import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../../src/infrastructure/services/email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendConfirmationEmail', () => {
    it('should send confirmation email successfully', async () => {
      const email = 'test@example.com';
      const token = 'test-token-123';
      const userName = 'John Doe';

      // Mock the transporter
      const sendMailSpy = jest.spyOn(service['transporter'], 'sendMail').mockResolvedValue({
        messageId: 'test-message-id',
      } as any);

      await service.sendConfirmationEmail(email, token, userName);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Banque AVENIR <duongvfe123@gmail.com>',
          to: email,
          subject: 'Confirm Your Email - Banque AVENIR',
        }),
      );
    });

    it('should throw error if email sending fails', async () => {
      const email = 'test@example.com';
      const token = 'test-token-123';

      jest.spyOn(service['transporter'], 'sendMail').mockRejectedValue(new Error('SMTP error'));

      await expect(service.sendConfirmationEmail(email, token)).rejects.toThrow(
        'Failed to send confirmation email',
      );
    });
  });

  describe('sendSavingsRateNotification', () => {
    it('should send savings rate notification successfully', async () => {
      const email = 'test@example.com';
      const newRate = 0.025;
      const userName = 'Jane Doe';

      const sendMailSpy = jest.spyOn(service['transporter'], 'sendMail').mockResolvedValue({
        messageId: 'test-message-id',
      } as any);

      await service.sendSavingsRateNotification(email, newRate, userName);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Savings Rate Update - Banque AVENIR',
        }),
      );
    });

    it('should not throw error if notification sending fails', async () => {
      const email = 'test@example.com';
      const newRate = 0.025;

      jest.spyOn(service['transporter'], 'sendMail').mockRejectedValue(new Error('SMTP error'));

      // Should not throw - notifications are not critical
      await expect(service.sendSavingsRateNotification(email, newRate)).resolves.not.toThrow();
    });
  });
});
