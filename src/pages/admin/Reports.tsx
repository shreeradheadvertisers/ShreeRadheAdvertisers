/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Keep constants from static data, but we'll fetch the records via hooks
import { states, districts, mediaTypes, customerGroups } from "@/lib/data";
import { FileDown, Printer, Filter, Building2, Check, ChevronsUpDown, Briefcase, IndianRupee, Loader2 } from "lucide-react";
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

// --- 1. IMPORT LIVE API HOOKS ---
import { useMedia } from "@/hooks/api/useMedia";
import { useBookings } from "@/hooks/api/useBookings";
import { useCustomers } from "@/hooks/api/useCustomers";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("inventory");
  
  // General Filters
  const [stateFilter, setStateFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");

  // Combobox Open States
  const [customerOpen, setCustomerOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  
  // Customer & Group Filters
  const [customerFilter, setCustomerFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  
  // Date Filters
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // --- 2. FETCH LIVE DATA ---
  // Using a high limit for Reports to ensure exports contain all records
  const { data: mediaRes, isLoading: mediaLoading } = useMedia({ limit: 1000 });
  const { data: bookingsRes, isLoading: bookingsLoading } = useBookings({ limit: 1000 });
  const { data: customersRes, isLoading: customersLoading } = useCustomers({ limit: 1000 });

  const mediaLocations = mediaRes?.data || [];
  const bookings = bookingsRes?.data || [];
  const customers = customersRes?.data || [];

  const availableDistricts = stateFilter !== "all" ? districts[stateFilter] || [] : [];

  // --- 3. FILTERING LOGIC (Updated for Live Data structures) ---

  const getInventoryData = () => {
    return mediaLocations.filter(item => {
      if (stateFilter !== "all" && item.state !== stateFilter) return false;
      if (districtFilter !== "all" && item.district !== districtFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      return true;
    });
  };

  const getBookingData = () => {
    return bookings.filter(item => {
      const media = item.mediaId || item.media;
      if (stateFilter !== "all" && media?.state !== stateFilter) return false;
      if (districtFilter !== "all" && media?.district !== districtFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (paymentStatusFilter !== "all" && item.paymentStatus !== paymentStatusFilter) return false;

      if (dateRange.start && new Date(item.startDate) < new Date(dateRange.start)) return false;
      if (dateRange.end && new Date(item.endDate) > new Date(dateRange.end)) return false;
      return true;
    });
  };

  const getCustomerReportData = () => {
    return bookings.filter(item => {
      const custId = typeof item.customerId === 'object' ? item.customerId?._id : item.customerId;
      const media = item.mediaId || item.media;

      if (customerFilter !== "all" && custId !== customerFilter) return false;
      if (typeFilter !== "all" && media?.type !== typeFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (paymentStatusFilter !== "all" && item.paymentStatus !== paymentStatusFilter) return false;

      if (dateRange.start && new Date(item.startDate) < new Date(dateRange.start)) return false;
      if (dateRange.end && new Date(item.endDate) > new Date(dateRange.end)) return false;
      return true;
    });
  };

  const getGroupReportData = () => {
    const targetCustomerIds = customers
      .filter(c => groupFilter === "all" || (c.group || "Uncategorized") === groupFilter)
      .map(c => c._id || (c as any).id);

    return bookings.filter(item => {
      const custId = typeof item.customerId === 'object' ? item.customerId?._id : item.customerId;
      const media = item.mediaId || item.media;

      if (!targetCustomerIds.includes(custId)) return false;
      if (typeFilter !== "all" && media?.type !== typeFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (paymentStatusFilter !== "all" && item.paymentStatus !== paymentStatusFilter) return false;

      if (dateRange.start && new Date(item.startDate) < new Date(dateRange.start)) return false;
      if (dateRange.end && new Date(item.endDate) > new Date(dateRange.end)) return false;
      return true;
    });
  };

  const inventoryData = getInventoryData();
  const bookingData = getBookingData();
  const customerData = getCustomerReportData();
  const groupData = getGroupReportData();

  // --- Export Functions ---
  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(fieldName => {
        const value = row[fieldName]?.toString() || '';
        return `"${value.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = () => {
    if (activeTab === "inventory") {
      const cleanData = inventoryData.map(m => ({
        ID: m._id || m.id, Name: m.name, Type: m.type, State: m.state, District: m.district, City: m.city, Status: m.status, Price: m.pricePerMonth
      }));
      downloadCSV(cleanData, "Media_Inventory_Report");
    } else if (activeTab === "bookings") {
      const cleanData = bookingData.map(b => {
        const media = b.mediaId || b.media;
        return {
          BookingID: b._id || b.id, 
          MediaName: media?.name, 
          District: media?.district, 
          StartDate: b.startDate?.split('T')[0], 
          EndDate: b.endDate?.split('T')[0], 
          Status: b.status, 
          Amount: b.amount,
          Payment: b.paymentStatus
        };
      });
      downloadCSV(cleanData, "Booking_History_Report");
    }
  };

  // --- 4. LOADING STATE ---
  if (mediaLoading || bookingsLoading || customersLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Preparing live report data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Reports Center</h1>
          <p className="text-muted-foreground">Generate and export detailed insights from live data.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print / PDF
          </Button>
          <Button onClick={handleDownload}>
            <FileDown className="h-4 w-4 mr-2" /> Download CSV
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="print:hidden">
           <TabsList>
            <TabsTrigger value="inventory">Media Inventory</TabsTrigger>
            <TabsTrigger value="bookings">Booking History</TabsTrigger>
            <TabsTrigger value="customers">Customer Reports</TabsTrigger>
            <TabsTrigger value="groups">Group Reports</TabsTrigger>
          </TabsList>
        </div>

        <Card className="print:hidden bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" /> Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Group Selector */}
              {activeTab === "groups" && (
                <div className="space-y-2">
                  <Label>Customer Group</Label>
                  <Select value={groupFilter} onValueChange={setGroupFilter}>
                    <SelectTrigger><SelectValue placeholder="All Groups" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {customerGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Customer Selector */}
              {activeTab === "customers" && (
                <div className="space-y-2 flex flex-col">
                  <Label>Customer (Company)</Label>
                  <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                        {customerFilter !== "all" ? customers.find((c) => (c._id || c.id) === customerFilter)?.company : "All Customers"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search company..." />
                        <CommandList>
                          <CommandEmpty>No company found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem value="all customers" onSelect={() => { setCustomerFilter("all"); setCustomerOpen(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", customerFilter === "all" ? "opacity-100" : "opacity-0")} /> All Customers
                            </CommandItem>
                            {customers.map((customer) => (
                              <CommandItem key={customer._id || customer.id} value={customer.company} onSelect={() => { setCustomerFilter(customer._id || customer.id); setCustomerOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", customerFilter === (customer._id || customer.id) ? "opacity-100" : "opacity-0")} /> {customer.company}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* State Search */}
              {activeTab !== "customers" && activeTab !== "groups" && (
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
                            {states.map((state) => (
                              <CommandItem key={state} value={state} onSelect={() => { setStateFilter(state); setDistrictFilter("all"); setStateOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", stateFilter === state ? "opacity-100" : "opacity-0")} /> {state}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Status */}
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
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
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

              {activeTab !== "inventory" && (
                <div className="space-y-2">
                  <Label>Payment Status</Label>
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
            </div>
          </CardContent>
        </Card>

        {/* Tab Contents */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Media Inventory Report</CardTitle>
              <CardDescription>Showing {inventoryData.length} locations from database.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryData.map((media) => (
                      <TableRow key={media._id || media.id}>
                        <TableCell className="font-medium">{media.name}</TableCell>
                        <TableCell>{media.type}</TableCell>
                        <TableCell>{media.city}, {media.district}</TableCell>
                        <TableCell><Badge variant={media.status === 'Available' ? 'success' : 'warning'}>{media.status}</Badge></TableCell>
                        <TableCell className="text-right">₹{media.pricePerMonth.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking History Report</CardTitle>
              <CardDescription>Showing {bookingData.length} live bookings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Media</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookingData.map((booking) => {
                      const media = booking.mediaId || booking.media;
                      return (
                        <TableRow key={booking._id || booking.id}>
                          <TableCell>
                            <div className="font-medium">{media?.name}</div>
                            <div className="text-xs text-muted-foreground">{media?.district}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="text-xs">{booking.startDate?.split('T')[0]}</div>
                            <div className="text-xs text-muted-foreground">{booking.endDate?.split('T')[0]}</div>
                          </TableCell>
                          <TableCell><Badge variant={booking.status === 'Active' ? 'success' : 'outline'}>{booking.status}</Badge></TableCell>
                          <TableCell><Badge variant={booking.paymentStatus === 'Paid' ? 'success' : 'destructive'}>{booking.paymentStatus}</Badge></TableCell>
                          <TableCell className="text-right font-medium">₹{booking.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Customer Performance Report</CardTitle>
                  <CardDescription>
                    {customerFilter === 'all' ? "Showing bookings for ALL customers." : `Showing bookings for ${customers.find(c => c.id === customerFilter)?.company}.`}
                  </CardDescription>
                </div>
                {customerFilter !== 'all' && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Spent (Filtered)</p>
                    <p className="text-xl font-bold">₹{customerData.reduce((sum, b) => sum + b.amountPaid, 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Contract Value: ₹{customerData.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client (Company)</TableHead>
                      <TableHead>Media</TableHead>
                      <TableHead>Status</TableHead>
                      {/* Added Payment Columns */}
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Paid / Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No bookings found for the selected criteria.</TableCell>
                      </TableRow>
                    ) : (
                      customerData.slice(0, 50).map((booking) => {
                         const customer = customers.find(c => c.id === booking.customerId);
                         return (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {/* Changed Icon to Building2 and Displayed Company Name */}
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                {customer?.company || "Unknown"}
                              </div>
                              <div className="text-xs text-muted-foreground ml-5">{booking.id}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{booking.media?.type}</div>
                              <div className="text-xs text-muted-foreground">{booking.media?.city}</div>
                            </TableCell>
                            <TableCell><Badge variant={booking.status === 'Active' ? 'success' : booking.status === 'Completed' ? 'secondary' : 'outline'}>{booking.status}</Badge></TableCell>
                            
                            {/* Payment Data */}
                            <TableCell>
                              <Badge 
                                variant={
                                  booking.paymentStatus === 'Paid' ? 'success' : 
                                  booking.paymentStatus === 'Partially Paid' ? 'warning' : 'destructive'
                                }
                                className="text-[10px]"
                              >
                                {booking.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium">₹{booking.amountPaid.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">of ₹{booking.amount.toLocaleString()}</div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Customer Group Analysis</CardTitle>
                  <CardDescription>
                    {groupFilter === 'all' ? "Showing booking data across all sectors." : `Showing data for the ${groupFilter} sector.`}
                  </CardDescription>
                </div>
                <div className="flex gap-4 text-right">
                   <div>
                     <p className="text-xs text-muted-foreground">Total Bookings</p>
                     <p className="text-lg font-bold flex items-center justify-end"><Briefcase className="h-4 w-4 mr-1 text-primary" />{groupData.length}</p>
                   </div>
                   <div>
                     <p className="text-xs text-muted-foreground">Total Revenue (Paid)</p>
                     <p className="text-lg font-bold flex items-center justify-end"><IndianRupee className="h-4 w-4 mr-1 text-success" />{(groupData.reduce((sum, b) => sum + b.amountPaid, 0))}L</p>
                   </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Media Type</TableHead>
                      <TableHead>Status</TableHead>
                      {/* Added Payment Columns */}
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Paid / Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No bookings found for the selected group.</TableCell>
                      </TableRow>
                    ) : (
                      groupData.slice(0, 50).map((booking) => {
                         const customer = customers.find(c => c.id === booking.customerId);
                         const balance = booking.amount - booking.amountPaid;
                         return (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">{customer?.company || "Unknown"}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="font-normal">{customer?.group || "N/A"}</Badge>
                            </TableCell>
                            <TableCell>{booking.media?.type}</TableCell>
                            <TableCell><Badge variant={booking.status === 'Active' ? 'success' : booking.status === 'Completed' ? 'secondary' : 'outline'}>{booking.status}</Badge></TableCell>
                            
                            {/* Payment Data */}
                            <TableCell>
                              <Badge 
                                variant={
                                  booking.paymentStatus === 'Paid' ? 'success' : 
                                  booking.paymentStatus === 'Partially Paid' ? 'warning' : 'destructive'
                                }
                                className="text-[10px]"
                              >
                                {booking.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                               <div className="text-xs font-medium">₹{booking.amountPaid.toLocaleString()}</div>
                               {balance > 0 && <div className="text-xs text-destructive">Bal: ₹{balance.toLocaleString()}</div>}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}