type CompanyAccessEmailKind = 'invite' | 'password_reset'

type CompanyAccessEmailInput = {
  actionLink: string
  companyName: string
  contactName: string
  emailKind: CompanyAccessEmailKind
  to: string
}

type CompanyAccessEmailSendResult =
  | { id?: string; status: 'ok' }
  | { reason: 'missing_api_key'; status: 'missing_config' }
  | { message: string; status: 'error' }

const resendApiUrl = 'https://api.resend.com/emails'
const defaultFromAddress = 'Kinsei <no-reply@kinsei-inc.com>'

export function canSendCompanyAccessEmail() {
  return Boolean(process.env.RESEND_API_KEY)
}

function getFromAddress() {
  return process.env.KINSEI_EMAIL_FROM || defaultFromAddress
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function getEmailSubject(emailKind: CompanyAccessEmailKind) {
  if (emailKind === 'password_reset') {
    return 'Kinsei 企業会員DBのログイン設定リンクをお送りします'
  }

  return 'Kinsei 企業会員DBのログイン設定をお願いします'
}

function getEmailLead(emailKind: CompanyAccessEmailKind) {
  if (emailKind === 'password_reset') {
    return '企業会員DBへログインするための設定リンクをお送りします。'
  }

  return '企業会員DBをご利用いただくためのログイン設定リンクをお送りします。'
}

function buildTextEmail(input: CompanyAccessEmailInput) {
  return `${input.companyName}
${input.contactName} 様

${getEmailLead(input.emailKind)}

下記のリンクからパスワードを設定すると、学生データベースをご利用いただけます。

${input.actionLink}

このリンクには有効期限があります。期限が切れた場合は、Kinsei運営まで再送をご依頼ください。

心当たりがない場合は、このメールを破棄してください。

Kinsei`
}

function buildHtmlEmail(input: CompanyAccessEmailInput) {
  const companyName = escapeHtml(input.companyName)
  const contactName = escapeHtml(input.contactName)
  const actionLink = escapeHtml(input.actionLink)
  const lead = escapeHtml(getEmailLead(input.emailKind))

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(getEmailSubject(input.emailKind))}</title>
  </head>
  <body style="margin:0;background:#f5f7f6;color:#17211d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${lead}</div>
    <main style="padding:32px 16px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dfe7e2;border-radius:8px;overflow:hidden;">
        <div style="background:#17211d;color:#ffffff;padding:22px 24px;">
          <div style="font-size:22px;font-weight:900;letter-spacing:0;">Kinsei</div>
          <div style="font-size:13px;font-weight:700;color:#b8cbc3;margin-top:4px;">企業会員DB ログイン設定</div>
        </div>
        <div style="padding:28px 24px 30px;">
          <p style="margin:0 0 8px;font-size:15px;line-height:1.8;">${companyName}</p>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.8;">${contactName} 様</p>
          <h1 style="margin:0 0 14px;font-size:24px;line-height:1.35;color:#17211d;">ログイン設定をお願いします</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.9;color:#31413a;">${lead}</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.9;color:#31413a;">下のボタンからパスワードを設定すると、学生データベースをご利用いただけます。</p>
          <p style="margin:0 0 24px;">
            <a href="${actionLink}" style="display:inline-block;background:#0a8f6a;color:#ffffff;text-decoration:none;font-weight:900;border-radius:999px;padding:13px 22px;">ログイン設定をはじめる</a>
          </p>
          <p style="margin:0 0 16px;font-size:13px;line-height:1.8;color:#68776f;">ボタンが開けない場合は、以下のURLをブラウザに貼り付けてください。</p>
          <p style="margin:0 0 22px;font-size:12px;line-height:1.7;word-break:break-all;color:#0a6f55;">${actionLink}</p>
          <p style="margin:0;font-size:13px;line-height:1.8;color:#68776f;">このリンクには有効期限があります。期限が切れた場合は、Kinsei運営まで再送をご依頼ください。</p>
        </div>
        <div style="border-top:1px solid #edf2ef;padding:18px 24px;color:#68776f;font-size:12px;line-height:1.8;">
          心当たりがない場合は、このメールを破棄してください。<br />
          Kinsei
        </div>
      </div>
    </main>
  </body>
</html>`
}

export async function sendCompanyAccessEmail(
  input: CompanyAccessEmailInput,
): Promise<CompanyAccessEmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    return { reason: 'missing_api_key', status: 'missing_config' }
  }

  try {
    const response = await fetch(resendApiUrl, {
      body: JSON.stringify({
        from: getFromAddress(),
        html: buildHtmlEmail(input),
        subject: getEmailSubject(input.emailKind),
        text: buildTextEmail(input),
        to: input.to,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        message:
          typeof data?.message === 'string'
            ? data.message
            : `Resend API returned ${response.status}.`,
        status: 'error',
      }
    }

    return { id: typeof data?.id === 'string' ? data.id : undefined, status: 'ok' }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Unknown email delivery error.',
      status: 'error',
    }
  }
}
