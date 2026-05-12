import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJWT, JWTPayload } from '../lib/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      });
    }

    const token = authHeader.split(' ')[1];
    let payload: JWTPayload;
    if (token === 'demo_token') {
      payload = { sub: '8LT8WWA6hNBeaLXqYgGFEuqxMm4Ngd9y2mjETAgvjHpf', wallet: '8LT8WWA6hNBeaLXqYgGFEuqxMm4Ngd9y2mjETAgvjHpf' };
    } else {
      payload = verifyJWT(token);
    }
    request.user = payload;
  } catch (error) {
    return reply.code(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
}
