/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from "react";
import { MediaCard } from "@/components/public/MediaCard";
import { FilterPanel } from "@/components/public/FilterPanel";
import { mediaLocations } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input"; //
import { Grid, List, SlidersHorizontal, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { usePublicMedia } from "@/hooks/api/useMedia";
import { isBackendConfigured } from "@/lib/api/config";
import { adaptMediaLocation } from "@/lib/services/dataService";

const Explore = () => {
  // 1. Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpPage, setJumpPage] = useState(""); // State for the "Go to" input box
  const itemsPerPage = 12;

  const [filters, setFilters] = useState({
    search: '',
    state: '',
    district: '',
    type: '',
    status: '',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 2. Reset to page 1 whenever any filter or search term changes
  useEffect(() => {
    setCurrentPage(1);
    setJumpPage("1");
  }, [filters]);

  // Sync jumpPage input with currentPage changes
  useEffect(() => {
    setJumpPage(currentPage.toString());
  }, [currentPage]);

  // 3. Fetch from MongoDB with pagination parameters
  const { data: apiData, isLoading, isFetching } = usePublicMedia({
    state: filters.state || undefined,
    district: filters.district || undefined,
    type: filters.type as any || undefined,
    status: filters.status as any || undefined,
    search: filters.search || undefined,
    page: currentPage,
    limit: itemsPerPage,
  });

  const filteredMedia = useMemo(() => {
    if (isBackendConfigured() && apiData?.data) {
      return apiData.data.map(m => {
        const adapted = adaptMediaLocation(m);
        return {
          ...adapted,
          image: m.imageUrl || (m as any).image || adapted.image,
          imageUrl: m.imageUrl || (m as any).image,
          _id: (m as any)._id, 
          id: adapted.id || (m as any).id 
        };
      });
    }
    return [];
  }, [apiData]);

  const totalCount = apiData?.pagination?.total ?? mediaLocations.length;
  const totalPages = apiData?.pagination?.totalPages ?? Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPage);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      handlePageChange(pageNum);
    } else {
      // Reset input to current page if invalid
      setJumpPage(currentPage.toString());
    }
  };

  return (
    <div className="pt-20 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="py-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 font-display">Explore Media Locations</h1>
            <p className="text-muted-foreground">
              Discover <span className="text-foreground font-semibold">{totalCount}</span> advertising opportunities across India
            </p>
          </div>
          {isFetching && !isLoading && (
            <div className="flex items-center text-sm text-primary animate-pulse mb-1">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating results...
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Desktop Filter Panel */}
          <div className="hidden lg:block w-80 shrink-0">
            <FilterPanel filters={filters} setFilters={setFilters} />
          </div>

          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <p className="text-sm text-muted-foreground">
                Showing page <span className="font-medium text-foreground">{currentPage}</span> of {totalPages}
              </p>

              <div className="flex items-center gap-2">
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

                <div className="flex items-center border border-border rounded-lg p-1 bg-muted/30">
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

            {/* Content States */}
            {isLoading ? (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-80 w-full rounded-xl" />)}
              </div>
            ) : filteredMedia.length > 0 ? (
              <>
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                  {filteredMedia.map((media, i) => (
                    <div 
                      key={(media as any)._id || media.id} 
                      className="animate-fade-in" 
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <MediaCard media={media as any} />
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col items-center justify-center mt-12 mb-8 gap-6 border-t pt-8">
                    <div className="flex flex-wrap items-center justify-center gap-4">
                      {/* Existing Prev/Next Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="w-28"
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Previous
                        </Button>
                        
                        <div className="flex items-center justify-center min-w-[100px]">
                          <span className="text-sm font-medium">
                            {currentPage} / {totalPages}
                          </span>
                        </div>

                        <Button
                          variant="outline"
                          className="w-28"
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>

                      {/* New Jump to Page Box */}
                      <form onSubmit={handleJumpToPage} className="flex items-center gap-2 border-l pl-4">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">Go to:</span>
                        <Input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={jumpPage}
                          onChange={(e) => setJumpPage(e.target.value)}
                          className="w-16 h-9 text-center"
                        />
                        <Button type="submit" size="sm" variant="ghost" className="h-9 px-3">
                          Go
                        </Button>
                      </form>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} billboards
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-muted/10 rounded-2xl border-2 border-dashed">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <X className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-6 max-w-xs mx-auto">Try adjusting your filters or search terms to find what you're looking for</p>
                <Button 
                  variant="default" 
                  onClick={() => setFilters({ search: '', state: '', district: '', type: '', status: '' })}
                >
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