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

/**
 * Utility to round a number to two decimal places
 */
export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate Basic Component (50% of Gross Salary)
 */
export function calculateBasic(grossSalary: number): number {
  if (grossSalary <= 0) return 0;
  return roundToTwo(0.50 * grossSalary);
}

/**
 * Calculate House Rent Allowance (HRA) (20% of Gross Salary)
 */
export function calculateHRA(grossSalary: number): number {
  if (grossSalary <= 0) return 0;
  return roundToTwo(0.20 * grossSalary);
}

/**
 * Calculate Special Allowance (30% of Gross Salary)
 */
export function calculateSpecialAllowance(grossSalary: number): number {
  if (grossSalary <= 0) return 0;
  return roundToTwo(0.30 * grossSalary);
}

/**
 * Calculate Provident Fund (PF) (12% of Basic Pay)
 */
export function calculatePF(basic: number): number {
  if (basic <= 0) return 0;
  return roundToTwo(0.12 * basic);
}

/**
 * Calculate Employee State Insurance (ESI) (0.75% of Gross Salary if Gross <= 21,000, else 0)
 */
export function calculateESI(grossSalary: number): number {
  if (grossSalary <= 0) return 0;
  if (grossSalary <= 21000) {
    return roundToTwo(0.0075 * grossSalary);
  }
  return 0;
}

/**
 * Calculate Professional Tax (PT) (Flat 200 for gross > 0)
 */
export function calculatePT(grossSalary: number): number {
  if (grossSalary <= 0) return 0;
  return 200;
}

/**
 * Calculate Loss of Pay (LOP) Deduction ((Gross Salary / 30) * lopDays)
 */
export function calculateLOPDeduction(grossSalary: number, lopDays: number): number {
  if (grossSalary <= 0 || !lopDays || lopDays <= 0) return 0;
  return roundToTwo((grossSalary / 30) * lopDays);
}

/**
 * Main Deductions Engine & Salary Calculator
 * 
 * Computes the complete itemized salary breakdown including statutory deductions,
 * LOP adjustments, earnings components, and final take-home net pay.
 * 
 * @param input - Either a SalaryCalculatorInput object or grossSalary number
 * @param lopDaysParam - Optional LOP days if first parameter is a number
 * @returns SalaryBreakdown object
 */
export function calculateSalary(
  input: SalaryCalculatorInput | number,
  lopDaysParam?: number
): SalaryBreakdown {
  let grossSalary = 0;
  let lopDays = 0;

  if (typeof input === "number") {
    grossSalary = Math.max(0, input || 0);
    lopDays = Math.max(0, lopDaysParam || 0);
  } else if (typeof input === "object" && input !== null) {
    grossSalary = Math.max(0, input.grossSalary || 0);
    lopDays = Math.max(0, input.lopDays || 0);
  }

  // Earnings Breakdown
  const basic = calculateBasic(grossSalary);
  const hra = calculateHRA(grossSalary);
  const specialAllowance = calculateSpecialAllowance(grossSalary);
  const totalEarnings = grossSalary;

  // Deductions Breakdown
  const pf = calculatePF(basic);
  const esi = calculateESI(grossSalary);
  const pt = calculatePT(grossSalary);
  const lopDeduction = calculateLOPDeduction(grossSalary, lopDays);

  const totalDeductions = roundToTwo(pf + esi + pt + lopDeduction);

  // Net Pay: grossSalary - (PF + ESI + PT + LOP Deduction)
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

const salaryCalculator = {
  calculateSalary,
  calculateBasic,
  calculateHRA,
  calculateSpecialAllowance,
  calculatePF,
  calculateESI,
  calculatePT,
  calculateLOPDeduction,
  roundToTwo,
};

export default salaryCalculator;
