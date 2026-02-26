"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const BASE = "/portal";

export default function LoginPage() {
  const router = useRouter();
  const [investorType, setInvestorType] = useState("any");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/auth/session`, { credentials: "include" })
      .then((r) => r.json() as Promise<{ authenticated: boolean }>)
      .then((data) => {
        if (data.authenticated) router.replace(`${BASE}/dashboard`);
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim(), investorType }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      router.push(`${BASE}/dashboard`);
    } catch {
      setError("Cannot reach API. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) return null;

  return (
    <div className="page">
      <div className="brand">
        <div>
          <h2>Dhamma Capital</h2>
          <small style={{ color: "var(--muted)" }}>Investor Portal</small>
        </div>
      </div>

      <section className="card">
        <h1>Investor Login</h1>
        <p className="subtitle">Secure access to your investor documents.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <label htmlFor="investor-type">Investor Type</label>
            <select id="investor-type" value={investorType} onChange={(e) => setInvestorType(e.target.value)}>
              <option value="any">Any</option>
              <option value="DII">DII</option>
              <option value="FII">FII</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="hello@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <button type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Access Portal"}
            </button>
          </div>

          {error && (
            <p className="error visible" role="alert">{error}</p>
          )}
        </form>

        <p className="hint">
          Credentials are validated server-side and read from Webflow CMS.
        </p>
      </section>
    </div>
  );
}
