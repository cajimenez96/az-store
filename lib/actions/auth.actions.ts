'use server';

import { prisma } from '@/db/prisma';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

interface RequestPasswordResetResult {
  success: boolean;
  message: string;
}

interface ResetPasswordResult {
  success: boolean;
  message: string;
}

/**
 * Request password reset: generate token, store in DB, send email
 * @param email User email
 */
export async function requestPasswordReset(
  email: string
): Promise<RequestPasswordResetResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message:
          'Si el email existe en nuestro sistema, recibirás un link de reset.',
      };
    }

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    // Generate new token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY);

    await prisma.passwordResetToken.create({
      data: {
        token,
        email: email.toLowerCase(),
        expiresAt,
      },
    });

    // Generate reset link
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // Send email via API route
    try {
      const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'password-reset',
          email: user.email,
          resetLink,
        }),
      });

      if (!emailResponse.ok) {
        console.error('Failed to send password reset email');
        // Still return success to user to prevent enumeration
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      // Still return success to user to prevent enumeration
    }

    return {
      success: true,
      message:
        'Si el email existe en nuestro sistema, recibirás un link de reset.',
    };
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      message: 'Error al procesar tu solicitud. Intenta nuevamente.',
    };
  }
}

interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

/**
 * Reset password: verify token, hash new password, update user
 * @param token Reset token
 * @param newPassword New password
 */
export async function resetPassword({
  token,
  newPassword,
}: ResetPasswordPayload): Promise<ResetPasswordResult> {
  try {
    // Validate password strength
    if (newPassword.length < 6) {
      return {
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres.',
      };
    }

    // Find token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return {
        success: false,
        message:
          'El link de reset es inválido o ya fue utilizado. Solicita uno nuevo.',
      };
    }

    // Check expiration
    if (new Date() > resetToken.expiresAt) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { token },
      });

      return {
        success: false,
        message: 'El link de reset ha expirado. Solicita uno nuevo.',
      };
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      return {
        success: false,
        message: 'Usuario no encontrado.',
      };
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // Update user password and delete token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({
        where: { token },
      }),
    ]);

    return {
      success: true,
      message: 'Tu contraseña ha sido restablecida correctamente.',
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      message:
        'Error al restablecer tu contraseña. Intenta nuevamente más tarde.',
    };
  }
}

/**
 * Verify reset token validity without using it
 * @param token Reset token
 */
export async function verifyResetToken(token: string): Promise<boolean> {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) return false;

    return new Date() <= resetToken.expiresAt;
  } catch {
    return false;
  }
}
