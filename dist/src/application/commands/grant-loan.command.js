"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrantLoanCommand = void 0;
class GrantLoanCommand {
    userId;
    accountId;
    principal;
    annualRate;
    termMonths;
    insuranceRate;
    constructor(userId, accountId, principal, annualRate, termMonths, insuranceRate) {
        this.userId = userId;
        this.accountId = accountId;
        this.principal = principal;
        this.annualRate = annualRate;
        this.termMonths = termMonths;
        this.insuranceRate = insuranceRate;
    }
}
exports.GrantLoanCommand = GrantLoanCommand;
//# sourceMappingURL=grant-loan.command.js.map