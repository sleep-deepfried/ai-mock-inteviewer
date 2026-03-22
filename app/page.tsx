import Link from "next/link";
import { Mic, Brain, FileText, Clock } from "lucide-react";

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

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">
          AI Mock Interviewer
        </span>
        <div className="flex gap-4">
          <Link
            href="/interview/setup"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition hover:text-white"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition hover:text-white"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          Ace Your Next Interview with{" "}
          <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            AI-Powered Practice
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-gray-400">
          Practice mock interviews with a realistic AI interviewer. Get
          real-time voice feedback, resume-tailored questions, and build
          confidence before the real thing.
        </p>
        <Link
          href="/interview/setup"
          className="mt-8 inline-flex items-center rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition hover:bg-purple-500"
        >
          Get Started
        </Link>
      </section>

      {/* Feature Grid */}
      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
          >
            <f.icon className="mb-4 h-8 w-8 text-purple-400" />
            <h3 className="text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-gray-400">{f.description}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} AI Mock Interviewer. All rights
        reserved.
      </footer>
    </main>
  );
}
