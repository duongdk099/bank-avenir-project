"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankAccountAggregate = void 0;
const aggregate_root_js_1 = require("./aggregate-root.js");
const account_opened_event_js_1 = require("./events/account-opened.event.js");
const funds_deposited_event_js_1 = require("./events/funds-deposited.event.js");
const funds_withdrawn_event_js_1 = require("./events/funds-withdrawn.event.js");
const transfer_sent_event_js_1 = require("./events/transfer-sent.event.js");
const transfer_received_event_js_1 = require("./events/transfer-received.event.js");
const interest_applied_event_js_1 = require("./events/interest-applied.event.js");
const money_vo_js_1 = require("../value-objects/money.vo.js");
const iban_vo_js_1 = require("../value-objects/iban.vo.js");
class BankAccountAggregate extends aggregate_root_js_1.AggregateRoot {
    userId;
    iban;
    accountType;
    balance;
    status;
    interestRate;
    constructor(id) {
        super(id);
    }
    static open(id, userId, iban, accountType, initialBalance = 0, interestRate) {
        const account = new BankAccountAggregate(id);
        const event = new account_opened_event_js_1.AccountOpenedEvent(id, userId, iban, accountType, initialBalance, 'EUR');
        account.apply(event);
        return account;
    }
    deposit(amount, description = 'Deposit') {
        if (this.status !== 'ACTIVE') {
            throw new Error('Cannot deposit to an inactive account');
        }
        const depositAmount = money_vo_js_1.Money.create(amount);
        const newBalance = this.balance.add(depositAmount);
        const event = new funds_deposited_event_js_1.FundsDepositedEvent(this.id, amount, 'EUR', newBalance.getAmount(), description);
        this.apply(event);
    }
    withdraw(amount, description = 'Withdrawal') {
        if (this.status !== 'ACTIVE') {
            throw new Error('Cannot withdraw from an inactive account');
        }
        const withdrawAmount = money_vo_js_1.Money.create(amount);
        if (this.balance.isLessThan(withdrawAmount)) {
            throw new Error('Insufficient funds');
        }
        const newBalance = this.balance.subtract(withdrawAmount);
        const event = new funds_withdrawn_event_js_1.FundsWithdrawnEvent(this.id, amount, 'EUR', newBalance.getAmount(), description);
        this.apply(event);
    }
    sendTransfer(recipientAccountId, recipientIban, amount, description = 'Transfer') {
        if (this.status !== 'ACTIVE') {
            throw new Error('Cannot transfer from an inactive account');
        }
        if (!this.isInternalIban(recipientIban)) {
            throw new Error('External transfers not allowed. Only internal transfers within AVENIR bank are permitted.');
        }
        const transferAmount = money_vo_js_1.Money.create(amount);
        if (this.balance.isLessThan(transferAmount)) {
            throw new Error('Insufficient funds for transfer');
        }
        const newBalance = this.balance.subtract(transferAmount);
        const event = new transfer_sent_event_js_1.TransferSentEvent(this.id, recipientAccountId, recipientIban, amount, 'EUR', newBalance.getAmount(), description);
        this.apply(event);
    }
    receiveTransfer(senderAccountId, senderIban, amount, description = 'Transfer received') {
        if (this.status !== 'ACTIVE') {
            throw new Error('Cannot receive transfer to an inactive account');
        }
        const transferAmount = money_vo_js_1.Money.create(amount);
        const newBalance = this.balance.add(transferAmount);
        const event = new transfer_received_event_js_1.TransferReceivedEvent(this.id, senderAccountId, senderIban, amount, 'EUR', newBalance.getAmount(), description);
        this.apply(event);
    }
    applyInterest() {
        if (this.accountType !== 'SAVINGS') {
            throw new Error('Interest can only be applied to savings accounts');
        }
        if (this.status !== 'ACTIVE') {
            throw new Error('Cannot apply interest to an inactive account');
        }
        if (!this.interestRate || this.interestRate <= 0) {
            throw new Error('Invalid interest rate');
        }
        const dailyRate = this.interestRate / 365;
        const interestAmount = this.balance.multiply(dailyRate);
        if (!interestAmount.isZero()) {
            const newBalance = this.balance.add(interestAmount);
            const event = new interest_applied_event_js_1.InterestAppliedEvent(this.id, interestAmount.getAmount(), 'EUR', this.interestRate, newBalance.getAmount());
            this.apply(event);
        }
    }
    isInternalIban(iban) {
        const cleanIban = iban.replace(/\s/g, '');
        const bankCode = cleanIban.substring(4, 9);
        return cleanIban.startsWith('FR') && bankCode === '12345';
    }
    applyEvent(event) {
        switch (event.eventType) {
            case 'ACCOUNT_OPENED':
                this.onAccountOpened(event);
                break;
            case 'FUNDS_DEPOSITED':
                this.onFundsDeposited(event);
                break;
            case 'FUNDS_WITHDRAWN':
                this.onFundsWithdrawn(event);
                break;
            case 'TRANSFER_SENT':
                this.onTransferSent(event);
                break;
            case 'TRANSFER_RECEIVED':
                this.onTransferReceived(event);
                break;
            case 'INTEREST_APPLIED':
                this.onInterestApplied(event);
                break;
            default:
                throw new Error(`Unknown event type: ${event.eventType}`);
        }
    }
    onAccountOpened(event) {
        this.userId = event.userId;
        this.iban = iban_vo_js_1.IBAN.create(event.iban);
        this.accountType = event.accountType;
        this.balance = money_vo_js_1.Money.create(event.initialBalance, event.currency);
        this.status = 'ACTIVE';
        if (this.accountType === 'SAVINGS') {
            this.interestRate = 0.02;
        }
    }
    onFundsDeposited(event) {
        this.balance = money_vo_js_1.Money.create(event.balanceAfter, event.currency);
    }
    onFundsWithdrawn(event) {
        this.balance = money_vo_js_1.Money.create(event.balanceAfter, event.currency);
    }
    onTransferSent(event) {
        this.balance = money_vo_js_1.Money.create(event.balanceAfter, event.currency);
    }
    onTransferReceived(event) {
        this.balance = money_vo_js_1.Money.create(event.balanceAfter, event.currency);
    }
    onInterestApplied(event) {
        this.balance = money_vo_js_1.Money.create(event.balanceAfter, event.currency);
    }
    getUserId() {
        return this.userId;
    }
    getIban() {
        return this.iban;
    }
    getAccountType() {
        return this.accountType;
    }
    getBalance() {
        return this.balance;
    }
    getStatus() {
        return this.status;
    }
    getInterestRate() {
        return this.interestRate;
    }
}
exports.BankAccountAggregate = BankAccountAggregate;
//# sourceMappingURL=bank-account.aggregate.js.map