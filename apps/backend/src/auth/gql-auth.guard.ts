import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();

    const req = ctx.req ?? ctx.request;
    if (!req) return false;

    // const authHeader = req.headers?.authorization;
    // if (!authHeader) return false;

    // const token = authHeader.split(' ')[1];
    // if (!token) return false;

    const token = req.cookies?.access_token;
    if (!token) return false;

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = payload;
      return true;
    } catch {
      return false;
    }
  }
}
