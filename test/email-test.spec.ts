import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../src/infrastructure/services/email.service';

describe('Email Service Tests', () => {
  let emailService: EmailService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    emailService = module.get<EmailService>(EmailService);
  });

  /**
   * Test 1: Send test email to b.amara@myskolae.fr
   */
  it('should send test email to b.amara@myskolae.fr', async () => {
    const result = await emailService.sendTestEmail('b.amara@myskolae.fr');

    expect(result).toBe(true);
    console.log('✅ Test email sent successfully to b.amara@myskolae.fr');
  }, 30000); // 30s timeout for email sending

  /**
   * Test 2: Send confirmation email
   */
  it('should send confirmation email to b.amara@myskolae.fr', async () => {
    const mockToken = 'test-token-123456';
    const mockName = 'Bilal Amara';

    const result = await emailService.sendConfirmationEmail(
      'b.amara@myskolae.fr',
      mockToken,
      mockName,
    );

    expect(result).toBe(true);
    console.log('✅ Confirmation email sent successfully');
  }, 30000);

  /**
   * Test 3: Send savings rate change notification
   */
  it('should send savings rate change notification to b.amara@myskolae.fr', async () => {
    const result = await emailService.sendSavingsRateChangeNotification(
      'b.amara@myskolae.fr',
      'Bilal Amara',
      0.02, // Old rate: 2%
      0.025, // New rate: 2.5%
      new Date('2025-02-01'),
    );

    expect(result).toBe(true);
    console.log('✅ Savings rate notification sent successfully');
  }, 30000);

  /**
   * Test 4: Send loan approval email
   */
  it('should send loan approval email to b.amara@myskolae.fr', async () => {
    const result = await emailService.sendLoanApprovalEmail(
      'b.amara@myskolae.fr',
      'Bilal Amara',
      50000, // 50,000€ loan
      450.50, // Monthly payment
      120, // 10 years
    );

    expect(result).toBe(true);
    console.log('✅ Loan approval email sent successfully');
  }, 30000);

  /**
   * Test 5: Send order execution email (BUY)
   */
  it('should send BUY order execution email to b.amara@myskolae.fr', async () => {
    const result = await emailService.sendOrderExecutionEmail(
      'b.amara@myskolae.fr',
      'Bilal Amara',
      'BUY',
      'AAPL',
      10, // 10 shares
      180.50, // Price per share
    );

    expect(result).toBe(true);
    console.log('✅ BUY order execution email sent successfully');
  }, 30000);

  /**
   * Test 6: Send order execution email (SELL)
   */
  it('should send SELL order execution email to b.amara@myskolae.fr', async () => {
    const result = await emailService.sendOrderExecutionEmail(
      'b.amara@myskolae.fr',
      'Bilal Amara',
      'SELL',
      'TSLA',
      5, // 5 shares
      250.75, // Price per share
    );

    expect(result).toBe(true);
    console.log('✅ SELL order execution email sent successfully');
  }, 30000);

  /**
   * Test 7: Send password reset email
   */
  it('should send password reset email to b.amara@myskolae.fr', async () => {
    const mockToken = 'reset-token-abcdef';
    const result = await emailService.sendPasswordResetEmail(
      'b.amara@myskolae.fr',
      mockToken,
      'Bilal Amara',
    );

    expect(result).toBe(true);
    console.log('✅ Password reset email sent successfully');
  }, 30000);

  /**
   * Test 8: Send generic notification
   */
  it('should send generic notification to b.amara@myskolae.fr', async () => {
    const result = await emailService.sendNotification(
      'b.amara@myskolae.fr',
      'Test de notification personnalisée',
      '<p>Bonjour <strong>Bilal</strong>,</p><p>Ceci est un test de notification générique de la Banque AVENIR.</p><p>Tous les systèmes fonctionnent correctement !</p>',
    );

    expect(result).toBe(true);
    console.log('✅ Generic notification sent successfully');
  }, 30000);
});
