function parseTimeToSeconds(value) {
  if (value == null || value === "") return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getHours() * 3600 + value.getMinutes() * 60 + value.getSeconds();
  }

  const str = String(value).trim();

  const isoMatch = str.match(/T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (isoMatch) {
    const h = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const s = Number(isoMatch[3] || 0);
    return h * 3600 + m * 60 + s;
  }

  const parts = str.split(":").map((p) => Number(p));
  if (parts.length >= 2 && parts.every((n) => Number.isFinite(n))) {
    const [h, m, s = 0] = parts;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 3600 + m * 60 + (Number.isFinite(s) ? s : 0);
  }

  return null;
}

function secondsToHours(seconds) {
  if (seconds == null || !Number.isFinite(seconds)) return 0;
  const hours = Math.max(0, seconds) / 3600;
  return Math.round(hours * 100) / 100;
}

function computeHoursWorked(checkIn, checkOut) {
  const inSec = parseTimeToSeconds(checkIn);
  const outSec = parseTimeToSeconds(checkOut);
  if (inSec == null || outSec == null) return 0;

  let diff = outSec - inSec;
  if (diff < 0) diff += 24 * 3600; 
  if (diff > 24 * 3600) diff = 24 * 3600;
  return secondsToHours(diff);
}

const DEFAULT_LATE_AFTER = 9 * 3600; 
const HALF_DAY_HOURS = 4;

function deriveStatus({ checkIn, checkOut, hoursWorked, explicitStatus }) {
  if (explicitStatus === "Absent") return "Absent";

  if (!checkIn && !checkOut) {
    return explicitStatus || "Absent";
  }

  const hours =
    hoursWorked != null && Number.isFinite(Number(hoursWorked))
      ? Number(hoursWorked)
      : computeHoursWorked(checkIn, checkOut);

  if (checkIn && checkOut && hours > 0 && hours < HALF_DAY_HOURS) {
    return "Half Day";
  }

  const inSec = parseTimeToSeconds(checkIn);
  if (inSec != null && inSec >= DEFAULT_LATE_AFTER) {
    return "Late";
  }

  if (explicitStatus && ["Present", "Late", "Half Day", "Absent"].includes(explicitStatus)) {
    if (explicitStatus === "Present") return "Present";
    return explicitStatus;
  }

  return checkIn ? "Present" : "Absent";
}

function nowTimeString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

module.exports = {
  parseTimeToSeconds,
  computeHoursWorked,
  deriveStatus,
  nowTimeString,
  HALF_DAY_HOURS,
  DEFAULT_LATE_AFTER
};
