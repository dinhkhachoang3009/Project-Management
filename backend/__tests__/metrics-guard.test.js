process.env.NODE_ENV = "test";
import { TEST_JWT_SECRET } from "./helpers/test-env.js";

process.env.JWT_SECRET = TEST_JWT_SECRET;
// must exist BEFORE the app import chain
process.env.METRICS_TOKEN = "test-metrics-token";

// dynamic import: env is in place before the app chain loads
const [
  { default: createApp },
  { routeLabel },
  { default: callsMW },
] = await Promise.all([
  import("../app.js"),
  import("../libs/metrics.js"),
  import("supertest"),
]);

const app = createApp();
const request = callsMW(app);

describe("/metrics bearer guard (G4a)", () => {
  test("denies requests without a bearer token (fail-closed)", async () => {
    const res = await request.get("/metrics");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Unauthorized" });
  });

  test("denies a wrong token", async () => {
    const res = await request
      .get("/metrics")
      .set("Authorization", "Bearer not-the-token");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Unauthorized" });
  });

  test("serves metrics for the matching bearer token", async () => {
    const res = await request
      .get("/metrics")
      .set("Authorization", "Bearer test-metrics-token");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("http_requests_total");
  });
});

describe("route label fallback (G4a)", () => {
  test("matched routes keep their path template", () => {
    expect(routeLabel({ route: { path: "/api-v1/tasks/:taskId" } })).toBe(
      "/api-v1/tasks/:taskId"
    );
  });

  test("unmatched paths collapse to 'unmatched' (no per-URL cardinality)", () => {
    expect(routeLabel({ route: null, path: "/api-v1/who/knows/what" })).toBe(
      "unmatched"
    );
  });
});
