function toDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calculateLeaveDays(startDate, endDate) {
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);

  if (!start || !end) {
    return { valid: false, message: "Start date and end date must be valid dates" };
  }

  if (end < start) {
    return { valid: false, message: "End date cannot be before start date" };
  }

  const diffTime = end - start;
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return { valid: true, totalDays };
}

function parseTime(value) {
  if (!value) return null;
  const date = new Date(`1970-01-01T${value}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calculateHoursWorked(checkIn, checkOut) {
  if (!checkIn || !checkOut) return { valid: true, hours: 0 };

  const checkInTime = parseTime(checkIn);
  const checkOutTime = parseTime(checkOut);

  if (!checkInTime || !checkOutTime) {
    return { valid: false, message: "Check-in and check-out must be valid times" };
  }

  if (checkOutTime < checkInTime) {
    return { valid: false, message: "Check-out cannot be before check-in" };
  }

  const diffMs = checkOutTime - checkInTime;
  return { valid: true, hours: parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)) };
}

function normalizePerformanceScores(rawScores) {
  const scores = rawScores.map((score) => {
    if (score === undefined || score === null || score === "") {
      return null;
    }

    const numericScore = Number(score);
    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 5) {
      return { invalid: true };
    }

    return numericScore;
  });

  if (scores.some((score) => score?.invalid)) {
    return { valid: false, message: "Performance scores must be numbers between 0 and 5" };
  }

  const validScores = scores.filter((score) => score !== null);
  const overallScore = validScores.length
    ? parseFloat((validScores.reduce((sum, score) => sum + score, 0) / validScores.length).toFixed(2))
    : 0;

  return { valid: true, scores, overallScore };
}

module.exports = {
  calculateLeaveDays,
  calculateHoursWorked,
  normalizePerformanceScores,
};
