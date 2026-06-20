import type { Route } from "../../+types/root";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";
import {
  CheckCircle2,
  LayoutDashboard,
  Users,
  BarChart3,
  Zap,
  Shield,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskManager - Manage Your Projects with Ease" },
    { name: "description", content: "TaskManager helps teams organize work, track progress, and collaborate effectively." },
  ];
}

const features = [
  {
    icon: LayoutDashboard,
    title: "Workspace Management",
    description:
      "Create workspaces for different teams or projects. Keep everything organized in one place.",
  },
  {
    icon: CheckCircle2,
    title: "Task Tracking",
    description:
      "Create, assign, and track tasks with ease. Monitor progress from To Do to Done.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Invite team members, assign roles, and work together seamlessly.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Get insights into project progress, task completion rates, and team productivity.",
  },
  {
    icon: Zap,
    title: "Fast & Responsive",
    description:
      "Built with modern technology for a fast, smooth experience on any device.",
  },
  {
    icon: Shield,
    title: "Secure",
    description:
      "Your data is protected with secure authentication and authorization.",
  },
];

const Homepage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="size-6 text-primary" />
              <span className="text-xl font-bold">TaskManager</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/sign-up">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Manage Your Projects{" "}
            <span className="text-primary">with Ease</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            TaskManager helps teams organize work, track progress, and collaborate
            effectively. From simple tasks to complex projects, we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/sign-up">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link to="/sign-in">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features to help you and your team stay productive and organized.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-none bg-muted/50">
              <CardHeader>
                <feature.icon className="size-10 text-primary mb-4" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-primary text-primary-foreground rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of teams already using TaskManager to organize their work
            and boost productivity.
          </p>
          <Link to="/sign-up">
            <Button size="lg" variant="secondary">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="size-5 text-primary" />
              <span className="font-semibold">TaskManager</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TaskManager. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
