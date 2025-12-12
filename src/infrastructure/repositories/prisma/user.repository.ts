import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  IUserRepository,
  UserEntity,
  CreateUserDto,
  UpdateUserDto,
  UserFilters,
} from '../../../domain/repositories/user.repository.interface';

/**
 * Prisma-based implementation of User Repository
 * 
 * Infrastructure layer adapter that implements the domain repository interface
 */
@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(prismaUser: any): UserEntity {
    return {
      ...prismaUser,
      profile: prismaUser.profile ? {
        ...prismaUser.profile,
        phone: prismaUser.profile.phone ?? undefined,
        address: prismaUser.profile.address ?? undefined,
        city: prismaUser.profile.city ?? undefined,
        postalCode: prismaUser.profile.postalCode ?? undefined,
        country: prismaUser.profile.country ?? undefined,
        dateOfBirth: prismaUser.profile.dateOfBirth ?? undefined,
      } : undefined,
    };
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    return user ? this.toDomain(user) : null;
  }

  async create(user: CreateUserDto): Promise<UserEntity> {
    const { profile, ...userData } = user;

    const created = await this.prisma.user.create({
      data: {
        ...userData,
        profile: profile
          ? {
              create: profile,
            }
          : undefined,
      },
      include: { profile: true },
    });
    return this.toDomain(created);
  }

  async update(id: string, data: Partial<UpdateUserDto>): Promise<UserEntity> {
    const { profile, ...userData } = data;

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...userData,
        profile: profile
          ? {
              update: profile,
            }
          : undefined,
      },
      include: { profile: true },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findAll(filters?: UserFilters): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: filters?.role,
        status: filters?.status,
        email: filters?.email ? { contains: filters.email } : undefined,
      },
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(user => this.toDomain(user));
  }

  async count(filters?: UserFilters): Promise<number> {
    return this.prisma.user.count({
      where: {
        role: filters?.role,
        status: filters?.status,
        email: filters?.email ? { contains: filters.email } : undefined,
      },
    });
  }
}
