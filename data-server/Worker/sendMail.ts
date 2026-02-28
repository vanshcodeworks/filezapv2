import { Worker } from "bullmq";
import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || smtpUser;

if (!process.env.REDIS_URL) throw new Error("Missing REDIS_URL");
if (!smtpUser || !smtpPass) throw new Error("Missing SMTP_USER/SMTP_PASS");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: smtpUser, pass: smtpPass },
});

function escapeHtml(input: string) {
  return input.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#039;";
      default:
        return c;
    }
  });
}

function formatExpiry(expiresAtIso: string) {
  const d = new Date(expiresAtIso);
  if (Number.isNaN(d.getTime())) return expiresAtIso;
  return d.toLocaleString();
}

async function sendEmail(payload: {
  toEmail: string;
  fileName: string;
  link: string;
  expiresAt: string;
  shortCode?: string;
  requiresPassword?: boolean;
}) {
  const brandName = "FileZap";
  const brandUrl = "https://filezap.vanshcodeworks.com";

  const safeFileName = escapeHtml(payload.fileName || "file");
  const safeLink = payload.link; // must already be a trusted app URL, not presigned S3
  const expiryText = escapeHtml(formatExpiry(payload.expiresAt));
  const shortCodeText = payload.shortCode ? escapeHtml(payload.shortCode) : "";

  const passwordLine = payload.requiresPassword
    ? `<tr><td style="padding:0 0 10px 0;color:#5a6270;font-size:13px;line-height:1.6">
         This file is <b>password-protected</b>. You’ll be prompted before download.
       </td></tr>`
    : "";

  // Email HTML (table-based, “boxed” UI similar to your site)
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#ffffff;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <!-- container -->
          <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="width:560px;max-width:100%;">
            <!-- header row -->
            <tr>
              <td style="padding:0 0 14px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="left" style="font-family:Arial,Helvetica,sans-serif;">
                      <span style="display:inline-block;border:2px solid #1b1f2a;padding:10px 14px;font-weight:900;letter-spacing:.3px;background:#f7f8fb;">
                        ${brandName}
                      </span>
                    </td>
                    <td align="right" style="font-family:Arial,Helvetica,sans-serif;">
                      <a href="${brandUrl}" style="color:#0b0f19;text-decoration:none;font-weight:700;font-size:12px;border:2px solid #1b1f2a;padding:10px 12px;background:#ffffff;">
                        ${escapeHtml(brandUrl.replace(/^https?:\/\//, ""))}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- main card with “shadow” -->
            <tr>
              <td>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <!-- shadow spacer -->
                    <td style="background:#1b1f2a;width:6px;font-size:0;line-height:0;">&nbsp;</td>
                    <td>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:2px solid #1b1f2a;background:#ffffff;">
                        <tr>
                          <td style="padding:18px 18px 12px 18px;font-family:Arial,Helvetica,sans-serif;">
                            <div style="font-size:18px;font-weight:900;color:#0b0f19;letter-spacing:-.2px;">
                              A file was shared with you
                            </div>
                            <div style="margin-top:6px;color:#5a6270;font-size:13px;line-height:1.6;">
                              Download securely with a short code link that can expire (12/24/48h).
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding:0 18px 14px 18px;font-family:Arial,Helvetica,sans-serif;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f7f8fb;border:2px solid #1b1f2a;">
                              <tr>
                                <td style="padding:12px 12px;">
                                  <div style="font-size:12px;color:#5a6270;font-weight:700;">File</div>
                                  <div style="font-size:14px;color:#0b0f19;font-weight:900;margin-top:2px;word-break:break-word;">
                                    ${safeFileName}
                                  </div>
                                </td>
                              </tr>
                              ${
                                shortCodeText
                                  ? `<tr>
                                      <td style="padding:0 12px 12px 12px;">
                                        <div style="font-size:12px;color:#5a6270;font-weight:700;">Short code</div>
                                        <div style="font-size:14px;color:#0b0f19;font-weight:900;margin-top:2px;letter-spacing:.6px;">
                                          ${shortCodeText}
                                        </div>
                                      </td>
                                    </tr>`
                                  : ""
                              }
                              <tr>
                                <td style="padding:0 12px 12px 12px;">
                                  <div style="font-size:12px;color:#5a6270;font-weight:700;">Expires</div>
                                  <div style="font-size:13px;color:#0b0f19;font-weight:800;margin-top:2px;">
                                    ${expiryText}
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        ${passwordLine}

                        <!-- CTA button -->
                        <tr>
                          <td align="center" style="padding:4px 18px 18px 18px;font-family:Arial,Helvetica,sans-serif;">
                            <a href="${safeLink}"
                               style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;
                                      font-weight:900;border:2px solid #1b1f2a;padding:12px 16px;">
                              Open in FileZap
                            </a>
                            <div style="margin-top:10px;color:#5a6270;font-size:12px;line-height:1.6;">
                              If the button doesn’t work, copy and paste:
                              <br/>
                              <span style="color:#0b0f19;font-weight:800;word-break:break-all;">${escapeHtml(safeLink)}</span>
                            </div>
                          </td>
                        </tr>

                        <!-- footer inside card -->
                        <tr>
                          <td style="padding:12px 18px;border-top:2px solid #1b1f2a;background:#eef1f6;font-family:Arial,Helvetica,sans-serif;">
                            <div style="color:#0b0f19;font-weight:900;font-size:12px;">
                              Use FileZap — <a href="${brandUrl}" style="color:#0b0f19;text-decoration:none;">filezap.vanshcodeworks.com</a>
                            </div>
                            <div style="color:#5a6270;font-size:12px;line-height:1.5;margin-top:6px;">
                              Tip: Only trust links that start with <b>${escapeHtml(brandUrl)}</b>.
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- bottom “shadow” -->
                  <tr>
                    <td></td>
                    <td style="height:6px;background:#1b1f2a;font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- small print -->
            <tr>
              <td style="padding:14px 4px 0 4px;font-family:Arial,Helvetica,sans-serif;color:#8a93a3;font-size:11px;line-height:1.5;">
                This message was generated by FileZap sharing. If you didn’t expect it, you can ignore it.
              </td>
            </tr>
          </table>
          <!-- /container -->
        </td>
      </tr>
    </table>
  </body>
</html>`;

  await transporter.sendMail({
    from: smtpFrom,
    to: payload.toEmail,
    subject: `FileZap: ${payload.fileName} shared with you`,
    text:
      `FileZap — file shared with you\n\n` +
      `File: ${payload.fileName}\n` +
      (payload.shortCode ? `Short code: ${payload.shortCode}\n` : "") +
      `Expires: ${payload.expiresAt}\n` +
      (payload.requiresPassword ? `Password: Required\n` : "") +
      `Open: ${payload.link}\n\n` +
      `Use FileZap: ${brandUrl}\n`,
    html,
  });
}

export const emailWorker = new Worker(
  "share-email",
  async (job) => {
    if (job.name === "send-share-link") {
      await sendEmail(job.data);
    }
  },
  { connection: { url: process.env.REDIS_URL } }
);

emailWorker.on("completed", (job) => {
  console.log(`[emailWorker] completed job ${job.id}`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`[emailWorker] failed job ${job?.id}`, err.message);
});