// api/src/middleware/metrics.middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { Counter, Histogram, register } from 'prom-client';

// Initialize default metrics
// collectDefaultMetrics(); // Handled in server.ts or separate init

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export async function metricsMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const start = process.hrtime();

  reply.then(
    () => {
      const delta = process.hrtime(start);
      const durationSeconds = delta[0] + delta[1] / 1e9;
      const labels = {
        method: request.method,
        route: request.routeOptions.url || 'unknown',
        status: reply.statusCode.toString(),
      };

      httpRequestsTotal.inc(labels);
      httpRequestDurationSeconds.observe(labels, durationSeconds);
    },
    (err) => {
        // Handle error if needed
    }
  );
}
