"use client";

import { useEffect, useRef, useState } from "react";
import { calcCalories } from "@/lib/calculations";
import type { Profile, Session, Stroke, Intensity } from "@/lib/types";

interface Props {
  profile: Profile;
  onLog: (
    session: Omit<Session, "id" | "user_id" | "created_at">,
  ) => Promise<void>;
}

export default function SessionForm({ profile, onLog }: Props) {
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [stroke, setStroke] = useState<Stroke>("freestyle");
  const [intensity, setIntensity] = useState<Intensity>("moderate");
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
      setErrorFields(new Set());
    }, 3600);
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [toastMsg]);

  function triggerShake() {
    const btn = btnRef.current;
    if (!btn) return;
    btn.style.animation = "none";
    void btn.offsetHeight;
    btn.style.animation = "shake 0.4s ease";
  }

  function showError(msg: string, fields: string[]) {
    setToastMsg(msg);
    setErrorFields(new Set(fields));
    triggerShake();
  }

  function step(field: "distance" | "duration", delta: number) {
    const stepSize = field === "distance" ? 50 : 1;
    if (field === "distance") {
      setDistance((prev) =>
        String(Math.max(0, (parseInt(prev) || 0) + delta * stepSize)),
      );
    } else {
      setDuration((prev) =>
        String(Math.max(0, (parseInt(prev) || 0) + delta * stepSize)),
      );
    }
  }

  async function handleSubmit() {
    if (submitting) return;

    const dist = parseInt(distance) || 0;
    const dur = parseInt(duration) || 0;

    const errors: string[] = [];
    const badFields: string[] = [];

    if (!distance || dist <= 0) {
      errors.push("Enter a distance");
      badFields.push("distance");
    } else if (dist > 20000) {
      errors.push(
        `<strong>${dist.toLocaleString()} m</strong> in one session? That's 200+ laps — please double-check`,
      );
      badFields.push("distance");
    }

    if (!duration || dur <= 0) {
      errors.push("Enter a duration");
      badFields.push("duration");
    } else if (dur > 480) {
      errors.push(
        `<strong>${dur} min</strong> is over 8 hours — that doesn't look right`,
      );
      badFields.push("duration");
    }

    if (errors.length === 0 && dist > 0 && dur > 0) {
      const paceMin100m = dur / (dist / 100);
      if (paceMin100m < 0.5) {
        errors.push(
          `That pace is <strong>${(paceMin100m * 60).toFixed(0)}s per 100m</strong> — faster than an Olympic sprinter! Double-check your values`,
        );
        badFields.push("distance", "duration");
      }
    }

    if (errors.length > 0) {
      showError(errors.join("<br>"), badFields);
      return;
    }

    const kcal = calcCalories(stroke, intensity, dur, profile.weight);

    setSubmitting(true);
    try {
      await onLog({ distance: dist, duration: dur, stroke, intensity, kcal });
      setDistance("");
      setDuration("");
    } finally {
      setSubmitting(false);
    }
  }

  function clearFieldError(field: string) {
    setErrorFields((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }

  return (
    <>
      <div className="form-card">
        <h2>Log a Session</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Distance (m)</label>
            <div className="num-input-wrap">
              <input
                type="number"
                placeholder="e.g. 1500"
                min="0"
                step="50"
                value={distance}
                className={errorFields.has("distance") ? "input-error" : ""}
                onChange={(e) => {
                  setDistance(e.target.value);
                  clearFieldError("distance");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <div className="num-steppers">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => step("distance", 1)}
                >
                  ▲
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => step("distance", -1)}
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Duration (min)</label>
            <div className="num-input-wrap">
              <input
                type="number"
                placeholder="e.g. 45"
                min="0"
                step="1"
                value={duration}
                className={errorFields.has("duration") ? "input-error" : ""}
                onChange={(e) => {
                  setDuration(e.target.value);
                  clearFieldError("duration");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <div className="num-steppers">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => step("duration", 1)}
                >
                  ▲
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => step("duration", -1)}
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Stroke</label>
            <div className="select-wrap">
              <select
                value={stroke}
                onChange={(e) => setStroke(e.target.value as Stroke)}
              >
                <option value="freestyle">Freestyle</option>
                <option value="breaststroke">Breaststroke</option>
                <option value="backstroke">Backstroke</option>
                <option value="butterfly">Butterfly</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Intensity</label>
            <div className="select-wrap">
              <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value as Intensity)}
              >
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>
        <button
          ref={btnRef}
          className="btn-log"
          onClick={handleSubmit}
          disabled={submitting}
        >
          Log Swim
        </button>
      </div>

      {toastMsg && (
        <div className="error-toast">
          <span className="toast-icon">⚠️</span>
          <span
            className="toast-msg"
            dangerouslySetInnerHTML={{ __html: toastMsg }}
          />
          <button className="toast-close" onClick={() => setToastMsg(null)}>
            ✕
          </button>
        </div>
      )}
    </>
  );
}
