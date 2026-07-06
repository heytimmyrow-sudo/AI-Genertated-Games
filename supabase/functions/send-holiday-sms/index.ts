const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-holiday-send-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

type SmsRequest = {
  mode?: "send-now" | "schedule" | "process-due";
  scheduleId?: string;
  holidayName?: string;
  to?: string;
  message?: string;
  sendAt?: string;
};

type ScheduledSms = {
  id: string;
  holiday_name: string;
  to_phone: string;
  body: string;
  send_at: string;
};

const TABLE = "holiday_messenger_sms";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const expectedKey = Deno.env.get("HOLIDAY_MESSENGER_SEND_KEY");
  const providedKey = request.headers.get("x-holiday-send-key") || "";
  if (!expectedKey) {
    return json({ error: "HOLIDAY_MESSENGER_SEND_KEY is not set." }, 500);
  }
  if (providedKey !== expectedKey) {
    return json({ error: "Auto-send passcode is not correct." }, 401);
  }

  const body = await request.json().catch(() => ({} as SmsRequest));
  const mode = body.mode || "send-now";

  if (mode === "schedule") {
    return scheduleSms(body);
  }
  if (mode === "process-due") {
    return processDueSms();
  }
  return sendNow(body);
});

async function scheduleSms(body: SmsRequest) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Supabase service role key is not set." }, 500);
  }

  const to = normalizePhone(String(body.to || ""));
  const message = cleanMessage(body.message);
  const sendAt = parseFutureDate(body.sendAt);
  if (!to) return json({ error: "A valid recipient phone number is required." }, 400);
  if (!message) return json({ error: "Message is required." }, 400);
  if (!sendAt) return json({ error: "A future sendAt date is required." }, 400);

  const allowedError = assertAllowedNumber(to);
  if (allowedError) return allowedError;

  const response = await fetch(`${supabaseUrl}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: getSupabaseHeaders(serviceRoleKey, { Prefer: "return=representation" }),
    body: JSON.stringify({
      holiday_name: String(body.holidayName || "Scheduled message").trim().slice(0, 120),
      to_phone: to,
      body: message,
      send_at: sendAt.toISOString(),
      status: "scheduled"
    })
  });
  const rows = await response.json().catch(() => []);
  if (!response.ok) {
    return json({ error: rows.message || "Could not save scheduled text." }, response.status);
  }
  return json({ ok: true, id: rows[0]?.id || "", sendAt: sendAt.toISOString() });
}

async function processDueSms() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Supabase service role key is not set." }, 500);
  }

  const dueUrl = new URL(`${supabaseUrl}/rest/v1/${TABLE}`);
  dueUrl.searchParams.set("select", "id,holiday_name,to_phone,body,send_at");
  dueUrl.searchParams.set("status", "eq.scheduled");
  dueUrl.searchParams.set("send_at", `lte.${new Date().toISOString()}`);
  dueUrl.searchParams.set("order", "send_at.asc");
  dueUrl.searchParams.set("limit", "25");

  const dueResponse = await fetch(dueUrl, { headers: getSupabaseHeaders(serviceRoleKey) });
  const dueRows = await dueResponse.json().catch(() => []);
  if (!dueResponse.ok) {
    return json({ error: dueRows.message || "Could not read due texts." }, dueResponse.status);
  }

  const results = [];
  for (const row of dueRows as ScheduledSms[]) {
    await updateScheduledSms(row.id, { status: "processing", error: null }, serviceRoleKey, supabaseUrl);
    try {
      const twilio = await sendTwilioSms(row.to_phone, row.body);
      await updateScheduledSms(row.id, {
        status: "sent",
        twilio_sid: twilio.sid || "",
        sent_at: new Date().toISOString(),
        error: null
      }, serviceRoleKey, supabaseUrl);
      results.push({ id: row.id, ok: true, sid: twilio.sid || "" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Twilio send failed.";
      await updateScheduledSms(row.id, { status: "failed", error: message }, serviceRoleKey, supabaseUrl);
      results.push({ id: row.id, ok: false, error: message });
    }
  }

  return json({ ok: true, processed: results.length, results });
}

async function sendNow(body: SmsRequest) {
  const to = normalizePhone(String(body.to || ""));
  const message = cleanMessage(body.message);
  if (!to) return json({ error: "A valid recipient phone number is required." }, 400);
  if (!message) return json({ error: "Message is required." }, 400);

  const allowedError = assertAllowedNumber(to);
  if (allowedError) return allowedError;

  try {
    const payload = await sendTwilioSms(to, message);
    return json({
      ok: true,
      sid: payload.sid || "",
      status: payload.status || "queued",
      to,
      scheduleId: String(body.scheduleId || ""),
      sentAt: new Date().toISOString()
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Twilio send failed." }, 502);
  }
}

async function sendTwilioSms(to: string, message: string) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = normalizePhone(Deno.env.get("TWILIO_FROM_NUMBER") || "");
  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio secrets are not fully configured.");
  }

  const form = new URLSearchParams();
  form.set("To", to);
  form.set("From", fromNumber);
  form.set("Body", message);

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Twilio rejected the SMS request.");
  }
  return payload;
}

async function updateScheduledSms(id: string, patch: Record<string, unknown>, serviceRoleKey: string, supabaseUrl: string) {
  await fetch(`${supabaseUrl}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: getSupabaseHeaders(serviceRoleKey),
    body: JSON.stringify(patch)
  });
}

function getSupabaseUrl() {
  return Deno.env.get("SUPABASE_URL") || "https://jbljqusdpifdyewlenun.supabase.co";
}

function getSupabaseHeaders(serviceRoleKey: string, extra: Record<string, string> = {}) {
  return {
    "Authorization": `Bearer ${serviceRoleKey}`,
    "apikey": serviceRoleKey,
    "Content-Type": "application/json",
    ...extra
  };
}

function cleanMessage(value: unknown) {
  return String(value || "").trim().slice(0, 320);
}

function parseFutureDate(value: unknown) {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return null;
  if (date.getTime() < Date.now() - 60000) return null;
  return date;
}

function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (trimmed.startsWith("+") && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return "";
}

function assertAllowedNumber(to: string) {
  const allowedNumbers = parseAllowedNumbers(Deno.env.get("HOLIDAY_ALLOWED_TO_NUMBERS") || "");
  if (allowedNumbers.size && !allowedNumbers.has(to)) {
    return json({ error: "This recipient is not on the allowed auto-send list." }, 403);
  }
  return null;
}

function parseAllowedNumbers(value: string) {
  return new Set(
    value
      .split(",")
      .map((entry) => normalizePhone(entry))
      .filter(Boolean)
  );
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
