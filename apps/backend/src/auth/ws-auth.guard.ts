import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const token = client.handshake.auth?.token;

    if (!token) return false;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      client.user = decoded;
      return true;
    } catch {
      return false;
    }
  }
}
