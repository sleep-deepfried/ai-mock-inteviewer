import Link from "next/link";
import { Mic, Target, LineChart } from "lucide-react";
import { LandingFaq, type FaqItem } from "@/components/landing/landing-faq";
import { LandingHeroComposer } from "@/components/landing/landing-hero-composer";

const bento = [
  {
    icon: Mic,
    title: "Voice practice",
    description:
      "Speak naturally in the browser; the interviewer replies with voice (Gemini + ElevenLabs). Same back-and-forth rhythm as a real screen.",
  },
  {
    icon: Target,
    title: "Tailored questions",
    description:
      "Your target role, interview focus (behavioral or technical), and optional resume shape the questions so practice matches what you are preparing for.",
  },
  {
    icon: LineChart,
    title: "Scored feedback",
    description:
      "When the session ends, get a concise summary with strengths, gaps, and concrete improvements—not a generic score only.",
  },
];

const faqItems: FaqItem[] = [
  {
    question: "What is AI Mock Interviewer?",
    answer:
      "It is a safe space to rehearse a real interview out loud. You pick the role you want, choose whether you want more behavioral or technical questions, add a resume if you like, then you talk—and hear an interviewer respond in real time. When you are done, you get clear feedback on what went well and what to tighten before the actual interview.",
  },
  {
    question: "Which browser works best?",
    answer:
      "You will have the smoothest time on desktop Chrome, Edge, or Arc. When your browser asks to use the microphone, say yes—that is how you are heard. A steady Wi‑Fi or wired connection also helps so your voice and captions stay in sync. If you use something else, it might still work, just expect a few more hiccups.",
  },
  {
    question: "Is my conversation or resume stored?",
    answer:
      "Your answers and optional resume are used to run your practice and to create the feedback you see—nothing more mysterious than that. How long data is kept depends on the privacy policy of whoever gave you access (for example your employer, school, or the company behind this link). Please do not paste passwords, secret codes, or confidential work material.",
  },
  {
    question: "Do I need an account?",
    answer:
      "Almost always, yes. You sign in so your sessions stay private to you—commonly with Google or a one-time link sent to your email. That is the version meant for real practice.",
  },
  {
    question: "Is this free? What does Beta mean?",
    answer:
      "Cost is up to whoever invited you—some programs include it at no charge, others bundle it with coaching or internal tools. If you see Beta, we are still improving the experience, so small things may change; it is not a trick charge, just an honest heads-up that you are among the early users.",
  },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

export default function HomePage() {
  const showSignIn = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH !== "true";
  const showBeta =
    typeof process.env.NEXT_PUBLIC_APP_STAGE === "string" &&
    process.env.NEXT_PUBLIC_APP_STAGE.toLowerCase() === "beta";

  return (
    <main className="relative flex min-h-dvh flex-col bg-black text-white">
      {/* Full-bleed hero canvas under the sticky bar (header sits above plain main bg in DOM otherwise). */}
      <div
        className="landing-stitch pointer-events-none absolute inset-x-0 top-0 z-0 min-h-dvh"
        aria-hidden
      />
      <header className="sticky top-0 z-50 bg-zinc-950/20 backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-zinc-950/[0.12]">
        <nav
          className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-4"
          aria-label="Main"
        >
          <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
            <span className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">
              AI Mock Interviewer
            </span>
            {showBeta ? (
              <span className="shrink-0 rounded-full border border-white/70 bg-transparent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                Beta
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/#start-interview"
              className={`inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition motion-safe:hover:bg-zinc-200 ${focusRing}`}
            >
              Get started
            </Link>
            {showSignIn ? (
              <Link
                href="/login"
                className={`inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-medium text-zinc-400 transition motion-safe:hover:text-white ${focusRing}`}
              >
                Sign in
              </Link>
            ) : null}
          </div>
        </nav>
      </header>

      <section
        className="relative z-10 flex min-h-[calc(100dvh-4.5rem)] flex-col items-center justify-center overflow-hidden px-4 py-10 text-center sm:px-6 sm:py-14"
        aria-labelledby="hero-heading"
      >
        <div className="relative z-10 mx-auto w-full max-w-5xl px-0 sm:px-2">
          <div className="mx-auto max-w-3xl">
            <h1
              id="hero-heading"
              className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl sm:leading-[1.06]"
            >
              Practice interviews that feel real.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:mt-5 sm:text-lg">
              Voice-first mock interviews. Questions tailored to your role and
              resume—then clear, actionable feedback when you are done.
            </p>
          </div>
          <div id="start-interview" className="w-full">
            <LandingHeroComposer focusRing={focusRing} />
          </div>
          {showSignIn ? (
            <p className="mt-6 text-center text-sm text-zinc-500">
              <Link
                href="/login"
                className={`font-medium text-zinc-400 underline-offset-4 transition motion-safe:hover:text-white ${focusRing} rounded`}
              >
                Sign in
              </Link>
            </p>
          ) : null}
        </div>
      </section>

      <section
        className="border-t border-white/10 bg-black px-4 py-16 sm:px-6 sm:py-20"
        aria-labelledby="bento-heading"
      >
        <div className="mx-auto max-w-5xl">
          <h2
            id="bento-heading"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Built for serious prep
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">
            Voice session, context-aware questions, and a structured debrief—so
            you know what to fix before the real interview.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bento.map((item) => (
              <div
                key={item.title}
                className="stitch-card motion-safe:transition motion-safe:hover:border-white/15 motion-safe:hover:bg-white/[0.045] p-6 sm:p-7"
              >
                <item.icon
                  className="h-8 w-8 text-violet-400"
                  aria-hidden
                />
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-t border-white/10 bg-black px-4 py-20 sm:px-6 sm:py-28"
        aria-labelledby="faq-heading"
      >
        <div className="mx-auto max-w-5xl">
          <h2
            id="faq-heading"
            className="text-center text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
          >
            Questions?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-relaxed text-zinc-400 sm:mt-4 sm:text-lg">
            Quick answers about the product, browsers, privacy, and sign-in.
          </p>
          <div className="mt-12 sm:mt-14">
            <LandingFaq items={faqItems} focusRing={focusRing} />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-zinc-600 sm:px-6">
        © {new Date().getFullYear()} AI Mock Interviewer
      </footer>
    </main>
  );
}
