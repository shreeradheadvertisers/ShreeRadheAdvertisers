/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, Fragment, useMemo } from "react";
import { useMedia } from "@/hooks/api/useMedia";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DistrictBreakdown() {
  const { data: mediaRes } = useMedia({ limit: 2000 } as any);
  const mediaLocations = useMemo(() => mediaRes?.data || [], [mediaRes]);

  const [selectedState, setSelectedState] = useState<string>('all');
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);

  // Calculate stats from live data
  const { states, filteredStats } = useMemo(() => {
    const statesSet = new Set<string>();
    const statsMap = new Map<string, any>();

    mediaLocations.forEach((m: any) => {
      statesSet.add(m.state);
      const key = `${m.state}-${m.district}`;
      if (!statsMap.has(key)) {
        statsMap.set(key, { district: m.district, state: m.state, total: 0, available: 0, booked: 0, comingSoon: 0 });
      }
      const s = statsMap.get(key);
      s.total++;
      if (m.status === 'Available') s.available++;
      else if (m.status === 'Booked') s.booked++;
      else s.comingSoon++;
    });

    const allStats = Array.from(statsMap.values());
    const filtered = selectedState === 'all' ? allStats : allStats.filter(s => s.state === selectedState);

    return { states: Array.from(statesSet).sort(), filteredStats: filtered };
  }, [mediaLocations, selectedState]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">District-wise Breakdown</h3>
        <Select value={selectedState} onValueChange={setSelectedState}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-8"></TableHead>
              <TableHead>District</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Available</TableHead>
              <TableHead className="text-center">Booked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStats.map((stat: any) => (
              <TableRow key={`${stat.state}-${stat.district}`}>
                <TableCell><ChevronRight className="h-4 w-4" /></TableCell>
                <TableCell className="font-medium">{stat.district}</TableCell>
                <TableCell className="text-center">{stat.total}</TableCell>
                <TableCell className="text-center"><Badge variant="success">{stat.available}</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="destructive">{stat.booked}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}