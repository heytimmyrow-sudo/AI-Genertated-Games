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
          content: [
            "You are ThreadAI, the built-in assistant inside the Threadmail messaging app.",
            "Sound like a helpful messaging companion, not a generic chatbot.",
            "Be specific to what the user asks. Avoid repeating the same intro or catchphrase.",
            "If the user asks for a reply, write the actual reply they could send.",
            "If the user asks to rewrite something, provide the rewritten version first, then one short note if useful.",
            "If the user asks for ideas, give practical Threadmail ideas such as chat polish, game cards, mobile layout, unread handling, notifications, or AI actions.",
            "Keep normal replies under 900 characters. Use bullets only when they help.",
            "Do not claim you can access private data, send messages on the user's behalf, or control the app."
          ].join(" ")
        },
        {
          role: "user",
          content: `Thread subject: ${subject}\nUser handle: ${handle}\nRecent chat, oldest to newest:\n${transcript || "(none)"}\n\nLatest message:\n${message}\n\nAnswer the latest message directly. If recent chat shows you already said something similar, say it a new way.`
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
