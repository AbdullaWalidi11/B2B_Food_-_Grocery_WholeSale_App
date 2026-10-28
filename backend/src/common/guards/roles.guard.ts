// backend/src/common/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../generated/prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Bouncer #2: Checks if the user's role matches the @Roles(...) decorator on the endpoint.
 * If the user's role is not allowed, it throws HTTP 403 Forbidden.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Read the roles required by the @Roles(...) decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are specified, the endpoint is accessible to any logged-in user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 2. Grab the user attached to the request by JwtAuthGuard
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 3. Check if user has permission
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
