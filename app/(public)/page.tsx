import Link from 'next/link';
import { ArrowRight, Kanban, ShieldCheck, Timer, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicLeadForm } from '@/components/features/public/lead-form';

const STAGES = ['New', 'Contacted', 'Qualified', 'Won'];

const FEATURES = [
  {
    icon: Kanban,
    title: 'Pipeline that moves with your team',
    body: 'Drag leads across a live Kanban board. Every status change writes itself to the activity trail — nobody has to remember to log it.',
  },
  {
    icon: Users2,
    title: 'Assignment your reps can trust',
    body: 'Route new leads to the right rep in one click, with full assignment history so ownership is never ambiguous.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access, enforced everywhere',
    body: 'Admins see the whole pipeline. Members see only what they own. The same permission model runs in the UI, the API, and the database layer.',
  },
  {
    icon: Timer,
    title: 'Built for the follow-up window',
    body: 'Search, filter, and sort thousands of leads in milliseconds so the next call happens before the window closes.',
  },
];

export default function LandingPage() {
  return (
    <div className="bg-canvas dark:bg-background">
      <SiteHeader />
      <Hero />
      <Features />
      <CTA />
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          Lead<span className="text-signal-copper">Flow</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-signal-copper">
            Lead management, built for follow-through
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Every lead, tracked from first click to closed deal.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            LeadFlow gives your sales team one shared pipeline — capture, assignment, notes, and a full
            audit trail — so nothing slips through a spreadsheet again.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#lead-form">Talk to sales</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            One lead, moving through the pipeline
          </p>
          <div className="flex items-center gap-2 overflow-x-auto">
            {STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-2">
                <div
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${
                    i === STAGES.length - 1
                      ? 'border-signal-teal/40 bg-signal-teal/10 text-signal-teal'
                      : 'border-border bg-secondary'
                  }`}
                >
                  {stage}
                </div>
                {i < STAGES.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3 border-t border-border pt-4 text-sm">
            <ActivityRow text="Lead created via public website form" time="9:02 AM" />
            <ActivityRow text="Assigned to Priya Shah" time="9:04 AM" />
            <ActivityRow text="Status changed to Qualified" time="11:20 AM" />
            <ActivityRow text="Status changed to Won" time="2:45 PM" accent />
          </div>
        </div>
      </div>
    </section>
  );
}

function ActivityRow({ text, time, accent }: { text: string; time: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${accent ? 'bg-signal-teal' : 'bg-muted-foreground'}`} />
        <span>{text}</span>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
    </div>
  );
}

function Features() {
  return (
    <section className="border-y border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Everything the pipeline needs</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          No bolt-on plugins, no spreadsheets on the side — the whole lead lifecycle lives in one place.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-border bg-card p-6">
              <feature.icon className="h-6 w-6 text-signal-copper" />
              <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="lead-form" className="mx-auto max-w-3xl px-6 py-20">
      <div className="text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Talk to sales</h2>
        <p className="mt-3 text-muted-foreground">
          Tell us about your team and we&apos;ll get back to you within one business day.
        </p>
      </div>
      <div className="mt-10 rounded-lg border border-border bg-card p-8 shadow-sm">
        <PublicLeadForm />
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} LeadFlow. All rights reserved.</p>
        <p>
          Built for{' '}
          <a
            href="https://digitalheroesco.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-4 hover:text-signal-copper"
          >
            Digital Heroes Training Task
          </a>
        </p>
      </div>
    </footer>
  );
}
