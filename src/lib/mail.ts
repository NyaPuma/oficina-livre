import nodemailer from "nodemailer";

type Attachment = { filename: string; content: Buffer };

/** Envio opcional: se o SMTP não estiver configurado, regressa `false` sem falhar. */
export async function sendMail(
  to: string,
  subject: string,
  text: string,
  attachments: Attachment[] = [],
): Promise<boolean> {
  if (!process.env.SMTP_HOST || !to) return false;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Oficina Livre <nao-responder@oficinalivre.local>",
    to,
    subject,
    text,
    attachments: attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });
  return true;
}
