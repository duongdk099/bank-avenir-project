"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BanAccountCommand = exports.CloseAccountCommand = exports.RenameAccountCommand = exports.DirectorCreateAccountCommand = void 0;
class DirectorCreateAccountCommand {
    userId;
    accountType;
    initialDeposit;
    name;
    constructor(userId, accountType, initialDeposit, name) {
        this.userId = userId;
        this.accountType = accountType;
        this.initialDeposit = initialDeposit;
        this.name = name;
    }
}
exports.DirectorCreateAccountCommand = DirectorCreateAccountCommand;
class RenameAccountCommand {
    accountId;
    newName;
    requestedBy;
    constructor(accountId, newName, requestedBy) {
        this.accountId = accountId;
        this.newName = newName;
        this.requestedBy = requestedBy;
    }
}
exports.RenameAccountCommand = RenameAccountCommand;
class CloseAccountCommand {
    accountId;
    reason;
    requestedBy;
    constructor(accountId, reason, requestedBy) {
        this.accountId = accountId;
        this.reason = reason;
        this.requestedBy = requestedBy;
    }
}
exports.CloseAccountCommand = CloseAccountCommand;
class BanAccountCommand {
    accountId;
    reason;
    directorId;
    constructor(accountId, reason, directorId) {
        this.accountId = accountId;
        this.reason = reason;
        this.directorId = directorId;
    }
}
exports.BanAccountCommand = BanAccountCommand;
//# sourceMappingURL=account-management.commands.js.map