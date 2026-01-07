/**
 * Email Service Interface (Domain Layer)
 *
 * Following Clean Architecture principles:
 * - Interface defined in domain (DIP: Dependency Inversion Principle)
 * - Implementation will be in infrastructure layer
 * - No dependency on any framework or library
 */

export interface IEmailService {
  /**
   * Send email confirmation link to user
   *
   * @param to - Recipient email address
   * @param token - Confirmation token (unique, secure)
   * @param userName - User's full name for personalization
   * @returns Promise<boolean> - true if sent successfully
   */
  sendConfirmationEmail(to: string, token: string, userName: string): Promise<boolean>;

  /**
   * Send password reset email
   *
   * @param to - Recipient email address
   * @param token - Reset token
   * @param userName - User's full name
   * @returns Promise<boolean> - true if sent successfully
   */
  sendPasswordResetEmail(to: string, token: string, userName: string): Promise<boolean>;

  /**
   * Send notification about savings rate change
   *
   * @param to - Recipient email address
   * @param userName - User's full name
   * @param oldRate - Previous interest rate (%)
   * @param newRate - New interest rate (%)
   * @param effectiveDate - Date when new rate takes effect
   * @returns Promise<boolean> - true if sent successfully
   */
  sendSavingsRateChangeNotification(
    to: string,
    userName: string,
    oldRate: number,
    newRate: number,
    effectiveDate: Date,
  ): Promise<boolean>;

  /**
   * Send loan approval notification
   *
   * @param to - Recipient email address
   * @param userName - User's full name
   * @param loanAmount - Amount approved
   * @param monthlyPayment - Monthly payment amount
   * @param termMonths - Loan term in months
   * @returns Promise<boolean> - true if sent successfully
   */
  sendLoanApprovalEmail(
    to: string,
    userName: string,
    loanAmount: number,
    monthlyPayment: number,
    termMonths: number,
  ): Promise<boolean>;

  /**
   * Send order execution notification
   *
   * @param to - Recipient email address
   * @param userName - User's full name
   * @param orderType - BUY or SELL
   * @param symbol - Stock symbol
   * @param quantity - Number of shares
   * @param price - Execution price
   * @returns Promise<boolean> - true if sent successfully
   */
  sendOrderExecutionEmail(
    to: string,
    userName: string,
    orderType: string,
    symbol: string,
    quantity: number,
    price: number,
  ): Promise<boolean>;

  /**
   * Send generic notification email
   *
   * @param to - Recipient email address
   * @param subject - Email subject
   * @param body - Email body (HTML supported)
   * @returns Promise<boolean> - true if sent successfully
   */
  sendNotification(to: string, subject: string, body: string): Promise<boolean>;

  /**
   * Send test email (for development/testing)
   *
   * @param to - Recipient email address
   * @returns Promise<boolean> - true if sent successfully
   */
  sendTestEmail(to: string): Promise<boolean>;
}
