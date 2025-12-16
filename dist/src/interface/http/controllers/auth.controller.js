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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const register_user_command_js_1 = require("../../../application/commands/register-user.command.js");
const confirm_email_command_js_1 = require("../../../application/commands/confirm-email.command.js");
const login_query_js_1 = require("../../../application/queries/login.query.js");
const register_user_dto_js_1 = require("../../../application/dto/register-user.dto.js");
const login_dto_js_1 = require("../../../application/dto/login.dto.js");
let AuthController = class AuthController {
    commandBus;
    queryBus;
    constructor(commandBus, queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }
    async register(dto) {
        const command = new register_user_command_js_1.RegisterUserCommand(dto.email, dto.password, dto.firstName, dto.lastName, dto.phone, dto.address, dto.city, dto.postalCode, dto.country, dto.dateOfBirth);
        const result = await this.commandBus.execute(command);
        return {
            message: 'User registered successfully. Please check your email to confirm your account.',
            userId: result.userId,
            confirmationToken: result.confirmationToken,
        };
    }
    async confirmEmail(token) {
        const command = new confirm_email_command_js_1.ConfirmEmailCommand(token);
        const result = await this.commandBus.execute(command);
        return {
            message: result.message,
            userId: result.userId,
        };
    }
    async login(dto) {
        const query = new login_query_js_1.LoginQuery(dto.email, dto.password);
        return this.queryBus.execute(query);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_user_dto_js_1.RegisterUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Get)('confirm/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "confirmEmail", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_js_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        cqrs_1.QueryBus])
], AuthController);
//# sourceMappingURL=auth.controller.js.map