/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { mediaLocations, mediaTypes } from "@/lib/data";
import { CalendarDays, Search, Filter, Loader2, Info, MapPin, PlusCircle, ChevronsUpDown, Check } from "lucide-react";
import { useBookings } from "@/hooks/api/useBookings";
import { useMedia, useMediaById } from "@/hooks/api/useMedia";
import { isWithinInterval, parseISO, startOfDay } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Availability = () => {
  const navigate = useNavigate();
  const [selectedMedia, setSelectedMedia] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  
  // Filter States
  const [typeFilter, setTypeFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');

  // Fetch Media Data
  const { data: mediaData, isLoading: isLoadingList } = useMedia({ 
    limit: 1000 
  });

  const sourceMedia = useMemo(() => {
    return mediaData?.data && mediaData.data.length > 0 ? mediaData.data : mediaLocations;
  }, [mediaData]);

  // --- DYNAMIC FILTER OPTIONS ---
  const uniqueStates = useMemo(() => {
    const states = sourceMedia.map(m => m.state).filter(Boolean);
    return ['All', ...new Set(states)].sort();
  }, [sourceMedia]);

  const uniqueDistricts = useMemo(() => {
    const relevantMedia = stateFilter === 'All' 
      ? sourceMedia 
      : sourceMedia.filter(m => m.state === stateFilter);
    const districts = relevantMedia.map(m => (m as any).district).filter(Boolean);
    return ['All', ...new Set(districts)].sort();
  }, [sourceMedia, stateFilter]);

  const uniqueCities = useMemo(() => {
    let relevantMedia = stateFilter === 'All' 
      ? sourceMedia 
      : sourceMedia.filter(m => m.state === stateFilter);
    if (districtFilter !== 'All') {
      relevantMedia = relevantMedia.filter(m => (m as any).district === districtFilter);
    }
    const cities = relevantMedia.map(m => m.city).filter(Boolean);
    return ['All', ...new Set(cities)].sort();
  }, [sourceMedia, stateFilter, districtFilter]);

  // --- MAIN FILTERING LOGIC ---
  const filteredMedia = useMemo(() => {
    if (!sourceMedia) return [];
    
    return sourceMedia.filter(media => {
      const matchesType = typeFilter === 'All' || media.type === typeFilter;
      const matchesState = stateFilter === 'All' || media.state === stateFilter;
      const matchesDistrict = districtFilter === 'All' || (media as any).district === districtFilter;
      const matchesCity = cityFilter === 'All' || media.city === cityFilter;
      return matchesType && matchesState && matchesDistrict && matchesCity;
    });
  }, [sourceMedia, typeFilter, stateFilter, districtFilter, cityFilter]);

  // Fetch Details & Bookings
  const { data: selectedMediaDetails } = useMediaById(selectedMedia);
  const { data: bookingsData, isLoading: isLoadingBookings } = useBookings({ 
    mediaId: selectedMedia,
    limit: 100 
  });

  const currentMedia = selectedMediaDetails || sourceMedia.find(m => m.id === selectedMedia);

  const bookedDays = useMemo(() => {
    if (!bookingsData?.data) return [];
    return bookingsData.data.map(booking => ({
      from: startOfDay(parseISO(booking.startDate)),
      to: startOfDay(parseISO(booking.endDate))
    }));
  }, [bookingsData]);

  // --- REDIRECT HANDLER ---
  const handleCreateBooking = () => {
    if (!selectedMedia || !selectedDates || selectedDates.length === 0) {
      toast.error("Please select a media location and dates first.");
      return;
    }

    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    const startDate = sortedDates[0].toISOString();
    const endDate = sortedDates[sortedDates.length - 1].toISOString();

    // Navigate to the correct Bookings route with State
    navigate('/admin/bookings', { 
      state: { 
        openCreateDialog: true, 
        prefill: {
          mediaId: selectedMedia,
          startDate: startDate,
          endDate: endDate
        }
      } 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Availability Management</h1>
        <p className="text-muted-foreground">Check availability and create new bookings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: FILTERS & SELECTION */}
        <Card className="p-6 bg-card border-border/50 h-fit">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" /> Find Media
          </h3>
          
          <div className="space-y-4 mb-6">
            
            {/* LOCATION FILTERS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">State</Label>
                <Select 
                  value={stateFilter} 
                  onValueChange={(val) => { setStateFilter(val); setDistrictFilter('All'); setCityFilter('All'); }}
                >
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    {uniqueStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">District</Label>
                <Select 
                  value={districtFilter} 
                  onValueChange={(val) => { setDistrictFilter(val); setCityFilter('All'); }}
                >
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    {uniqueDistricts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">City</Label>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    {uniqueCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* CATEGORY */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  {mediaTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* SEARCHABLE COMBOBOX */}
            <div className="space-y-2 pt-4 border-t border-border/50">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Select Location</Label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between pl-3 text-left font-normal"
                    disabled={isLoadingList}
                  >
                    {selectedMedia && currentMedia ? (
                      <span className="truncate">{currentMedia.name}</span>
                    ) : (
                      <span className="text-muted-foreground">
                        {isLoadingList ? "Loading..." : filteredMedia.length === 0 ? "No matches found" : "Search name, city or ID..."}
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Type to search..." />
                    <CommandList>
                      <CommandEmpty>No media found.</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-auto">
                        {filteredMedia.map((media) => (
                          <CommandItem
                            key={media.id}
                            value={`${media.name} ${media.city} ${media.id}`}
                            onSelect={() => { setSelectedMedia(media.id); setOpenCombobox(false); }}
                            className="group cursor-pointer aria-selected:bg-primary aria-selected:text-primary-foreground"
                          >
                            <Check className={cn("mr-2 h-4 w-4 shrink-0", selectedMedia === media.id ? "opacity-100" : "opacity-0", "group-aria-selected:text-primary-foreground")} />
                            <div className="flex flex-col w-full overflow-hidden">
                              <span className="font-medium truncate group-aria-selected:text-primary-foreground">{media.name}</span>
                              <div className={cn("flex items-center text-xs gap-1", "text-muted-foreground group-aria-selected:text-primary-foreground/80")}>
                                <span className="truncate max-w-[120px]">{media.city}</span>
                                <span>•</span>
                                <span className="font-mono text-[10px] opacity-70 group-aria-selected:opacity-100">{media.id}</span>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="flex justify-between px-1">
                <span className="text-[10px] text-muted-foreground">{filteredMedia.length} locations available</span>
              </div>
            </div>
          </div>

          {/* PREVIEW */}
          {currentMedia && (
            <div className="mt-6 p-4 rounded-lg bg-muted/50 animate-fade-in border border-border/50">
                <div className="space-y-2 text-sm">
                  <div className="font-bold text-foreground text-base">{currentMedia.name}</div>
                  <div className="text-muted-foreground text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {currentMedia.city}, {currentMedia.state}
                  </div>
                  <div className="pt-2 flex justify-between items-center border-t border-border/50 mt-2">
                      <Badge variant="outline" className="bg-background">{currentMedia.type}</Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {currentMedia.pricePerMonth ? `₹${currentMedia.pricePerMonth.toLocaleString()}/mo` : 'Price on Request'}
                      </span>
                  </div>
                </div>
            </div>
          )}

          {/* LEGEND */}
          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-muted-foreground">Calendar Legend</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-md bg-emerald-600 text-white flex items-center justify-center font-medium shadow-sm">12</div>
                <span className="text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-md bg-red-700 text-white flex items-center justify-center font-medium shadow-sm">14</div>
                <span className="text-muted-foreground">Booked</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-medium shadow-sm">15</div>
                <span className="text-muted-foreground">Selected</span>
              </div>
            </div>
          </div>
        </Card>

        {/* RIGHT COLUMN: CALENDAR */}
        <Card className="lg:col-span-2 p-6 bg-card border-border/50 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Select Dates & Book
              {isLoadingBookings && <Loader2 className="h-4 w-4 animate-spin ml-2 text-muted-foreground" />}
            </h3>
            {selectedDates && selectedDates.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedDates([])} className="h-8 text-xs">Clear Selection</Button>
            )}
          </div>

          <div className="flex justify-center border rounded-xl p-6 bg-white shadow-sm flex-grow">
            {selectedMedia ? (
                <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={setSelectedDates}
                numberOfMonths={2}
                showOutsideDays={true}
                fixedWeeks={false}
                modifiers={{ booked: (date) => bookedDays.some(range => isWithinInterval(startOfDay(date), { start: range.from, end: range.to })) }}
                modifiersStyles={{ booked: { backgroundColor: '#b91c1c', color: 'white', textDecoration: 'line-through', fontWeight: '600', opacity: 0.9, border: '1px solid #991b1b' } }}
                classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    nav: "space-x-1 flex items-center",
                    head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
                    cell: "h-10 w-10 text-center p-1 relative focus-within:relative focus-within:z-20",
                    day: "h-full w-full p-0 font-normal aria-selected:opacity-100 bg-emerald-600 text-white hover:bg-emerald-700 rounded-md transition-all shadow-sm",
                    day_selected: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !border-primary",
                    day_today: "ring-2 ring-primary ring-offset-2 font-bold",
                    day_outside: "text-muted-foreground opacity-30 bg-transparent hover:bg-transparent border-none",
                }}
                />
            ) : (
                <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-center">
                    <Info className="h-10 w-10 mb-4 opacity-20" />
                    <p>Select a location from the left<br/>to check availability.</p>
                </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-border flex justify-end">
            <Button size="lg" className="w-full sm:w-auto shadow-lg" onClick={handleCreateBooking} disabled={!selectedMedia || !selectedDates || selectedDates.length === 0}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Booking for {selectedDates?.length || 0} Days
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Availability;