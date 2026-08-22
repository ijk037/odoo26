// ─── Roles ──────────────────────────────────────────────────────────────────
export type Role = 'admin' | 'manager' | 'employee'

// ─── Profile Status ──────────────────────────────────────────────────────────
export type ProfileStatus = 'draft' | 'pending' | 'verified' | 'changes_requested'

// ─── Profile ─────────────────────────────────────────────────────────────────
export interface Profile {
  id: string
  full_name: string | null
  date_of_birth: string | null
  phone: string | null
  email: string | null
  address: string | null
  profile_photo: string | null
  employee_id: string | null
  department: string | null
  designation: string | null
  joining_date: string | null
  skills: string[] | null
  education: EducationEntry[] | null
  experience: ExperienceEntry[] | null
  role: Role
  profile_status: ProfileStatus
  manager_id: string | null
  admin_comment: string | null
  verified_by: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface EducationEntry {
  degree: string
  institution: string
  year: string
  grade?: string
}

export interface ExperienceEntry {
  title: string
  company: string
  start_year: string
  end_year: string
  description?: string
}

// ─── Daily Task ──────────────────────────────────────────────────────────────
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type TaskStatus = 'assigned' | 'in_progress' | 'completed'

export interface DailyTask {
  id: string
  employee_id: string
  manager_id: string
  task_date: string
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  created_at: string
  updated_at: string
  // joined
  employee?: Profile
  manager?: Profile
}

// ─── Attendance Location ─────────────────────────────────────────────────────
export interface AttendanceLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  allowed_radius: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export type AttendanceStatus = 'present' | 'absent' | 'half_day'

export interface Attendance {
  id: string
  employee_id: string
  task_id: string | null
  date: string
  check_in: string | null
  check_in_latitude: number | null
  check_in_longitude: number | null
  check_in_distance: number | null
  check_out: string | null
  check_out_latitude: number | null
  check_out_longitude: number | null
  check_out_distance: number | null
  working_hours: number | null
  status: AttendanceStatus
  work_completed: string | null
  created_at: string
  updated_at: string
  // joined
  employee?: Profile
  task?: DailyTask
}

// ─── Salary Structure ─────────────────────────────────────────────────────────
export interface SalaryStructure {
  id: string
  employee_id: string
  basic_salary: number
  hra: number
  allowances: number
  deductions: number
  net_salary: number
  effective_from: string
  created_by: string
  created_at: string
  updated_at: string
  // joined
  employee?: Profile
  creator?: Profile
}

// ─── Leave Request ────────────────────────────────────────────────────────────
export type LeaveType = 'sick' | 'casual' | 'annual' | 'unpaid'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason: string
  status: LeaveStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  // joined
  employee?: Profile
  reviewer?: Profile
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// ─── QR Payload ───────────────────────────────────────────────────────────────
export interface QRPayload {
  location_id: string
  location_name: string
  timestamp: number
}
