/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mediaTypes, customerGroups } from "@/lib/data";
import { FileDown, Printer, Filter, Building2, Check, ChevronsUpDown, Briefcase, IndianRupee, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// --- IMPORT API HOOKS & CONTEXT ---
import { useMedia } from "@/hooks/api/useMedia";
import { useBookings } from "@/hooks/api/useBookings";
import { useCustomers } from "@/hooks/api/useCustomers";
import { useAuth } from "@/contexts/AuthContext";

export default function Reports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("inventory");
  
  // Pagination & Print State
  const [currentPage, setCurrentPage] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const itemsPerPage = 20;

  // Filters
  const [stateFilter, setStateFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [customerFilter, setCustomerFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, stateFilter, districtFilter, statusFilter, typeFilter, paymentStatusFilter, customerFilter, groupFilter, dateRange]);

  // --- PRINT HANDLER ---
  useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [isPrinting]);

  // --- DATA FETCHING ---
  const { data: mediaResponse } = useMedia({ limit: 2000 });
  const { data: bookingsResponse } = useBookings({ limit: 2000 });
  const { data: customersResponse } = useCustomers({ limit: 2000 });

  const mediaLocations = useMemo(() => mediaResponse?.data || [], [mediaResponse]);
  const bookings = useMemo(() => bookingsResponse?.data || [], [bookingsResponse]);
  const customers = useMemo(() => customersResponse?.data || [], [customersResponse]);

  // --- DYNAMIC LISTS ---
  const { states, districts } = useMemo(() => {
    const uniqueStates = Array.from(new Set(mediaLocations.map(m => m.state).filter(Boolean))).sort();
    const districtMap: Record<string, string[]> = {};
    mediaLocations.forEach(m => {
      if (m.state && m.district) {
        if (!districtMap[m.state]) districtMap[m.state] = [];
        if (!districtMap[m.state].includes(m.district)) districtMap[m.state].push(m.district);
      }
    });
    Object.keys(districtMap).forEach(key => districtMap[key].sort());
    return { states: uniqueStates, districts: districtMap };
  }, [mediaLocations]);

  const availableDistricts = useMemo(() => {
    if (stateFilter === "all") return Array.from(new Set(mediaLocations.map(m => m.district).filter(Boolean))).sort();
    return districts[stateFilter] || [];
  }, [stateFilter, districts, mediaLocations]);

  // --- FILTERING ---
  const getInventoryData = () => mediaLocations.filter(item => {
    if (stateFilter !== "all" && item.state !== stateFilter) return false;
    if (districtFilter !== "all" && item.district !== districtFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    return true;
  });

  const getBookingData = () => bookings.filter(item => {
    if (stateFilter !== "all" && item.media?.state !== stateFilter) return false;
    if (districtFilter !== "all" && item.media?.district !== districtFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (paymentStatusFilter !== "all" && item.paymentStatus !== paymentStatusFilter) return false;
    if (dateRange.start && new Date(item.startDate) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(item.endDate) > new Date(dateRange.end)) return false;
    return true;
  });

  const getCustomerReportData = () => bookings.filter(item => {
    if (customerFilter !== "all" && item.customerId !== customerFilter) return false;
    if (typeFilter !== "all" && item.media?.type !== typeFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (paymentStatusFilter !== "all" && item.paymentStatus !== paymentStatusFilter) return false;
    if (dateRange.start && new Date(item.startDate) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(item.endDate) > new Date(dateRange.end)) return false;
    return true;
  });

  const getGroupReportData = () => {
    const targetCustomers = customers.filter(c => {
      if (groupFilter !== "all" && (c.group || "Uncategorized") !== groupFilter) return false;
      return true;
    });
    const targetCustomerIds = targetCustomers.map(c => c.id);
    return bookings.filter(item => {
      if (!targetCustomerIds.includes(item.customerId)) return false;
      if (typeFilter !== "all" && item.media?.type !== typeFilter) return false;
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

  // --- HELPERS ---
  const getCurrentPageData = (data: any[]) => {
    if (isPrinting) return data; 
    return data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === 'available' || s === 'active' || s === 'paid') return <Badge className="!bg-green-600 !text-white hover:!bg-green-700 border-none print:bg-green-600 print:text-white print:border-0">{status}</Badge>;
    if (s === 'booked' || s === 'pending') return <Badge className="!bg-red-600 !text-white hover:!bg-red-700 border-none print:bg-red-600 print:text-white print:border-0">{status}</Badge>;
    if (s === 'partially paid' || s === 'coming soon') return <Badge className="!bg-yellow-500 !text-white hover:!bg-yellow-600 border-none print:bg-yellow-500 print:text-white print:border-0">{status}</Badge>;
    return <Badge variant="secondary" className="print:bg-transparent print:text-black print:border print:border-gray-300">{status}</Badge>;
  };

  const getFilterContext = () => {
    const filters = [];
    if (stateFilter !== 'all') filters.push(`State: ${stateFilter}`);
    if (districtFilter !== 'all') filters.push(`District: ${districtFilter}`);
    if (statusFilter !== 'all') filters.push(`Status: ${statusFilter}`);
    if (customerFilter !== 'all') {
      const c = customers.find(x => x.id === customerFilter);
      filters.push(`Client: ${c?.company || 'Unknown'}`);
    }
    if (dateRange.start || dateRange.end) filters.push(`Date: ${dateRange.start || 'Start'} to ${dateRange.end || 'End'}`);
    return filters.length > 0 ? filters.join(" | ") : "None (All Records)";
  };

  // --- EXPORT FUNCTION: CSV ---
  const handleDownloadCSV = () => {
    const getData = () => {
       if (activeTab === "inventory") return inventoryData.map(m => ({ ID: m.id, Location: m.name, Type: m.type, District: m.district, Status: m.status, Price: m.pricePerMonth }));
       if (activeTab === "bookings") return bookingData.map(b => ({ ID: b.id, Media: b.media?.name, Start: b.startDate, End: b.endDate, Status: b.status, Payment: b.paymentStatus, Amount: b.amount, Paid: b.amountPaid }));
       if (activeTab === "customers") return customerData.map(b => ({ Client: customers.find(c => c.id === b.customerId)?.company, Media: b.media?.type, Status: b.status, Payment: b.paymentStatus, Total: b.amount }));
       return groupData.map(b => ({ Company: customers.find(c => c.id === b.customerId)?.company, Group: customers.find(c => c.id === b.customerId)?.group, Media: b.media?.type, Status: b.status, Payment: b.paymentStatus, Balance: b.amount - b.amountPaid }));
    };
    
    const data = getData();
    if(data.length === 0) return;

    // Add Metadata Header Rows
    const headerRows = [
      ["SHREE RADHE ADVERTISERS - OFFICIAL REPORT"],
      [`Generated On: ${new Date().toLocaleString()}`],
      [`Generated By: ${user?.name || "System Admin"}`],
      [`Active Filters: ${getFilterContext()}`],
      [], // Spacer
    ];

    const keys = Object.keys(data[0]);
    const csvContent = [
      ...headerRows.map(r => r.join(",")),
      keys.join(","),
      ...data.map(row => keys.map(k => `"${String((row as any)[k]||'').replace(/"/g,'""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SRA_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // --- EXPORT FUNCTION: EXCEL (HTML Table Method) ---
  const handleDownloadExcel = () => {
    const getData = () => {
       if (activeTab === "inventory") return inventoryData.map(m => ({ ID: m.id, Location: m.name, Type: m.type, District: m.district, Status: m.status, Price: m.pricePerMonth }));
       if (activeTab === "bookings") return bookingData.map(b => ({ ID: b.id, Media: b.media?.name, Start: b.startDate, End: b.endDate, Status: b.status, Payment: b.paymentStatus, Amount: b.amount, Paid: b.amountPaid }));
       if (activeTab === "customers") return customerData.map(b => ({ Client: customers.find(c => c.id === b.customerId)?.company, Media: b.media?.type, Status: b.status, Payment: b.paymentStatus, Total: b.amount }));
       return groupData.map(b => ({ Company: customers.find(c => c.id === b.customerId)?.company, Group: customers.find(c => c.id === b.customerId)?.group, Media: b.media?.type, Status: b.status, Payment: b.paymentStatus, Balance: b.amount - b.amountPaid }));
    };
    
    const data = getData();
    if(data.length === 0) return;
    const keys = Object.keys(data[0]);

    // Create HTML Table structure for Excel
    const tableHTML = `
      <table border="1">
        <thead>
          <tr><th colspan="${keys.length}" style="font-size:16px; font-weight:bold; background-color:#f0f0f0;">SHREE RADHE ADVERTISERS</th></tr>
          <tr><th colspan="${keys.length}" style="font-size:14px; font-weight:bold;">Official System Report</th></tr>
          <tr><td colspan="${keys.length}">Generated On: ${new Date().toLocaleString()}</td></tr>
          <tr><td colspan="${keys.length}">Generated By: ${user?.name || "System Admin"}</td></tr>
          <tr><td colspan="${keys.length}">Filters: ${getFilterContext()}</td></tr>
          <tr><td colspan="${keys.length}"></td></tr>
          <tr style="background-color:#e0e0e0; font-weight:bold;">
            ${keys.map(k => `<th>${k}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `<tr>${keys.map(k => `<td>${(row as any)[k] || ''}</td>`).join('')}</tr>`).join('')}
        </tbody>
        <tfoot>
           <tr><td colspan="${keys.length}"></td></tr>
           <tr><td colspan="${keys.length}" style="font-style:italic; color:#666;">CONFIDENTIAL: For Internal Use Only</td></tr>
           <tr><td colspan="${keys.length}" style="font-style:italic; color:#666;">© ${new Date().getFullYear()} Shree Radhe Advertisers</td></tr>
        </tfoot>
      </table>
    `;

    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SRA_Report_${activeTab}.xls`;
    link.click();
  };

  const renderPagination = (totalItems: number) => {
    if (isPrinting) return null;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;
    return (
      <div className="py-4 flex items-center justify-between border-t mt-4 print:hidden">
        <div className="text-sm text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries</div>
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
            <PaginationItem><div className="flex items-center gap-2 px-4 text-sm font-medium">Page {currentPage} of {totalPages}</div></PaginationItem>
            <PaginationItem><PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    // FIX: print:pb-32 adds padding at bottom to prevent footer overlap
    <div className="space-y-6 print:space-y-0 print:pb-32 relative"> 
      
      {/* GLOBAL STYLES FOR PRINT */}
      <style>
        {`
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* WATERMARK FIX: Tiled Background Pattern on Body */
            body {
              background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><text x='150' y='150' fill='rgba(0,0,0,0.05)' font-size='24' font-family='Arial' font-weight='bold' transform='rotate(-45 150 150)' text-anchor='middle' dominant-baseline='middle'>CONFIDENTIAL</text></svg>") !important;
              background-repeat: repeat !important;
              background-position: center !important;
            }

            /* Make backgrounds transparent so watermark shows */
            .bg-card, .bg-background, .bg-white, table, tr, td, th {
              background-color: transparent !important;
            }

            /* INK SAVING: Remove all outer borders and shadows */
            .shadow-sm, .shadow-md, .shadow-lg, .border, .border-b-2 {
              box-shadow: none !important;
              border: none !important;
            }

            /* INK SAVING: Keep only a very light separator for rows */
            tr {
              border-bottom: 1px solid #f3f4f6 !important; 
            }
            
            /* Clean Header Separator */
            thead tr {
              border-bottom: 1px solid #000 !important;
            }
          }
        `}
      </style>

      {/* --- PROFESSIONAL REPORT HEADER (Print Only) --- */}
      <div className="hidden print:block mb-6 w-full pb-4">
        <div className="flex justify-between items-start mb-6">
           <div className="flex items-center gap-4">
            <img src={logo} alt="Company Logo" className="h-16 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-black uppercase tracking-tight">Shree Radhe Advertisers</h1>
              <p className="text-gray-600 font-medium mt-1">Official System Report</p>
            </div>
           </div>
           
           <div className="text-right">
             <div className="mb-2">
               <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Generated On</p>
               <p className="font-mono text-sm font-bold text-black">
                 {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
               </p>
             </div>
             <div>
               <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Generated By</p>
               <p className="font-medium text-black text-sm">{user?.name || user?.email || "System Admin"}</p>
             </div>
           </div>
        </div>

        <div className="flex justify-between items-end bg-gray-100 p-3 rounded print:bg-transparent">
          <div>
            <h2 className="text-xl font-bold text-black uppercase">
              {activeTab === 'inventory' && "Media Inventory Report"}
              {activeTab === 'bookings' && "Booking History Report"}
              {activeTab === 'customers' && "Customer Performance Report"}
              {activeTab === 'groups' && "Group Analysis Report"}
            </h2>
            <p className="text-xs text-gray-600 mt-1 font-medium">
              <span className="font-bold text-black">Active Filters:</span> {getFilterContext()}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500 uppercase font-bold">Total Records</span>
            <p className="text-xl font-bold text-black leading-none">
              {activeTab === 'inventory' && inventoryData.length}
              {activeTab === 'bookings' && bookingData.length}
              {activeTab === 'customers' && customerData.length}
              {activeTab === 'groups' && groupData.length}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Reports Center</h1>
          <p className="text-muted-foreground">Generate and export detailed insights about your inventory and bookings.</p>
        </div>
        <div className="flex gap-2">
          {/* UPDATED BUTTONS */}
          <Button variant="outline" onClick={() => setIsPrinting(true)} disabled={isPrinting}>
            <Printer className="h-4 w-4 mr-2" /> {isPrinting ? "Preparing..." : "Print / PDF"}
          </Button>
          <Button variant="outline" onClick={handleDownloadCSV}>
            <FileDown className="h-4 w-4 mr-2" /> Download CSV
          </Button>
          <Button onClick={handleDownloadExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Download Excel
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

        {/* Filter Card */}
        <Card className="print:hidden bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" /> Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Selectors and Filters */}
              {activeTab === "groups" && (
                <div className="space-y-2"><Label>Group</Label><Select value={groupFilter} onValueChange={setGroupFilter}><SelectTrigger><SelectValue placeholder="All Groups" /></SelectTrigger><SelectContent><SelectItem value="all">All Groups</SelectItem>{customerGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
              )}
              {activeTab === "customers" && (
                <div className="space-y-2 flex flex-col"><Label>Customer</Label><Popover open={customerOpen} onOpenChange={setCustomerOpen}><PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={customerOpen} className="w-full justify-between font-normal">{customerFilter !== "all" ? customers.find((c) => c.id === customerFilter)?.company : "All Customers"}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[300px] p-0"><Command><CommandInput placeholder="Search company..." /><CommandList><CommandEmpty>No company found.</CommandEmpty><CommandGroup><CommandItem value="all" onSelect={() => setCustomerFilter("all")}>All Customers</CommandItem>{customers.map((c) => (<CommandItem key={c.id} value={c.company} onSelect={() => setCustomerFilter(c.id)}>{c.company}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover></div>
              )}
              {activeTab !== "customers" && activeTab !== "groups" && (
                <>
                <div className="space-y-2 flex flex-col"><Label>State</Label><Popover open={stateOpen} onOpenChange={setStateOpen}><PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={stateOpen} className="w-full justify-between font-normal">{stateFilter !== "all" ? stateFilter : "All States"}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[200px] p-0"><Command><CommandInput placeholder="Search state..." /><CommandList><CommandEmpty>No state found.</CommandEmpty><CommandGroup><CommandItem value="all states" onSelect={() => { setStateFilter("all"); setDistrictFilter("all"); setStateOpen(false); }}>All States</CommandItem>{states.map((s) => (<CommandItem key={s} value={s} onSelect={() => { setStateFilter(s); setDistrictFilter("all"); setStateOpen(false); }}>{s}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover></div>
                <div className="space-y-2 flex flex-col"><Label>District</Label><Popover open={districtOpen} onOpenChange={setDistrictOpen}><PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={districtOpen} className="w-full justify-between font-normal" disabled={stateFilter === "all"}>{districtFilter !== "all" ? districtFilter : "All Districts"}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[200px] p-0"><Command><CommandInput placeholder="Search district..." /><CommandList><CommandEmpty>No district found.</CommandEmpty><CommandGroup><CommandItem value="all districts" onSelect={() => { setDistrictFilter("all"); setDistrictOpen(false); }}>All Districts</CommandItem>{availableDistricts.map((d) => (<CommandItem key={d} value={d} onSelect={() => { setDistrictFilter(d); setDistrictOpen(false); }}>{d}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover></div>
                </>
              )}
              {activeTab !== "bookings" && (
                <div className="space-y-2"><Label>Media Type</Label><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{mediaTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              )}
              <div className="space-y-2"><Label>Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{activeTab === "inventory" ? <><SelectItem value="Available">Available</SelectItem><SelectItem value="Booked">Booked</SelectItem><SelectItem value="Coming Soon">Coming Soon</SelectItem></> : <><SelectItem value="Active">Active</SelectItem><SelectItem value="Upcoming">Upcoming</SelectItem><SelectItem value="Completed">Completed</SelectItem></>}</SelectContent></Select></div>
              {activeTab !== "inventory" && (
                <div className="space-y-2"><Label>Payment Status</Label><Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}><SelectTrigger><SelectValue placeholder="All Payments" /></SelectTrigger><SelectContent><SelectItem value="all">All Payments</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Partially Paid">Partially Paid</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent></Select></div>
              )}
            </div>
            {/* Dates */}
            {(activeTab === "bookings" || activeTab === "customers" || activeTab === "groups") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} /></div>
                <div className="space-y-2"><Label>End Date</Label><Input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} /></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- TABLES --- */}
        
        <TabsContent value="inventory" className="space-y-4">
          <Card className="border-none shadow-none print:border-none print:shadow-none">
            <CardContent className="p-0 print:p-0">
              <div className="rounded-md border print:border-none">
                <Table>
                  <TableHeader>
                    <TableRow className="print:bg-transparent print:text-black print:border-b-2 print:border-black">
                      <TableHead>ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCurrentPageData(inventoryData).map((media) => (
                      <TableRow key={media.id} className="print:border-b print:border-gray-200">
                        <TableCell className="font-mono text-xs">{media.id}</TableCell>
                        <TableCell className="font-medium">{media.name}</TableCell>
                        <TableCell>{media.type}</TableCell>
                        <TableCell>{media.city}, {media.district}</TableCell>
                        {/* FIX: Use helper function for corrected colors */}
                        <TableCell>{getStatusBadge(media.status)}</TableCell>
                        <TableCell className="text-right">₹{media.pricePerMonth.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {renderPagination(inventoryData.length)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card className="border-none shadow-none print:border-none print:shadow-none">
            <CardContent className="p-0 print:p-0">
              <div className="rounded-md border print:border-none">
                <Table>
                  <TableHeader>
                    <TableRow className="print:bg-transparent print:text-black print:border-b-2 print:border-black">
                      <TableHead>ID</TableHead>
                      <TableHead>Media</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Paid / Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCurrentPageData(bookingData).map((booking) => {
                      const balance = booking.amount - booking.amountPaid;
                      return (
                        <TableRow key={booking.id} className="print:border-b print:border-gray-200">
                          <TableCell className="font-mono text-xs">{booking.id}</TableCell>
                          <TableCell>
                            <div className="font-medium">{booking.media?.name}</div>
                            <div className="text-xs text-muted-foreground">{booking.media?.district}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="text-xs">{booking.startDate}</div>
                            <div className="text-xs text-muted-foreground">{booking.endDate}</div>
                          </TableCell>
                          {/* FIX: Use helper function for corrected colors */}
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell>{getStatusBadge(booking.paymentStatus)}</TableCell>
                          <TableCell className="text-right">
                             <div className="text-xs font-medium text-success">₹{booking.amountPaid.toLocaleString()}</div>
                             {balance > 0 && <div className="text-xs text-destructive">Due: ₹{balance.toLocaleString()}</div>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {renderPagination(bookingData.length)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card className="border-none shadow-none print:border-none print:shadow-none">
            <CardContent className="p-0 print:p-0">
              <div className="rounded-md border print:border-none">
                <Table>
                  <TableHeader>
                    <TableRow className="print:bg-transparent print:text-black print:border-b-2 print:border-black">
                      <TableHead>Client (Company)</TableHead>
                      <TableHead>Media</TableHead>
                      <TableHead>Status</TableHead>
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
                      getCurrentPageData(customerData).map((booking) => {
                         const customer = customers.find(c => c.id === booking.customerId);
                         return (
                          <TableRow key={booking.id} className="print:border-b print:border-gray-200">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                {customer?.company || "Unknown"}
                              </div>
                              <div className="text-xs text-muted-foreground ml-5">{booking.id}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{booking.media?.type}</div>
                              <div className="text-xs text-muted-foreground">{booking.media?.city}</div>
                            </TableCell>
                            {/* FIX: Use helper function for corrected colors */}
                            <TableCell>{getStatusBadge(booking.status)}</TableCell>
                            <TableCell>{getStatusBadge(booking.paymentStatus)}</TableCell>
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
              {renderPagination(customerData.length)}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="groups" className="space-y-4">
          <Card className="border-none shadow-none print:border-none print:shadow-none">
            <CardContent className="p-0 print:p-0">
              <div className="rounded-md border print:border-none">
                <Table>
                  <TableHeader>
                    <TableRow className="print:bg-transparent print:text-black print:border-b-2 print:border-black">
                      <TableHead>Company</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Media Type</TableHead>
                      <TableHead>Status</TableHead>
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
                      getCurrentPageData(groupData).map((booking) => {
                         const customer = customers.find(c => c.id === booking.customerId);
                         const balance = booking.amount - booking.amountPaid;
                         return (
                          <TableRow key={booking.id} className="print:border-b print:border-gray-200">
                            <TableCell className="font-medium">{customer?.company || "Unknown"}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="font-normal">{customer?.group || "N/A"}</Badge>
                            </TableCell>
                            <TableCell>{booking.media?.type}</TableCell>
                            {/* FIX: Use helper function for corrected colors */}
                            <TableCell>{getStatusBadge(booking.status)}</TableCell>
                            <TableCell>{getStatusBadge(booking.paymentStatus)}</TableCell>
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
              {renderPagination(groupData.length)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- ADDED: PRINT FOOTER (Sticky) --- */}
      <div className="hidden print:flex fixed bottom-0 left-0 w-full justify-between items-center text-[10px] text-gray-500 border-t border-gray-200 pt-2 bg-white pb-4 z-50">
        <p>© {new Date().getFullYear()} Shree Radhe Advertisers. All rights reserved.</p>
        <p>CONFIDENTIAL: For internal use only.</p>
      </div>
    </div>
  );
}