import { describe, expect, it, vi, beforeEach } from 'vitest';
import { userRepository } from '@/repositories/user.repository';
import { authService } from '@/services/auth.service';

vi.mock('@/repositories/user.repository', () => ({
  userRepository: {
    findByEmail: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    list: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService.register', () => {
  it('rejects registration when the email is already taken', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue({ id: 'existing' } as never);

    await expect(
      authService.register({ name: 'Jordan Lee', email: 'jordan@test.com', password: 'Password123!' })
    ).rejects.toThrow('already exists');
  });

  it('hashes the password before storing the user and defaults role to MEMBER', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.create).mockResolvedValue({
      id: 'new-user',
      name: 'Jordan Lee',
      email: 'jordan@test.com',
      role: 'MEMBER',
    } as never);

    const result = await authService.register({
      name: 'Jordan Lee',
      email: 'jordan@test.com',
      password: 'Password123!',
    });

    const createArg = vi.mocked(userRepository.create).mock.calls[0]![0];
    expect(createArg.passwordHash).not.toBe('Password123!');
    expect(createArg.role).toBe('MEMBER');
    expect(result.email).toBe('jordan@test.com');
  });
});
