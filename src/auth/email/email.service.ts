import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationPin(email: string, pin: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Código de verificación - SweetyLust',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Verificación</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%); padding: 30px 20px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">SweetyLust</h1>
                      <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Código de verificación</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 10px 0;">Hola,</p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 25px 0;">
                        Has solicitado iniciar sesión en tu cuenta de SweetyLust. Utiliza el siguiente código para completar tu verificación:
                      </p>
                      
                      <!-- PIN Code -->
                      <div style="background-color: #f5f5f5; border: 2px dashed #ff6b6b; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                        <span style="font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #ff6b6b; font-family: monospace;">${pin}</span>
                      </div>
                      
                      <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0 0 10px 0;">
                        <strong>Este código expirará en 10 minutos.</strong>
                      </p>
                      
                      <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 20px 0 0 0;">
                        Si no solicitaste este código, puedes ignorar este mensaje. Por seguridad, no compartas este código con nadie.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                      <p style="color: #999999; font-size: 12px; margin: 0 0 5px 0;">
                        © ${new Date().getFullYear()} SweetyLust. Todos los derechos reservados.
                      </p>
                      <p style="color: #999999; font-size: 12px; margin: 0;">
                        Este es un mensaje automático, por favor no responder a este correo.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
  }
}
