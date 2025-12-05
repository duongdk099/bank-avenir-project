import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './jwt-payload.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async generateToken(userId: string, role: string): Promise<string> {
    // Map role permissions based on Section 5.1
    const permissions = this.getPermissionsForRole(role);

    const payload: JwtPayload = {
      sub: userId,
      role: role as 'CLIENT' | 'ADMIN' | 'MANAGER',
      permissions,
    };

    return this.jwtService.sign(payload);
  }

  private getPermissionsForRole(role: string): string[] {
    const permissionsMap: Record<string, string[]> = {
      CLIENT: [
        'account:read',
        'account:transfer',
        'profile:read',
        'profile:update',
      ],
      ADMIN: [
        'account:read',
        'account:write',
        'user:read',
        'user:write',
        'user:delete',
      ],
      MANAGER: [
        'account:read',
        'account:write',
        'user:read',
        'user:write',
        'report:read',
        'loan:approve',
      ],
    };

    return permissionsMap[role] || [];
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.comparePasswords(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
    };
  }

  async login(email: string, password: string): Promise<{ accessToken: string; user: any }> {
    const user = await this.validateUser(email, password);
    const accessToken = await this.generateToken(user.id, user.role);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    };
  }
}
