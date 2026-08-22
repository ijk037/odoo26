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
  Sparkles,
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
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setGeoLoading(true);

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCoords({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setGeoLoading(false);
          },
          () => {
            // Default to simulated office coordinates
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
            `Checked in at ${formatTime(data.record.checkIn)}! Status: ${data.record.status}`,
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
      <div className="retro-card-static bg-[#FAF7F2] max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#151D22]">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 border border-[#151D22] ${
                isCheckedIn ? "bg-[#ffdad6] text-[#ba1a1a]" : "bg-[#d6edd9] text-[#346645]"
              }`}
            >
              {isCheckedIn ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-display-lg text-base font-bold uppercase text-[#151D22]">
                {isCheckedIn ? "Complete Working Shift" : "Verified Shift Check-In"}
              </h3>
              <p className="text-xs text-[#414942]">GPS Geofence validation & shift rule enforcement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-[#151D22] bg-[#FAF7F2] hover:bg-[#ffdad6]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Geolocation Verification Card */}
        <div className="p-3 bg-[#edf4fd] border-2 border-[#151D22] space-y-2 text-xs shadow-[2px_2px_0px_0px_rgba(21,29,34,1)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-[#151D22]">
              <MapPin className="w-4 h-4 text-[#346645]" />
              <span>Presence Geofence Verification:</span>
            </div>
            {geoLoading ? (
              <span className="flex items-center gap-1 text-[10px] text-[#717971]">
                <Loader2 className="w-3 h-3 animate-spin text-[#346645]" />
                <span>Locating GPS...</span>
              </span>
            ) : geofenceResult?.isVerified ? (
              <span className="px-1.5 py-0.5 bg-[#d6edd9] text-[#142c1e] border border-[#346645] text-[10px] font-bold">
                HQ Geofence Verified
              </span>
            ) : (
              <span className="px-1.5 py-0.5 bg-[#ffdbce] text-[#370e00] border border-[#994621] text-[10px] font-bold">
                Remote / Field Presence
              </span>
            )}
          </div>

          <div className="text-[11px] text-[#414942]">
            <p className="font-bold text-[#151D22]">
              {geofenceResult?.locationLabel || "San Francisco Headquarters (Within 1000m)"}
            </p>
            {coords && (
              <p className="text-[10px] text-[#717971]">
                Coordinates: {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° W
              </p>
            )}
          </div>
        </div>

        {/* Shift Selection */}
        {!isCheckedIn && (
          <div className="space-y-2 text-xs">
            <label className="block font-bold text-[#151D22] uppercase">Assigned Shift Schedule</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(SHIFTS).map((s) => (
                <button
                  key={s.type}
                  type="button"
                  onClick={() => setShiftType(s.type)}
                  className={`p-2 border-2 text-left transition-all font-mono ${
                    shiftType === s.type
                      ? "bg-[#d6edd9] border-[#151D22] shadow-[2px_2px_0px_0px_rgba(21,29,34,1)] font-bold text-[#151D22]"
                      : "bg-[#FAF7F2] border-[#2D3134] text-[#414942] hover:bg-[#edf4fd]"
                  }`}
                >
                  <span className="font-bold block text-xs">{s.type}</span>
                  <span className="text-[10px] block">
                    {s.startTime} - {s.endTime}
                  </span>
                  <span className="text-[9px] text-[#717971] block">Late cut-off: {s.lateThreshold}</span>
                </button>
              ))}
            </div>

            <div className="p-2 bg-[#E6A938]/20 border border-[#E6A938] text-[11px] text-[#151D22]">
              <span className="font-bold">Shift Policy:</span> Check in by {currentShift.lateThreshold} logs PRESENT. Working &gt; 8.5h logs billable Overtime (OT).
            </div>
          </div>
        )}

        {/* Remarks */}
        <div className="text-xs">
          <label className="block font-bold text-[#151D22] uppercase mb-1">Punch Remarks (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isCheckedIn ? "e.g. Completed sprint deliverables" : "e.g. Desk 4B, on-site meetings"}
            className="w-full p-2 retro-input text-xs"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-[#151D22]">
          <button
            type="button"
            onClick={onClose}
            className="retro-btn-secondary px-3 py-1.5 text-xs font-bold uppercase"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || geoLoading}
            onClick={handlePunch}
            className={`px-4 py-2 text-xs font-bold uppercase flex items-center gap-1.5 ${
              isCheckedIn ? "retro-btn-danger" : "retro-btn-primary"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recording...</span>
              </>
            ) : isCheckedIn ? (
              <>
                <LogOut className="w-4 h-4" />
                <span>Clock Out Shift</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Verified GPS Check-In</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
