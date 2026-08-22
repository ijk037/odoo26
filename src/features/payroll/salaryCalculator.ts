/**
 * Dayflow HRMS - Section 3.6 Automated Deductions Engine & Salary Calculator
 * 
 * Component logic:
 * - Basic = 0.50 * grossSalary
 * - HRA = 0.20 * grossSalary
 * - Special Allowance = 0.30 * grossSalary
 * - PF = 0.12 * Basic (Provident Fund)
 * - ESI = grossSalary <= 21000 ? 0.0075 * grossSalary : 0 (Employee State Insurance)
 * - PT = 200 (flat Professional Tax)
 * - LOP Deduction = (grossSalary / 30) * lopDays (Loss of Pay from attendance reconciliation)
 * - Net Pay = grossSalary - (PF + ESI + PT + LOP Deduction)
 */

export interface SalaryCalculatorInput {
  grossSalary: number;
  lopDays?: number;
}

export interface SalaryBreakdown {
  grossSalary: number;
  lopDays: number;
  
  // Earnings Components
  basic: number;
  hra: number;
  specialAllowance: number;
  totalEarnings: number;

  // Deductions
  pf: number;
  esi: number;
  pt: number;
  lopDeduction: number;
  totalDeductions: number;

  // Final Net Compensation
  netPay: number;
}

// ponytail: round to 2 decimal places using Math.round and EPSILON
export const roundToTwo = (num: number): number =>
  Math.round((num + Number.EPSILON) * 100) / 100;

export const calculateBasic = (gross: number): number =>
  gross > 0 ? roundToTwo(0.50 * gross) : 0;

export const calculateHRA = (gross: number): number =>
  gross > 0 ? roundToTwo(0.20 * gross) : 0;

export const calculateSpecialAllowance = (gross: number): number =>
  gross > 0 ? roundToTwo(0.30 * gross) : 0;

export const calculatePF = (basic: number): number =>
  basic > 0 ? roundToTwo(0.12 * basic) : 0;

export const calculateESI = (gross: number): number =>
  gross > 0 && gross <= 21000 ? roundToTwo(0.0075 * gross) : 0;

export const calculatePT = (gross: number): number =>
  gross > 0 ? 200 : 0;

export const calculateLOPDeduction = (gross: number, lopDays: number): number =>
  gross > 0 && lopDays > 0 ? roundToTwo((gross / 30) * lopDays) : 0;

/**
 * Main Deductions Engine & Salary Calculator
 */
export function calculateSalary(
  input: SalaryCalculatorInput | number,
  lopDaysParam?: number
): SalaryBreakdown {
  const grossSalary = Math.max(0, typeof input === "number" ? input : input?.grossSalary || 0);
  const lopDays = Math.max(0, typeof input === "number" ? lopDaysParam || 0 : input?.lopDays || 0);

  const basic = calculateBasic(grossSalary);
  const hra = calculateHRA(grossSalary);
  const specialAllowance = calculateSpecialAllowance(grossSalary);
  const totalEarnings = grossSalary;

  const pf = calculatePF(basic);
  const esi = calculateESI(grossSalary);
  const pt = calculatePT(grossSalary);
  const lopDeduction = calculateLOPDeduction(grossSalary, lopDays);

  const totalDeductions = roundToTwo(pf + esi + pt + lopDeduction);
  const netPay = roundToTwo(Math.max(0, grossSalary - totalDeductions));

  return {
    grossSalary,
    lopDays,
    basic,
    hra,
    specialAllowance,
    totalEarnings,
    pf,
    esi,
    pt,
    lopDeduction,
    totalDeductions,
    netPay,
  };
}

/**
 * ponytail self-check for statutory rules
 */
export function assertSalaryEngine(): boolean {
  const sample = calculateSalary({ grossSalary: 20000, lopDays: 0 });
  if (sample.basic !== 10000 || sample.esi !== 150 || sample.pt !== 200 || sample.netPay !== 18450) {
    throw new Error("Salary calculator statutory rules assertion failed");
  }
  return true;
}

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
    unpaidLeaveDays = 0,
    halfDays = 0,
  } = input;

  const basicPay = roundToTwo(baseSalary * 0.5);
  const hra = roundToTwo(baseSalary * 0.3);
  const transportAllowance = roundToTwo(baseSalary * 0.1);
  const specialAllowance = Math.max(0, roundToTwo(baseSalary * 0.1 + allowances));
  const grossEarnings = roundToTwo(basicPay + hra + transportAllowance + specialAllowance);

  const perDayRate = totalWorkingDays > 0 ? grossEarnings / totalWorkingDays : 0;
  const lossOfPayDays = unpaidLeaveDays + halfDays * 0.5;
  const lossOfPayDeduction = roundToTwo(lossOfPayDays * perDayRate);

  const providentFund = roundToTwo(basicPay * 0.12);
  const taxDeduction = Math.max(0, roundToTwo(deductions > 0 ? deductions : grossEarnings * 0.08));

  const totalDeductions = roundToTwo(providentFund + taxDeduction + lossOfPayDeduction);
  const netPayable = Math.max(0, roundToTwo(grossEarnings - totalDeductions));
  const payableDays = Math.max(0, totalWorkingDays - lossOfPayDays);

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

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
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
    if (num > 0) str += ones[num] + " ";
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
  if (rounded % 1000 > 0) result += convertChunk(rounded % 1000);
  return `${result.trim()} Dollars Only`;
}

const salaryCalculator = {
  calculateSalary,
  calculateDynamicPayroll,
  numberToWords,
  calculateBasic,
  calculateHRA,
  calculateSpecialAllowance,
  calculatePF,
  calculateESI,
  calculatePT,
  calculateLOPDeduction,
  roundToTwo,
  assertSalaryEngine,
};

export default salaryCalculator;
