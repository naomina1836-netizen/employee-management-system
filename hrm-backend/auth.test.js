



const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

describe("Auth utilities", () => {
  const secret = process.env.JWT_SECRET;

  test("JWT_SECRET is set for tests", () => {
    expect(secret).toBeTruthy();
    expect(String(secret).length).toBeGreaterThan(10);
  });

  test("can sign and verify a token", () => {
    const payload = {
      user_id: 1,
      username: "admin",
      email: "admin@hrm.com",
      role: "Admin",
      employee_id: 1,
      must_change_password: true
    };
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });
    const decoded = jwt.verify(token, secret);
    expect(decoded.user_id).toBe(1);
    expect(decoded.role).toBe("Admin");
    expect(decoded.must_change_password).toBe(true);
  });

  test("bcrypt hashes and verifies password123", async () => {
    const hash = await bcrypt.hash("password123", 10);
    expect(await bcrypt.compare("password123", hash)).toBe(true);
    expect(await bcrypt.compare("wrong", hash)).toBe(false);
  });

  test("demo seed hash matches password123", async () => {

    const seedHash = "$2a$10$yTgOMJAH8zZJcC0kuJr.hu6HlpBoUt/jfl09BlhKTh2PwTa7j/Q2i";
    const ok = await bcrypt.compare("password123", seedHash);
    expect(ok).toBe(true);
  });
});

describe("Access helpers", () => {
  const {
    isPrivileged,
    canModifyEmployee,
    canAccessEmployee
  } = require("./utils/access");

  test("Admin/HR are privileged", () => {
    expect(isPrivileged("Admin")).toBe(true);
    expect(isPrivileged("HR")).toBe(true);
    expect(isPrivileged("Employee")).toBe(false);
  });

  test("Employee can only modify self", () => {
    const user = { role: "Employee", employee_id: 5 };
    expect(canModifyEmployee(user, 5)).toBe(true);
    expect(canModifyEmployee(user, 9)).toBe(false);
  });

  test("Admin can modify anyone", () => {
    const user = { role: "Admin", employee_id: 1 };
    expect(canModifyEmployee(user, 99)).toBe(true);
  });
});

describe("Pagination helper", () => {
  const { parsePagination, paginatedResponse } = require("./utils/pagination");

  test("defaults", () => {
    const p = parsePagination({});
    expect(p.limit).toBe(50);
    expect(p.offset).toBe(0);
    expect(p.page).toBe(1);
  });

  test("page converts to offset", () => {
    const p = parsePagination({ page: 3, limit: 10 });
    expect(p.limit).toBe(10);
    expect(p.offset).toBe(20);
    expect(p.page).toBe(3);
  });

  test("max limit capped at 200", () => {
    const p = parsePagination({ limit: 999 });
    expect(p.limit).toBe(200);
  });

  test("paginatedResponse shape", () => {
    const body = paginatedResponse([{ id: 1 }], 25, { limit: 10, offset: 0, page: 1 });
    expect(body.data).toHaveLength(1);
    expect(body.pagination.total).toBe(25);
    expect(body.pagination.totalPages).toBe(3);
  });
});