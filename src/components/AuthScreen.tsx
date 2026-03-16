"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Step = "splash" | "login" | "signup" | "checkEmail";


const footerStyle: React.CSSProperties = {
  textAlign: "center",
  marginTop: "20px",
  fontSize: "0.8rem",
  color: "rgba(255,255,255,0.4)",
};
const linkStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--foam)",
  cursor: "pointer",
  fontSize: "inherit",
  padding: 0,
};

export default function AuthScreen() {
  const router = useRouter();
  const [displayedStep, setDisplayedStep] = useState<Step>("splash");
  const [isExiting, setIsExiting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3600);
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [toastMsg]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  function goTo(next: Step) {
    if (isExiting) return;
    setIsExiting(true);
    transitionTimerRef.current = setTimeout(() => {
      setDisplayedStep(next);
      setIsExiting(false);
    }, 220);
  }

  async function handleLogin() {
    if (loading || !email || !password) return;
    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    setToastMsg(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setToastMsg(error.message);
      setLoading(false);
    } else {
      router.push("/tracker");
      router.refresh();
    }
  }

  async function handleSignup() {
    if (loading || !email || !password) return;
    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    setToastMsg(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || undefined,
        },
      },
    });
    if (error) {
      setToastMsg(error.message);
      setLoading(false);
    } else if (data.session) {
      router.push("/tracker");
      router.refresh();
    } else {
      goTo("checkEmail");
      setLoading(false);
    }
  }

  const Toast = toastMsg ? (
    <div className="error-toast">
      <span className="toast-icon">⚠️</span>
      <span className="toast-msg">{toastMsg}</span>
      <button className="toast-close" onClick={() => setToastMsg(null)}>
        ✕
      </button>
    </div>
  ) : null;

  const contentClass = `auth-step-content${isExiting ? " auth-step-exit" : ""}`;

  return (
    <>
      <div id="screenOnboarding" className="screen active">
        <div
          className="onboarding-card"
          style={{
            position: "relative",
            textAlign:
              displayedStep === "splash" || displayedStep === "checkEmail"
                ? "center"
                : undefined,
          }}
        >
          {/* Back button — shown on login, signup */}
          {(displayedStep === "login" || displayedStep === "signup") && (
            <button
              className="auth-back-btn"
              onClick={() =>
                goTo(displayedStep === "login" ? "splash" : "login")
              }
              aria-label="Back"
            >
              ←
            </button>
          )}

          <div className={contentClass}>
            {/* ── SPLASH ── */}
            {displayedStep === "splash" && (
              <>
                <div className="onboarding-logo">
                  <h1>SwimPulse</h1>
                  <p>Track · Burn · Recover</p>
                </div>
                <p className="onboarding-why" style={{ margin: "12px 0 28px" }}>
                  &ldquo;Water is the driving force of all nature.&rdquo;
                </p>
                <button className="btn-continue" onClick={() => goTo("login")}>
                  Get Started
                </button>
              </>
            )}

            {/* ── CHECK EMAIL ── */}
            {displayedStep === "checkEmail" && (
              <>
                <div className="onboarding-logo">
                  <h1>SwimPulse</h1>
                  <p>Track · Burn · Recover</p>
                </div>
                <p className="onboarding-why" style={{ margin: "16px 0 24px" }}>
                  Check your email for a confirmation link, then come back to
                  sign in.
                </p>
                <button className="btn-continue" onClick={() => goTo("login")}>
                  Back to Sign In
                </button>
              </>
            )}

            {/* ── LOGIN ── */}
            {displayedStep === "login" && (
              <>
                <div
                  className="onboarding-logo"
                  style={{ marginBottom: "4px" }}
                >
                  <h1 style={{ fontSize: "1.9rem" }}>SwimPulse</h1>
                  <p>Track · Burn · Recover</p>
                </div>

                <div className="onboarding-fields">
                  <div className="onboarding-field">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      autoComplete="email"
                    />
                  </div>
                  <div className="onboarding-field">
                    <label htmlFor="password">Password</label>
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <button
                  className={`btn-continue${!email || !password ? " btn-continue--locked" : ""}`}
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? "…" : "Sign In"}
                </button>

                <p style={footerStyle}>
                  Don&apos;t have an account?{" "}
                  <button style={linkStyle} onClick={() => goTo("signup")}>
                    Create New
                  </button>
                </p>
              </>
            )}

            {/* ── SIGN UP ── */}
            {displayedStep === "signup" && (
              <>
                <div
                  className="onboarding-logo"
                  style={{ marginBottom: "4px" }}
                >
                  <h1 style={{ fontSize: "1.9rem" }}>SwimPulse</h1>
                  <p>Track · Burn · Recover</p>
                </div>

                <div className="onboarding-fields">
                  <div className="onboarding-field">
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="Jane Swimmer"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                  <div className="onboarding-field">
                    <label htmlFor="signupEmail">Email</label>
                    <input
                      id="signupEmail"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  <div className="onboarding-field">
                    <label htmlFor="signupPassword">Password</label>
                    <input
                      id="signupPassword"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <button
                  className={`btn-continue${!email || !password ? " btn-continue--locked" : ""}`}
                  onClick={handleSignup}
                  disabled={loading}
                >
                  {loading ? "…" : "Create Account →"}
                </button>

                <p style={footerStyle}>
                  Already have an account?{" "}
                  <button style={linkStyle} onClick={() => goTo("login")}>
                    Login
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      {Toast}
    </>
  );
}
