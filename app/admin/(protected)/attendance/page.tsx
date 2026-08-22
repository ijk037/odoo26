import { createClient } from '@/lib/supabase/server'
import { QrCode, MapPin, CheckCircle2 } from 'lucide-react'
import QRGenerator from '@/components/attendance/QRGenerator'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'QR Code — Admin' }

export default async function AdminAttendancePage() {
  const supabase = await createClient()

  const { data: locations } = await supabase
    .from('attendance_locations')
    .select('*')
    .eq('is_active', true)

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="page-header">
        <h1>Attendance QR Codes</h1>
        <p>Generate QR codes for employee check-in/check-out at company locations.</p>
      </div>

      {locations && locations.length > 0 ? (
        <div className="space-y-6">
          {locations.map(loc => (
            <div key={loc.id} className="card">
              <div className="flex items-start gap-4 mb-5 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="p-3 rounded-xl" style={{ background: 'hsl(224 75% 50% / 0.15)' }}>
                  <MapPin className="w-6 h-6" style={{ color: 'var(--color-brand-400)' }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--color-foreground)' }}>{loc.name}</h2>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)} · Radius: {loc.allowed_radius}m
                  </p>
                  <span className="badge badge-success mt-1"><CheckCircle2 className="w-3 h-3" /> Active</span>
                </div>
              </div>
              <QRGenerator locationId={loc.id} locationName={loc.name} />
            </div>
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center py-12" style={{ color: 'var(--color-muted)' }}>
          <QrCode className="w-12 h-12 mb-4 opacity-30" />
          <p className="font-medium">No active locations found.</p>
          <p className="text-sm mt-1">Run the initial SQL migration to seed the MUJ location.</p>
        </div>
      )}
    </div>
  )
}
