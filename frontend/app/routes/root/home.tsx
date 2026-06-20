import type { Route } from "../../+types/root";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import {
  LayoutDashboard,
  CheckCircle2,
  Users,
  BarChart3,
  UserPlus,
  Mail,
  Zap,
  CheckSquare,
  TrendingUp,
  CreditCard,
  BadgeCheck,
  RefreshCcw,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskManager - Get More Done" },
    {
      name: "description",
      content:
        "The modern task management platform that helps teams organize, track, and complete work efficiently.",
    },
  ];
}

const features = [
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Work together seamlessly with your team in shared workspaces with real-time updates.",
  },
  {
    icon: CheckSquare,
    title: "Task Management",
    description:
      "Organize tasks with priorities, due dates, comments, and track progress visually.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description:
      "Visualize project progress with beautiful charts and get insights into team productivity.",
  },
];

const steps = [
  {
    icon: UserPlus,
    title: "Create an account",
    description:
      "Sign up for free and set up your first workspace in seconds.",
  },
  {
    icon: Users,
    title: "Invite your team",
    description:
      "Add your team members and start collaborating right away.",
  },
  {
    icon: Zap,
    title: "Get things done",
    description:
      "Create projects, assign tasks, and track progress in real-time.",
  },
];

const footerLinks = {
  Product: ["Features", "Pricing", "Use Cases", "Roadmap"],
  Company: ["About", "Careers", "Blog", "Contact"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
};

export default function Homepage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <LayoutDashboard className="size-6 text-primary" />
              <span className="text-xl font-bold">TaskManager</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/sign-in">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/sign-up">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Get more done with{" "}
              <span className="text-primary">TaskManager</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              The modern task management platform that helps teams organize,
              track, and complete work efficiently.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/sign-up">
                <Button size="lg" className="w-full sm:w-auto">
                  Try for Free
                </Button>
              </Link>
              <a href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  See Features
                </Button>
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-primary" />
                No credit card required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="size-4 text-primary" />
                Free plan available
              </span>
              <span className="inline-flex items-center gap-1.5">
                <RefreshCcw className="size-4 text-primary" />
                Cancel anytime
              </span>
            </div>
          </div>

          {/* Right - Dashboard Mockup */}
          <div className="relative hidden lg:block">
            <div className="rounded-xl border bg-card shadow-2xl p-5">
              {/* Mock Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="h-8 w-8 rounded-full bg-muted" />
                </div>
              </div>
              {/* Mock Stats Row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg border bg-background p-3"
                  >
                    <div className="h-3 w-16 rounded bg-muted mb-2" />
                    <div className="h-6 w-10 rounded bg-primary/20" />
                  </div>
                ))}
              </div>
              {/* Mock Chart Area */}
              <div className="rounded-lg border bg-background p-4">
                <div className="h-3 w-24 rounded bg-muted mb-4" />
                <div className="flex items-end gap-2 h-32">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-primary/80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              {/* Mock Task List */}
              <div className="mt-4 rounded-lg border bg-background p-4">
                <div className="h-3 w-28 rounded bg-muted mb-3" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded border" />
                      <div className="h-3 w-full rounded bg-muted" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground mb-4">
              Our Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Everything you need to manage tasks effectively
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our powerful features help teams stay organized and deliver
              projects on time.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col items-center text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <feature.icon className="size-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground mb-4">
              How It Works
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Simple process, powerful results
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started in minutes and see improved team productivity.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div
                key={step.title}
                className="flex flex-col items-center text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="size-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Ready to boost your team's productivity?
          </h2>
          <p className="mt-4 text-lg opacity-90 max-w-xl mx-auto">
            Join thousands of teams that use TaskManager to get more done,
            together.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/sign-up">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link to="/sign-in">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2">
                <LayoutDashboard className="size-5 text-primary" />
                <span className="font-bold text-lg">TaskManager</span>
              </Link>
              <p className="mt-3 text-sm text-muted-foreground max-w-xs">
                Simplify task management and team collaboration.
              </p>
            </div>

            {/* Links */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold">{category}</h4>
                <ul className="mt-4 space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                        {link}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TaskManager. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {/* Social icons as simple inline SVGs */}
              <a
                href="#"
                aria-label="Facebook"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  className="size-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  className="size-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  className="size-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
