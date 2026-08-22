'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  User, Phone, MapPin, Calendar, Briefcase, Building2,
  GraduationCap, Plus, Trash2, Loader2, CheckCircle2,
  AlertCircle, Clock, Upload, X, Save, Send
} from 'lucide-react'
import type { Profile, EducationEntry, ExperienceEntry } from '@/types'
import { formatDate } from '@/lib/utils'

const DEPARTMENTS = [
  'Engineering', 'Computer Science', 'Information Technology',
  'Management', 'Commerce', 'Arts & Humanities', 'Science',
  'Law', 'Medicine', 'Architecture', 'Design', 'Administration', 'Other'
]

const SKILLS_SUGGESTIONS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js',
  'SQL', 'MongoDB', 'Git', 'Docker', 'AWS', 'Leadership',
  'Communication', 'Project Management', 'Data Analysis'
]

const STATUS_CONFIG = {
  draft:             { label: 'Draft',            color: 'var(--color-muted)',    bg: 'var(--color-surface-3)',   icon: Clock,          text: 'Complete your profile and submit for admin review.' },
  pending:           { label: 'Under Review',      color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', icon: Clock,          text: 'Your profile is being reviewed by the admin.' },
  verified:          { label: 'Verified',          color: 'var(--color-success)', bg: 'var(--color-success-bg)', icon: CheckCircle2,   text: 'Your profile has been verified.' },
  changes_requested: { label: 'Changes Requested', color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)',  icon: AlertCircle,    text: 'Admin has requested changes to your profile.' },
}

export default function EmployeeProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [toast, setToast]           = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [skillInput, setSkillInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadProfile() }, [])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  async function loadProfile() {
    const res = await fetch('/api/profile')
    const { data } = await res.json()
    setProfile(data)
    setLoading(false)
  }

  const isEditable = profile?.profile_status === 'draft' || profile?.profile_status === 'changes_requested'

  function updateField(field: keyof Profile, value: unknown) {
    if (!isEditable) return
    setProfile(prev => prev ? { ...prev, [field]: value } : prev)
  }

  // ── Skills ──────────────────────────────────────────────────
  function addSkill(skill: string) {
    if (!skill.trim() || !isEditable) return
    const current = profile?.skills ?? []
    if (current.includes(skill.trim())) return
    updateField('skills', [...current, skill.trim()])
    setSkillInput('')
  }
  function removeSkill(skill: string) {
    updateField('skills', (profile?.skills ?? []).filter(s => s !== skill))
  }

  // ── Education ────────────────────────────────────────────────
  function addEducation() {
    const entry: EducationEntry = { degree: '', institution: '', year: '' }
    updateField('education', [...(profile?.education ?? []), entry])
  }
  function updateEducation(i: number, field: keyof EducationEntry, value: string) {
    const edu = [...(profile?.education ?? [])]
    edu[i] = { ...edu[i], [field]: value }
    updateField('education', edu)
  }
  function removeEducation(i: number) {
    updateField('education', (profile?.education ?? []).filter((_, idx) => idx !== i))
  }

  // ── Experience ───────────────────────────────────────────────
  function addExperience() {
    const entry: ExperienceEntry = { title: '', company: '', start_year: '', end_year: '' }
    updateField('experience', [...(profile?.experience ?? []), entry])
  }
  function updateExperience(i: number, field: keyof ExperienceEntry, value: string) {
    const exp = [...(profile?.experience ?? [])]
    exp[i] = { ...exp[i], [field]: value }
    updateField('experience', exp)
  }
  function removeExperience(i: number) {
    updateField('experience', (profile?.experience ?? []).filter((_, idx) => idx !== i))
  }

  // ── Photo upload ─────────────────────────────────────────────
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !isEditable) return

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Photo must be under 5MB.')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const ext = file.name.split('.').pop()
      const path = `${user!.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(path)

      updateField('profile_photo', publicUrl)
      showToast('success', 'Photo uploaded successfully.')
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  // ── Save ─────────────────────────────────────────────────────
  async function handleSave() {
    if (!profile || !isEditable) return
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: profile.full_name,
          date_of_birth: profile.date_of_birth,
          phone: profile.phone,
          address: profile.address,
          profile_photo: profile.profile_photo,
          employee_id: profile.employee_id,
          department: profile.department,
          designation: profile.designation,
          joining_date: profile.joining_date,
          skills: profile.skills,
          education: profile.education,
          experience: profile.experience,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      showToast('success', 'Profile saved successfully.')
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  // ── Submit ───────────────────────────────────────────────────
  async function handleSubmit() {
    if (!isEditable) return
    setSubmitting(true)
    try {
      // Save first
      await handleSave()
      // Then submit
      const res = await fetch('/api/profile/submit', { method: 'POST' })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      showToast('success', 'Profile submitted for review!')
      await loadProfile()
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Submit failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-brand-400)' }} />
    </div>
  )

  const statusCfg = STATUS_CONFIG[profile?.profile_status ?? 'draft']
  const StatusIcon = statusCfg.icon

  return (
    <div className="animate-fade-in max-w-4xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-fade-in"
          style={{
            background: toast.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            border: `1px solid ${toast.type === 'success' ? 'hsl(142 50% 20%)' : 'hsl(0 50% 25%)'}`,
            color: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="page-header mb-0">
          <h1>My Profile</h1>
          <p>Keep your information up to date for admin verification.</p>
        </div>
        {isEditable && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={handleSave} disabled={saving} className="btn btn-secondary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
            <button onClick={handleSubmit} disabled={submitting || saving} className="btn btn-primary">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit for Review
            </button>
          </div>
        )}
      </div>

      {/* Status banner */}
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl mb-6"
        style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.color}33` }}>
        <StatusIcon className="w-5 h-5 flex-shrink-0" style={{ color: statusCfg.color }} />
        <div className="flex-1">
          <span className="text-sm font-semibold" style={{ color: statusCfg.color }}>
            Status: {statusCfg.label}
          </span>
          <span className="text-sm ml-2" style={{ color: 'var(--color-muted)' }}>{statusCfg.text}</span>
        </div>
        {profile?.profile_status === 'verified' && profile.verified_at && (
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Verified {formatDate(profile.verified_at)}</span>
        )}
      </div>

      {/* Admin comment */}
      {profile?.admin_comment && profile.profile_status === 'changes_requested' && (
        <div className="mb-6 px-4 py-4 rounded-xl" style={{ background: 'var(--color-danger-bg)', border: '1px solid hsl(0 50% 25%)' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-danger)' }}>Admin Feedback:</p>
          <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>{profile.admin_comment}</p>
        </div>
      )}

      {/* ── PERSONAL INFO ─────────────────────────────────── */}
      <section className="card mb-5">
        <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <User className="w-5 h-5" style={{ color: 'var(--color-brand-400)' }} />
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>Personal Information</h2>
        </div>

        <div className="flex gap-6">
          {/* Photo upload */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden"
              style={{ background: 'var(--color-surface-2)', border: '2px solid var(--color-border)' }}>
              {profile?.profile_photo ? (
                <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10" style={{ color: 'var(--color-muted)' }} />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'hsl(0 0% 0% / 0.6)' }}>
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
            </div>
            {isEditable && (
              <>
                <button onClick={() => fileRef.current?.click()}
                  className="btn btn-secondary text-xs px-3 py-1.5 gap-1.5">
                  <Upload className="w-3 h-3" /> Upload Photo
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </>
            )}
          </div>

          {/* Fields */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                Full Name *
              </label>
              <input value={profile?.full_name ?? ''} disabled={!isEditable}
                onChange={e => updateField('full_name', e.target.value)}
                placeholder="Rahul Sharma" className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                Date of Birth *
              </label>
              <input type="date" value={profile?.date_of_birth ?? ''} disabled={!isEditable}
                onChange={e => updateField('date_of_birth', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                Phone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                <input value={profile?.phone ?? ''} disabled={!isEditable}
                  onChange={e => updateField('phone', e.target.value)}
                  placeholder="+91 98765 43210" className="input-base pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                Email
              </label>
              <input value={profile?.email ?? ''} disabled
                className="input-base opacity-50 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                <input value={profile?.address ?? ''} disabled={!isEditable}
                  onChange={e => updateField('address', e.target.value)}
                  placeholder="City, State" className="input-base pl-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROFESSIONAL INFO ──────────────────────────────── */}
      <section className="card mb-5">
        <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Briefcase className="w-5 h-5" style={{ color: 'var(--color-brand-400)' }} />
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>Professional Information</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Employee ID</label>
            <input value={profile?.employee_id ?? ''} disabled={!isEditable}
              onChange={e => updateField('employee_id', e.target.value)}
              placeholder="EMP-001" className="input-base" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Department *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: 'var(--color-muted)' }} />
              <select value={profile?.department ?? ''} disabled={!isEditable}
                onChange={e => updateField('department', e.target.value)}
                className="input-base pl-10 appearance-none"
                style={{ background: 'var(--color-surface-2)' }}>
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Designation *</label>
            <input value={profile?.designation ?? ''} disabled={!isEditable}
              onChange={e => updateField('designation', e.target.value)}
              placeholder="Software Engineer" className="input-base" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Joining Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
              <input type="date" value={profile?.joining_date ?? ''} disabled={!isEditable}
                onChange={e => updateField('joining_date', e.target.value)}
                className="input-base pl-10" />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mt-4">
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Skills</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {(profile?.skills ?? []).map(skill => (
              <span key={skill} className="flex items-center gap-1.5 badge badge-brand">
                {skill}
                {isEditable && (
                  <button onClick={() => removeSkill(skill)} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
            {(profile?.skills ?? []).length === 0 && (
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>No skills added yet</span>
            )}
          </div>
          {isEditable && (
            <>
              <div className="flex gap-2">
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
                  placeholder="Type a skill and press Enter" className="input-base flex-1" />
                <button onClick={() => addSkill(skillInput)} className="btn btn-secondary px-3">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {SKILLS_SUGGESTIONS.filter(s => !(profile?.skills ?? []).includes(s)).slice(0, 6).map(s => (
                  <button key={s} onClick={() => addSkill(s)}
                    className="text-xs px-2 py-1 rounded-lg transition-colors"
                    style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                    + {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── EDUCATION ─────────────────────────────────────── */}
      <section className="card mb-5">
        <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" style={{ color: 'var(--color-brand-400)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>Education</h2>
          </div>
          {isEditable && (
            <button onClick={addEducation} className="btn btn-secondary text-xs px-3 py-1.5">
              <Plus className="w-3 h-3" /> Add
            </button>
          )}
        </div>
        {(profile?.education ?? []).length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--color-muted)' }}>No education entries added.</p>
        ) : (
          <div className="space-y-4">
            {(profile?.education ?? []).map((edu, i) => (
              <div key={i} className="p-4 rounded-xl relative" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                {isEditable && (
                  <button onClick={() => removeEducation(i)}
                    className="absolute top-3 right-3 p-1 rounded-lg hover:bg-red-900/30 transition-colors"
                    style={{ color: 'var(--color-danger)' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="grid grid-cols-2 gap-3 pr-8">
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Degree</label>
                    <input value={edu.degree} disabled={!isEditable}
                      onChange={e => updateEducation(i, 'degree', e.target.value)}
                      placeholder="B.Tech Computer Science" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Institution</label>
                    <input value={edu.institution} disabled={!isEditable}
                      onChange={e => updateEducation(i, 'institution', e.target.value)}
                      placeholder="Manipal University Jaipur" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Year</label>
                    <input value={edu.year} disabled={!isEditable}
                      onChange={e => updateEducation(i, 'year', e.target.value)}
                      placeholder="2024" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Grade / CGPA</label>
                    <input value={edu.grade ?? ''} disabled={!isEditable}
                      onChange={e => updateEducation(i, 'grade', e.target.value)}
                      placeholder="8.5 CGPA" className="input-base" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── EXPERIENCE ────────────────────────────────────── */}
      <section className="card mb-8">
        <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" style={{ color: 'var(--color-brand-400)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>Work Experience</h2>
          </div>
          {isEditable && (
            <button onClick={addExperience} className="btn btn-secondary text-xs px-3 py-1.5">
              <Plus className="w-3 h-3" /> Add
            </button>
          )}
        </div>
        {(profile?.experience ?? []).length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--color-muted)' }}>No experience entries added.</p>
        ) : (
          <div className="space-y-4">
            {(profile?.experience ?? []).map((exp, i) => (
              <div key={i} className="p-4 rounded-xl relative" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                {isEditable && (
                  <button onClick={() => removeExperience(i)}
                    className="absolute top-3 right-3 p-1 rounded-lg hover:bg-red-900/30 transition-colors"
                    style={{ color: 'var(--color-danger)' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="grid grid-cols-2 gap-3 pr-8">
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Job Title</label>
                    <input value={exp.title} disabled={!isEditable}
                      onChange={e => updateExperience(i, 'title', e.target.value)}
                      placeholder="Software Engineer" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Company</label>
                    <input value={exp.company} disabled={!isEditable}
                      onChange={e => updateExperience(i, 'company', e.target.value)}
                      placeholder="Tech Corp" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Start Year</label>
                    <input value={exp.start_year} disabled={!isEditable}
                      onChange={e => updateExperience(i, 'start_year', e.target.value)}
                      placeholder="2022" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>End Year</label>
                    <input value={exp.end_year} disabled={!isEditable}
                      onChange={e => updateExperience(i, 'end_year', e.target.value)}
                      placeholder="2024 or Present" className="input-base" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Description</label>
                    <textarea value={exp.description ?? ''} disabled={!isEditable}
                      onChange={e => updateExperience(i, 'description', e.target.value)}
                      placeholder="Brief description of responsibilities..." rows={2}
                      className="input-base resize-none" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom actions */}
      {isEditable && (
        <div className="flex justify-end gap-3 sticky bottom-4">
          <button onClick={handleSave} disabled={saving} className="btn btn-secondary shadow-xl">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <button onClick={handleSubmit} disabled={submitting || saving} className="btn btn-primary shadow-xl">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit for Review
          </button>
        </div>
      )}
    </div>
  )
}
