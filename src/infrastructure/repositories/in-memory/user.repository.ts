import {
  IUserRepository,
  CreateUserDto,
  UpdateUserDto,
  UserFilters,
} from '../../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../../domain/types/entity.types';

/**
 * In-Memory implementation of User Repository
 * 
 * Used for unit testing and development without database dependencies
 */
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, UserEntity> = new Map();

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const users = Array.from(this.users.values());
    return users.find((u) => u.email === email) || null;
  }

  async create(user: CreateUserDto): Promise<UserEntity> {
    const newUser: UserEntity = {
      ...user,
      profile: user.profile
        ? {
            id: crypto.randomUUID(),
            userId: user.id,
            ...user.profile,
          }
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async update(id: string, data: Partial<UpdateUserDto>): Promise<UserEntity> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    const updatedUser: UserEntity = {
      ...user,
      ...data,
      profile: data.profile
        ? { ...user.profile, ...data.profile }
        : user.profile,
      updatedAt: new Date(),
    } as UserEntity;

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  async findAll(filters?: UserFilters): Promise<UserEntity[]> {
    let users = Array.from(this.users.values());

    if (filters?.role) {
      users = users.filter((u) => u.role === filters.role);
    }

    if (filters?.status) {
      users = users.filter((u) => u.status === filters.status);
    }

    if (filters?.email) {
      users = users.filter((u) => u.email.includes(filters.email!));
    }

    return users.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async count(filters?: UserFilters): Promise<number> {
    const users = await this.findAll(filters);
    return users.length;
  }

  // Test helper methods
  clear(): void {
    this.users.clear();
  }

  getAll(): UserEntity[] {
    return Array.from(this.users.values());
  }
}
