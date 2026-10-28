// backend/src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../../generated/prisma/client';

export interface CurrentUserPayload {
  id: string;
  email: string;
  role: UserRole;
  vendorId?: string | null;
  companyId?: string | null;
}

/**
 * Custom parameter decorator to extract the logged-in user from the request.
 * Example 1: getProfile(@CurrentUser() user: CurrentUserPayload)
 * Example 2: getVendorProducts(@CurrentUser('vendorId') vendorId: string)
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
