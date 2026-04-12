import type { Metadata } from "next";
import Link from "next/link";
import { LegalDraftDisclaimer } from "@/components/legal-draft-disclaimer";

export const metadata: Metadata = {
  title: "Privacy Policy — Vocis",
  description:
    "How Vocis handles data for the web trial and related services.",
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
              practice. This policy describes how we handle information when you
              use the <strong>public website trial</strong> (approximately 30
              seconds of voice interaction in the browser, without creating an
              account through the site) and how that compares to account-based use
              elsewhere (e.g. our mobile apps), where applicable.
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
                interview; we do not use the web trial to build a long-term
                marketing profile from your voice on the server for that flow.
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
              Mobile app and accounts
            </h2>
            <p>
              If you use the Vocis mobile application or other signed-in
              experiences, additional data (such as account identifiers, session
              history, or scorecards) may be stored according to that
              product&apos;s flows and your authentication provider (e.g. Supabase).
              This page focuses on the web trial; in-app notices or a separate
              in-product policy may apply there.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Third parties</h2>
            <p>
              We use <strong>Google</strong> (Gemini / AI services) to power
              interview dialogue and related features. Google&apos;s terms and
              privacy policy also apply to their processing. We use industry
              standard transport (HTTPS) between your browser and our API.
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
