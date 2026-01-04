/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mediaTypes } from "@/lib/data";
import { Search, X } from "lucide-react";
import { useLocationData } from "@/contexts/LocationDataContext";

interface FilterPanelProps {
  filters: {
    search: string;
    state: string;
    district: string;
    type: string;
    status: string;
  };
  setFilters: (filters: any) => void;
}

export function FilterPanel({ filters, setFilters }: FilterPanelProps) {
  // 1. Initialize the hook to get states and allDistricts mapping
  const { states, allDistricts } = useLocationData();

  // 2. Derive available districts based on the selected state from context
  const availableDistricts = filters.state && filters.state !== 'all' 
    ? allDistricts[filters.state] || [] 
    : [];

  const clearFilters = () => {
    setFilters({
      search: '',
      state: '',
      district: '',
      type: '',
      status: '',
    });
  };

  const hasActiveFilters = filters.search || filters.state || filters.district || filters.type || filters.status;

  return (
    <div className="glass-card rounded-xl p-6 sticky top-20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by location or ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        <div className="space-y-2">
          <Label>State</Label>
          <Select 
            value={filters.state} 
            onValueChange={(value) => setFilters({ ...filters, state: value, district: '' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {/* Uses the live states list from LocationDataContext */}
              {states.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>District</Label>
          <Select 
            value={filters.district} 
            onValueChange={(value) => setFilters({ ...filters, district: value })}
            disabled={!filters.state || filters.state === 'all'}
          >
            <SelectTrigger>
              <SelectValue placeholder={filters.state && filters.state !== 'all' ? "Select District" : "Select State First"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {/* Uses the districts mapped to the selected state */}
              {availableDistricts.map(district => (
                <SelectItem key={district} value={district}>{district}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Media Type</Label>
          <Select 
            value={filters.type} 
            onValueChange={(value) => setFilters({ ...filters, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {mediaTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Availability</Label>
          <Select 
            value={filters.status} 
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Booked">Booked</SelectItem>
              <SelectItem value="Coming Soon">Coming Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}