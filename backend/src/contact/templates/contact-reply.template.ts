import { Contact } from '../entities/contact.entity';

export interface ContactReplyTemplateData {
    contact: Contact;
    frontendUrl: string;
}

export const getContactReplyEmailTemplate = (data: ContactReplyTemplateData) => {
    const { contact, frontendUrl } = data;

    const subject = contact.subject
        ? `Re: ${contact.subject} - SquadBul İletişim`
        : 'İletişim Mesajınıza Cevap - SquadBul';

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎮 SquadBul</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">İletişim Mesajınıza Cevap</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    Merhaba <strong>${contact.name}</strong>,
                </p>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    İletişim mesajınız için teşekkür ederiz. Mesajınıza cevabımız aşağıdadır:
                </p>
                
                ${contact.subject ? `
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                    <p style="color: #999; font-size: 12px; margin: 0 0 5px 0;">KONU</p>
                    <p style="color: #333; font-size: 14px; margin: 0; font-weight: 600;">${contact.subject}</p>
                </div>
                ` : ''}
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                    <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">MESAJINIZ</p>
                    <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${contact.message}</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="color: rgba(255,255,255,0.9); font-size: 12px; margin: 0 0 10px 0;">CEVABIMIZ</p>
                    <p style="color: white; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${contact.admin_reply}</p>
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                    Başka sorularınız varsa, bu e-postayı yanıtlayarak veya <a href="${frontendUrl}/contact" style="color: #667eea; text-decoration: none;">iletişim formumuzu</a> kullanarak bize ulaşabilirsiniz.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${frontendUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600;">
                        SquadBul'a Git
                    </a>
                </div>
                
                <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px; text-align: center;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        © 2026 SquadBul. Tüm hakları saklıdır.
                    </p>
                    <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                        Bu e-posta ${contact.email} adresine gönderilmiştir.
                    </p>
                </div>
            </div>
        </div>
    `;

    const text = `
Merhaba ${contact.name},

İletişim mesajınız için teşekkür ederiz.

${contact.subject ? `KONU: ${contact.subject}\n` : ''}
MESAJINIZ:
${contact.message}

CEVABIMIZ:
${contact.admin_reply}

Başka sorularınız varsa bize ulaşabilirsiniz.

İyi oyunlar!
SquadBul Ekibi

---
© 2026 SquadBul
${frontendUrl}
    `;

    return { subject, html, text };
};
