import { useState, useMemo } from "react";
import { MediaCard } from "@/components/public/MediaCard";
import { FilterPanel } from "@/components/public/FilterPanel";
import { mediaLocations } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Grid, List, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Explore = () => {
  const [filters, setFilters] = useState({
    search: '',
    state: '',
    district: '',
    type: '',
    status: '',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredMedia = useMemo(() => {
    return mediaLocations.filter(media => {
      const matchesSearch = filters.search === '' ||
        media.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        media.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        media.city.toLowerCase().includes(filters.search.toLowerCase());

      const matchesState = !filters.state || filters.state === 'all' || media.state === filters.state;
      const matchesDistrict = !filters.district || filters.district === 'all' || media.district === filters.district;
      const matchesType = !filters.type || filters.type === 'all' || media.type === filters.type;
      const matchesStatus = !filters.status || filters.status === 'all' || media.status === filters.status;

      return matchesSearch && matchesState && matchesDistrict && matchesType && matchesStatus;
    });
  }, [filters]);

  return (
    <div className="pt-20 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="py-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Explore Media Locations</h1>
          <p className="text-muted-foreground">
            Discover {mediaLocations.length}+ advertising opportunities across India
          </p>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filter Panel */}
          <div className="hidden lg:block w-80 shrink-0">
            <FilterPanel filters={filters} setFilters={setFilters} />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{filteredMedia.length}</span> results
              </p>

              <div className="flex items-center gap-2">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <FilterPanel filters={filters} setFilters={setFilters} />
                  </SheetContent>
                </Sheet>

                {/* View Toggle */}
                <div className="flex items-center border border-border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            {filteredMedia.length > 0 ? (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "flex flex-col gap-4"
              }>
                {filteredMedia.map((media, i) => (
                  <div 
                    key={media.id} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <MediaCard media={media} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <X className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
                <Button variant="outline" onClick={() => setFilters({ search: '', state: '', district: '', type: '', status: '' })}>
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
