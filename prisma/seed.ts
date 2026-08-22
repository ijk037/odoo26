import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Dayflow HRMS database seeding...");

  // Clean existing tables in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.salaryStructure.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing database records.");

  // Password hashes
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const hrPassword = await bcrypt.hash("Hr@123", 10);
  const alexPassword = await bcrypt.hash("Alex@123", 10);
  const sarahPassword = await bcrypt.hash("Sarah@123", 10);
  const marcusPassword = await bcrypt.hash("Marcus@123", 10);
  const emilyPassword = await bcrypt.hash("Emily@123", 10);

  // 1. Create Super Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@dayflow.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
      profile: {
        create: {
          employeeId: "ADM-001",
          firstName: "Eleanor",
          lastName: "Vance",
          phone: "+1 (555) 019-2834",
          department: "Executive",
          designation: "Chief Executive Officer & Super Admin",
          joiningDate: new Date("2022-01-15"),
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
          address: "100 Innovation Way, Suite 500, San Francisco, CA",
          emergencyContact: "+1 (555) 019-9999 (David Vance - Spouse)",
          gender: "Female",
        },
      },
      salaryStructure: {
        create: {
          baseSalary: 14000,
          allowances: 2500,
          deductions: 1800,
          netSalary: 14700,
          currency: "USD",
          paymentCycle: "MONTHLY",
          paymentMethod: "BANK_TRANSFER",
          bankName: "Silicon Valley Bank / First Republic",
          accountNumber: "**** **** 8821",
        },
      },
    },
    include: { profile: true },
  });

  // 2. Create HR Manager User
  const hrUser = await prisma.user.create({
    data: {
      email: "hr@dayflow.com",
      passwordHash: hrPassword,
      role: "HR",
      status: "ACTIVE",
      profile: {
        create: {
          employeeId: "HR-001",
          firstName: "Sophia",
          lastName: "Martinez",
          phone: "+1 (555) 014-4829",
          department: "Human Resources",
          designation: "Director of People & Culture",
          joiningDate: new Date("2023-03-01"),
          avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
          address: "450 Mission Street, Apt 12B, San Francisco, CA",
          emergencyContact: "+1 (555) 014-9988 (Carlos Martinez - Brother)",
          gender: "Female",
        },
      },
      salaryStructure: {
        create: {
          baseSalary: 8500,
          allowances: 900,
          deductions: 750,
          netSalary: 8650,
          currency: "USD",
          paymentCycle: "MONTHLY",
          paymentMethod: "BANK_TRANSFER",
          bankName: "Chase Bank",
          accountNumber: "**** **** 4192",
        },
      },
    },
    include: { profile: true },
  });

  // 3. Create Senior Fullstack Engineer
  const alexUser = await prisma.user.create({
    data: {
      email: "alex.chen@dayflow.com",
      passwordHash: alexPassword,
      role: "EMPLOYEE",
      status: "ACTIVE",
      profile: {
        create: {
          employeeId: "EMP-001",
          firstName: "Alex",
          lastName: "Chen",
          phone: "+1 (555) 018-7391",
          department: "Engineering",
          designation: "Staff Software Engineer",
          joiningDate: new Date("2023-06-10"),
          avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
          address: "88 Market St, San Francisco, CA",
          emergencyContact: "+1 (555) 018-9911 (Linda Chen - Mother)",
          gender: "Male",
        },
      },
      salaryStructure: {
        create: {
          baseSalary: 9500,
          allowances: 800,
          deductions: 850,
          netSalary: 9450,
          currency: "USD",
          paymentCycle: "MONTHLY",
          paymentMethod: "BANK_TRANSFER",
          bankName: "Wells Fargo",
          accountNumber: "**** **** 6734",
        },
      },
    },
    include: { profile: true },
  });

  // 4. Create Lead Product Designer
  const sarahUser = await prisma.user.create({
    data: {
      email: "sarah.jenkins@dayflow.com",
      passwordHash: sarahPassword,
      role: "EMPLOYEE",
      status: "ACTIVE",
      profile: {
        create: {
          employeeId: "EMP-002",
          firstName: "Sarah",
          lastName: "Jenkins",
          phone: "+1 (555) 012-9481",
          department: "Product & Design",
          designation: "Lead Product Designer",
          joiningDate: new Date("2023-08-15"),
          avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
          address: "320 Embarcadero, Oakland, CA",
          emergencyContact: "+1 (555) 012-3321 (Mark Jenkins - Father)",
          gender: "Female",
        },
      },
      salaryStructure: {
        create: {
          baseSalary: 7800,
          allowances: 600,
          deductions: 620,
          netSalary: 7780,
          currency: "USD",
          paymentCycle: "MONTHLY",
          paymentMethod: "BANK_TRANSFER",
          bankName: "Bank of America",
          accountNumber: "**** **** 3819",
        },
      },
    },
    include: { profile: true },
  });

  // 5. Create Growth Marketing Specialist
  const marcusUser = await prisma.user.create({
    data: {
      email: "marcus.vance@dayflow.com",
      passwordHash: marcusPassword,
      role: "EMPLOYEE",
      status: "ACTIVE",
      profile: {
        create: {
          employeeId: "EMP-003",
          firstName: "Marcus",
          lastName: "Vance",
          phone: "+1 (555) 015-8832",
          department: "Marketing",
          designation: "Senior Growth Marketing Manager",
          joiningDate: new Date("2024-01-08"),
          avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
          address: "710 Folsom St, San Francisco, CA",
          emergencyContact: "+1 (555) 015-4491 (Rachel Vance - Sister)",
          gender: "Male",
        },
      },
      salaryStructure: {
        create: {
          baseSalary: 6800,
          allowances: 500,
          deductions: 520,
          netSalary: 6780,
          currency: "USD",
          paymentCycle: "MONTHLY",
          paymentMethod: "BANK_TRANSFER",
          bankName: "Citibank",
          accountNumber: "**** **** 9102",
        },
      },
    },
    include: { profile: true },
  });

  // 6. Create QA Automation Engineer
  const emilyUser = await prisma.user.create({
    data: {
      email: "emily.watson@dayflow.com",
      passwordHash: emilyPassword,
      role: "EMPLOYEE",
      status: "ACTIVE",
      profile: {
        create: {
          employeeId: "EMP-004",
          firstName: "Emily",
          lastName: "Watson",
          phone: "+1 (555) 017-6643",
          department: "Quality Engineering",
          designation: "Senior SDET / QA Engineer",
          joiningDate: new Date("2024-03-20"),
          avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
          address: "155 Berry St, San Francisco, CA",
          emergencyContact: "+1 (555) 017-8899 (James Watson - Spouse)",
          gender: "Female",
        },
      },
      salaryStructure: {
        create: {
          baseSalary: 7200,
          allowances: 500,
          deductions: 550,
          netSalary: 7150,
          currency: "USD",
          paymentCycle: "MONTHLY",
          paymentMethod: "BANK_TRANSFER",
          bankName: "PNC Bank",
          accountNumber: "**** **** 5523",
        },
      },
    },
    include: { profile: true },
  });

  const allUsers = [adminUser, hrUser, alexUser, sarahUser, marcusUser, emilyUser];
  console.log(`✅ Seeded ${allUsers.length} core users & profiles.`);

  // 7. Seed 30 Days of Realistic Attendance Records
  console.log("📅 Generating 30 days of realistic attendance history...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const user of allUsers) {
    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const normalizedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

      // Deterministic variation based on day and user
      const isLate = (dayOffset + user.email.length) % 7 === 0;
      const isHalfDay = (dayOffset + user.email.length) % 17 === 0;
      const isAbsent = (dayOffset + user.email.length) % 23 === 0;

      let status = "PRESENT";
      let workingHours = 8.5;
      let overtimeHours = 0.0;
      let shiftType = (dayOffset % 5 === 0) ? "MORNING" : (dayOffset % 8 === 0) ? "FLEXIBLE" : "GENERAL";
      let penaltyApplied = "NONE";
      let checkIn: Date | null = new Date(date);
      let checkOut: Date | null = new Date(date);

      // 25% of days have overtime
      const hasOvertime = (dayOffset + user.email.length) % 4 === 0;

      if (isAbsent) {
        status = "ABSENT";
        checkIn = null;
        checkOut = null;
        workingHours = 0;
      } else if (isHalfDay) {
        status = "HALF_DAY";
        penaltyApplied = "HALF_DAY_PENALTY";
        checkIn.setHours(9, 0, 0);
        checkOut.setHours(13, 15, 0);
        workingHours = 4.25;
      } else if (isLate) {
        status = "LATE";
        penaltyApplied = "LATE_WARNING";
        checkIn.setHours(9, 45, 0);
        checkOut.setHours(18, 15, 0);
        workingHours = 8.5;
      } else {
        status = "PRESENT";
        const randomMinutes = ((dayOffset * 3) % 20) - 10;
        checkIn.setHours(8, 55 + randomMinutes, 0);
        if (hasOvertime) {
          checkOut.setHours(19, 30 + randomMinutes, 0);
          workingHours = 10.5;
          overtimeHours = 2.0;
        } else {
          checkOut.setHours(17, 30 + randomMinutes, 0);
          workingHours = 8.5;
          overtimeHours = 0.0;
        }
      }

      const isHQ = (dayOffset % 6 !== 0);

      await prisma.attendanceRecord.create({
        data: {
          userId: user.id,
          date: normalizedDate,
          checkIn,
          checkOut,
          status,
          shiftType,
          workingHours,
          overtimeHours,
          penaltyApplied,
          latitude: isHQ ? 37.7749 : 37.7833,
          longitude: isHQ ? -122.4194 : -122.4167,
          locationName: isHQ ? "San Francisco HQ (Verified Geofence)" : "Remote / Client Location",
          isGeofenceVerified: isHQ,
          isIpVerified: isHQ,
          notes:
            status === "LATE"
              ? "Late arrival past grace window"
              : status === "HALF_DAY"
              ? "Medical appointment / partial shift"
              : overtimeHours > 0
              ? `Standard shift + ${overtimeHours}h approved overtime`
              : "Standard on-time shift",
          ipAddress: isHQ ? "192.168.1.104" : "74.125.200.100",
        },
      });
    }
  }

  console.log("✅ Seeded comprehensive attendance history.");

  // 8. Seed Realistic Leave Requests
  console.log("📝 Seeding realistic leave requests...");

  // Leave 1: Alex Chen - Paid Vacation (PENDING)
  const leaveStart1 = new Date(today);
  leaveStart1.setDate(leaveStart1.getDate() + 5);
  const leaveEnd1 = new Date(leaveStart1);
  leaveEnd1.setDate(leaveEnd1.getDate() + 4);

  await prisma.leaveRequest.create({
    data: {
      userId: alexUser.id,
      leaveType: "PAID",
      startDate: leaveStart1,
      endDate: leaveEnd1,
      daysCount: 5,
      reason: "Annual family summer vacation trip to Hawaii.",
      status: "PENDING",
    },
  });

  // Leave 2: Sarah Jenkins - Sick Leave (APPROVED by HR)
  const leaveStart2 = new Date(today);
  leaveStart2.setDate(leaveStart2.getDate() - 10);
  const leaveEnd2 = new Date(leaveStart2);
  leaveEnd2.setDate(leaveEnd2.getDate() + 1);

  await prisma.leaveRequest.create({
    data: {
      userId: sarahUser.id,
      leaveType: "SICK",
      startDate: leaveStart2,
      endDate: leaveEnd2,
      daysCount: 2,
      reason: "Seasonal viral flu and high fever.",
      status: "APPROVED",
      approverId: hrUser.id,
      approvedAt: new Date(leaveStart2.getTime() - 1000 * 60 * 60 * 24),
    },
  });

  // Leave 3: Marcus Vance - Casual Leave (REJECTED by HR)
  const leaveStart3 = new Date(today);
  leaveStart3.setDate(leaveStart3.getDate() - 4);
  const leaveEnd3 = new Date(leaveStart3);
  leaveEnd3.setDate(leaveEnd3.getDate() + 2);

  await prisma.leaveRequest.create({
    data: {
      userId: marcusUser.id,
      leaveType: "CASUAL",
      startDate: leaveStart3,
      endDate: leaveEnd3,
      daysCount: 3,
      reason: "Attending friend's bachelor party during critical product launch week.",
      status: "REJECTED",
      approverId: hrUser.id,
      rejectionReason: "Product Q3 launch campaign scheduled during this exact window. Please reschedule after launch.",
    },
  });

  // Leave 4: Emily Watson - Maternity / Casual Leave (PENDING)
  const leaveStart4 = new Date(today);
  leaveStart4.setDate(leaveStart4.getDate() + 12);
  const leaveEnd4 = new Date(leaveStart4);
  leaveEnd4.setDate(leaveEnd4.getDate() + 1);

  await prisma.leaveRequest.create({
    data: {
      userId: emilyUser.id,
      leaveType: "CASUAL",
      startDate: leaveStart4,
      endDate: leaveEnd4,
      daysCount: 2,
      reason: "Family personal matters and relocation setup.",
      status: "PENDING",
    },
  });

  console.log("✅ Seeded leave requests with varied statuses and approvals.");

  // 9. Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: adminUser.id,
        action: "SYSTEM_INITIALIZE",
        entity: "System",
        entityId: "SYS-INIT",
        details: JSON.stringify({ version: "1.0.0", environment: "production-ready" }),
        ipAddress: "127.0.0.1",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      },
      {
        actorId: adminUser.id,
        action: "USER_CREATE",
        entity: "User",
        entityId: hrUser.id,
        details: JSON.stringify({ email: hrUser.email, role: "HR" }),
        ipAddress: "192.168.1.1",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28),
      },
      {
        actorId: hrUser.id,
        action: "LEAVE_APPROVE",
        entity: "LeaveRequest",
        entityId: "LEAVE-002",
        details: JSON.stringify({ targetUserId: sarahUser.id, daysCount: 2, type: "SICK" }),
        ipAddress: "192.168.1.45",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
      },
      {
        actorId: hrUser.id,
        action: "LEAVE_REJECT",
        entity: "LeaveRequest",
        entityId: "LEAVE-003",
        details: JSON.stringify({ targetUserId: marcusUser.id, reason: "Product Q3 launch campaign" }),
        ipAddress: "192.168.1.45",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      },
    ],
  });

  console.log("✅ Seeded audit logs.");
  console.log("\n🚀 Database seeding completed successfully!");
  console.log("--------------------------------------------------");
  console.log("🔑 Demo Accounts for Instant Sign-In:");
  console.log("  • Super Admin: admin@dayflow.com      (Password: Admin@123)");
  console.log("  • HR Manager:  hr@dayflow.com         (Password: Hr@123)");
  console.log("  • Staff Dev:   alex.chen@dayflow.com  (Password: Alex@123)");
  console.log("  • UX Lead:     sarah.jenkins@dayflow.com (Password: Sarah@123)");
  console.log("  • Marketing:   marcus.vance@dayflow.com (Password: Marcus@123)");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
