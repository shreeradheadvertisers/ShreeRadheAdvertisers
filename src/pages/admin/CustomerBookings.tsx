/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Users, Search, Building2, Mail, Phone, MapPin, Calendar, IndianRupee,
  ChevronDown, ChevronUp, ExternalLink, Plus, Pencil, Trash2, Settings, FolderCog, Eye, MoreHorizontal,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { customerGroups as initialGroups } from "@/lib/data";
import type { Customer, Booking } from "@/lib/api/types"; 

import { AddCustomerDialog, EditCustomerDialog, DeleteCustomerDialog } from "@/components/admin/CustomerManagement";
import { CreateBookingDialog } from "@/components/admin/CreateBookingDialog";
import { CustomerGroupInsights } from "@/components/admin/CustomerGroupInsights";
import { ManageGroupsDialog } from "@/components/admin/GroupManagement";
import { EditBookingDialog, ViewBookingDialog, DeleteBookingDialog, AllBookingsDialog } from "@/components/admin/BookingManagement";
import { toast } from "@/hooks/use-toast";
import { formatIndianRupee } from "@/lib/utils";
import { useCustomers } from "@/hooks/api/useCustomers"; 
import { useBookings, useUpdateBooking, useDeleteBooking } from "@/hooks/api/useBookings";

// Helper component for pagination controls
function PaginationControls({ 
  currentPage, 
  totalPages, 
  onPageChange,
  totalItems,
  pageSize
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (p: number) => void;
  totalItems: number;
  pageSize: number;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-border/50">
      <p className="text-xs text-muted-foreground">
        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} records
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <div className="flex items-center justify-center min-w-[80px] text-sm font-medium">
          {currentPage} / {totalPages}
        </div>
        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

interface CustomerCardProps {
  customer: Customer;
  bookings: Booking[];
  onEditBooking: (b: Booking) => void;
  onDeleteBooking: (b: Booking) => void;
  onViewBooking: (b: Booking) => void;
}

function CustomerCard({ customer, bookings, onEditBooking, onDeleteBooking, onViewBooking }: CustomerCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const activeBookings = bookings.filter(b => b.status === 'Active').length;
  const completedBookings = bookings.filter(b => b.status === 'Completed').length;
  const upcomingBookings = bookings.filter(b => b.status === 'Upcoming').length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg">{customer.company}</CardTitle>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Badge variant="outline" className="text-xs font-normal">{customer.group || 'General'}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-xl font-bold text-primary">{bookings.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-xl font-bold text-success flex items-center justify-end gap-0.5">
                    <IndianRupee className="h-4 w-4" /> 
                    {(bookings.reduce((sum, b) => sum + (b.amount || 0), 0) / 100000).toFixed(1)}L
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0">
                  {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-muted-foreground" /> <span className="font-medium">Contact:</span> <span>{customer.name}</span></div>
              <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> <span>{customer.email}</span></div>
              <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> <span>{customer.phone}</span></div>
              <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /> <span>{customer.address}</span></div>
            </div>
            
            <div className="flex gap-4">
              <Badge variant="success" className="px-3 py-1">{activeBookings} Active</Badge>
              <Badge variant="secondary" className="px-3 py-1">{completedBookings} Completed</Badge>
              <Badge variant="outline" className="px-3 py-1">{upcomingBookings} Upcoming</Badge>
            </div>

            <div className="border border-border/50 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Media</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => {
                    const media = booking.mediaId || booking.media;
                    return (
                      <TableRow key={booking._id || booking.id} className="hover:bg-muted/30 group">
                        <TableCell className="font-mono text-xs">{booking.id || booking._id}</TableCell>
                        <TableCell>
                          <div><p className="font-medium">{media?.name || "N/A"}</p><p className="text-xs text-muted-foreground">{media?.city}</p></div>
                        </TableCell>
                        <TableCell><div className="text-sm"><p>{booking.startDate?.split('T')[0]}</p><p className="text-xs text-muted-foreground">{booking.endDate?.split('T')[0]}</p></div></TableCell>
                        <TableCell><span className="flex items-center font-semibold"><IndianRupee className="h-3 w-3" />{booking.amount?.toLocaleString()}</span></TableCell>
                        <TableCell>
                          <Badge 
                             className="capitalize"
                             variant={
                              booking.status?.toLowerCase() === 'active' ? 'success' : 
                              booking.status?.toLowerCase() === 'completed' ? 'secondary' : 
                              'outline'
                            }>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={(e) => { e.stopPropagation(); onViewBooking(booking); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEditBooking(booking)}><Pencil className="h-4 w-4 mr-2" /> Modify</DropdownMenuItem>
                                <DropdownMenuItem asChild><Link to={`/admin/media/${media?._id || media?.id}`}><ExternalLink className="h-4 w-4 mr-2" /> View Media</Link></DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => onDeleteBooking(booking)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {bookings.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No bookings found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function CustomerBookings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("bookings");
  
  // 1. PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 2. DATA FETCHING (OPTIMIZED WITH PAGINATION)
  const { data: customersResponse, isLoading: isLoadingCustomers } = useCustomers({ 
    search: searchQuery,
    page: currentPage,
    limit: itemsPerPage
  });

  // Limit bookings fetch to 200 to balance stats accuracy with server speed
  const { data: bookingsData, isLoading: isLoadingBookings } = useBookings({ limit: 200 });
  const allBookings = useMemo(() => bookingsData?.data || [], [bookingsData]);

  const updateBookingMutation = useUpdateBooking();
  const deleteBookingMutation = useDeleteBooking();

  // Reset page when searching to avoid empty result views
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // 3. DYNAMIC CUSTOMER DATA PROCESSING
  const customers = useMemo(() => {
    if (isLoadingCustomers && !customersResponse) return [];
    const sourceData = customersResponse?.data || [];
    
    return sourceData.map((c: any) => {
      const id = c._id || c.id;
      // Filter bookings locally for the expanded card stats
      const custBookings = allBookings.filter(b => {
        const bCustId = typeof b.customerId === 'object' ? b.customerId._id : b.customerId;
        return bCustId === id;
      });

      return {
        ...c,
        id,
        group: c.group || 'General',
        // Calculate recent stats locally
        totalBookings: custBookings.length,
        totalSpent: custBookings.reduce((sum, b) => sum + (b.amount || 0), 0),
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: c.updatedAt || new Date().toISOString()
      } as Customer;
    });
  }, [customersResponse, allBookings, isLoadingCustomers]);

  const [groups, setGroups] = useState<string[]>(initialGroups);

  // Dialog States
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [manageGroupsOpen, setManageGroupsOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [deleteBooking, setDeleteBooking] = useState<Booking | null>(null);
  const [allBookingsDialogOpen, setAllBookingsDialogOpen] = useState(false);

  const totalRevenue = allBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const pagination = customersResponse?.pagination;

  const handleUpdateBooking = (updatedBooking: Booking) => {
    updateBookingMutation.mutate({ 
      id: updatedBooking._id || updatedBooking.id, 
      data: updatedBooking 
    });
  };

  const handleDeleteBooking = (id: string) => {
    deleteBookingMutation.mutate(id);
    toast({ title: "Booking Deleted", description: "The record has been updated." });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Customer Bookings</h1>
          <p className="text-muted-foreground mt-1">Live overview of customer history</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setManageGroupsOpen(true)}><FolderCog className="h-4 w-4 mr-2" />Groups</Button>
          <Button variant="outline" onClick={() => setAddCustomerOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Client</Button>
          <CreateBookingDialog />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="bookings">Customer Bookings</TabsTrigger>
          <TabsTrigger value="manage">Manage Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-6 mt-6">
          {/* TOP STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card/50 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group" onClick={() => setActiveTab("manage")}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-white transition-colors"><Users className="h-6 w-6"/></div>
                <div><p className="text-sm text-muted-foreground">Total Clients</p><p className="text-2xl font-bold">{pagination?.total || customers.length}</p></div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group" onClick={() => setAllBookingsDialogOpen(true)}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="rounded-xl bg-accent/10 p-3 text-accent group-hover:bg-accent group-hover:text-white transition-colors"><Calendar className="h-6 w-6"/></div>
                <div><p className="text-sm text-muted-foreground">Recent Bookings</p><p className="text-2xl font-bold">{allBookings.length}</p></div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="rounded-xl bg-success/10 p-3 text-success group-hover:bg-success group-hover:text-white transition-colors"><IndianRupee className="h-6 w-6"/></div>
                <div>
                  <p className="text-sm text-muted-foreground">Recent Revenue</p>
                  <p className="text-2xl font-bold">₹{(totalRevenue / 100000).toFixed(2)} L</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="my-8">
            <CustomerGroupInsights customers={customers} allBookings={allBookings} />
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search company..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>

          <div className="space-y-4">
            {isLoadingCustomers ? (
               <div className="p-12 text-center text-muted-foreground">Loading records...</div>
            ) : customers.length > 0 ? (
              <>
                {customers.map((customer) => (
                  <CustomerCard 
                    key={customer._id || customer.id} 
                    customer={customer} 
                    bookings={allBookings.filter(b => {
                      const bCustId = typeof b.customerId === 'object' ? b.customerId._id : b.customerId;
                      return bCustId === customer.id;
                    })} 
                    onEditBooking={setEditBooking}
                    onDeleteBooking={(b) => setDeleteBooking(b)}
                    onViewBooking={setViewBooking}
                  />
                ))}
                
                <PaginationControls 
                  currentPage={currentPage}
                  totalPages={pagination?.totalPages || 1}
                  onPageChange={setCurrentPage}
                  totalItems={pagination?.total || 0}
                  pageSize={itemsPerPage}
                />
              </>
            ) : (
              <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">No customers found matching your criteria.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="manage" className="mt-6">
          <Card className="bg-card/50">
            <CardHeader><div className="flex flex-col sm:flex-row justify-between gap-4"><CardTitle className="flex gap-2"><Settings className="h-5 w-5"/> Manage Clients</CardTitle><Button onClick={() => setAddCustomerOpen(true)}><Plus className="h-4 w-4 mr-2"/> Add Client</Button></div></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Company</TableHead><TableHead>Group</TableHead><TableHead>Bookings (Recent)</TableHead><TableHead>Spent (Recent)</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {isLoadingCustomers ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-4">Loading clients...</TableCell></TableRow>
                    ) : customers.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.id.substring(0, 6)}...</TableCell>
                        <TableCell className="font-medium">{c.company}</TableCell>
                        <TableCell><Badge variant="outline" className="font-normal">{c.group || 'N/A'}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{c.totalBookings}</Badge></TableCell>
                        <TableCell className="font-medium">₹{(c.totalSpent/100000).toFixed(1)}L</TableCell>
                        <TableCell className="text-right flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditCustomer(c)}><Pencil className="h-4 w-4"/></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteCustomer(c)}><Trash2 className="h-4 w-4"/></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <PaginationControls 
                currentPage={currentPage}
                totalPages={pagination?.totalPages || 1}
                onPageChange={setCurrentPage}
                totalItems={pagination?.total || 0}
                pageSize={itemsPerPage}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AllBookingsDialog open={allBookingsDialogOpen} onOpenChange={setAllBookingsDialogOpen} bookings={allBookings} customers={customers} onEdit={setEditBooking} onDelete={(b) => setDeleteBooking(b)} onView={setViewBooking} />
      <AddCustomerDialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen} onCustomerAdded={() => {}} availableGroups={groups} onAddGroup={(g) => setGroups([...groups, g])} />
      {editCustomer && <EditCustomerDialog customer={editCustomer} open={!!editCustomer} onOpenChange={() => setEditCustomer(null)} onCustomerUpdated={() => {}} availableGroups={groups} onAddGroup={() => {}} />}
      {deleteCustomer && <DeleteCustomerDialog customer={deleteCustomer} open={!!deleteCustomer} onOpenChange={() => setDeleteCustomer(null)} onCustomerDeleted={() => {}} />}
      {viewBooking && <ViewBookingDialog booking={viewBooking} open={!!viewBooking} onOpenChange={() => setViewBooking(null)} />}
      {editBooking && <EditBookingDialog booking={editBooking} open={!!editBooking} onOpenChange={() => setEditBooking(null)} onSave={handleUpdateBooking} />}
      {deleteBooking && <DeleteBookingDialog booking={deleteBooking} open={!!deleteBooking} onOpenChange={() => setDeleteBooking(null)} onConfirm={(id) => handleDeleteBooking(id)} />}
    </div>
  );
}