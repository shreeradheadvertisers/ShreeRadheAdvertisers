import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, MapPin, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "@/lib/data";

export function HeroSection() {
  const navigate = useNavigate();
  const stats = getDashboardStats();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-peacock/15 rounded-full blur-3xl animate-float delay-300" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMxLjIgMCAyIC44IDIgMnMtLjggMi0yIDItMi0uOC0yLTIgLjgtMiAyLTJ6IiBmaWxsPSJjdXJyZW50Q29sb3IiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-50" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-slide-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium text-primary">Shree Radhe Advertisers - Premium OOH Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up delay-100 font-display">
            Transform Your Brand With
            <span className="block gradient-text mt-2">Strategic OOH Advertising</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up delay-200">
            Access premium billboard, unipole, and digital LED locations across major cities. 
            Data-driven outdoor advertising that delivers measurable results.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up delay-300">
            <Button size="xl" variant="hero" onClick={() => navigate('/explore')}>
              Explore Media Locations
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button size="xl" variant="outline" onClick={() => navigate('/contact')}>
              Get a Quote
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto animate-slide-up delay-400">
            <div className="glass-card rounded-xl p-6 hover-lift">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.total}+</div>
              <div className="text-sm text-muted-foreground">Media Locations</div>
            </div>

            <div className="glass-card rounded-xl p-6 hover-lift">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-success/10">
                  <Building2 className="h-5 w-5 text-success" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.districtsCount}+</div>
              <div className="text-sm text-muted-foreground">Districts Covered</div>
            </div>

            <div className="glass-card rounded-xl p-6 hover-lift">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-peacock/10">
                  <Tv className="h-5 w-5 text-peacock" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">6</div>
              <div className="text-sm text-muted-foreground">Media Types</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}