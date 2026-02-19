import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendDocumentsReadyEmail({
  to,
  userName,
  jobTitle,
  companyName,
  applicationId,
}: {
  to: string
  userName: string
  jobTitle: string
  companyName: string
  applicationId: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://applyai.app'

  return resend.emails.send({
    from: 'ApplyAI <noreply@yourdomain.com>', // update with verified domain
    to,
    subject: `Your documents for ${jobTitle} at ${companyName} are ready`,
    html: `
      <p>Hi ${userName},</p>
      <p>Your application documents for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> have been generated.</p>
      <p><a href="${appUrl}/applications/${applicationId}">View your documents</a></p>
      <p>— The ApplyAI team</p>
    `,
  })
}
