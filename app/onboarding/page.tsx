"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import {
  Mic,
  Target,
  LineChart,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
} from "lucide-react";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

const WELCOME_SLIDES = [
  {
    icon: Mic,
    title: "Practice out loud",
    description:
      "Speak naturally — the AI interviewer responds in real time, just like a real phone screen.",
  },
  {
    icon: Target,
    title: "Tailored to you",
    description:
      "Pick your target role and interview style. Add a resume for even more relevant questions.",
  },
  {
    icon: LineChart,
    title: "Get real feedback",
    description:
      "After each session, see your score breakdown with specific strengths and areas to improve.",
  },
];

const SUGGESTED_ROLES = [
  "Software Engineer",
  "Product Manager",
  "Data Scientist",
  "UX Designer",
  "Engineering Manager",
  "Solutions Architect",
  "Frontend Engineer",
  "Backend Engineer",
] as const;

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingContent />
    </ProtectedRoute>
  );
}

function OnboardingContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name ?? "",
  );
  const [targetRole, setTargetRole] = useState("");

  const totalSteps = WELCOME_SLIDES.length + 2; // slides + name + role

  const handleComplete = () => {
    // Save onboarding data to localStorage
    localStorage.setItem("vocis_onboarded", "true");
    localStorage.setItem("vocis_just_onboarded", "true");
    localStorage.setItem("vocis_display_name", displayName);
    if (targetRole) {
      localStorage.setItem("vocis_target_role", targetRole);
    }
    router.push("/dashboard");
  };

  const currentSlideIndex = step;
  const isOnSlides = step < WELCOME_SLIDES.length;
  const isOnNameStep = step === WELCOME_SLIDES.length;
  const isOnRoleStep = step === WELCOME_SLIDES.length + 1;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center bg-[#050508] px-4 py-10 text-white">
      <div
        className="landing-stitch pointer-events-none absolute inset-0 z-0"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Progress dots */}
        <div className="mb-8 flex justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all ${
                i === step
                  ? "w-6 bg-purple-500"
                  : i < step
                    ? "bg-purple-500/50"
                    : "bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Welcome slides */}
        {isOnSlides && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10">
              {(() => {
                const Icon = WELCOME_SLIDES[currentSlideIndex].icon;
                return <Icon className="h-10 w-10 text-purple-400" />;
              })()}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {WELCOME_SLIDES[currentSlideIndex].title}
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-zinc-400">
              {WELCOME_SLIDES[currentSlideIndex].description}
            </p>
          </div>
        )}

        {/* Name step */}
        {isOnNameStep && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10">
              <Sparkles className="h-10 w-10 text-purple-400" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              What should we call you?
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-zinc-400">
              This helps personalize your experience.
            </p>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className={`mt-8 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-lg outline-none transition placeholder:text-zinc-600 focus:border-purple-500 ${focusRing}`}
              autoFocus
            />
          </div>
        )}

        {/* Role step */}
        {isOnRoleStep && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10">
              <Target className="h-10 w-10 text-purple-400" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              What role are you targeting?
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-zinc-400">
              We&apos;ll use this to suggest relevant practice sessions.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {SUGGESTED_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setTargetRole(role)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${focusRing} ${
                    targetRole === role
                      ? "border-purple-500 bg-purple-500/20 text-white"
                      : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Or type your own..."
              className={`mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center outline-none transition placeholder:text-zinc-600 focus:border-purple-500 ${focusRing}`}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-zinc-400 transition hover:text-white disabled:invisible ${focusRing}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {isOnRoleStep ? (
            <button
              type="button"
              onClick={handleComplete}
              className={`inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 ${focusRing}`}
            >
              <Check className="h-4 w-4" />
              Get started
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className={`inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 ${focusRing}`}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Skip link */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleComplete}
            className={`text-sm text-zinc-500 transition hover:text-zinc-300 ${focusRing} rounded`}
          >
            Skip for now
          </button>
        </div>
      </div>
    </main>
  );
}
