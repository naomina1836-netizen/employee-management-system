


const {
  canModifyEmployee,
  canAccessEmployee,
  isPrivileged,
  denyAccess
} = require("./utils/access");
const { parsePagination } = require("./utils/pagination");

describe("Employee ownership rules", () => {
  test("Employee cannot access another employee id", () => {
    const emp = { role: "Employee", employee_id: 2 };
    expect(canModifyEmployee(emp, 2)).toBe(true);
    expect(canModifyEmployee(emp, 3)).toBe(false);
  });

  test("HR can access any employee", () => {
    const hr = { role: "HR", employee_id: 5 };
    expect(canModifyEmployee(hr, 1)).toBe(true);
    expect(canModifyEmployee(hr, 100)).toBe(true);
  });

  test("denyAccess sends 403", () => {
    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      }
    };
    denyAccess(res, "nope");
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("nope");
  });
});

describe("List pagination query params", () => {
  test("limit and offset from query", () => {
    const p = parsePagination({ limit: "20", offset: "40" });
    expect(p.limit).toBe(20);
    expect(p.offset).toBe(40);
  });
});