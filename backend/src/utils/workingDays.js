// utils/workingDays.js
import PublicHoliday from "../models/PublicHoliday.js";
import CompanySetting from "../models/CompanySetting.js";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Calculates working days between startDate (YYYY-MM-DD) and endDate (YYYY-MM-DD) inclusive.
 * Skips weekends (from CompanySetting, default Sat/Sun) and Public Holidays.
 */
export async function calculateWorkingDays(startDateStr, endDateStr) {
  const settings = await CompanySetting.findOne().lean();
  const weekendDays = settings?.weekendDays || ["Saturday", "Sunday"];

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (start > end) {
    throw new Error("Start date cannot be after end date");
  }

  // Fetch all holidays in range
  const holidays = await PublicHoliday.find({
    date: { $gte: startDateStr, $lte: endDateStr },
  }).lean();
  const holidayDateSet = new Set(holidays.map((h) => h.date));

  let workingDaysCount = 0;
  const current = new Date(start);

  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const dayName = DAY_NAMES[current.getDay()];
    const isWeekend = weekendDays.includes(dayName);
    const isHoliday = holidayDateSet.has(dateStr);

    if (!isWeekend && !isHoliday) {
      workingDaysCount++;
    }

    current.setDate(current.getDate() + 1);
  }

  return workingDaysCount;
}

/**
 * Gets total expected working days in a given month (YYYY-MM).
 */
export async function getMonthWorkingDays(yearMonthStr) {
  const [yearStr, monthStr] = yearMonthStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // first day of month
  const startDateStr = `${yearStr}-${String(month).padStart(2, "0")}-01`;
  // last day of month
  const lastDay = new Date(year, month, 0).getDate();
  const endDateStr = `${yearStr}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return calculateWorkingDays(startDateStr, endDateStr);
}
