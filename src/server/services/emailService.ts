// Port of backend/studio/services/email_service.py — SMTP via nodemailer,
// console fallback when unconfigured. Same env vars, same HTML layout.
import nodemailer from "nodemailer";

export function appBaseUrl(fallbackBaseUrl?: string | null): string {
  const configured = (process.env.APP_BASE_URL ?? "").trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (fallbackBaseUrl) return fallbackBaseUrl.replace(/\/+$/, "");
  return "http://localhost:3000";
}

function smtpConfigured(): boolean {
  return Boolean(
    (process.env.SMTP_USERNAME ?? "").trim() && (process.env.SMTP_PASSWORD ?? "").trim(),
  );
}

function emailFrom(): string {
  const raw = (
    process.env.EMAIL_FROM ||
    process.env.AUTH_EMAIL_FROM ||
    "onboarding@example.com"
  ).trim();
  return raw.includes("<") ? raw : `Dharwin One <${raw}>`;
}

async function deliverSmtp(to: string, subject: string, html: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: (process.env.SMTP_HOST ?? "smtp.gmail.com").trim(),
    port: Number(process.env.SMTP_PORT ?? "465"),
    secure: true,
    connectionTimeout: Number(process.env.SMTP_TIMEOUT ?? "7") * 1000,
    auth: {
      user: (process.env.SMTP_USERNAME ?? "").trim(),
      pass: (process.env.SMTP_PASSWORD ?? "").trim(),
    },
  });
  await transporter.sendMail({ from: emailFrom(), to, subject, html });
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!smtpConfigured()) {
    console.log(`[email:console] to=${to} subject=${subject}\n${html}`);
    return;
  }
  await deliverSmtp(to, subject, html);
}

// Email-client constraints: table layout, inline CSS, system fonts, no
// animation/web fonts. Brand green #41A454 for the logo mark; darker #2B7F3F
// for button/links so white-on-green text meets WCAG AA (>=4.5:1).
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function layout(
  preheader: string,
  title: string,
  intro: string,
  buttonLabel: string,
  link: string,
  footnote: string,
): string {
  return `\
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background-color:#f3f6f4;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f6f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td style="padding:0 8px 20px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="36" height="36" align="center" bgcolor="#41A454" style="border-radius:9px;font-family:${FONT};font-size:19px;font-weight:700;color:#ffffff;line-height:36px;">D</td>
                  <td style="padding-left:10px;font-family:${FONT};font-size:17px;font-weight:700;color:#0f172a;">Dharwin&nbsp;One</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border:1px solid #e4eae6;border-radius:14px;padding:36px 32px;">
              <h1 style="margin:0 0 12px 0;font-family:${FONT};font-size:21px;line-height:1.35;font-weight:700;color:#0f172a;">${title}</h1>
              <p style="margin:0 0 24px 0;font-family:${FONT};font-size:15px;line-height:1.6;color:#475569;">${intro}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
                <tr>
                  <td bgcolor="#2B7F3F" style="border-radius:9px;">
                    <a href="${link}" style="display:inline-block;padding:13px 32px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:9px;">${buttonLabel}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px 0;font-family:${FONT};font-size:13px;line-height:1.6;color:#64748b;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin:0 0 24px 0;padding:12px 14px;background-color:#f6f8f7;border:1px solid #e4eae6;border-radius:8px;font-family:${FONT};font-size:12px;line-height:1.5;word-break:break-all;">
                <a href="${link}" style="color:#2B7F3F;text-decoration:underline;">${link}</a>
              </p>
              <p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.6;color:#64748b;">${footnote}</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 8px 0 8px;font-family:${FONT};font-size:12px;line-height:1.6;color:#94a3b8;">
              Dharwin One &middot; AI calling agents and campaign workspace<br>
              You received this email because of activity on your Dharwin One account.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendVerification(
  to: string,
  rawToken: string,
  baseUrl?: string | null,
): Promise<void> {
  const link = `${appBaseUrl(baseUrl)}/verify?token=${encodeURIComponent(rawToken)}`;
  await sendEmail(
    to,
    "Verify your Dharwin One account",
    layout(
      "Confirm your email to activate your Dharwin One account.",
      "Verify your email",
      "Welcome to Dharwin One! Click the button below to confirm this email address and activate your account.",
      "Verify email",
      link,
      "This link expires in 24 hours. If you didn't create a Dharwin One account, you can safely ignore this email.",
    ),
  );
}

export async function sendPasswordReset(
  to: string,
  rawToken: string,
  baseUrl?: string | null,
): Promise<void> {
  const link = `${appBaseUrl(baseUrl)}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await sendEmail(
    to,
    "Reset your Dharwin One password",
    layout(
      "Choose a new password for your Dharwin One account.",
      "Reset your password",
      "We received a request to reset the password for your Dharwin One account. Click the button below to choose a new one.",
      "Reset password",
      link,
      "This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.",
    ),
  );
}
