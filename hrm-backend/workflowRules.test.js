const {
  calculateHoursWorked,
  calculateLeaveDays,
  normalizePerformanceScores,
} = require("./utils/workflowRules");

describe("Workflow validation rules", () => {
  test("calculates inclusive leave days", () => {
    const result = calculateLeaveDays("2026-09-20", "2026-09-22");
    expect(result).toEqual({ valid: true, totalDays: 3 });
  });

  test("rejects leave end date before start date", () => {
    const result = calculateLeaveDays("2026-09-22", "2026-09-20");
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/End date/);
  });

  test("calculates worked hours from valid times", () => {
    const result = calculateHoursWorked("09:15:00", "17:45:00");
    expect(result).toEqual({ valid: true, hours: 8.5 });
  });

  test("rejects check-out before check-in", () => {
    const result = calculateHoursWorked("17:00:00", "09:00:00");
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/Check-out/);
  });

  test("averages performance scores as numbers", () => {
    const result = normalizePerformanceScores(["5", "4", "4", "5", "3"]);
    expect(result.valid).toBe(true);
    expect(result.scores).toEqual([5, 4, 4, 5, 3]);
    expect(result.overallScore).toBe(4.2);
  });

  test("rejects performance scores outside the 0-5 range", () => {
    const result = normalizePerformanceScores(["5", "6", "4", "5", "3"]);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/between 0 and 5/);
  });
});
