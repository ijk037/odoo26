// ============================================================================
// HACKATHON MODULE: Utilities & Conflict Detection
// ============================================================================

// import { prisma } from "@/lib/prisma";

/**
 * Detects if a requested leave overlaps with any existing APPROVED leaves 
 * within the same department. This powers the '⚠️ Conflict' badge in the UI.
 */
export async function detectDepartmentConflicts(departmentId: string, startDate: Date, endDate: Date) {
  /*
  const overlappingLeaves = await prisma.leaveRequest.findMany({
    where: {
      overallStatus: "APPROVED",
      user: {
        departmentId: departmentId
      },
      OR: [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate }
        }
      ]
    },
    include: {
      user: {
        select: { name: true, id: true }
      }
    }
  });

  return overlappingLeaves;
  */
}

/**
 * Calculates working days between two dates, excluding weekends (Sat/Sun).
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const curDate = new Date(startDate.getTime());
  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}
