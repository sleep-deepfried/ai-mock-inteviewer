import Link from "next/link";
import { Mic, Target, LineChart, Smartphone } from "lucide-react";
import { LandingFaq, type FaqItem } from "@/components/landing/landing-faq";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHeroComposer } from "@/components/landing/landing-hero-composer";

const bento = [
  {
    icon: Mic,
    title: "Voice practice",
    description:
      "Speak naturally in the browser; the AI interviewer replies with voice in real time. Same back-and-forth rhythm as a real phone screen.",
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
    question: "What is Vocis?",
    answer:
      "Vocis is your personal interview practice space. Pick a role, choose behavioral or technical focus, optionally upload your resume, then have a real-time voice conversation with an AI interviewer. When you finish, you get clear feedback on what went well and what to improve before your actual interview.",
  },
  {
    question: "Which browser works best?",
    answer:
      "Desktop Chrome, Edge, or Arc give you the best experience. Make sure to allow microphone access when prompted—that is how the AI hears you. A stable internet connection helps keep your voice and the AI responses in sync. Other browsers may work but might have occasional hiccups.",
  },
  {
    question: "Is my conversation or resume stored?",
    answer:
      "Your session data and resume are used only to run your practice and generate feedback. We do not share or sell your information. Please avoid pasting passwords, API keys, or confidential work material during your sessions.",
  },
  {
    question: "Do I need an account?",
    answer:
      "Yes, signing in keeps your sessions private and lets you track your progress over time. You can sign in with Google or request a magic link sent to your email—quick and secure.",
  },
  {
    question: "Is this free? What does Beta mean?",
    answer:
      "Yes, Vocis is completely free to use. The Beta label means we are actively refining the experience based on user feedback—expect occasional updates and improvements. You are helping shape the product by being an early user, and we appreciate it.",
  },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

export default function HomePage() {
  const showBeta =
    typeof process.env.NEXT_PUBLIC_APP_STAGE === "string" &&
    process.env.NEXT_PUBLIC_APP_STAGE.toLowerCase() === "beta";

  return (
    <>
      <a
        href="#start-interview"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-purple-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <main className="relative flex min-h-dvh flex-col bg-[#050508] text-white">
        {/* Full-page stitch canvas (fills main height; content stacks above at z-10+). */}
        <div
          className="landing-stitch pointer-events-none absolute inset-0 z-0"
          aria-hidden
        />
        <LandingHeader showBeta={showBeta} focusRing={focusRing} />

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
          </div>
        </section>

        <section
          className="relative z-10 px-4 py-16 sm:px-6 sm:py-20"
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
              Voice session, context-aware questions, and a structured
              debrief—so you know what to fix before the real interview.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bento.map((item) => (
                <div
                  key={item.title}
                  className="stitch-card motion-safe:transition motion-safe:hover:border-white/15 motion-safe:hover:bg-white/[0.045] p-6 sm:p-7"
                >
                  <item.icon className="h-8 w-8 text-violet-400" aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile App Coming Soon */}
        <section className="relative z-10 px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/50 via-zinc-900/80 to-zinc-900/80 p-6 sm:rounded-3xl sm:p-10">
              <div
                className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl"
                aria-hidden
              />
              <div
                className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl"
                aria-hidden
              />
              <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 sm:h-20 sm:w-20">
                  <Smartphone
                    className="h-8 w-8 text-violet-400 sm:h-10 sm:w-10"
                    aria-hidden
                  />
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2">
                    <h3 className="text-xl font-semibold sm:text-2xl">
                      Mobile App
                    </h3>
                    <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                      Coming Soon
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
                    Practice interviews on the go. Get notified when the iOS and
                    Android apps launch.
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-full border border-violet-500/30 bg-violet-500/10 px-5 py-2.5 text-sm font-medium text-violet-300 transition hover:border-violet-500/50 hover:bg-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Notify me
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          className="relative z-10 px-4 py-20 sm:px-6 sm:py-28"
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

        <footer
          className="relative z-10 px-4 py-8 text-center text-xs leading-relaxed text-zinc-600 sm:px-6"
          role="contentinfo"
        >
          <p>
            © {new Date().getFullYear()} Vocis
            <span className="mx-1.5 text-zinc-700" aria-hidden>
              ·
            </span>
            <span className="text-zinc-500">
              Earl John Pulido, in collaboration with Tutorial Dojo
            </span>
          </p>
        </footer>
      </main>
    </>
  );
}
