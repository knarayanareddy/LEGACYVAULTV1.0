import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config/constants';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);

  if (error.validation) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.validation,
      },
    });
  }

  const statusCode = error.statusCode || 500;
  const message = config.isProd && statusCode === 500
    ? 'Internal Server Error'
    : error.message;

  reply.code(statusCode).send({
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message,
      ...(config.isDev && { stack: error.stack }),
    },
  });
}
