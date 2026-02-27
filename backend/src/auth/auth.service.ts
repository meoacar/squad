import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { UserStatus } from '../common/enums';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async register(registerDto: RegisterDto) {
        const existingEmail = await this.usersService.findByEmail(registerDto.email);
        if (existingEmail) {
            throw new ConflictException('Email already exists');
        }

        const existingUsername = await this.usersService.findByUsername(registerDto.username);
        if (existingUsername) {
            throw new ConflictException('Username already exists');
        }

        const bcryptRounds = parseInt(this.configService.get<string>('BCRYPT_ROUNDS', '10'), 10);
        const hashedPassword = await bcrypt.hash(registerDto.password, bcryptRounds);
        const emailVerificationToken = this.generateRandomToken();

        const user = await this.usersService.create({
            ...registerDto,
            password: hashedPassword,
            email_verification_token: emailVerificationToken,
            status: UserStatus.PENDING_VERIFICATION,
        });

        return {
            user,
            message: 'Registration successful. Please check your email to verify your account.',
        };
    }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.account_locked_until && user.account_locked_until > new Date()) {
            throw new UnauthorizedException(`Account is locked until ${user.account_locked_until.toISOString()}`);
        }

        if (user.status === UserStatus.BANNED) {
            throw new UnauthorizedException('Account is banned');
        }

        if (user.status === UserStatus.SUSPENDED) {
            throw new UnauthorizedException('Account is suspended');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            await this.usersService.incrementFailedLoginAttempts(user.id);

            if (user.failed_login_attempts >= 4) {
                const lockUntil = new Date();
                lockUntil.setMinutes(lockUntil.getMinutes() + 15);
                await this.usersService.lockAccount(user.id, lockUntil);
                throw new UnauthorizedException('Account locked due to multiple failed login attempts. Try again in 15 minutes.');
            }

            throw new UnauthorizedException('Invalid credentials');
        }

        await this.usersService.resetFailedLoginAttempts(user.id);
        await this.usersService.updateLastLogin(user.id);

        const tokens = await this.generateTokens(user);
        const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
        await this.usersService.update(user.id, { refresh_token: hashedRefreshToken });

        return { ...tokens, user };
    }

    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });

            const user = await this.usersService.findOne(payload.sub);

            if (!user.refresh_token) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refresh_token);
            if (!isRefreshTokenValid) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const tokens = await this.generateTokens(user);
            const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
            await this.usersService.update(user.id, { refresh_token: hashedRefreshToken });

            return tokens;
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async logout(userId: string) {
        await this.usersService.update(userId, { refresh_token: undefined });
        return { message: 'Logout successful' };
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return { message: 'If the email exists, a password reset link has been sent.' };
        }

        const resetToken = this.generateRandomToken();
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 1);

        await this.usersService.update(user.id, {
            password_reset_token: resetToken,
            password_reset_expires: resetExpires,
        });

        return { message: 'If the email exists, a password reset link has been sent.' };
    }

    async resetPassword(token: string, newPassword: string) {
        const users = await this.usersService.findAll();
        const user = users.find(
            (u) => u.password_reset_token === token && u.password_reset_expires && u.password_reset_expires > new Date(),
        );

        if (!user) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        const bcryptRounds = parseInt(this.configService.get<string>('BCRYPT_ROUNDS', '10'), 10);
        const hashedPassword = await bcrypt.hash(newPassword, bcryptRounds);

        await this.usersService.update(user.id, {
            password: hashedPassword,
            password_reset_token: undefined,
            password_reset_expires: undefined,
        });

        return { message: 'Password reset successful' };
    }

    async verifyEmail(token: string) {
        const users = await this.usersService.findAll();
        const user = users.find((u) => u.email_verification_token === token);

        if (!user) {
            throw new BadRequestException('Invalid verification token');
        }

        if (user.email_verified) {
            return { message: 'Email already verified' };
        }

        await this.usersService.update(user.id, {
            email_verified: true,
            email_verified_at: new Date(),
            email_verification_token: undefined,
            status: UserStatus.ACTIVE,
        });

        return { message: 'Email verified successfully' };
    }

    async resendVerificationEmail(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return { message: 'If the email exists, a verification email has been sent.' };
        }

        if (user.email_verified) {
            throw new BadRequestException('Email already verified');
        }

        const emailVerificationToken = this.generateRandomToken();
        await this.usersService.update(user.id, { email_verification_token: emailVerificationToken });

        return { message: 'If the email exists, a verification email has been sent.' };
    }

    private async generateTokens(user: User) {
        const payload = { sub: user.id, email: user.email, username: user.username };

        const [access_token, refresh_token] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
            }),
        ]);

        return { access_token, refresh_token };
    }

    private generateRandomToken(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.usersService.findOne(userId);

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Mevcut şifre hatalı');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await this.usersService.update(userId, {
            password: hashedPassword,
            refresh_token: undefined, // Force re-login
        });
    }
}
