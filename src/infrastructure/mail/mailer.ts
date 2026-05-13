import nodemailer from "nodemailer";
import { env } from "../../config/env";

const smtpEnabled = env.MAIL_TRANSPORT === "smtp";

if (smtpEnabled && (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS)) {
  throw new Error("Configuration SMTP incomplete: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS requis");
}

export const mailer = smtpEnabled
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE ?? false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  : nodemailer.createTransport({
      jsonTransport: true,
    });
