// src/modules/user/user.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { User, Prisma } from 'generated/prisma';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
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
    return this.userRepository.findByEmail(email);
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
    try {
      return await this.userRepository.update(id, data);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw error;
    }
  }

  async deleteUser(id: string): Promise<User> {
    try {
      return await this.userRepository.delete(id);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw error;
    }
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