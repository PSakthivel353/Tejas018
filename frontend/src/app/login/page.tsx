"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, GraduationCap, Landmark, LogIn, UserPlus } from "lucide-react";
import { Badge, Button, Card, CardHeader, Field, Notice, Skeleton, inputClass } from "@/components/ui";
import { DEMO_USERS, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl py-12">
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  const { login, signup } = useAuth();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>("candidate");

  // Sign In Form State
  const [identifier, setIdentifier] = useState("cand101");
  const [password, setPassword] = useState("password123");

  // Sign Up Form State
  const [suName, setSuName] = useState("");
  const [suId, setSuId] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suCompany, setSuCompany] = useState("");
  const [suTrade, setSuTrade] = useState("CNC Operation");
  const [suPhone, setSuPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    if (tab === "signin") {
      setIdentifier(DEMO_USERS[newRole].id);
      setPassword("password123");
    }
  };

  const getDestination = (userRole: Role) => {
    if (redirectUrl) return redirectUrl;
    if (userRole === "candidate") return "/seeker";
    if (userRole === "recruiter") return "/employer";
    return "/officer";
  };

  const onSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(identifier, password, role);
      if (res.success) {
        router.push(getDestination(role));
      } else {
        setError(res.error || "Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await signup({
        id: suId,
        name: suName,
        email: suEmail,
        password: suPassword,
        role,
        companyName: role === "recruiter" ? suCompany : undefined,
        trade: role === "candidate" ? suTrade : undefined,
        phone: suPhone,
      });
      if (res.success) {
        setSuccessMsg("Account created successfully! Redirecting...");
        setTimeout(() => {
          router.push(getDestination(role));
        }, 800);
      } else {
        setError(res.error || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: "candidate" as Role, label: "Job Seeker", icon: GraduationCap, idLabel: "Candidate ID" },
    { id: "recruiter" as Role, label: "Employer / Recruiter", icon: Building2, idLabel: "Recruiter ID" },
    { id: "admin" as Role, label: "Administrator", icon: Landmark, idLabel: "Admin ID" },
  ];

  return (
    <div className="mx-auto max-w-xl py-6 sm:py-10">
      <Card>
        {/* Sign In vs Sign Up Tabs */}
        <div className="flex border-b border-line bg-sunken">
          <button
            type="button"
            onClick={() => {
              setTab("signin");
              setError(null);
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors",
              tab === "signin"
                ? "border-b-2 border-accent bg-surface text-accent"
                : "text-muted hover:text-ink",
            )}
          >
            <LogIn size={16} /> Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("signup");
              setError(null);
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors",
              tab === "signup"
                ? "border-b-2 border-accent bg-surface text-accent"
                : "text-muted hover:text-ink",
            )}
          >
            <UserPlus size={16} /> Register (Sign Up)
          </button>
        </div>

        <div className="p-6">
          {/* Role Selection */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((item) => {
                const Icon = item.icon;
                const active = role === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleRoleChange(item.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all",
                      active
                        ? "border-accent bg-accent-soft font-medium text-accent ring-1 ring-accent"
                        : "border-line bg-surface text-muted hover:border-accent/40 hover:text-ink",
                    )}
                  >
                    <Icon size={20} />
                    <span className="text-xs leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mb-5">
              <Notice kind="error">{error}</Notice>
            </div>
          )}

          {successMsg && (
            <div className="mb-5">
              <Notice kind="success">{successMsg}</Notice>
            </div>
          )}

          {/* SIGN IN FORM */}
          {tab === "signin" && (
            <form onSubmit={onSignIn} className="space-y-4">
              <Field
                label={`${roles.find((r) => r.id === role)?.idLabel} or Email`}
                htmlFor="identifier"
                hint={`Example: ${DEMO_USERS[role].id} or ${DEMO_USERS[role].email}`}
              >
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className={inputClass}
                  placeholder={`Enter your ${role} ID or email`}
                />
              </Field>

              <Field label="Password" htmlFor="password">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Enter your password"
                />
              </Field>

              <div className="pt-2">
                <Button type="submit" variant="primary" loading={loading} className="w-full">
                  Sign In as {roles.find((r) => r.id === role)?.label}
                </Button>
              </div>
            </form>
          )}

          {/* SIGN UP FORM */}
          {tab === "signup" && (
            <form onSubmit={onSignUp} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full Name" htmlFor="su-name">
                  <input
                    id="su-name"
                    required
                    value={suName}
                    onChange={(e) => setSuName(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Ramesh K."
                  />
                </Field>
                <Field label={`${roles.find((r) => r.id === role)?.idLabel}`} htmlFor="su-id" hint="A unique login identifier">
                  <input
                    id="su-id"
                    required
                    value={suId}
                    onChange={(e) => setSuId(e.target.value)}
                    className={inputClass}
                    placeholder={`e.g. ${role.slice(0, 4)}_${Math.floor(Math.random() * 900) + 100}`}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Email Address" htmlFor="su-email">
                  <input
                    id="su-email"
                    type="email"
                    required
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                    className={inputClass}
                    placeholder="name@example.com"
                  />
                </Field>
                <Field label="Phone Number" htmlFor="su-phone">
                  <input
                    id="su-phone"
                    value={suPhone}
                    onChange={(e) => setSuPhone(e.target.value)}
                    className={inputClass}
                    placeholder="+91 98765 43210"
                  />
                </Field>
              </div>

              <Field label="Password" htmlFor="su-pass">
                <input
                  id="su-pass"
                  type="password"
                  required
                  value={suPassword}
                  onChange={(e) => setSuPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Create a secure password"
                />
              </Field>

              {role === "recruiter" && (
                <Field label="Company / Enterprise Name" htmlFor="su-comp">
                  <input
                    id="su-comp"
                    required
                    value={suCompany}
                    onChange={(e) => setSuCompany(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Trichy Precision Gears Pvt Ltd"
                  />
                </Field>
              )}

              {role === "candidate" && (
                <Field label="Trade Specialty" htmlFor="su-trade">
                  <select
                    id="su-trade"
                    value={suTrade}
                    onChange={(e) => setSuTrade(e.target.value)}
                    className={inputClass}
                  >
                    <option value="CNC Operation">CNC Operation</option>
                    <option value="EV Mechanic">EV Mechanic</option>
                    <option value="Solar Technician">Solar Technician</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Welder">Welder</option>
                    <option value="Fitter">Fitter</option>
                    <option value="Turner">Turner</option>
                    <option value="Refrigeration & AC">Refrigeration & AC</option>
                  </select>
                </Field>
              )}

              <div className="pt-2">
                <Button type="submit" variant="primary" loading={loading} className="w-full">
                  Create {roles.find((r) => r.id === role)?.label} Account
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
