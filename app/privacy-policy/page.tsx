import type { Metadata } from "next";
import Link from "next/link";
import { LegalDraftDisclaimer } from "@/components/legal-draft-disclaimer";

export const metadata: Metadata = {
  title: "Privacy Policy — Vocis",
  description:
    "How Vocis handles data for the web trial, signed-in web use, and mobile apps.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh bg-[#050508] px-4 py-10 text-zinc-300 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-medium text-violet-400 hover:text-violet-300"
        >
          ← Home
        </Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-white">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: April 12, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Overview</h2>
            <p>
              Vocis (&quot;we,&quot; &quot;us&quot;) provides voice-based interview
              practice. This policy covers the <strong>anonymous website trial</strong>
              (a short browser preview without signing in on the site),{" "}
              <strong>signed-in use of the Vocis website</strong> (where we offer
              accounts and save history in our database), and{" "}
              <strong>mobile apps</strong> (including the local-first iOS
              experience described below). Product-specific details may also appear
              in-app.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              Web trial (no account)
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Role text</strong> you enter (job title or description) is
                sent to our servers to configure the session and may be included in
                prompts to <strong>Google Gemini</strong> (Live API) for real-time
                voice dialogue.
              </li>
              <li>
                <strong>Voice audio</strong> is processed in real time for the
                interview. We do not use the web trial to build a long-term
                advertising profile from your voice for that flow.
              </li>
              <li>
                Session context is held in <strong>server memory</strong> for a
                limited time (on the order of tens of minutes) to run the session,
                then discarded. We do not require you to sign in on the website for
                the trial.
              </li>
              <li>
                <strong>Resume upload</strong> is not offered on the anonymous web
                trial.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              Signed-in website (account)
            </h2>
            <p>
              Where the Vocis website supports sign-in, we may store{" "}
              <strong>account identifiers</strong>,{" "}
              <strong>session history</strong>, and <strong>scorecards</strong> in our
              systems (for example via{" "}
              <strong>Supabase</strong>) so you can return to past interviews. That
              processing is tied to your authenticated session. See your account
              settings and cookie notices on the site for related controls.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              Mobile app (e.g. iOS)
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>History and scores on your device:</strong> In the current
                Vocis mobile app, completed interview summaries and scores are
                stored <strong>on the device</strong> (for example using Apple&apos;s
                on-device database features). They are not uploaded to Vocis for
                long-term cloud storage in that configuration. If you delete the app
                or erase the device without a backup, that local data may be lost.
              </li>
              <li>
                <strong>What still goes to our servers:</strong> To run voice
                interviews and generate feedback, the app contacts Vocis APIs. We
                process <strong>session identifiers</strong>,{" "}
                <strong>job role</strong>, optional <strong>job description</strong>,
                optional <strong>resume text</strong> (extracted from files on the
                device before upload), <strong>transcripts</strong>, and{" "}
                <strong>session metadata</strong> (such as duration) as needed to
                configure the AI and produce scores. Voice audio is handled in real
                time through our infrastructure and <strong>Google Gemini</strong>{" "}
                services.
              </li>
              <li>
                <strong>Abuse prevention:</strong> The app may send a{" "}
                <strong>stable device identifier</strong> and use app-embedded
                credentials so our servers can apply rate limits and protect the
                service. These values are not used to sell personal data.
              </li>
              <li>
                <strong>No website account required:</strong> The mobile build
                aligned with this policy does not require you to create a Vocis
                website account to practice; your progress stays on-device unless we
                ship a future signed-in or sync feature and tell you otherwise.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Third parties</h2>
            <p>
              We use <strong>Google</strong> (Gemini and related AI services) to
              power interview dialogue, live voice sessions, and scored feedback.
              Google&apos;s terms and privacy policy also apply to their processing.
              We use industry-standard transport (HTTPS/TLS) between your browser
              or app and our APIs.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Children</h2>
            <p>
              Vocis is not directed at children under 13 (or the minimum age in
              your jurisdiction). Do not use the service if you are not old enough
              to consent to data processing where you live.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p>
              For privacy questions, contact the operator of this site (see
              footer on the home page) or your organization&apos;s administrator
              if Vocis is offered through an enterprise.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Changes</h2>
            <p>
              We may update this policy from time to time. The &quot;Last
              updated&quot; date reflects the latest revision.
            </p>
          </section>
        </div>

        <LegalDraftDisclaimer />
      </div>
    </main>
  );
}
