import type { Metadata } from "next";
import Link from "next/link";

const SUPPORT_URL = "https://vocis.tutorialsdojo.com/support";

export const metadata: Metadata = {
  title: "Support — Vocis",
  description:
    "Get help with the Vocis web trial, mobile apps, accounts, and common questions.",
  alternates: {
    canonical: SUPPORT_URL,
  },
  openGraph: {
    title: "Support — Vocis",
    description:
      "Get help with the Vocis web trial, mobile apps, accounts, and common questions.",
    url: SUPPORT_URL,
    type: "website",
  },
};

export default function SupportPage() {
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
          Support
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Official page:{" "}
          <a
            href={SUPPORT_URL}
            className="text-violet-400 underline decoration-violet-400/40 underline-offset-2 hover:text-violet-300"
          >
            {SUPPORT_URL}
          </a>
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Quick answers</h2>
            <p>
              Many questions about the browser trial, supported browsers, Beta,
              and how web compares to the mobile apps are covered in the{" "}
              <Link
                href="/#faq-heading"
                className="font-medium text-violet-400 hover:text-violet-300"
              >
                FAQ on the home page
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Policies</h2>
            <p>
              For how we handle data and the rules for using Vocis, see the{" "}
              <Link
                href="/privacy-policy"
                className="font-medium text-violet-400 hover:text-violet-300"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/terms"
                className="font-medium text-violet-400 hover:text-violet-300"
              >
                Terms of Service
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p>
              Vocis is offered by Earl John Pulido in collaboration with{" "}
              <a
                href="https://tutorialsdojo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-violet-400 hover:text-violet-300"
              >
                Tutorials Dojo
              </a>
              . For product support or partnership questions not answered above,
              reach out through the channels listed on the Tutorials Dojo website.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
