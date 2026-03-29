import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationPin(email: string, pin: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: '✨ Tu código de acceso exclusivo - SweetyLust',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Montecarlo&family=Cinzel:wght@400;700&family=Poiret+One&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0f0507; color: #f3d0d7;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0507; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #1a080c; border: 1px solid #461B27; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                  
                  <tr>
                    <td style="background: linear-gradient(135deg, #0f0507 0%, #2d1119 50%, #461B27 100%); padding: 50px 20px; text-align: center; border-bottom: 1px solid #461B27;">
                      <h1 style="font-family: 'Montecarlo', cursive; color: #ffa9a9; margin: 0; font-size: 52px; font-weight: normal; line-height: 1;">Sweety Lust</h1>
                      
                      <div style="width: 40px; background-color: #ffa9a9; height: 1px; margin: 15px auto; opacity: 0.3;"></div>
                      
                      <p style="font-family: 'Cinzel', serif; color: #f3d0d7; margin: 0; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; opacity: 0.8;">Verificación de Seguridad</p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 50px 40px; text-align: center; font-family: 'Poiret One', sans-serif;">
                      <p style="color: #f3d0d7; font-size: 24px; margin: 0 0 20px 0; font-weight: 400;">Hola,</p>
                      <p style="color: #f3d0d7; font-size: 17px; line-height: 1.8; margin: 0 0 40px 0; opacity: 0.9; letter-spacing: 0.5px;">
                        Has solicitado acceder a tu espacio en <b style="color: #ffa9a9; font-family: 'Cinzel', serif; font-size: 14px; letter-spacing: 1px;">SweetyLust</b>. Para proteger tu privacidad y verificar tu identidad, utiliza el siguiente código de acceso:
                      </p>
                      
                      <div style="background-color: rgba(70, 27, 39, 0.2); border: 1px solid rgba(255, 169, 169, 0.2); border-radius: 20px; padding: 35px; margin: 25px 0;">
                        <span style="font-family: 'Cinzel', serif; font-size: 52px; font-weight: bold; letter-spacing: 14px; color: #ffa9a9; display: block;">${pin}</span>
                      </div>
                      
                      <p style="color: #ffa9a9; font-size: 14px; margin: 30px 0 0 0; letter-spacing: 2px; text-transform: uppercase;">
                        Válido por los próximos <b>10 minutos</b>
                      </p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="background-color: #0f0507; padding: 40px 30px; text-align: center; border-top: 1px solid #461B27; font-family: 'Poiret One', sans-serif;">
                      <p style="color: #461B27; font-size: 12px; margin: 0 0 10px 0; letter-spacing: 3px; text-transform: uppercase;">
                        © ${new Date().getFullYear()} SweetyLust — Tu espacio privado de placer y fantasía.
                      </p>
                      <div style="width: 20px; height: 1px; background-color: #461B27; margin: 10px auto; opacity: 0.5;"></div>
                      <p style="color: #461B27; font-size: 10px; margin: 0; opacity: 0.8; letter-spacing: 1px;">
                        Este es un mensaje automático generado por seguridad.
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
