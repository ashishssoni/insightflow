import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from './prisma.service';
import { WORKSPACE_ROLES_KEY } from './roles.decorator';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(WORKSPACE_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { sub?: string } | undefined;
    if (!user?.sub) throw new UnauthorizedException('Missing authenticated user');

    const workspaceId =
      request.params?.workspaceId ?? request.body?.workspaceId ?? request.query?.workspaceId;

    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new ForbiddenException('Workspace context is required');
    }

    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.sub, workspaceId },
      select: { role: true },
    });

    if (!membership) throw new ForbiddenException('You do not belong to this workspace');
    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient workspace permissions');
    }

    request.workspaceMembership = membership;
    return true;
  }
}
