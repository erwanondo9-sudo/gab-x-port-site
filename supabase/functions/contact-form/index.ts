import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const DESTINATION = "gabxport120@gmail.com";
const ALLOWED_ORIGIN = "https://gx-gab-x-port.vercel.app";

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char] || char);
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST" || origin !== ALLOWED_ORIGIN) {
    return new Response(JSON.stringify({ error: "Requête non autorisée." }), {
      status: 403, headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    const name = String(payload.name || "").trim();
    const email = String(payload.email || "").trim();
    const subject = String(payload.subject || "").trim();
    const message = String(payload.message || "").trim();

    if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        email.length > 254 || !subject || subject.length > 160 ||
        message.length < 10 || message.length > 5000) {
      return new Response(JSON.stringify({ error: "Veuillez vérifier les champs du formulaire." }), {
        status: 400, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Le service d’envoi n’est pas encore configuré." }), {
        status: 503, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Gab X-Port <onboarding@resend.dev>",
        to: [DESTINATION],
        reply_to: email,
        subject: `Contact Gab X-Port : ${subject}`,
        html: `<h2>Nouveau message depuis Gab X-Port</h2><p><strong>Nom :</strong> ${safeName}</p><p><strong>E-mail :</strong> ${safeEmail}</p><p><strong>Objet :</strong> ${safeSubject}</p><hr><p>${safeMessage}</p>`,
        text: `Nouveau message depuis Gab X-Port\nNom : ${name}\nE-mail : ${email}\nObjet : ${subject}\n\n${message}`,
      }),
    });

    if (!resendResponse.ok) {
      const detail = await resendResponse.text();
      console.error("Resend error:", detail);
      return new Response(JSON.stringify({ error: "L’e-mail n’a pas pu être envoyé. Vérifiez la configuration du service d’envoi." }), {
        status: 502, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return new Response(JSON.stringify({ error: "Une erreur est survenue pendant l’envoi." }), {
      status: 500, headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
