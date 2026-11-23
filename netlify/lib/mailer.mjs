import nodemailer from 'nodemailer';

export function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(payload),
  };
}

export function getEnvSmtpSummary() {
  const hasGmail = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  const hasCustom = Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)
  );
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === 'true'
      : port === 465;

  return {
    isConfigured: hasCustom || hasGmail,
    provider: hasCustom ? 'custom' : hasGmail ? 'gmail' : 'none',
    gmailUser: process.env.GMAIL_USER || '',
    host: process.env.SMTP_HOST || '',
    port,
    secure,
    user: process.env.SMTP_USER || '',
    fromAddress:
      process.env.SMTP_FROM ||
      (process.env.SMTP_USER ? `"testimgeldi" <${process.env.SMTP_USER}>` : '') ||
      (process.env.GMAIL_USER ? `"testimgeldi" <${process.env.GMAIL_USER}>` : '') ||
      '"testimgeldi" <info@testimgeldi.com>',
    runtime: 'netlify',
  };
}

export function createTransporterFromConfig(override) {
  if (override && override.enabled !== false) {
    if (override.provider === 'gmail' && override.gmailUser && override.gmailAppPassword) {
      return {
        transporter: nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: String(override.gmailUser).trim(),
            pass: String(override.gmailAppPassword).trim().replace(/\s+/g, ''),
          },
        }),
        from:
          override.fromAddress ||
          `"testimgeldi" <${String(override.gmailUser).trim()}>`,
      };
    }

    if (override.host && override.user && override.pass) {
      const port = parseInt(String(override.port || '465'), 10);
      const secure =
        override.secure === true ||
        String(override.secure) === 'true' ||
        port === 465;

      return {
        transporter: nodemailer.createTransport({
          host: String(override.host).trim(),
          port,
          secure,
          auth: {
            user: String(override.user).trim(),
            pass: String(override.pass).trim(),
          },
        }),
        from:
          override.fromAddress ||
          `"testimgeldi" <${String(override.user).trim()}>`,
      };
    }
  }

  // Fallback to Netlify Environment Variables
  if (process.env.SMTP_HOST && process.env.SMTP_USER && (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)) {
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const secure =
      process.env.SMTP_SECURE !== undefined
        ? process.env.SMTP_SECURE === 'true'
        : port === 465;

    return {
      transporter: nodemailer.createTransport({
        host: process.env.SMTP_HOST.trim(),
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER.trim(),
          pass: (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '').trim(),
        },
      }),
      from:
        process.env.SMTP_FROM ||
        `"testimgeldi" <${process.env.SMTP_USER.trim()}>`,
    };
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return {
      transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER.trim(),
          pass: process.env.GMAIL_APP_PASSWORD.trim().replace(/\s+/g, ''),
        },
      }),
      from:
        process.env.SMTP_FROM ||
        `"testimgeldi" <${process.env.GMAIL_USER.trim()}>`,
    };
  }

  return null;
}

export function buildVerificationEmailHtml({ isRegister, code }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #4f46e5; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 24px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px;">testimgeldi</h1>
        <p style="color: #e0e7ff; margin: 4px 0 0; font-size: 13px;">Online Sınav & Optik Okuma Platformu</p>
      </div>
      <div style="padding: 0 8px;">
        <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; margin-bottom: 12px;">
          ${isRegister ? 'E-Posta Doğrulama Kodu' : 'Şifre Sıfırlama Kodu'}
        </h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          Merhaba,<br/>
          ${
            isRegister
              ? 'testimgeldi platformunda öğretmen / öğrenci hesabınızı etkinleştirmek için aşağıdaki 6 haneli doğrulama kodunu kullanınız:'
              : 'testimgeldi hesabınızın şifresini yenilemek için aşağıdaki 6 haneli güvenlik kodunu kullanınız:'
          }
        </p>
        <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
          <div style="font-size: 34px; font-weight: 800; font-family: 'Courier New', Courier, monospace; letter-spacing: 10px; color: #4f46e5;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 12px; margin: 10px 0 0;">Bu güvenlik kodu 15 dakika geçerlidir.</p>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          Bu işlemi siz başlatmadıysanız lütfen bu iletiyi dikkate almayınız. Güvenliğiniz için bu kodu kimseyle paylaşmayınız.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
          testimgeldi · Online Optik Kağıt Değerlendirme Çözümleri · testimgeldi.com
        </p>
      </div>
    </div>
  `;
}
