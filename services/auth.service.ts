import bcrypt from 'bcryptjs';
import { userRepository } from '@/repositories/user.repository';
import { ApiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import type { RegisterInput } from '@/lib/validators/auth';

const SALT_ROUNDS = 12;

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ApiError('An account with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'MEMBER',
    });

    logger.auth('User registered', { userId: user.id });

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  },
};
