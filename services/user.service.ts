import bcrypt from 'bcryptjs';
import { userRepository } from '@/repositories/user.repository';
import { assertPermission } from '@/lib/rbac';
import { ApiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import type { Role } from '@prisma/client';

interface ActingUser {
  id: string;
  role: Role;
}

export const userService = {
  async list(actingUser: ActingUser) {
    assertPermission(actingUser.role, 'USERS_MANAGE');
    return userRepository.list();
  },

  async createUser(
    actingUser: ActingUser,
    input: { name: string; email: string; password: string; role: Role }
  ) {
    assertPermission(actingUser.role, 'USERS_MANAGE');

    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ApiError('A user with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });

    logger.auth('User created by admin', { userId: user.id, createdBy: actingUser.id });
    return user;
  },

  async updateUser(actingUser: ActingUser, targetId: string, data: Partial<{ name: string; role: Role }>) {
    assertPermission(actingUser.role, 'USERS_MANAGE');

    const target = await userRepository.findById(targetId);
    if (!target) {
      throw new ApiError('User not found', 404);
    }

    const updated = await userRepository.update(targetId, data);
    logger.auth('User updated by admin', { userId: targetId, updatedBy: actingUser.id });
    return updated;
  },
};
