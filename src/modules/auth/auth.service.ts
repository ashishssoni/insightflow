import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WorkspaceRole } from '@prisma/client';
import { hashPassword, verifyPassword } from '../../common/password.util';
import { PrismaService } from '../../common/prisma.service';
import { slugify } from '../../common/slug.util';
import { env } from '../../config/env';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerOwner(payload: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const baseSlug = slugify(payload.workspaceName);
    const slug = await this.ensureUniqueWorkspaceSlug(baseSlug);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: payload.email.toLowerCase(),
          fullName: payload.fullName,
          passwordHash: hashPassword(payload.password),
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: payload.workspaceName,
          slug,
        },
      });

      await tx.membership.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: WorkspaceRole.OWNER,
        },
      });

      return { user, workspace };
    });

    const session = await this.issueTokens(result.user.id, result.user.email);
    await this.storeRefreshToken(result.user.id, session.refreshToken);

    return {
      message: 'Workspace owner registered successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
      },
      workspace: {
        id: result.workspace.id,
        name: result.workspace.name,
        slug: result.workspace.slug,
        role: WorkspaceRole.OWNER,
      },
      session,
    };
  }

  async login(payload: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
      include: { memberships: { include: { workspace: true } } },
    });

    if (!user?.passwordHash || !verifyPassword(payload.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const session = await this.issueTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, session.refreshToken);

    return {
      message: 'Login successful',
      user: { id: user.id, email: user.email, fullName: user.fullName },
      workspaces: user.memberships.map((membership) => ({
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        role: membership.role,
        plan: membership.workspace.plan,
      })),
      session,
    };
  }

  async refresh(userId: string, payload: RefreshTokenDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.refreshTokenHash || !verifyPassword(payload.refreshToken, user.refreshTokenHash)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.issueTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, session.refreshToken);
    return { message: 'Token refreshed', session };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { memberships: { include: { workspace: true } } },
    });

    if (!user) throw new UnauthorizedException('User not found');
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      workspaces: user.memberships.map((membership) => ({
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        role: membership.role,
        plan: membership.workspace.plan,
      })),
    };
  }

  private async issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hashPassword(refreshToken) },
    });
  }

  private async ensureUniqueWorkspaceSlug(baseSlug: string) {
    let candidate = baseSlug;
    let counter = 1;
    while (await this.prisma.workspace.findUnique({ where: { slug: candidate } })) {
      counter += 1;
      candidate = `${baseSlug}-${counter}`;
    }
    return candidate;
  }
}
