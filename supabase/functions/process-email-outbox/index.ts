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

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !fromEmail || !publicSiteUrl) {
    return json({ error: "email_delivery_not_configured", detail: "Configure Supabase service role, Resend API key, verified sender address and the environment-specific public site origin before enabling delivery." }, 503);
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
      let subject: string;
      let textBody: string;
      let htmlBody: string;

      if (job.event_type === "madrasa_invitation") {
        const invitationUrl = String(job.payload.invitation_url || "");
        const parsed = new URL(invitationUrl);
        const expected = new URL(publicSiteUrl);
        if (parsed.protocol !== "https:" || parsed.origin !== expected.origin || !parsed.pathname.startsWith("/platform/accept")) {
          throw new Error("invitation_url_origin_not_allowed");
        }
        subject = "Your SahiTech MDI Madrasa invitation";
        textBody = `Your application for ${institutionName} has been approved. Accept the secure invitation within 72 hours: ${invitationUrl}`;
        htmlBody = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:560px;margin:auto"><h2>SahiTech Education · MDI</h2><p>Your Madrasa application for <strong>${escapeHtml(institutionName)}</strong> has been approved.</p><p>Use the secure invitation below to create or access your Madrasa Admin account. The invitation expires in 72 hours and can be used only once.</p><p><a href="${escapeHtml(invitationUrl)}" style="display:inline-block;padding:12px 18px;background:#047857;color:#fff;text-decoration:none;border-radius:8px">Accept invitation</a></p><p>If you were not expecting this invitation, you can ignore this message.</p><p style="font-size:12px;color:#64748b">SahiTech Education · Madrasa Digitalization Initiative</p></div>`;
      } else if (job.event_type === "madrasa_application_received") {
        const uploadUrl = String(job.payload.upload_url || "");
        const parsed = new URL(uploadUrl);
        const expected = new URL(publicSiteUrl);
        if (parsed.protocol !== "https:" || parsed.origin !== expected.origin || !parsed.pathname.startsWith("/register-madrasa/documents")) {
          throw new Error("application_upload_url_origin_not_allowed");
        }
        const contact = escapeHtml(String(job.payload.contact_person_name || "Applicant"));
        subject = "MDI application received — SahiTech Education";
        textBody = `Dear ${contact}, we received the Madrasa application for ${institutionName}. Use this private link to upload or continue your supporting documents. The link expires in seven days: ${uploadUrl}`;
        htmlBody = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:560px;margin:auto"><h2>Application received</h2><p>Dear ${contact},</p><p>We have received the Madrasa application for <strong>${escapeHtml(institutionName)}</strong>.</p><p>The application will be reviewed by the SahiTech Education Global Platform Owner. No tenant workspace or active account is created until verification and approval are complete.</p><p><a href="${escapeHtml(uploadUrl)}" style="display:inline-block;padding:12px 18px;background:#047857;color:#fff;text-decoration:none;border-radius:8px">Upload / continue documents</a></p><p>This private upload link expires in seven days. Keep it confidential.</p><p>SahiTech Education · MDI</p></div>`;
      } else {
        throw new Error("unsupported_email_event");
      }

      const safeName = escapeHtml(institutionName);
      const safeUrl = escapeHtml(invitationUrl);
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
