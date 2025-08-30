import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { User, Prisma } from '@repo/db/prisma/generated/prisma';
import { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    // let repository handle unique‐constraint conflicts
    return this.userRepository.create(data);
  }

  async getUserById(id: string): Promise<User> {
    const cacheKey = `user:${id}`;
    const cachedUser = await this.cacheManager.get<User>(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.cacheManager.set(cacheKey, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async getUserByEmailOrThrow(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
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
    const user = await this.userRepository.update(id, data);
    const cacheKey = `user:${id}`;
    await this.cacheManager.del(cacheKey);
    return user;
  }

  async deleteUser(id: string): Promise<User> {
    const user = await this.userRepository.delete(id);
    const cacheKey = `user:${id}`;
    await this.cacheManager.del(cacheKey);
    return user;
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
