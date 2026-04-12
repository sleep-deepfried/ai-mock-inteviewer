import Link from "next/link";
import { Mic, Target, LineChart, Smartphone, Play, Apple } from "lucide-react";
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
      "Longer sessions, on-device history, and scored feedback in the Vocis mobile app—download when you are ready to go deeper.",
  },
];

const faqItems: FaqItem[] = [
  {
    question: "What is Vocis?",
    answer:
      "Vocis helps you practice job interviews out loud with an AI interviewer that speaks back in real time. This website offers a short, anonymous preview; the mobile apps are built for longer sessions and deeper feedback.",
  },
  {
    question: "How long is the web trial?",
    answer:
      "About 30 seconds once you are connected—enough to feel the back-and-forth. When the timer ends, you will see where to go for full-length practice (the Vocis app). There is no scored report or results page on the web trial.",
  },
  {
    question: "Which browser works best?",
    answer:
      "Use a recent desktop version of Chrome, Edge, or Arc. When the browser asks for microphone access, choose Allow; without the mic, the interviewer cannot hear you. A stable Wi‑Fi or wired connection reduces audio dropouts. Other browsers may work but are not our primary test targets.",
  },
  {
    question: "What is included in the mobile app?",
    answer:
      "The Vocis mobile app is built for full-length interviews, on-device history (so your past sessions stay on your phone unless we add cloud sync later), and scored feedback after each run. Store links appear on this site when they are configured. The web stays a lightweight trial, not a replacement for the app.",
  },
  {
    question: "What happens to my voice and the role I enter?",
    answer:
      "On the web trial, the job role or description you type and your live voice audio are sent to our servers and to Google Gemini (Live API) to run the conversation. The server keeps session data in memory for a limited time, then it expires. On mobile, voice and session data are processed the same way for the live interview and scoring, while your completed history and scores are stored on the device—see the Privacy Policy. Never dictate passwords, API keys, or employer-confidential material.",
  },
  {
    question: "Do I need an account on the website?",
    answer:
      "No for the browser trial—it stays anonymous. If the full Vocis website offers sign-in, that is optional and used for cloud-saved history there. The current Vocis mobile app is set up so you can practice without a website account; your interview history stays on your phone.",
  },
  {
    question: "Can I upload my resume during the web trial?",
    answer:
      "No. Resume upload is turned off for the anonymous web trial to keep data collection minimal. On mobile you can attach a resume: text is extracted on your device, then the app sends what is needed to configure the interview and scoring—see the Privacy Policy for details.",
  },
  {
    question: "Is Vocis free? What does Beta mean?",
    answer:
      "Yes—you can try Vocis without paying. Beta means we are still shipping improvements; you might see UI tweaks, copy updates, or behavior changes as we learn from usage. Share feedback if something feels confusing.",
  },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

function MobileAppCtaSection({ focusRing: ring }: { focusRing: string }) {
  const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim();
  const playStoreUrl = process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim();

  // Check if URLs are valid (not placeholder values like "coming-soon")
  const isValidUrl = (url: string | undefined): url is string =>
    !!url && url.startsWith("http");
  const appStoreReady = isValidUrl(appStoreUrl);
  const playStoreReady = isValidUrl(playStoreUrl);
  const hasComingSoon =
    (appStoreUrl && !appStoreReady) || (playStoreUrl && !playStoreReady);

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
                Longer interviews, history, and scored feedback. Install from
                the App Store or Google Play when available.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
              {appStoreReady ? (
                <a
                  href={appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-3 rounded-xl border border-white/20 bg-black px-4 py-2.5 transition hover:bg-zinc-900 ${ring}`}
                >
                  <Apple className="h-8 w-8 text-white" aria-hidden />
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-300">
                      Download on the
                    </span>
                    <span className="text-lg font-semibold leading-tight text-white">
                      App Store
                    </span>
                  </div>
                </a>
              ) : appStoreUrl ? (
                <span className="inline-flex cursor-default items-center gap-3 rounded-xl border border-white/10 bg-black px-4 py-2.5">
                  <Apple className="h-8 w-8 text-white" aria-hidden />
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                      Coming soon to
                    </span>
                    <span className="text-lg font-semibold leading-tight text-white">
                      App Store
                    </span>
                  </div>
                </span>
              ) : null}
              {playStoreReady ? (
                <a
                  href={playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-3 rounded-xl border border-white/20 bg-black px-4 py-2.5 transition hover:bg-zinc-900 ${ring}`}
                >
                  <Play
                    className="h-8 w-8 fill-current text-white"
                    aria-hidden
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-300">
                      Get it on
                    </span>
                    <span className="text-lg font-semibold leading-tight text-white">
                      Google Play
                    </span>
                  </div>
                </a>
              ) : playStoreUrl ? (
                <span className="inline-flex cursor-default items-center gap-3 rounded-xl border border-white/10 bg-black px-4 py-2.5">
                  <Play
                    className="h-8 w-8 fill-current text-white"
                    aria-hidden
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                      Coming soon to
                    </span>
                    <span className="text-lg font-semibold leading-tight text-white">
                      Google Play
                    </span>
                  </div>
                </span>
              ) : null}
              {!appStoreUrl && !playStoreUrl ? (
                <p className="text-center text-xs text-zinc-500 sm:text-left">
                  Set{" "}
                  <code className="text-zinc-400">
                    NEXT_PUBLIC_APP_STORE_URL
                  </code>{" "}
                  and{" "}
                  <code className="text-zinc-400">
                    NEXT_PUBLIC_PLAY_STORE_URL
                  </code>{" "}
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
              Web trial length, browsers, privacy, mobile vs web, and what Beta
              means.
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
