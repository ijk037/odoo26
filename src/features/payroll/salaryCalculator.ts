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

export default {
  calculateSalary,
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
