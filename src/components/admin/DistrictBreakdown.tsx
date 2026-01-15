/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, Fragment, useMemo } from "react";
import { useNavigate } from "react-router-dom"; //
import { useMedia } from "@/hooks/api/useMedia";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight, MapPin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function DistrictBreakdown() {
  const navigate = useNavigate(); //
  const [selectedState, setSelectedState] = useState<string>('all');
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);

  const { data: mediaRes, isLoading } = useMedia({ limit: 2000 } as any);
  const mediaLocations = useMemo(() => mediaRes?.data || [], [mediaRes]);

  const { statesList, filteredStats } = useMemo(() => {
    const statesSet = new Set<string>();
    const statsMap = new Map<string, any>();

    mediaLocations.forEach((m: any) => {
      if (m.state) statesSet.add(m.state);
      
      const stateName = m.state || 'Unknown';
      const districtName = m.district || 'Unknown';
      const key = `${stateName}-${districtName}`;
      
      if (!statsMap.has(key)) {
        statsMap.set(key, { 
          district: districtName, 
          state: stateName, 
          total: 0, 
          available: 0, 
          booked: 0, 
          locations: [] 
        });
      }
      
      const s = statsMap.get(key);
      s.total++;
      if (m.status === 'Available') s.available++;
      else if (m.status === 'Booked') s.booked++;
      
      s.locations.push(m);
    });

    const allStats = Array.from(statsMap.values()).sort((a, b) => a.district.localeCompare(b.district));
    const filtered = selectedState === 'all' 
      ? allStats 
      : allStats.filter(s => s.state === selectedState);

    return { 
      statesList: Array.from(statesSet).sort(), 
      filteredStats: filtered 
    };
  }, [mediaLocations, selectedState]);

  if (isLoading) {
    return (
      <Card className="p-6 bg-card border-border/50">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">District-wise Breakdown</h3>
          <p className="text-sm text-muted-foreground">Click a district to see locations, then click a location to view details</p>
        </div>
        <Select value={selectedState} onValueChange={setSelectedState}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {statesList.map(state => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-8"></TableHead>
              <TableHead>District</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Available</TableHead>
              <TableHead className="text-center">Booked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No media locations found for the selected criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredStats.map((stat) => {
                const districtKey = `${stat.state}-${stat.district}`;
                const isExpanded = expandedDistrict === districtKey;

                return (
                  <Fragment key={districtKey}>
                    <TableRow 
                      className={cn(
                        "cursor-pointer hover:bg-muted/30 transition-colors",
                        isExpanded && "bg-muted/30 font-semibold"
                      )}
                      onClick={() => setExpandedDistrict(isExpanded ? null : districtKey)}
                    >
                      <TableCell>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="font-medium">{stat.district}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{stat.state}</TableCell>
                      <TableCell className="text-center">{stat.total}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="success" className="min-w-[2rem] justify-center">{stat.available}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="destructive" className="min-w-[2rem] justify-center">{stat.booked}</Badge>
                      </TableCell>
                    </TableRow>
                    
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/5 p-0">
                          <div className="p-4 space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                               <MapPin className="h-3 w-3" /> List of Assets in {stat.district}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2">
                              {stat.locations.map((loc: any) => (
                                <div 
                                  key={loc._id || loc.id} 
                                  // UPDATED: Added cursor-pointer, hover effect, and onClick navigation
                                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50 hover:border-primary/60 hover:bg-primary/5 cursor-pointer transition-all shadow-sm group"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent toggling the district row
                                    navigate(`/admin/media/${loc._id || loc.id}`); //
                                  }}
                                >
                                  <div className="min-w-0 pr-2">
                                    <div className="text-sm font-medium truncate leading-none mb-1 group-hover:text-primary transition-colors flex items-center gap-1.5">
                                      {loc.name}
                                      <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50" />
                                    </div>
                                    <div className="text-[10px] text-muted-foreground truncate">{loc.address || loc.landmark || loc.city}</div>
                                  </div>
                                  <Badge 
                                    variant={loc.status === 'Available' ? 'success' : 'destructive'}
                                    className="text-[9px] uppercase font-bold tracking-tighter px-1.5 h-5 flex-shrink-0"
                                  >
                                    {loc.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}