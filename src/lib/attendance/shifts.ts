export interface OfficeLocation {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export const OFFICE_HQ: OfficeLocation = {
  name: "Dayflow San Francisco HQ (100 Innovation Way)",
  latitude: 37.7749,
  longitude: -122.4194,
  radiusMeters: 1000, // 1km office radius
};

export const ALLOWED_OFFICE_IPS = [
  "127.0.0.1",
  "::1",
  "localhost",
  "192.168.",
  "10.0.",
  "172.16.",
];

export interface ShiftDefinition {
  type: "MORNING" | "GENERAL" | "NIGHT" | "FLEXIBLE";
  label: string;
  startTime: string; // "09:00"
  endTime: string;   // "17:30"
  graceMinutes: number; // 15 mins
  lateThreshold: string; // "09:30"
  halfDayThreshold: string; // "10:30"
  standardHours: number; // 8.5
}

export const SHIFTS: Record<string, ShiftDefinition> = {
  MORNING: {
    type: "MORNING",
    label: "Early Morning Shift (08:00 - 16:30)",
    startTime: "08:00",
    endTime: "16:30",
    graceMinutes: 15,
    lateThreshold: "08:30",
    halfDayThreshold: "09:30",
    standardHours: 8.5,
  },
  GENERAL: {
    type: "GENERAL",
    label: "Standard Corporate Shift (09:00 - 17:30)",
    startTime: "09:00",
    endTime: "17:30",
    graceMinutes: 15,
    lateThreshold: "09:30",
    halfDayThreshold: "10:30",
    standardHours: 8.5,
  },
  NIGHT: {
    type: "NIGHT",
    label: "Evening Operations Shift (18:00 - 02:30)",
    startTime: "18:00",
    endTime: "02:30",
    graceMinutes: 15,
    lateThreshold: "18:30",
    halfDayThreshold: "19:30",
    standardHours: 8.5,
  },
  FLEXIBLE: {
    type: "FLEXIBLE",
    label: "Flexible Agile Schedule",
    startTime: "09:30",
    endTime: "18:00",
    graceMinutes: 30,
    lateThreshold: "10:30",
    halfDayThreshold: "12:00",
    standardHours: 8.5,
  },
};

// Calculate Haversine distance in meters
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Validate Geolocation against Office Headquarters Geofence
export function validateGeofence(
  latitude?: number | null,
  longitude?: number | null
): { isVerified: boolean; distanceMeters: number; locationLabel: string } {
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    return {
      isVerified: false,
      distanceMeters: 0,
      locationLabel: "Remote / GPS Not Provided",
    };
  }

  const distance = calculateDistanceMeters(
    latitude,
    longitude,
    OFFICE_HQ.latitude,
    OFFICE_HQ.longitude
  );

  const isVerified = distance <= OFFICE_HQ.radiusMeters;
  const locationLabel = isVerified
    ? `Office HQ (${distance}m within Geofence)`
    : `Remote Location (${Math.round(distance / 1000)}km from HQ)`;

  return {
    isVerified,
    distanceMeters: distance,
    locationLabel,
  };
}

// Validate IP Address against authorized corporate networks
export function validateIpAddress(ip?: string | null): {
  isVerified: boolean;
  label: string;
} {
  if (!ip) return { isVerified: false, label: "Unknown IP" };
  const isVerified = ALLOWED_OFFICE_IPS.some((allowed) => ip.includes(allowed));
  return {
    isVerified,
    label: isVerified ? "Office Intranet (Verified)" : "Public Network (Remote)",
  };
}

// Evaluate Shift Status and Late/Half-Day Penalty on Check-In
export function evaluateShiftCheckIn(
  checkInDate: Date,
  shiftType = "GENERAL"
): {
  status: "PRESENT" | "LATE" | "HALF_DAY";
  penaltyApplied: "NONE" | "LATE_WARNING" | "HALF_DAY_PENALTY";
  notes: string;
} {
  const shift = SHIFTS[shiftType] || SHIFTS.GENERAL;
  const hours = checkInDate.getHours();
  const minutes = checkInDate.getMinutes();
  const checkInMinutes = hours * 60 + minutes;

  const [startH, startM] = shift.startTime.split(":").map(Number);
  const shiftStartMinutes = startH * 60 + startM;

  const [lateH, lateM] = shift.lateThreshold.split(":").map(Number);
  const lateMinutes = lateH * 60 + lateM;

  const [halfH, halfM] = shift.halfDayThreshold.split(":").map(Number);
  const halfDayMinutes = halfH * 60 + halfM;

  if (checkInMinutes > halfDayMinutes) {
    return {
      status: "HALF_DAY",
      penaltyApplied: "HALF_DAY_PENALTY",
      notes: `Severe delay (${hours}:${String(minutes).padStart(2, "0")}) exceeding shift cut-off. Half-day deduction applied.`,
    };
  }

  if (checkInMinutes > lateMinutes) {
    return {
      status: "LATE",
      penaltyApplied: "LATE_WARNING",
      notes: `Late arrival (${hours}:${String(minutes).padStart(2, "0")}) past grace period (${shift.startTime} + ${shift.graceMinutes}m).`,
    };
  }

  return {
    status: "PRESENT",
    penaltyApplied: "NONE",
    notes: `Punctual check-in for ${shift.label}.`,
  };
}

// Compute Work Duration, Overtime & Adjusted Status on Check-Out
export function evaluateShiftCheckOut(
  checkInDate: Date,
  checkOutDate: Date,
  currentStatus: string
): {
  workingHours: number;
  overtimeHours: number;
  finalStatus: string;
  notesAddition: string;
} {
  const diffMs = Math.max(0, checkOutDate.getTime() - checkInDate.getTime());
  const hours = diffMs / (1000 * 60 * 60);
  const workingHours = Math.round(hours * 100) / 100;

  // Overtime beyond 8.5 standard shift
  const overtimeHours = Math.max(0, Math.round((workingHours - 8.5) * 100) / 100);

  let finalStatus = currentStatus;
  let notesAddition = "";

  if (workingHours < 4.5 && currentStatus !== "ABSENT") {
    finalStatus = "HALF_DAY";
    notesAddition = "Shift duration under 4.5 hours (Half-day logged).";
  } else if (overtimeHours > 0) {
    notesAddition = `Logged ${overtimeHours}h approved overtime.`;
  }

  return {
    workingHours,
    overtimeHours,
    finalStatus,
    notesAddition,
  };
}
