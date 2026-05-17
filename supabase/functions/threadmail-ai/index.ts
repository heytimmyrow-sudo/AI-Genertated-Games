const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

type ThreadmailRequest = {
  handle?: string;
  subject?: string;
  message?: string;
  recent?: Array<{ from?: string; body?: string }>;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAiKey) {
    return json({ error: "OPENAI_API_KEY is not set." }, 500);
  }

  const body = await request.json().catch(() => ({} as ThreadmailRequest));
  const message = String(body.message || "").trim();
  const handle = String(body.handle || "friend").trim().slice(0, 24);
  const subject = String(body.subject || "Threadmail chat").trim().slice(0, 140);
  const recent = Array.isArray(body.recent) ? body.recent.slice(-8) : [];

  if (!message) {
    return json({ error: "Message is required." }, 400);
  }

  const transcript = recent
    .map((entry) => `${String(entry.from || "user").slice(0, 24)}: ${String(entry.body || "").slice(0, 800)}`)
    .join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") || "gpt-5.5",
      input: [
        {
          role: "system",
          content: "You are ThreadAI inside Threadmail. Be friendly, concise, and useful. Keep replies under 900 characters unless the user asks for detail. Do not claim to send messages, access private data, or control the app."
        },
        {
          role: "user",
          content: `Thread subject: ${subject}\nUser handle: ${handle}\nRecent chat:\n${transcript || "(none)"}\n\nLatest message:\n${message}`
        }
      ]
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json({ error: payload.error?.message || "OpenAI request failed." }, response.status);
  }

  return json({ reply: String(payload.output_text || "I am here. What should we work on?").trim() });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
