import client from "prom-client";

// Tạo registry mặc định
const register = new client.Registry();

// Enable default metrics (CPU, memory, event loop lag...)
client.collectDefaultMetrics({ register });

// Đếm số request theo method, route, status code
const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// Đo thờI gian response (histogram)
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// Middleware đo metric
export function metricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    const method = req.method;
    const status = res.statusCode;

    httpRequestCounter.inc({ method, route, status_code: status });
    httpRequestDuration.observe({ method, route, status_code: status }, duration);
  });

  next();
}

// Endpoint /metrics
export async function metricsEndpoint(req, res) {
  try {
    const metrics = await register.metrics();
    res.set("Content-Type", register.contentType);
    res.end(metrics);
  } catch (err) {
    res.status(500).end(err.message);
  }
}

export { register };
