import { createClient } from "npm:@supabase/supabase-js@2.49.1";

type OutboxJob = {
  id: string;
  event_type: string;
  recipient_email: string;
  payload: Record<string, unknown>;
  attempts: number;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char] || char);

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

async function deriveAndVerifyToken(
  purpose: "upload" | "invitation",
  applicationId: string,
  nonce: string,
  expectedHash: string,
  secret: string,
) {
  if (!/^[0-9a-f-]{36}$/i.test(applicationId)
      || !/^[0-9a-f]{64}$/.test(nonce)
      || !/^[0-9a-f]{64}$/.test(expectedHash)
      || secret.length < 32) {
    throw new Error("email_token_material_invalid");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`mdi-${purpose}:${applicationId}:${nonce}`),
  );
  const token = toHex(new Uint8Array(signature)).toUpperCase();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const actualHash = toHex(new Uint8Array(digest));
  if (actualHash !== expectedHash) throw new Error("email_token_hash_mismatch");
  return token;
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");
  const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL");
  const tokenHmacSecret = Deno.env.get("MDI_EMAIL_TOKEN_HMAC_SECRET");

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !fromEmail || !publicSiteUrl || !tokenHmacSecret || tokenHmacSecret.length < 32) {
    return json({ error: "email_delivery_not_configured", detail: "Configure Supabase service role, Resend API key, verified sender, canonical HTTPS site origin and the shared MDI email-token HMAC secret." }, 503);
  }

  let origin: string;
  try {
    const site = new URL(publicSiteUrl);
    if (site.protocol !== "https:" || site.pathname !== "/" || site.search || site.hash) throw new Error("invalid_public_site_origin");
    origin = site.origin;
  } catch {
    return json({ error: "invalid_public_site_url" }, 503);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: jobs, error: claimError } = await supabase.rpc("claim_email_outbox", { p_limit: 10 });
  if (claimError) return json({ error: "outbox_claim_failed" }, 500);

  const results: Array<{ id: string; sent: boolean }> = [];
  for (const job of (jobs || []) as OutboxJob[]) {
    try {
      const institutionName = String(job.payload.institution_name || "your Madrasa");
      const applicationId = String(job.payload.application_id || "");
      let subject: string;
      let textBody: string;
      let htmlBody: string;

      if (job.event_type === "madrasa_invitation") {
        const token = await deriveAndVerifyToken(
          "invitation",
          applicationId,
          String(job.payload.token_nonce || ""),
          String(job.payload.token_hash || ""),
          tokenHmacSecret,
        );
        const invitationUrl = `${origin}/platform/accept#token=${token}`;
        subject = "Your SahiTech MDI Madrasa invitation";
        textBody = `Your application for ${institutionName} has been approved. Accept the secure invitation within 72 hours: ${invitationUrl}`;
        htmlBody = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:560px;margin:auto"><h2>SahiTech Education · MDI</h2><p>Your Madrasa application for <strong>${escapeHtml(institutionName)}</strong> has been approved.</p><p>Use the secure invitation below to create or access your Madrasa Admin account. The invitation expires in 72 hours and can be used only once.</p><p><a href="${escapeHtml(invitationUrl)}" style="display:inline-block;padding:12px 18px;background:#047857;color:#fff;text-decoration:none;border-radius:8px">Accept invitation</a></p><p>If you were not expecting this invitation, you can ignore this message.</p><p style="font-size:12px;color:#64748b">SahiTech Education · Madrasa Digitalization Initiative</p></div>`;
      } else if (job.event_type === "madrasa_application_received") {
        const token = await deriveAndVerifyToken(
          "upload",
          applicationId,
          String(job.payload.upload_token_nonce || ""),
          String(job.payload.upload_token_hash || ""),
          tokenHmacSecret,
        );
        const uploadUrl = `${origin}/register-madrasa/documents?applicationId=${encodeURIComponent(applicationId)}#token=${token}`;
        const contact = escapeHtml(String(job.payload.contact_person_name || "Applicant"));
        subject = "MDI application received — SahiTech Education";
        textBody = `Dear ${contact}, we received the Madrasa application for ${institutionName}. Use this private link to upload or continue your supporting documents. The link expires in seven days: ${uploadUrl}`;
        htmlBody = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:560px;margin:auto"><h2>Application received</h2><p>Dear ${contact},</p><p>We have received the Madrasa application for <strong>${escapeHtml(institutionName)}</strong>.</p><p>The application will be reviewed by the SahiTech Education Global Platform Owner. No tenant workspace or active account is created until verification and approval are complete.</p><p><a href="${escapeHtml(uploadUrl)}" style="display:inline-block;padding:12px 18px;background:#047857;color:#fff;text-decoration:none;border-radius:8px">Upload / continue documents</a></p><p>This private upload link expires in seven days. Keep it confidential.</p><p>SahiTech Education · MDI</p></div>`;
      } else {
        throw new Error("unsupported_email_event");
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${resendApiKey}`,
          "content-type": "application/json",
          "Idempotency-Key": job.id,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [job.recipient_email],
          subject,
          text: textBody,
          html: htmlBody,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`resend_http_${response.status}: ${body.slice(0, 400)}`);
      }

      const { error: completeError } = await supabase.rpc("complete_email_outbox", {
        p_id: job.id,
        p_success: true,
        p_error: null,
      });
      if (completeError) throw new Error("outbox_completion_failed");
      results.push({ id: job.id, sent: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_delivery_error";
      await supabase.rpc("complete_email_outbox", {
        p_id: job.id,
        p_success: false,
        p_error: message,
      });
      results.push({ id: job.id, sent: false });
    }
  }

  return json({ claimed: (jobs || []).length, results });
});
