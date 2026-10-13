import { env } from "@patty/api/env";
import { AppError } from "@patty/api/lib/errors";
import { logger } from "@patty/api/lib/logger";
import { readFileSync } from "fs";
import { join } from "path";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function loadTemplate(name: string, vars: Record<string, string>): string {
  // import.meta.url is standard ESM; .pathname gives the directory of this file.
  const path = join(new URL(".", import.meta.url).pathname, "templates", name);
  let html = readFileSync(path, "utf-8");
  for (const [key, value] of Object.entries(vars)) {
    html = html.replaceAll(`{${key}}`, value);
  }
  return html;
}

/** Sends a verification email with a 6-digit OTP code. */
export async function sendVerificationEmail(
  to: string,
  code: string,
  lang: string,
): Promise<void> {
  if (env.RESEND_API_KEY === "re_placeholder") {
    logger.info(
      { to, lang },
      "Mock email: verification code generated (Resend not configured)",
    );
    return;
  }

  const isEn = lang !== "tr";

  const subject = isEn
    ? "Verify your Patty account"
    : "Patty hesabınızı doğrulayın";
  const html = loadTemplate(
    isEn ? "verification_en.html" : "verification_tr.html",
    { code },
  );

  const { error } = await resend.emails.send({
    from: env.RESEND_SENDER_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    throw AppError.internal(
      `Failed to send verification email: ${error.message}`,
    );
  }
}

/** Sends a password reset email with a 6-digit OTP code. */
export async function sendPasswordResetEmail(
  to: string,
  code: string,
  lang: string,
): Promise<void> {
  if (env.RESEND_API_KEY === "re_placeholder") {
    logger.info(
      { to, lang },
      "Mock email: password reset code generated (Resend not configured)",
    );
    return;
  }

  const isEn = lang !== "tr";

  const subject = isEn
    ? "Reset your Patty password"
    : "Patty şifrenizi sıfırlayın";
  const html = loadTemplate(
    isEn ? "password_reset_en.html" : "password_reset_tr.html",
    { code },
  );

  const { error } = await resend.emails.send({
    from: env.RESEND_SENDER_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    throw AppError.internal(
      `Failed to send password reset email: ${error.message}`,
    );
  }
}

/** Sends an account deletion confirmation email. */
export async function sendAccountDeletionEmail(
  to: string,
  lang: string,
  restoreUntilDate: string,
): Promise<void> {
  if (env.RESEND_API_KEY === "re_placeholder") {
    logger.info(
      { to, lang },
      "Mock email: account deletion confirmation (Resend not configured)",
    );
    return;
  }

  const isEn = lang !== "tr";

  const subject = isEn
    ? "Your Patty account has been scheduled for deletion"
    : "Patty hesabınız silinmek üzere işaretlendi";
  const html = loadTemplate(
    isEn ? "account_deletion_en.html" : "account_deletion_tr.html",
    { restoreUntilDate },
  );

  const { error } = await resend.emails.send({
    from: env.RESEND_SENDER_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    throw AppError.internal(
      `Failed to send account deletion email: ${error.message}`,
    );
  }
}
