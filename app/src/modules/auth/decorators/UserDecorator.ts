import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JWTPayload } from '../guards/AuthGuard';

export const User = createParamDecorator(
  (data: keyof any | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: JWTPayload = request.user;
    return data ? user?.[data] : user;
  },
);