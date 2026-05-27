export function calculateSimpleInterest(principal, annualRate, months) {
  return Math.round(principal + (principal * annualRate * months) / 1200);
}

export function calculateCompoundInterest(principal, annualRate, months, cycle = "monthly") {
  const periodsPerYear = cycle === "weekly" ? 52 : cycle === "yearly" ? 1 : 12;
  const periods = Math.max(1, Math.round((months / 12) * periodsPerYear));
  const amount = principal * Math.pow(1 + annualRate / 100 / periodsPerYear, periods);
  return Math.round(amount);
}

export function getTotalPayable({ principal, interestRate, interestType, months, cycle }) {
  if (interestType === "Compound") {
    return calculateCompoundInterest(principal, interestRate, months, cycle);
  }
  return calculateSimpleInterest(principal, interestRate, months);
}

export function buildMonthlyBreakdown({ principal, interestRate, months, interestType, cycle }) {
  return Array.from({ length: months }, (_, index) => {
    const month = index + 1;
    const total = getTotalPayable({ principal, interestRate, interestType, months: month, cycle });
    return {
      label: `${month} నెల`,
      principal,
      interest: Math.max(0, total - principal),
      total
    };
  });
}

export function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function calculateTrustScore({ paymentsOnTime = 0, delays = 0, activeLoans = 0 }) {
  const base = 55 + paymentsOnTime * 7 - delays * 9 - activeLoans * 3;
  return Math.min(98, Math.max(18, base));
}

export function riskFromScore(score) {
  if (score >= 75) return "Low";
  if (score >= 50) return "Medium";
  return "High";
}
