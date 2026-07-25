import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { logger } from './logger';
import { loginSchema } from './validators/auth';
import type { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      image?: string | null;
    };
  }
  interface User {
    role: Role;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // No database adapter: sessions are pure JWTs and the only provider is
  // Credentials, which Auth.js does not persist through an adapter anyway.
  // (Account/Session/VerificationToken tables still exist in the schema per
  // the task spec's required table list, and are exactly where you'd wire an
  // adapter back in if an OAuth provider or database sessions were added.)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days — "remember session"
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
          logger.auth('Login attempt for unknown email', { email });
          return null;
        }

        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
          logger.auth('Login attempt with invalid password', { userId: user.id });
          return null;
        }

        logger.auth('Login succeeded', { userId: user.id });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      if (token.email) {
        session.user.email = token.email;
      }
      return session;
    },
  },
});
