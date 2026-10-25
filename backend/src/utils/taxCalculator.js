// utils/taxCalculator.js

/**
 * Calculates annual and monthly income tax based on annual gross income (gross * 12).
 * Slabs:
 * - 0 to 600,000: 0
 * - 600,001 to 1,200,000: 5% of amount exceeding 600,000
 * - 1,200,001 to 2,400,000: 30,000 + 15% of amount exceeding 1,200,000
 * - 2,400,001 to 3,600,000: 210,000 + 25% of amount exceeding 2,400,000
 * - Above 3,600,000: 510,000 + 35% of amount exceeding 3,600,000
 */
export function calculateTax(grossMonthly) {
  const annualGross = Math.round(grossMonthly * 12);
  let annualTax = 0;

  if (annualGross <= 600000) {
    annualTax = 0;
  } else if (annualGross <= 1200000) {
    annualTax = (annualGross - 600000) * 0.05;
  } else if (annualGross <= 2400000) {
    annualTax = 30000 + (annualGross - 1200000) * 0.15;
  } else if (annualGross <= 3600000) {
    annualTax = 210000 + (annualGross - 2400000) * 0.25;
  } else {
    annualTax = 510000 + (annualGross - 3600000) * 0.35;
  }

  annualTax = Math.round(annualTax);
  const monthlyTax = Math.round(annualTax / 12);

  return {
    annualGross,
    annualTax,
    monthlyTax,
  };
}
