import { HeroSection } from "@/components/public/HeroSection";
import { AboutSection } from "@/components/public/AboutSection";
import { MediaCard } from "@/components/public/MediaCard";
import { Button } from "@/components/ui/button";
import { mediaLocations } from "@/lib/data";
import { ArrowRight, Building2, CheckCircle, Target, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const featuredMedia = mediaLocations.slice(0, 6);

  return (
    <>
      <HeroSection />

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
              Why Choose <span className="gradient-text">Shree Radhe Advertisers</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Transform your outdoor advertising strategy with our comprehensive platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Target, title: 'Strategic Locations', desc: 'Prime spots in high-traffic areas across major cities' },
              { icon: TrendingUp, title: 'Data-Driven', desc: 'Analytics and insights for informed decisions' },
              { icon: CheckCircle, title: 'Easy Booking', desc: 'Streamlined process from inquiry to activation' },
              { icon: Building2, title: 'Diverse Media', desc: 'Unipoles, hoardings, LEDs, and more' },
            ].map((feature, i) => (
              <div 
                key={i} 
                className="glass-card rounded-xl p-6 hover-lift animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Media Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">Featured Locations</h2>
              <p className="text-muted-foreground">Discover premium advertising spots across India</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/explore')}>
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredMedia.map((media, i) => (
              <div key={media.id} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <MediaCard media={media} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <AboutSection />

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 font-display">
            Ready to Amplify Your Brand?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Get started with Shree Radhe Advertisers today and unlock the power of strategic outdoor advertising
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" variant="hero" onClick={() => navigate('/contact')}>
              Get Started Today
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button size="xl" variant="outline" onClick={() => navigate('/explore')}>
              Explore Locations
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;