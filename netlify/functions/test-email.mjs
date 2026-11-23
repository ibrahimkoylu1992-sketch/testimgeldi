import { jsonResponse, createTransporterFromConfig } from '../lib/mailer.mjs';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Yalnızca POST isteği desteklenmektedir.' });
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const targetEmail = String(body.targetEmail || 'ibrahimkoylu1992@gmail.com').trim();
    const override = body.smtpOverride || null;

    const mailer = createTransporterFromConfig(override);
    if (!mailer) {
      return jsonResponse(400, {
        error:
          'Henüz geçerli bir SMTP veya Gmail yapılandırması bulunamadı. Formu doldurarak test edebilir veya Netlify Environment Variables üzerinden tanımlayabilirsiniz.',
      });
    }

    const testCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await mailer.transporter.sendMail({
        from: mailer.from,
        to: targetEmail,
        replyTo: 'info@testimgeldi.com',
        subject: 'testimgeldi - Canlı E-Posta Sunucusu Test Mesajı',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="background-color: #4f46e5; padding: 16px; border-radius: 8px; text-align: center; color: white;">
              <h2 style="margin: 0;">testimgeldi E-Posta Testi</h2>
            </div>
            <div style="padding: 20px 0;">
              <p style="color: #334155; font-size: 15px;">Merhaba,</p>
              <p style="color: #334155; font-size: 14px; line-height: 1.5;">
                Bu test mesajı, <strong>testimgeldi</strong> sisteminizin canlı e-posta gönderebildiğini onaylamak için gönderilmiştir.
              </p>
              <div style="background: #f8fafc; border: 2px dashed #4f46e5; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
                <span style="font-size: 26px; font-weight: bold; font-family: monospace; color: #4f46e5;">${testCode}</span>
                <p style="font-size: 12px; color: #64748b; margin: 6px 0 0;">Örnek Doğrulama Kodu</p>
              </div>
              <p style="color: #10b981; font-weight: bold; font-size: 13px;">✔ SMTP bağlantınız sorunsuz çalışıyor!</p>
            </div>
          </div>
        `,
        text: `testimgeldi Test E-Postası Başarılı! Kod: ${testCode}`,
      });

      return jsonResponse(200, {
        success: true,
        message: `Test e-postası ${targetEmail} adresine başarıyla gönderildi!`,
      });
    } catch (smtpErr) {
      console.error('[NETLIFY TEST EMAIL ERROR]', smtpErr);
      return jsonResponse(500, {
        error: `E-posta gönderilemedi: ${smtpErr?.message || 'SMTP kimlik doğrulama veya bağlantı hatası. Host, port ve şifreyi kontrol ediniz.'}`,
      });
    }
  } catch (err) {
    console.error('Test email function error:', err);
    return jsonResponse(500, { error: 'Test e-postası gönderilirken bir hata oluştu.' });
  }
};
