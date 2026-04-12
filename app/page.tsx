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
      "Speak naturally in the browser; the AI interviewer replies with voice in real time. The web trial is a short preview of that flow.",
  },
  {
    icon: Target,
    title: "Tailored questions",
    description:
      "Pick your target role and behavioral or technical focus so the first exchange matches what you are preparing for.",
  },
  {
    icon: LineChart,
    title: "Full prep on mobile",
    description:
      "Longer sessions, history, and scored feedback live in the Vocis iOS and Android apps—download when you are ready to go deeper.",
  },
];

const faqItems: FaqItem[] = [
  {
    question: "What is Vocis?",
    answer:
      "Vocis is voice-first interview practice. On the web you can try about 30 seconds of real-time AI dialogue with no sign-in. For full-length sessions, history, and scored feedback, use the Vocis mobile app.",
  },
  {
    question: "Which browser works best?",
    answer:
      "Desktop Chrome, Edge, or Arc give you the best experience. Allow microphone access when prompted—that is how the AI hears you. A stable internet connection keeps audio in sync. Other browsers may work but can be less reliable.",
  },
  {
    question: "What happens to my voice and role text?",
    answer:
      "The web trial sends your role text and live audio to our servers and to Google Gemini to run the session. Anonymous trial data is not used to build a long-term profile on our side; see the Privacy Policy for details. Do not share passwords, API keys, or highly confidential material.",
  },
  {
    question: "Do I need an account on the website?",
    answer:
      "No. The browser trial is anonymous. The mobile app uses its own sign-in for full features and history.",
  },
  {
    question: "Is this free? What does Beta mean?",
    answer:
      "Yes, Vocis is free to try. Beta means we are still refining the product—expect updates. Your feedback helps us improve.",
  },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

function MobileAppCtaSection({ focusRing: ring }: { focusRing: string }) {
  const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim();
  const playStoreUrl = process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim();

  return (
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
              <h3 className="text-xl font-semibold sm:text-2xl">
                Full Vocis on mobile
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Longer interviews, history, and scored feedback. Install from the
                App Store or Google Play when links are configured for your
                environment.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
              {appStoreUrl ? (
                <a
                  href={appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center rounded-full border border-white/15 bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 ${ring}`}
                >
                  App Store
                </a>
              ) : null}
              {playStoreUrl ? (
                <a
                  href={playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center rounded-full border border-violet-500/35 bg-violet-500/15 px-5 py-2.5 text-sm font-medium text-violet-200 transition hover:border-violet-500/55 hover:bg-violet-500/25 ${ring}`}
                >
                  Google Play
                </a>
              ) : null}
              {!appStoreUrl && !playStoreUrl ? (
                <p className="text-center text-xs text-zinc-500 sm:text-left">
                  Set <code className="text-zinc-400">NEXT_PUBLIC_APP_STORE_URL</code>{" "}
                  and{" "}
                  <code className="text-zinc-400">NEXT_PUBLIC_PLAY_STORE_URL</code>{" "}
                  to show download buttons.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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
                Try Vocis in 30 seconds—no sign-in.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:mt-5 sm:text-lg">
                A quick voice preview in your browser. Full sessions, history,
                and scored feedback are in the Vocis app for iOS and Android.
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
              Web trial vs full app
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">
              The site is a short, anonymous taste of voice practice. Serious
              prep—with scoring and progress—happens in the app.
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

        <MobileAppCtaSection focusRing={focusRing} />

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
              Quick answers about the web trial, browsers, privacy, and the app.
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
          <nav
            className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
            aria-label="Legal"
          >
            <Link
              href="/privacy-policy"
              className={`text-zinc-500 transition hover:text-zinc-300 ${focusRing} rounded`}
            >
              Privacy Policy
            </Link>
            <span className="text-zinc-700" aria-hidden>
              ·
            </span>
            <Link
              href="/terms"
              className={`text-zinc-500 transition hover:text-zinc-300 ${focusRing} rounded`}
            >
              Terms of Service
            </Link>
          </nav>
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
