// ============================================
// NIVA — Auth Service
// ============================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { config } from '../../config';
import { AuthPayload } from '../../middleware/auth';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface LoginInput {
  emailOrUsername: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  token: string;
  expiresAt: Date;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, username, password, displayName } = input;

    // Check if email or username already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
      },
    });

    if (existing) {
      if (existing.email === email.toLowerCase()) {
        throw new ConflictError('Email already registered');
      }
      throw new ConflictError('Username already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        displayName: displayName || username,
      },
    });

    // Create session
    const tokenData = await this.createSession(user.id, user.email, user.username);

    // Audit log
    await this.auditLog(user.id, 'user.register', 'auth', { email: user.email });

    logger.info(`New user registered: ${user.username}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      ...tokenData,
    };
  }

  /**
   * Login with email/username and password
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const { emailOrUsername, password } = input;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername.toLowerCase() },
          { username: emailOrUsername.toLowerCase() },
        ],
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      await this.auditLog(user.id, 'user.login_failed', 'auth', {
        reason: 'invalid_password',
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session
    const tokenData = await this.createSession(user.id, user.email, user.username);

    // Audit log
    await this.auditLog(user.id, 'user.login', 'auth');

    logger.info(`User logged in: ${user.username}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      ...tokenData,
    };
  }

  /**
   * Logout — invalidate session
   */
  async logout(token: string): Promise<void> {
    await prisma.session.updateMany({
      where: { token },
      data: { isActive: false },
    });
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        twoFactorEnabled: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new BadRequestError('User not found');
    }

    return user;
  }

  /**
   * Create JWT token and session
   */
  private async createSession(
    userId: string,
    email: string,
    username: string
  ): Promise<{ token: string; expiresAt: Date }> {
    const payload: AuthPayload = { userId, email, username };
    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    // Calculate expiry
    const decoded = jwt.decode(token) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000);

    // Store session
    await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
        isActive: true,
      },
    });

    return { token, expiresAt };
  }

  /**
   * Audit log helper
   */
  private async auditLog(
    userId: string,
    action: string,
    resource?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      await prisma.auditEvent.create({
        data: {
          userId,
          action,
          resource,
          details: details ? (details as any) : undefined,
        },
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
    }
  }
}

export const authService = new AuthService();
