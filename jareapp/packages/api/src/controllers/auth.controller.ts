import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { generateTokenPair, verifyRefreshToken, signAccessToken } from '../utils/jwt';
import { sendOtpSms, generateOtpCode } from '../services/sms';
import { AuthenticatedRequest } from '../middleware/auth';

const OTP_EXPIRES_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES || '10', 10);
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6', 10);

// POST /auth/send-otp
export async function sendOtp(req: Request, res: Response): Promise<void> {
  try {
    const { phone } = req.body as { phone: string };

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { phone } });

    // Generate OTP
    const code = generateOtpCode(OTP_LENGTH);
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    // Save OTP
    await prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt,
        userId: existingUser?.id,
      },
    });

    // Send SMS
    await sendOtpSms(phone, code);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        isNewUser: !existingUser,
        phone,
        expiresInMinutes: OTP_EXPIRES_MINUTES,
      },
    });
  } catch (error) {
    console.error('[Auth] sendOtp error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
}

// POST /auth/verify-otp
export async function verifyOtp(req: Request, res: Response): Promise<void> {
  try {
    const { phone, code } = req.body as { phone: string; code: string };

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone,
        code,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
      return;
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      // New user - return a temp token for registration
      res.json({
        success: true,
        message: 'Phone verified successfully',
        data: {
          isNewUser: true,
          phone,
        },
      });
      return;
    }

    // Existing user - update last login and return tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        isVerified: true,
      },
    });

    const tokens = generateTokenPair({
      userId: user.id,
      role: user.role,
      phone: user.phone,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        isNewUser: false,
        tokens,
        user: {
          id: user.id,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role,
          neighborhoodId: user.neighborhoodId,
          preferredLanguage: user.preferredLanguage,
        },
      },
    });
  } catch (error) {
    console.error('[Auth] verifyOtp error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
}

// POST /auth/register
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { phone, firstName, lastName, email, password, neighborhoodId, preferredLanguage } =
      req.body as {
        phone: string;
        firstName: string;
        lastName: string;
        email?: string;
        password?: string;
        neighborhoodId?: string;
        preferredLanguage?: string;
      };

    // Verify phone was previously validated with OTP (check for used OTP)
    const usedOtp = await prisma.otpCode.findFirst({
      where: {
        phone,
        isUsed: true,
        createdAt: { gt: new Date(Date.now() - 30 * 60 * 1000) }, // within 30 mins
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!usedOtp) {
      res.status(400).json({ success: false, message: 'Phone number must be verified first' });
      return;
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      res.status(409).json({ success: false, message: 'User with this phone already exists' });
      return;
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        res.status(409).json({ success: false, message: 'User with this email already exists' });
        return;
      }
    }

    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, 12);
    }

    // Validate neighborhood if provided
    if (neighborhoodId) {
      const neighborhood = await prisma.neighborhood.findUnique({ where: { id: neighborhoodId } });
      if (!neighborhood) {
        res.status(400).json({ success: false, message: 'Invalid neighborhood ID' });
        return;
      }
    }

    const user = await prisma.user.create({
      data: {
        phone,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        email: email || undefined,
        passwordHash,
        neighborhoodId: neighborhoodId || undefined,
        preferredLanguage: (preferredLanguage as 'AR' | 'EN') || 'AR',
        isVerified: true,
        lastLoginAt: new Date(),
      },
    });

    const tokens = generateTokenPair({
      userId: user.id,
      role: user.role,
      phone: user.phone,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        tokens,
        user: {
          id: user.id,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role,
          neighborhoodId: user.neighborhoodId,
          preferredLanguage: user.preferredLanguage,
        },
      },
    });
  } catch (error) {
    console.error('[Auth] register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
}

// POST /auth/login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { phone, password } = req.body as { phone: string; password: string };

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ success: false, message: 'Account is deactivated' });
      return;
    }

    if (!user.passwordHash) {
      res.status(401).json({ success: false, message: 'Password login not available for this account. Use OTP.' });
      return;
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = generateTokenPair({
      userId: user.id,
      role: user.role,
      phone: user.phone,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        tokens,
        user: {
          id: user.id,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role,
          neighborhoodId: user.neighborhoodId,
          preferredLanguage: user.preferredLanguage,
        },
      },
    });
  } catch (error) {
    console.error('[Auth] login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
}

// POST /auth/refresh
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken: token } = req.body as { refreshToken: string };

    if (!token) {
      res.status(400).json({ success: false, message: 'Refresh token is required' });
      return;
    }

    const payload = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, phone: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'User not found or inactive' });
      return;
    }

    const newAccessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      phone: user.phone,
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: 15 * 60,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: 'Refresh token has expired. Please login again.' });
      return;
    }
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
}

// POST /auth/logout
export async function logout(_req: AuthenticatedRequest, res: Response): Promise<void> {
  // In a stateless JWT setup, logout is handled client-side
  // If using Redis blacklist, you'd add the token here
  res.json({ success: true, message: 'Logged out successfully' });
}

// GET /auth/me
export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        neighborhood: {
          include: { governorate: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        isVerified: user.isVerified,
        isActive: user.isActive,
        neighborhoodId: user.neighborhoodId,
        neighborhood: user.neighborhood,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth] getMe error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user info' });
  }
}
