"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Building2, Mail, Lock, User, Briefcase, Phone, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    department: "Engineering",
    designation: "Software Engineer",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    const res = await register({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      department: formData.department,
      designation: formData.designation,
      phone: formData.phone,
    });

    if (!res.success) {
      setError(res.error || "Registration failed");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EFEA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-mono text-xs">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10 px-4">
        {/* Header Logo */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#346645] border-2 border-[#151D22] shadow-[3px_3px_0px_0px_rgba(21,29,34,1)] text-white mb-2">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="font-display-lg text-2xl font-extrabold uppercase text-[#151D22] tracking-tight">
            Create Employee Profile
          </h2>
          <p className="text-xs text-[#414942]">
            Register your official Dayflow HRMS workforce account
          </p>
        </div>

        {/* Card Form */}
        <div className="retro-card-static bg-[#FAF7F2] p-6 sm:p-8 shadow-[5px_5px_0px_0px_rgba(21,29,34,1)] space-y-4">
          {error && (
            <div className="p-3 bg-[#ffdad6] border-2 border-[#ba1a1a] flex items-start gap-2 text-[#ba1a1a] font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Sarah"
                  className="w-full p-2 retro-input"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Jenkins"
                  className="w-full p-2 retro-input"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">Work Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="s.jenkins@dayflow.com"
                className="w-full p-2 retro-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full p-2 retro-input font-bold"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Quality Engineering">Quality Engineering</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Designation</label>
                <input
                  type="text"
                  name="designation"
                  required
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="Lead Designer"
                  className="w-full p-2 retro-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full p-2 retro-input"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full p-2 retro-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full retro-btn-primary py-3 px-4 text-xs font-bold uppercase flex items-center justify-center gap-2 mt-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-[#717971] border-t border-[#151D22]">
            Already have an active workforce profile?{" "}
            <Link href="/login" className="font-bold text-[#346645] underline underline-offset-4">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
