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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterUserHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const register_user_command_js_1 = require("../commands/register-user.command.js");
const prisma_service_js_1 = require("../../infrastructure/database/prisma/prisma.service.js");
const auth_service_js_1 = require("../../infrastructure/auth/auth.service.js");
const event_store_service_js_1 = require("../../infrastructure/event-store/event-store.service.js");
const user_aggregate_js_1 = require("../../domain/entities/user.aggregate.js");
const uuid_1 = require("uuid");
let RegisterUserHandler = class RegisterUserHandler {
    prisma;
    authService;
    eventStore;
    eventBus;
    constructor(prisma, authService, eventStore, eventBus) {
        this.prisma = prisma;
        this.authService = authService;
        this.eventStore = eventStore;
        this.eventBus = eventBus;
    }
    async execute(command) {
        if (!command.email) {
            throw new common_1.BadRequestException('email is required');
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email: command.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const passwordHash = await this.authService.hashPassword(command.password);
        const userId = (0, uuid_1.v4)();
        const userAggregate = user_aggregate_js_1.UserAggregate.register(userId, command.email, passwordHash, 'CLIENT');
        await this.eventStore.save(userAggregate, 'User');
        await this.prisma.user.create({
            data: {
                id: userId,
                email: command.email,
                passwordHash: passwordHash,
                role: 'CLIENT',
                status: 'ACTIVE',
                profile: {
                    create: {
                        firstName: command.firstName,
                        lastName: command.lastName,
                        phone: command.phone,
                        address: command.address,
                        city: command.city,
                        postalCode: command.postalCode,
                        country: command.country,
                        dateOfBirth: command.dateOfBirth,
                    },
                },
            },
        });
        return { userId };
    }
};
exports.RegisterUserHandler = RegisterUserHandler;
exports.RegisterUserHandler = RegisterUserHandler = __decorate([
    (0, cqrs_1.CommandHandler)(register_user_command_js_1.RegisterUserCommand),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        auth_service_js_1.AuthService,
        event_store_service_js_1.EventStore,
        cqrs_1.EventBus])
], RegisterUserHandler);
//# sourceMappingURL=register-user.handler.js.map