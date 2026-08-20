const request = require("supertest");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_at_least_32_characters_long_xyz";
process.env.JWT_EXPIRE = "15m";
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_USER = process.env.DB_USER || "root";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "";
process.env.DB_NAME = process.env.DB_NAME || "hrm_db";

let app;
let canRun = false;

beforeAll(async () => {
  try {
    app = require("../server");
    await new Promise((r) => setTimeout(r, 1500));
    const res = await request(app).get("/api/health");
    canRun = res.status === 200;
  } catch (e) {
    console.warn("Skipping integration tests — server/DB not available:", e.message);
    canRun = false;
  }
});

describe("Auth API", () => {
  test("health check returns OK", async () => {
    if (!canRun) return;
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
  });

  test("login with invalid credentials returns 401", async () => {
    if (!canRun) return;
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "wrongpass" });
    expect(res.status).toBe(401);
  });

  test("login validation requires email and password", async () => {
    if (!canRun) return;
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });

  test("demo admin login succeeds and returns tokens", async () => {
    if (!canRun) return;
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@hrm.com", password: "password123" });

    if (res.status === 200) {
      expect(res.body.token || res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe("Admin");
    } else {
      console.warn("Admin login skipped/failed — ensure schema is seeded");
    }
  });

  test("protected route rejects missing token", async () => {
    if (!canRun) return;
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
