// src/components/public/MediaShowcase.tsx
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

import unipoleImg from "@/assets/media/unipole.jpg";
import ledScreenImg from "@/assets/media/led-screen.jpg";
import kioskImg from "@/assets/media/kiosk.jpg";
import hoardingImg from "@/assets/media/hoarding.jpg";
import gantryImg from "@/assets/media/gantry.jpg";
import busShelterImg from "@/assets/media/bus-shelter.jpg";

const mediaTypes = [
  {
    title: "Unipoles",
    filterValue: "Unipole",
    description: "Single-pole mounted billboards perfect for high-visibility locations along highways and main roads",
    image: unipoleImg,
    features: ["24/7 Visibility", "High Traffic Areas", "LED Illumination"],
  },
  {
    title: "Digital LEDs",
    filterValue: "Digital LED",
    description: "Dynamic digital displays that capture attention with vibrant, changeable content",
    image: ledScreenImg,
    features: ["Dynamic Content", "Multiple Ads", "Real-time Updates"],
  },
  {
    title: "Kiosks",
    filterValue: "Kiosk",
    description: "Street-level advertising panels strategically placed in pedestrian areas and retail zones",
    image: kioskImg,
    features: ["Eye-level Placement", "Urban Locations", "High Engagement"],
  },
  {
    title: "Hoardings",
    filterValue: "Hoarding",
    description: "Large-format billboards commanding attention on highways and busy intersections",
    image: hoardingImg,
    features: ["Maximum Impact", "Highway Visibility", "Brand Dominance"],
  },
  {
    title: "Gantries",
    filterValue: "Gantry",
    description: "Overhead structures spanning roadways for unavoidable brand exposure",
    image: gantryImg,
    features: ["Full Road Coverage", "Impossible to Miss", "Premium Locations"],
  },
  {
    title: "Bus Shelters",
    filterValue: "Bus Shelter",
    description: "Advertising panels integrated into transit shelters for daily commuter reach",
    image: busShelterImg,
    features: ["Commuter Reach", "Dwell Time", "Repeated Exposure"],
  },
];

export function MediaShowcase() {
  const navigate = useNavigate();

  const handleTypeClick = (type: string) => {
    // 1. Prepare the filter object
    const newFilters = {
      search: '',
      state: '',
      district: '',
      type: type,
      status: '',
    };
    
    // 2. Explicitly SAVE to sessionStorage so Explore.tsx picks it up on mount
    sessionStorage.setItem('explore-filters', JSON.stringify(newFilters));
    sessionStorage.setItem('explore-page', '1');
    
    // 3. Navigate with state as a backup trigger
    navigate('/explore', { state: { filterType: type } });
  };

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-peacock/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-slide-up">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider mb-2 block">
            Our Media Portfolio
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
            Diverse <span className="gradient-text">Advertising Solutions</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From traditional hoardings to cutting-edge digital LEDs, we offer a complete range of outdoor advertising media to maximize your brand's visibility
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mediaTypes.map((media, index) => (
            <div
              key={media.title}
              className="group relative rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/50 transition-all duration-500 hover-lift animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={media.image}
                  alt={media.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-2xl font-bold font-display text-white drop-shadow-md tracking-tight">
                    {media.title}
                  </h3>
                </div>
              </div>

              <div className="p-6">
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {media.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {media.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <Button 
                  className="w-full justify-between group/btn shadow-sm hover:shadow-md transition-all active:scale-95"
                  onClick={() => handleTypeClick(media.filterValue)}
                >
                  <span>View {media.title}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 animate-slide-up delay-500">
          <Button 
            size="lg" 
            variant="hero" 
            onClick={() => {
              sessionStorage.removeItem('explore-filters');
              navigate('/explore', { state: null });
            }}
          >
            Explore All Media Locations
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}