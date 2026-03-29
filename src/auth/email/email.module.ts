import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('BREVO_SMTP_HOST'),
          port: configService.get('BREVO_SMTP_PORT'),
          secure: configService.get('BREVO_EMAIL_SECURE') === 'true',
          auth: {
            user: configService.get('BREVO_SMTP_USER'),
            pass: configService.get('BREVO_SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: `"${configService.get('BREVO_FROM_NAME')}" <${configService.get('BREVO_FROM_EMAIL')}>`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
