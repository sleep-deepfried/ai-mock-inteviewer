import Link from "next/link";
import {
  Mic,
  Brain,
  FileText,
  Clock,
  SlidersHorizontal,
  LineChart,
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Real-Time Voice",
    description:
      "Natural bidirectional audio conversation powered by Gemini Live API.",
  },
  {
    icon: Brain,
    title: "AI Interviewer",
    description:
      "Practice with Alex Chen, a seasoned technical interviewer persona.",
  },
  {
    icon: FileText,
    title: "Resume-Aware",
    description:
      "Upload your resume and get questions tailored to your experience.",
  },
  {
    icon: Clock,
    title: "Timed Sessions",
    description:
      "15-minute mock interviews that simulate real interview pressure.",
  },
];

const steps: {
  icon: typeof SlidersHorizontal;
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
}[] = [
  {
    icon: SlidersHorizontal,
    title: "Configure",
    description:
      "Set your role, optional job description, and resume so questions match what you are targeting.",
    href: "/interview/setup",
    linkLabel: "Open setup",
  },
  {
    icon: Mic,
    title: "Practice",
    description:
      "After setup, join a live voice session with the AI interviewer—like a real technical screen.",
  },
  {
    icon: LineChart,
    title: "Review",
    description:
      "See scores, strengths, and concrete improvements when the session ends.",
    href: "/interview/results",
    linkLabel: "Open results",
  },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

export default function HomePage() {
  const showSignIn = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH !== "true";

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <nav
          className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6"
          aria-label="Main"
        >
          <span className="text-lg font-semibold tracking-tight">
            AI Mock Interviewer
          </span>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/interview/setup"
              className={`inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-white/25 hover:bg-white/10 sm:px-4 ${focusRing}`}
            >
              Get Started
            </Link>
            {showSignIn && (
              <Link
                href="/login"
                className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium text-gray-300 transition hover:text-white sm:px-4 ${focusRing}`}
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </header>

      <section
        className="landing-hero relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16 text-center sm:px-6 sm:py-24"
        aria-labelledby="hero-heading"
      >
        <div className="relative z-10 flex max-w-3xl flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400/90">
            Voice-first mock interviews
          </p>
          <h1
            id="hero-heading"
            className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
          >
            Ace Your Next Interview with{" "}
            <span className="bg-linear-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Practice
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-gray-400 sm:mt-6 sm:text-lg">
            Practice mock interviews with a realistic AI interviewer. Get
            real-time voice feedback, resume-tailored questions, and build
            confidence before the real thing.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
            <Link
              href="/interview/setup"
              className={`inline-flex items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition hover:bg-purple-500 ${focusRing}`}
            >
              Get Started
            </Link>
            {showSignIn && (
              <Link
                href="/login"
                className={`inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-gray-200 transition hover:border-white/25 hover:bg-white/5 ${focusRing}`}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </section>

      <section
        className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-20"
        aria-labelledby="how-heading"
      >
        <h2
          id="how-heading"
          className="text-center text-2xl font-bold tracking-tight sm:text-3xl"
        >
          How it works
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-gray-400 sm:text-base">
          Three steps from setup to feedback—no scheduling required.
        </p>
        <ol className="mt-10 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {steps.map((step, index) => (
            <li key={step.title}>
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/3 p-6 transition hover:-translate-y-0.5 hover:border-purple-500/25 hover:bg-white/6 hover:shadow-lg hover:shadow-purple-900/10">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600/20 text-sm font-bold text-purple-300"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <step.icon
                    className="h-8 w-8 shrink-0 text-purple-400"
                    aria-hidden
                  />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 flex-1 text-sm text-gray-400">
                  {step.description}
                </p>
                {step.href && step.linkLabel ? (
                  <Link
                    href={step.href}
                    className={`mt-4 inline-flex text-sm font-medium text-purple-400 transition hover:text-purple-300 ${focusRing} rounded`}
                  >
                    {step.linkLabel}
                    <span className="sr-only"> — {step.title}</span>
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-4 pb-8 sm:grid-cols-2 sm:gap-6 sm:px-6 lg:grid-cols-4"
        aria-label="Features"
      >
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/7 hover:shadow-lg hover:shadow-black/20"
          >
            <f.icon className="mb-4 h-8 w-8 text-purple-400" aria-hidden />
            <h3 className="text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-gray-400">{f.description}</p>
          </div>
        ))}
      </section>

      <section
        className="border-y border-white/10 bg-white/2 px-4 py-16 sm:px-6"
        aria-labelledby="cta-heading"
      >
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2
            id="cta-heading"
            className="text-xl font-bold tracking-tight sm:text-2xl"
          >
            Ready to practice?
          </h2>
          <p className="mt-2 text-sm text-gray-400 sm:text-base">
            Start a session in minutes—configure once, then jump into voice.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/interview/setup"
              className={`inline-flex items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition hover:bg-purple-500 ${focusRing}`}
            >
              Get Started
            </Link>
            {showSignIn && (
              <Link
                href="/login"
                className={`inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-gray-200 transition hover:border-white/25 hover:bg-white/5 ${focusRing}`}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} AI Mock Interviewer. All rights
        reserved.
      </footer>
    </main>
  );
}
