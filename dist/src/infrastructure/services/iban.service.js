"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IbanService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IbanService = void 0;
const common_1 = require("@nestjs/common");
const iban_vo_js_1 = require("../../domain/value-objects/iban.vo.js");
const prisma_service_js_1 = require("../database/prisma/prisma.service.js");
let IbanService = class IbanService {
    static { IbanService_1 = this; }
    prisma;
    static accountCounter = 1;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateIban() {
        let iban;
        let isUnique = false;
        while (!isUnique) {
            const accountNumber = IbanService_1.accountCounter.toString();
            IbanService_1.accountCounter++;
            iban = iban_vo_js_1.IBAN.generate(accountNumber);
            const existing = await this.prisma.bankAccount.findUnique({
                where: { iban: iban.getValue() },
            });
            if (!existing) {
                isUnique = true;
            }
        }
        return iban;
    }
    validateIban(iban) {
        return iban_vo_js_1.IBAN.validate(iban);
    }
    isInternalIban(iban) {
        const cleanIban = iban.replace(/\s/g, '');
        const bankCode = cleanIban.substring(4, 9);
        return cleanIban.startsWith('FR') && bankCode === '12345';
    }
    async findAccountByIban(iban) {
        return this.prisma.bankAccount.findUnique({
            where: { iban: iban.replace(/\s/g, '') },
        });
    }
};
exports.IbanService = IbanService;
exports.IbanService = IbanService = IbanService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], IbanService);
//# sourceMappingURL=iban.service.js.map