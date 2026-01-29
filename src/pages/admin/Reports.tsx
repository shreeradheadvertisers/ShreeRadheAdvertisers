/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mediaTypes, customerGroups } from "@/lib/data";
import { FileDown, Printer, Filter, Building2, ChevronsUpDown, FileSpreadsheet, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { useBookings, useUpdateBooking } from "@/hooks/api/useBookings";
import { useCustomers } from "@/hooks/api/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api/client"; // 👈 ADDED: Import API Client for Logging

// --- IMPORT EDIT DIALOG ---
import { EditBookingDialog } from "@/components/admin/BookingManagement";

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("inventory");
  
  // Pagination & Print State
  const [currentPage, setCurrentPage] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const itemsPerPage = 20;

  // Edit Dialog State
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // API Mutations
  const updateBookingMutation = useUpdateBooking();

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
  const { data: bookingsResponse, refetch: refetchBookings } = useBookings({ limit: 2000 });
  const { data: customersResponse } = useCustomers({ limit: 2000 });

  const mediaLocations = useMemo(() => mediaResponse?.data || [], [mediaResponse]);
  const rawBookings = useMemo(() => bookingsResponse?.data || [], [bookingsResponse]);
  const customers = useMemo(() => customersResponse?.data || [], [customersResponse]);

  // --- DATA ENRICHMENT ---
  const bookings = useMemo(() => {
    const sortedBookings = [...rawBookings].sort((a, b) => 
        new Date(a.createdAt || a.startDate).getTime() - new Date(b.createdAt || b.startDate).getTime()
    );

    return sortedBookings.map((booking, index) => {
      const mediaIdStr = typeof booking.mediaId === 'object' ? booking.mediaId?._id : booking.mediaId;
      const customerIdStr = typeof booking.customerId === 'object' ? booking.customerId?._id : booking.customerId;

      const media = mediaLocations.find((m) => m._id === mediaIdStr || m.id === mediaIdStr) 
                    || (typeof booking.mediaId === 'object' ? booking.mediaId : null)
                    || booking.media 
                    || { name: "", type: "", district: "", city: "", state: "" };

      const customer = customers.find((c) => c._id === customerIdStr || c.id === customerIdStr) 
                       || (typeof booking.customerId === 'object' ? booking.customerId : null)
                       || booking.customer 
                       || { company: "", group: "" };

      let displayId = "N/A";
      const dateSource = booking.startDate || booking.createdAt;
      
      if (dateSource) {
          const d = new Date(dateSource);
          if (!isNaN(d.getTime())) {
              const year = d.getFullYear();
              const month = d.getMonth(); 
              let startYear, endYear;
              if (month < 3) {
                 startYear = year - 1;
                 endYear = year;
              } else {
                 startYear = year;
                 endYear = year + 1;
              }
              const ay = `${String(startYear).slice(-2)}${String(endYear).slice(-2)}`;
              const seqNum = 1000 + index + 1;
              displayId = `SRA/${ay}/${seqNum}`;
          }
      }

      return { 
        ...booking, 
        displayId, 
        media: {
           ...media,
           name: media.name || "Unknown Media",
           type: media.type || "Unknown Type",
           district: media.district || "",
           city: media.city || "",
           state: media.state || ""
        }, 
        customer: {
           ...customer,
           company: customer.company || "Unknown Client",
           group: customer.group || "Uncategorized"
        }
      };
    });
  }, [rawBookings, mediaLocations, customers]);

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
    if (customerFilter !== "all" && (item.customerId === customerFilter || item.customer?._id === customerFilter)) return false;
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
    const targetCustomerIds = new Set(targetCustomers.flatMap(c => [c._id, c.id]));
    
    return bookings.filter(item => {
      const cId = typeof item.customerId === 'object' ? item.customerId?._id : item.customerId;
      if (!targetCustomerIds.has(cId)) return false;
      
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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

  // --- HANDLERS ---
  const handleEditClick = (booking: any) => {
    setSelectedBooking(booking);
    setIsEditOpen(true);
  };

  const handleBookingSave = async (updatedData: any) => {
    if (!selectedBooking) return;
    try {
      await updateBookingMutation.mutateAsync({
        id: selectedBooking._id || selectedBooking.id,
        data: updatedData
      });
      toast({ title: "Booking Updated", description: "The booking details have been saved." });
      refetchBookings(); 
      setIsEditOpen(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Update Failed", description: "Could not save changes.", variant: "destructive" });
    }
  };

  // --- EXPORT FUNCTIONS ---
  const handleDownloadCSV = () => {
    const getData = () => {
       if (activeTab === "inventory") return inventoryData.map((m, i) => ({ 
         "S.No": i + 1, 
         ID: m.id, 
         Location: m.name, 
         Type: m.type, 
         District: m.district, 
         Status: m.status, 
         Price: m.pricePerMonth,
         "View Link": `${window.location.origin}/media/${m.id}`
       }));
       
       if (activeTab === "bookings") return bookingData.map(b => ({ 
         ID: b.displayId, 
         Media: b.media?.name || "Unknown", 
         Start: formatDate(b.startDate), 
         End: formatDate(b.endDate), 
         Status: b.status, 
         Payment: b.paymentStatus, 
         Amount: b.amount, 
         Paid: b.amountPaid 
       }));
       if (activeTab === "customers") return customerData.map(b => ({ 
         ID: b.displayId, 
         Client: b.customer?.company || "Unknown", 
         Media: `${b.media?.name || ''} (${b.media?.type || ''})`, 
         Location: `${b.media?.city}, ${b.media?.district}`, 
         Status: b.status, 
         Payment: b.paymentStatus, 
         Total: b.amount 
       }));
       return groupData.map(b => ({ 
         ID: b.displayId, 
         Company: b.customer?.company || "Unknown", 
         Group: b.customer?.group, 
         Media: `${b.media?.name} - ${b.media?.type}`, 
         Status: b.status, 
         Payment: b.paymentStatus, 
         Balance: b.amount - b.amountPaid 
       }));
    };
    
    const data = getData();
    if(data.length === 0) return;

    const headerRows = [
      ["SHREE RADHE ADVERTISERS - OFFICIAL REPORT"],
      [`Generated On: ${new Date().toLocaleString()}`],
      [`Generated By: ${user?.name || "System Admin"}`],
      [`Active Filters: ${getFilterContext()}`],
      [], 
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

    // 👇 ADDED: Log the download action
    apiClient.post('/analytics/log', {
      action: 'EXPORT',
      module: 'REPORTS',
      description: `Downloaded ${activeTab.toUpperCase()} Report (CSV)`
    }).catch(err => console.error("Logging failed", err));
  };

  const handleDownloadExcel = () => {
    const getData = () => {
       if (activeTab === "inventory") return inventoryData.map((m, i) => ({ 
         "S.No": i + 1, 
         ID: m.id, 
         Location: m.name, 
         Type: m.type, 
         District: m.district, 
         Status: m.status, 
         Price: m.pricePerMonth,
         View: `=HYPERLINK("${window.location.origin}/media/${m.id}", "View")`
       }));

       if (activeTab === "bookings") return bookingData.map(b => ({ 
         ID: b.displayId, 
         Media: b.media?.name || "Unknown", 
         Start: formatDate(b.startDate), 
         End: formatDate(b.endDate), 
         Status: b.status, 
         Payment: b.paymentStatus, 
         Amount: b.amount, 
         Paid: b.amountPaid 
       }));
       if (activeTab === "customers") return customerData.map(b => ({ 
         ID: b.displayId, 
         Client: b.customer?.company || "Unknown", 
         Media: `${b.media?.name} (${b.media?.type})`, 
         Location: `${b.media?.city}, ${b.media?.district}`, 
         Status: b.status, 
         Payment: b.paymentStatus, 
         Total: b.amount 
       }));
       return groupData.map(b => ({ 
         ID: b.displayId, 
         Company: b.customer?.company || "Unknown", 
         Group: b.customer?.group, 
         Media: `${b.media?.name} - ${b.media?.type}`, 
         Status: b.status, 
         Payment: b.paymentStatus, 
         Balance: b.amount - b.amountPaid 
       }));
    };
    
    const data = getData();
    if(data.length === 0) return;
    const keys = Object.keys(data[0]);

    const headerRows = [
      ["SHREE RADHE ADVERTISERS - OFFICIAL REPORT"],
      [`Generated On: ${new Date().toLocaleString()}`],
      [`Generated By: ${user?.name || "System Admin"}`],
      [`Active Filters: ${getFilterContext()}`],
      [], 
    ];

    const csvContent = [
      ...headerRows.map(r => r.join(",")),
      keys.join(","),
      ...data.map(row => keys.map(k => {
        const val = String((row as any)[k] || '');
        if (val.startsWith('=')) return val;
        return `"${val.replace(/"/g, '""')}"`;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SRA_Smart_Report_${activeTab}.csv`;
    link.click();

    // 👇 ADDED: Log the download action
    apiClient.post('/analytics/log', {
      action: 'EXPORT',
      module: 'REPORTS',
      description: `Downloaded ${activeTab.toUpperCase()} Report (Excel)`
    }).catch(err => console.error("Logging failed", err));
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
    <div className="space-y-6 print:space-y-0 print:pb-32 relative"> 
      
      {/* GLOBAL STYLES FOR PRINT */}
      <style>
        {`
          @media print {
            @page {
              margin: 10mm; /* Minimal margins for portrait mode */
              size: auto;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><text x='150' y='150' fill='rgba(0,0,0,0.05)' font-size='24' font-family='Arial' font-weight='bold' transform='rotate(-45 150 150)' text-anchor='middle' dominant-baseline='middle'>CONFIDENTIAL</text></svg>") !important;
              background-repeat: repeat !important;
              background-position: center !important;
            }
            .bg-card, .bg-background, .bg-white, table, tr, td, th {
              background-color: transparent !important;
            }
            .shadow-sm, .shadow-md, .shadow-lg, .border, .border-b-2 {
              box-shadow: none !important;
              border: none !important;
            }
            tr {
              border-bottom: 1px solid #e5e7eb !important; 
              break-inside: avoid;
            }
            thead tr {
              border-bottom: 2px solid #000 !important;
            }
            /* COMPACT TABLE CELLS FOR PRINT */
            th, td {
               padding: 4px !important;
               font-size: 10px !important;
               vertical-align: top;
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
          <Button variant="outline" onClick={() => setIsPrinting(true)} disabled={isPrinting}>
            <Printer className="h-4 w-4 mr-2" /> {isPrinting ? "Preparing..." : "Print / PDF"}
          </Button>
          <Button variant="outline" onClick={handleDownloadCSV}>
            <FileDown className="h-4 w-4 mr-2" /> Download CSV
          </Button>
          <Button onClick={handleDownloadExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Download Excel / Sheets
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
                      <TableHead className="print:w-[30px] print:text-center">S.No</TableHead>
                      <TableHead className="print:w-[50px]">ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-center print:text-black print:w-[40px]">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCurrentPageData(inventoryData).map((media, index) => (
                      <TableRow 
                        key={media.id} 
                        className="print:border-b print:border-gray-200 cursor-pointer hover:bg-muted/50 print:p-0"
                        onClick={() => navigate(`/admin/media/${media.id}`)}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground print:text-[10px] print:p-1 print:text-center">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-mono text-xs print:text-[10px] print:p-1">{media.id}</TableCell>
                        <TableCell className="font-medium print:text-[10px] print:p-1 print:whitespace-normal">{media.name}</TableCell>
                        <TableCell className="print:text-[10px] print:p-1">{media.type}</TableCell>
                        <TableCell className="print:text-[10px] print:p-1 print:whitespace-normal">{media.city}, {media.district}</TableCell>
                        {/* FIX: Use helper function for corrected colors */}
                        <TableCell className="print:p-1">{getStatusBadge(media.status)}</TableCell>
                        <TableCell className="text-right print:text-[10px] print:p-1">₹{media.pricePerMonth.toLocaleString()}</TableCell>
                        <TableCell className="text-center print:p-1">
                          
                          {/* 1. EYE ICON (Screen Only) */}
                          <a 
                            href={`/media/${media.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors print:hidden"
                            title="View on Live Website"
                          >
                            <Eye className="h-4 w-4" />
                          </a>

                          {/* 2. TEXT LINK (Print Only) */}
                          <a 
                            href={`${window.location.origin}/media/${media.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden print:inline text-blue-600 underline text-[10px] font-medium"
                          >
                            View
                          </a>

                        </TableCell>
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
                      {/* FIX: Set fixed widths for ID and Duration */}
                      <TableHead className="w-[120px] print:w-[80px]">Booking ID</TableHead>
                      <TableHead>Media</TableHead>
                      <TableHead className="w-[150px] print:w-[100px]">Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Paid / Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCurrentPageData(bookingData).map((booking) => {
                      const balance = booking.amount - booking.amountPaid;
                      return (
                        <TableRow 
                          key={booking.id} 
                          className="print:border-b print:border-gray-200 print:p-0 cursor-pointer hover:bg-muted/50"
                          onClick={() => handleEditClick(booking)}
                        >
                          {/* FIX: Professional Formatted Sequential ID */}
                          <TableCell className="font-mono text-xs print:text-[10px] print:p-1 text-primary font-medium">
                            {booking.displayId}
                          </TableCell>
                          
                          {/* UPDATED: Uses enriched booking.media object */}
                          <TableCell className="print:p-1">
                            <div className="font-medium print:text-[10px] print:whitespace-normal">{booking.media?.name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground print:text-[9px] print:whitespace-normal">{booking.media?.district || "Unknown"}</div>
                          </TableCell>
                          
                          {/* FIX: Use helper to format dates cleanly */}
                          <TableCell className="print:p-1 whitespace-nowrap">
                            <div className="text-xs print:text-[10px]">{formatDate(booking.startDate)}</div>
                            <div className="text-xs text-muted-foreground print:text-[9px]">{formatDate(booking.endDate)}</div>
                          </TableCell>
                          
                          <TableCell className="print:p-1">{getStatusBadge(booking.status)}</TableCell><TableCell className="print:p-1">{getStatusBadge(booking.paymentStatus)}</TableCell>
                          <TableCell className="text-right print:p-1"><div className="text-xs font-medium text-success print:text-[10px]">₹{booking.amountPaid.toLocaleString()}</div>{balance > 0 && <div className="text-xs text-destructive print:text-[10px]">Due: ₹{balance.toLocaleString()}</div>}</TableCell>
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
                      <TableHead className="w-[30%]">Media Details</TableHead>
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
                      getCurrentPageData(customerData).map((booking) => (
                          <TableRow 
                            key={booking.id} 
                            className="print:border-b print:border-gray-200 print:p-0 cursor-pointer hover:bg-muted/50"
                            onClick={() => handleEditClick(booking)}
                          >
                             {/* UPDATED: Uses enriched booking.customer object */}
                            <TableCell className="font-medium print:p-1 print:text-[10px] align-top">
                              <div className="flex items-center gap-2"><Building2 className="h-3 w-3 text-muted-foreground print:hidden" />{booking.customer?.company || "Unknown"}</div>
                              <div className="text-xs text-muted-foreground ml-5 print:ml-0 print:text-[9px] font-mono">{booking.displayId}</div>
                            </TableCell>
                            
                            {/* UPDATED: Detailed Media Cell */}
                            <TableCell className="print:p-1 align-top">
                              <div className="font-medium text-sm print:text-[10px] whitespace-normal leading-snug mb-1">
                                {booking.media?.name || "Unknown Media"}
                              </div>
                              <div className="text-xs text-muted-foreground print:text-[9px] whitespace-normal">
                                <Badge variant="outline" className="mr-1.5 px-1 py-0 h-auto font-normal text-[10px] border-muted-foreground/30">{booking.media?.type || "N/A"}</Badge>
                                {booking.media?.city}, {booking.media?.district}
                              </div>
                            </TableCell>

                            <TableCell className="print:p-1 align-top">{getStatusBadge(booking.status)}</TableCell>
                            <TableCell className="print:p-1 align-top">{getStatusBadge(booking.paymentStatus)}</TableCell>
                            <TableCell className="text-right print:p-1 align-top">
                              <div className="font-medium print:text-[10px]">₹{booking.amountPaid.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground print:text-[9px]">of ₹{booking.amount.toLocaleString()}</div>
                            </TableCell>
                          </TableRow>
                        ))
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
                      <TableHead>Media Details</TableHead>
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
                         const balance = booking.amount - booking.amountPaid;
                         return (
                          <TableRow 
                            key={booking.id} 
                            className="print:border-b print:border-gray-200 print:p-0 cursor-pointer hover:bg-muted/50"
                            onClick={() => handleEditClick(booking)}
                          >
                             {/* UPDATED: Uses enriched booking.customer object */}
                            <TableCell className="font-medium print:p-1 print:text-[10px] align-top">{booking.customer?.company || "Unknown"}</TableCell>
                            <TableCell className="print:p-1 align-top">
                                <Badge variant="outline" className="font-normal print:text-[9px]">{booking.customer?.group || "N/A"}</Badge>
                            </TableCell>
                            
                            {/* UPDATED: Detailed Media Cell */}
                            <TableCell className="print:p-1 align-top">
                              <div className="font-medium text-sm print:text-[10px] whitespace-normal leading-snug mb-1">
                                {booking.media?.name || "Unknown Media"}
                              </div>
                              <div className="text-xs text-muted-foreground print:text-[9px] whitespace-normal">
                                <span className="font-medium">{booking.media?.type}</span> • {booking.media?.city}
                              </div>
                            </TableCell>

                            <TableCell className="print:p-1 align-top">{getStatusBadge(booking.status)}</TableCell>
                            <TableCell className="print:p-1 align-top">{getStatusBadge(booking.paymentStatus)}</TableCell>
                            <TableCell className="text-right print:p-1 align-top">
                              <div className="text-xs font-medium print:text-[10px]">₹{booking.amountPaid.toLocaleString()}</div>
                              {balance > 0 && <div className="text-xs text-destructive print:text-[10px]">Bal: ₹{balance.toLocaleString()}</div>}
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

      {/* --- EDIT DIALOG RENDERER --- */}
      {selectedBooking && (
        <EditBookingDialog 
          open={isEditOpen} 
          onOpenChange={setIsEditOpen} 
          booking={selectedBooking} 
          onSave={handleBookingSave}
        />
      )}

      {/* --- ADDED: PRINT FOOTER (Sticky) --- */}
      <div className="hidden print:flex fixed bottom-0 left-0 w-full justify-between items-center text-[10px] text-gray-500 border-t border-gray-200 pt-2 bg-white pb-4 z-50">
        <p>© {new Date().getFullYear()} Shree Radhe Advertisers. All rights reserved.</p>
        <p>CONFIDENTIAL: For internal use only.</p>
      </div>
    </div>
  );
}