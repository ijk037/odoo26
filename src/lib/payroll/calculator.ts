export interface PayrollCalculationInput {
  baseSalary: number;
  allowances?: number;
  deductions?: number;
  totalWorkingDays?: number;
  presentDays?: number;
  paidLeaveDays?: number;
  unpaidLeaveDays?: number;
  halfDays?: number;
  lateDays?: number;
}

export interface ItemizedPaystub {
  basicPay: number;
  hra: number;
  transportAllowance: number;
  specialAllowance: number;
  grossEarnings: number;
  providentFund: number;
  taxDeduction: number;
  lossOfPayDeduction: number;
  totalDeductions: number;
  netPayable: number;
  currency: string;
  totalWorkingDays: number;
  payableDays: number;
  unpaidDays: number;
}

export function calculateDynamicPayroll(
  input: PayrollCalculationInput,
  currency = "USD"
): ItemizedPaystub {
  const {
    baseSalary,
    allowances = 0,
    deductions = 0,
    totalWorkingDays = 22,
    presentDays = 20,
    paidLeaveDays = 2,
    unpaidLeaveDays = 0,
    halfDays = 0,
  } = input;

  // Breakdown of Gross Earnings
  // 50% Basic, 30% HRA, 10% Transport, 10% Special / Flex allowances (or custom allowance balance)
  const basicPay = Math.round(baseSalary * 0.5 * 100) / 100;
  const hra = Math.round(baseSalary * 0.3 * 100) / 100;
  const transportAllowance = Math.round(baseSalary * 0.1 * 100) / 100;
  const specialAllowance = Math.max(
    0,
    Math.round((baseSalary * 0.1 + allowances) * 100) / 100
  );
  const grossEarnings = Math.round((basicPay + hra + transportAllowance + specialAllowance) * 100) / 100;

  // Daily rate for LOP (Loss of Pay calculation)
  const perDayRate = totalWorkingDays > 0 ? grossEarnings / totalWorkingDays : 0;
  const lossOfPayDays = unpaidLeaveDays + halfDays * 0.5;
  const lossOfPayDeduction = Math.round(lossOfPayDays * perDayRate * 100) / 100;

  // Standard Deductions: 12% PF on Basic, standard tax or custom deductions
  const providentFund = Math.round(basicPay * 0.12 * 100) / 100;
  const taxDeduction = Math.max(
    0,
    Math.round((deductions > 0 ? deductions : grossEarnings * 0.08) * 100) / 100
  );

  const totalDeductions = Math.round((providentFund + taxDeduction + lossOfPayDeduction) * 100) / 100;
  const netPayable = Math.max(0, Math.round((grossEarnings - totalDeductions) * 100) / 100);

  const payableDays = Math.max(
    0,
    totalWorkingDays - lossOfPayDays
  );

  return {
    basicPay,
    hra,
    transportAllowance,
    specialAllowance,
    grossEarnings,
    providentFund,
    taxDeduction,
    lossOfPayDeduction,
    totalDeductions,
    netPayable,
    currency,
    totalWorkingDays,
    payableDays,
    unpaidDays: lossOfPayDays,
  };
}

export function numberToWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return "Zero Dollars Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertChunk(num: number): string {
    let str = "";
    if (num >= 100) {
      str += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }
    if (num > 0) {
      str += ones[num] + " ";
    }
    return str.trim();
  }

  let result = "";
  if (rounded >= 1000000) {
    result += convertChunk(Math.floor(rounded / 1000000)) + " Million ";
    amount %= 1000000;
  }
  if (rounded >= 1000) {
    result += convertChunk(Math.floor(rounded / 1000)) + " Thousand ";
    amount %= 1000;
  }
  if (rounded % 1000 > 0) {
    result += convertChunk(rounded % 1000);
  }

  return `${result.trim()} Dollars Only`;
}
