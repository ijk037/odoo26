'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, ClipboardCheck, Calendar, DollarSign,
  LogOut, Shield, Briefcase, UserCircle, CheckSquare, QrCode,
  History, FileText, UserCog, Building2
} from 'lucide-react'
import type { Role } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard',       href: '/admin/dashboard',            icon: LayoutDashboard },
  { label: 'Verification',    href: '/admin/verification',         icon: ClipboardCheck  },
  { label: 'Manager Assign',  href: '/admin/manager-allocation',   icon: UserCog         },
  { label: 'Attendance QR',   href: '/admin/attendance',           icon: QrCode          },
  { label: 'Team Attendance', href: '/admin/employees/attendance', icon: CheckSquare     },
  { label: 'Leave Requests',  href: '/admin/leave',                icon: Calendar        },
  { label: 'Salary',          href: '/admin/salary',               icon: DollarSign      },
]

const MANAGER_NAV: NavItem[] = [
  { label: 'Dashboard',      href: '/manager/dashboard',          icon: LayoutDashboard },
  { label: 'Daily Tasks',    href: '/manager/tasks',              icon: FileText        },
  { label: 'Team Attendance', href: '/manager/attendance',        icon: CheckSquare     },
]

const EMPLOYEE_NAV: NavItem[] = [
  { label: 'Dashboard',      href: '/employee/dashboard',         icon: LayoutDashboard },
  { label: 'My Profile',     href: '/employee/profile',           icon: UserCircle      },
  { label: 'Attendance',     href: '/employee/attendance',        icon: QrCode          },
  { label: 'History',        href: '/employee/attendance/history', icon: History        },
  { label: 'Leave',          href: '/employee/leave',             icon: Calendar        },
  { label: 'Salary',         href: '/employee/salary',            icon: DollarSign      },
]

const ROLE_CONFIG = {
  admin:    { nav: ADMIN_NAV,    icon: Shield,      label: 'Admin',    color: 'hsl(224 75% 50%)' },
  manager:  { nav: MANAGER_NAV,  icon: Briefcase,   label: 'Manager',  color: 'hsl(262 60% 55%)' },
  employee: { nav: EMPLOYEE_NAV, icon: UserCircle,  label: 'Employee', color: 'hsl(142 60% 40%)' },
}

interface SidebarProps {
  role: Role
  userName: string | null
  userEmail: string | null
}

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const config = ROLE_CONFIG[role]
  const Icon = config.icon

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${role}/login`)
    router.refresh()
  }

  return (
    <aside className="flex flex-col h-full" style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}>
      {/* Logo */}
      <div className="p-5 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${config.color}, hsl(224 75% 50%))` }}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-foreground)' }}>HRMS</p>
            <p className="text-xs truncate" style={{ color: config.color }}>{config.label} Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {config.nav.map((item) => {
          const ItemIcon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'text-white'
                  : 'hover:bg-[var(--color-surface-2)]'
              )}
              style={isActive ? {
                background: `linear-gradient(135deg, ${config.color}33, ${config.color}22)`,
                color: config.color,
                border: `1px solid ${config.color}33`,
              } : { color: 'var(--color-muted)' }}>
              <ItemIcon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1" style={{ background: 'var(--color-surface-2)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${config.color}, hsl(224 75% 50%))` }}>
            {(userName?.[0] ?? userEmail?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-foreground)' }}>
              {userName ?? 'User'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{userEmail}</p>
          </div>
        </div>
        <button onClick={handleLogout} id="logout-btn"
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-[var(--color-danger-bg)]"
          style={{ color: 'var(--color-muted)' }}>
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
