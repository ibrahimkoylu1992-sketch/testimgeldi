import { jsonResponse, getEnvSmtpSummary } from '../lib/mailer.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'GET') {
    return jsonResponse(200, getEnvSmtpSummary());
  }

  if (event.httpMethod === 'POST') {
    const summary = getEnvSmtpSummary();
    if (summary.isConfigured) {
      return jsonResponse(200, {
        success: true,
        runtime: 'netlify',
        message:
          'Canlı Netlify ortamında e-posta ayarları ortam değişkenlerinden (Environment Variables) aktif durumda. "Canlı Test E-Postası Gönder" ile test edebilirsiniz.',
      });
    }

    return jsonResponse(400, {
      runtime: 'netlify',
      error:
        'Canlı sitede (Netlify) kalıcı SMTP gönderimi için bilgileri Netlify → Site configuration → Environment variables bölümüne (SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM) ekleyip yeniden deploy almalısınız.',
    });
  }

  return jsonResponse(405, { error: 'Desteklenmeyen HTTP yöntemi.' });
};
