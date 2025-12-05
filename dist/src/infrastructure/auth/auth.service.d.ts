import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma/prisma.service.js';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    hashPassword(password: string): Promise<string>;
    comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean>;
    generateToken(userId: string, role: string): Promise<string>;
    private getPermissionsForRole;
    validateUser(email: string, password: string): Promise<any>;
    login(email: string, password: string): Promise<{
        accessToken: string;
        user: any;
    }>;
}
