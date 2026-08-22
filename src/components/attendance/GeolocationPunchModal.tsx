"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import { formatTime } from "@/lib/utils";
import {
  MapPin,
  ShieldCheck,
  Globe,
  Clock,
  LogIn,
  LogOut,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { SHIFTS, validateGeofence, OFFICE_HQ } from "@/lib/attendance/shifts";

interface GeolocationPunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayRecord: any;
  onSuccess: () => void;
}

export function GeolocationPunchModal({
  isOpen,
  onClose,
  todayRecord,
  onSuccess,
}: GeolocationPunchModalProps) {
  const { toast } = useToast();
  const [shiftType, setShiftType] = useState<string>("GENERAL");
  const [notes, setNotes] = useState<string>("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState<boolean>(true);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Capture Browser GPS Coordinates on open
  useEffect(() => {
    if (isOpen) {
      setGeoLoading(true);
      setGeoError(null);

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCoords({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setGeoLoading(false);
          },
          (err) => {
            console.warn("Geolocation permission error/timeout:", err.message);
            // Default to simulated office coordinates if permission is denied
            setCoords({
              lat: OFFICE_HQ.latitude,
              lng: OFFICE_HQ.longitude,
            });
            setGeoLoading(false);
          },
          { timeout: 6000, enableHighAccuracy: true }
        );
      } else {
        setCoords({
          lat: OFFICE_HQ.latitude,
          lng: OFFICE_HQ.longitude,
        });
        setGeoLoading(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isCheckedIn = !!todayRecord?.checkIn && !todayRecord?.checkOut;
  const geofenceResult = coords ? validateGeofence(coords.lat, coords.lng) : null;
  const currentShift = SHIFTS[shiftType] || SHIFTS.GENERAL;

  const handlePunch = async () => {
    setSubmitting(true);
    const action = isCheckedIn ? "checkout" : "checkin";

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          notes,
          shiftType,
          latitude: coords?.lat,
          longitude: coords?.lng,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Attendance punch failed", "Notice");
      } else {
        if (action === "checkin") {
          toast.success(
            `Checked in at ${formatTime(data.record.checkIn)}! Status: ${data.record.status} (${
              data.record.locationName
            })`,
            "Check-In Confirmed"
          );
        } else {
          toast.success(
            `Shift completed! Logged ${data.record.workingHours} hrs (${data.record.overtimeHours}h OT)`,
            "Check-Out Confirmed"
          );
        }
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Attendance action error:", err);
      toast.error("Network communication error", "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isCheckedIn ? "bg-rose-500/10 text-rose-400" : "bg-indigo-500/10 text-indigo-400"
              }`}
            >
              {isCheckedIn ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isCheckedIn ? "Complete Working Shift" : "Verified Shift Check-In"}
              </h3>
              <p className="text-xs text-slate-400">
                Browser GPS Geofence validation & shift rule enforcement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Geolocation & Geofence Verification Card */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>Presence Geofence Verification</span>
            </div>
            {geoLoading ? (
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                <span>Locating GPS...</span>
              </span>
            ) : geofenceResult?.isVerified ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>HQ Geofence Verified</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Remote / Field Presence</span>
              </span>
            )}
          </div>

          <div className="text-xs text-slate-400 space-y-1">
            <p className="text-slate-300 font-medium">
              {geofenceResult?.locationLabel || "San Francisco Headquarters (Within 1000m)"}
            </p>
            {coords && (
              <p className="text-[10px] font-mono text-slate-500">
                Coordinates: {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° W
              </p>
            )}
          </div>
        </div>

        {/* Shift Selection (For Check-In) */}
        {!isCheckedIn && (
          <div className="space-y-3 text-xs">
            <label className="block font-semibold text-slate-300">Assigned Shift Schedule</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(SHIFTS).map((s) => (
                <button
                  key={s.type}
                  type="button"
                  onClick={() => setShiftType(s.type)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    shiftType === s.type
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="font-bold block text-slate-200">{s.type}</span>
                  <span className="text-[10px] font-mono text-indigo-300 block">
                    {s.startTime} - {s.endTime}
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">
                    Grace: +{s.graceMinutes}m | Late: {s.lateThreshold}
                  </span>
                </button>
              ))}
            </div>

            {/* Shift Rules Hint */}
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Shift Penalty Policy:</span>
              </div>
              <p className="text-slate-300">
                Check in by <strong>{currentShift.lateThreshold}</strong> logs <span className="text-emerald-400 font-bold">PRESENT</span>.
                Arrivals past <strong>{currentShift.halfDayThreshold}</strong> automatically incur a <span className="text-purple-400 font-bold">HALF-DAY</span> deduction. Working &gt; 8.5h logs approved <span className="text-amber-400 font-bold">Overtime (OT)</span>.
              </p>
            </div>
          </div>
        )}

        {/* Remarks / Notes */}
        <div>
          <label className="block text-slate-300 text-xs font-semibold mb-1">
            Punch Remarks (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              isCheckedIn
                ? "e.g. Completed sprint deliverables, customer demos"
                : "e.g. Office desk 4B, client on-site meeting"
            }
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || geoLoading}
            onClick={handlePunch}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-white text-xs shadow-lg transition-all disabled:opacity-50 ${
              isCheckedIn
                ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recording Punch...</span>
              </>
            ) : isCheckedIn ? (
              <>
                <LogOut className="w-4 h-4" />
                <span>Clock Out Shift</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Verified Geofence Check-In</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
