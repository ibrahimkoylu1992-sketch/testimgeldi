import {
  jsonResponse,
  createTransporterFromConfig,
  buildVerificationEmailHtml,
} from '../lib/mailer.mjs';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Yalnızca POST isteği desteklenmektedir.' });
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { email, code, type } = body;

    if (!email || !code) {
      return jsonResponse(400, { error: 'E-posta adresi ve doğrulama kodu gereklidir.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();
    const isRegister = type === 'register';
    const subject = isRegister
      ? 'testimgeldi - Hesap Doğrulama Kodunuz'
      : 'testimgeldi - Şifre Sıfırlama Kodunuz';

    const mailer = createTransporterFromConfig(null);
    if (!mailer) {
      return jsonResponse(200, {
        success: true,
        delivered: false,
        isSmtpConfigured: false,
        message:
          'Sunucu e-posta (SMTP) ortam değişkenleri henüz tanımlanmamış. Netlify panelinden info@testimgeldi.com SMTP bilgilerini ekleyiniz.',
      });
    }

    try {
      await mailer.transporter.sendMail({
        from: mailer.from,
        to: cleanEmail,
        replyTo: 'info@testimgeldi.com',
        subject,
        html: buildVerificationEmailHtml({ isRegister, code: cleanCode }),
        text: `testimgeldi Güvenlik Kodunuz: ${cleanCode} (15 dakika geçerlidir)`,
      });

      return jsonResponse(200, {
        success: true,
        delivered: true,
        isSmtpConfigured: true,
        message: 'Doğrulama kodu e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol ediniz.',
      });
    } catch (smtpErr) {
      console.error('[NETLIFY SMTP ERROR]', smtpErr);
      return jsonResponse(200, {
        success: true,
        delivered: false,
        isSmtpConfigured: true,
        smtpError:
          'SMTP sunucusuna bağlanılamadı veya kimlik doğrulama reddedildi. Lütfen info@testimgeldi.com SMTP kullanıcı adı, şifre ve port ayarlarını kontrol ediniz.',
        message:
          'E-posta sunucusu (SMTP) doğrulama mailini gönderemedi. Lütfen yönetici ayarlarından SMTP bağlantısını test ediniz.',
      });
    }
  } catch (err) {
    console.error('[NETLIFY FUNCTION ERROR]', err);
    return jsonResponse(500, {
      error: 'Doğrulama e-postası işlenirken beklenmeyen bir hata oluştu.',
    });
  }
};
