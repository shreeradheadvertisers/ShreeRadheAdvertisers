/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { states, districts, mediaTypes, customerGroups } from "@/lib/data";
import { FileDown, Printer, Filter, Building2, Check, ChevronsUpDown, Briefcase, IndianRupee, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useMedia } from "@/hooks/api/useMedia";
import { useBookings } from "@/hooks/api/useBookings";
import { useCustomers } from "@/hooks/api/useCustomers";
import { MediaType, MediaStatus, BookingStatus, PaymentStatus } from "@/lib/api/types";

// Reusable Pagination Component for Reports
function ReportPagination({ page, totalPages, onPageChange }: { page: number, totalPages: number, onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-2 py-4 border-t mt-4">
      <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filters
  const [stateFilter, setStateFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Popover States
  const [customerOpen, setCustomerOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [stateFilter, districtFilter, statusFilter, typeFilter, paymentStatusFilter, customerFilter, groupFilter, dateRange, activeTab]);

  // --- 1. FETCH LIVE DATA (Filtered on Server) ---
  // Pass filters directly to hooks to stop limit=1000 calls
  const { data: mediaRes, isLoading: mediaLoading } = useMedia({
    limit: itemsPerPage,
    page: currentPage,
    state: stateFilter === "all" ? undefined : stateFilter,
    district: districtFilter === "all" ? undefined : districtFilter,
    type: typeFilter === "all" ? undefined : typeFilter as MediaType,
    status: statusFilter === "all" ? undefined : statusFilter as MediaStatus,
  });

  const { data: bookingsRes, isLoading: bookingsLoading } = useBookings({
    limit: itemsPerPage,
    page: currentPage,
    status: statusFilter === "all" ? undefined : statusFilter as BookingStatus,
    paymentStatus: paymentStatusFilter === "all" ? undefined : paymentStatusFilter as PaymentStatus,
    customerId: customerFilter === "all" ? undefined : customerFilter,
    startDate: dateRange.start || undefined,
    endDate: dateRange.end || undefined,
  });

  const { data: customersRes } = useCustomers({ limit: 1000 }); // Needed for the dropdown list

  const inventoryData = mediaRes?.data || [];
  const bookingData = bookingsRes?.data || [];
  const customers = customersRes?.data || [];
  const availableDistricts = stateFilter !== "all" ? districts[stateFilter] || [] : [];

  // --- 2. EXPORT LOGIC ---
const handleDownload = () => {
    // 1. Identify which dataset to export
    const dataToExport: any[] = activeTab === "inventory" ? inventoryData : bookingData; 
    
    if (dataToExport.length === 0) return;
    
    // 2. Extract headers (only top-level fields, no objects)
    const headers = Object.keys(dataToExport[0]).filter(
      (key) => typeof dataToExport[0][key] !== 'object'
    );

    // 3. Map rows to CSV strings (The fix is casting 'row' to 'any')
    const csvRows = dataToExport.map((row: any) => {
      return headers.map((fieldName) => {
        const value = row[fieldName] ?? ''; // Safely access property
        return `"${String(value).replace(/"/g, '""')}"`; // Escape quotes
      }).join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    // 4. Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SRA_${activeTab}_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (mediaLoading || bookingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Fetching report data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Reports Center</h1>
          <p className="text-muted-foreground">Optimized real-time reporting.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print</Button>
          <Button onClick={handleDownload}><FileDown className="h-4 w-4 mr-2" /> Export CSV</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="print:hidden">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
        </TabsList>

        <Card className="print:hidden bg-card/50">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* State Filter */}
              <div className="space-y-2 flex flex-col">
                <Label>State</Label>
                <Popover open={stateOpen} onOpenChange={setStateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                      {stateFilter !== "all" ? stateFilter : "All States"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search state..." />
                      <CommandList>
                        <CommandEmpty>No state found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem value="all states" onSelect={() => { setStateFilter("all"); setDistrictFilter("all"); setStateOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", stateFilter === "all" ? "opacity-100" : "opacity-0")} /> All States
                          </CommandItem>
                          {states.map((s) => (
                            <CommandItem key={s} value={s} onSelect={() => { setStateFilter(s); setDistrictFilter("all"); setStateOpen(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", stateFilter === s ? "opacity-100" : "opacity-0")} /> {s}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {activeTab === "inventory" ? (
                      <>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Booked">Booked</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status (Hidden for Inventory) */}
              {activeTab !== "inventory" && (
                <div className="space-y-2">
                  <Label>Payment</Label>
                  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date Filters */}
              {activeTab !== "inventory" && (
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Media Inventory</CardTitle><CardDescription>Total: {mediaRes?.pagination?.total || 0}</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>District</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Price</TableHead></TableRow></TableHeader>
                <TableBody>
                  {inventoryData.map((m) => (
                    <TableRow key={m._id || m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.district}</TableCell>
                      <TableCell><Badge variant={m.status === 'Available' ? 'success' : 'warning'}>{m.status}</Badge></TableCell>
                      <TableCell className="text-right">₹{m.pricePerMonth.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ReportPagination page={currentPage} totalPages={mediaRes?.pagination?.totalPages || 1} onPageChange={setCurrentPage} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Booking History</CardTitle><CardDescription>Total: {bookingsRes?.pagination?.total || 0}</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Media</TableHead><TableHead>Dates</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                  {bookingData.map((b) => (
                    <TableRow key={b._id || b.id}>
                      <TableCell>{(b.mediaId || b.media)?.name}</TableCell>
                      <TableCell className="text-xs">{b.startDate?.split('T')[0]} to {b.endDate?.split('T')[0]}</TableCell>
                      <TableCell><Badge variant={b.status === 'Active' ? 'success' : 'outline'}>{b.status}</Badge></TableCell>
                      <TableCell className="text-right font-medium">₹{b.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ReportPagination page={currentPage} totalPages={bookingsRes?.pagination?.totalPages || 1} onPageChange={setCurrentPage} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}