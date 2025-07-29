// src/modules/user/user.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { User, Prisma } from 'generated/prisma';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    // let repository handle unique‐constraint conflicts
    return this.userRepository.create(data);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    // repository will throw on DB errors; null means “not found”
    return this.userRepository.findByEmail(email);
  }

  async getUserByEmailWithSocialAccounts(email: string): Promise<User | null> {
    return this.userRepository.findByEmailWithSocialAccounts(email);
  }

  async getUserWithSocialAccounts(id: string): Promise<User> {
    const user = await this.userRepository.findWithSocialAccounts(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async getUserWithRecentPosts(id: string, limit = 10): Promise<User> {
    const user = await this.userRepository.findWithRecentPosts(id, limit);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    // repository.handleError will throw NotFoundException if id doesn’t exist
    return this.userRepository.update(id, data);
  }

  async deleteUser(id: string): Promise<User> {
    // same here—repository maps P2025 → NotFoundException
    return this.userRepository.delete(id);
  }

  async getUsers(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    return this.userRepository.findMany(params);
  }

  async getUserCount(where?: Prisma.UserWhereInput): Promise<number> {
    return this.userRepository.count(where);
  }
}
