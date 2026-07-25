import { db } from '@/lib/db';
import type { Role } from '@prisma/client';

/**
 * Repository layer: talks to Prisma only. No validation, no permission
 * checks, no business rules — those live in the service layer above it.
 */
export const userRepository = {
  findByEmail(email: string) {
    return db.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return db.user.findUnique({ where: { id } });
  },

  create(input: { name: string; email: string; passwordHash: string; role?: Role }) {
    return db.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role ?? 'MEMBER',
      },
    });
  },

  update(id: string, data: Partial<{ name: string; role: Role }>) {
    return db.user.update({ where: { id }, data });
  },

  list() {
    return db.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  },
};
