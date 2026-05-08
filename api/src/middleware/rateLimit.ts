import { config } from '../config/constants';

export const rateLimitConfig = {
  max: config.rateLimitMax,
  timeWindow: config.rateLimitWindow,
  cache: 10000,
  allowList: ['127.0.0.1'],
  redis: undefined, // Can be configured to use Redis for distributed rate limiting
  skipOnError: true,
};
