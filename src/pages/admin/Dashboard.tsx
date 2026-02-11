/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { StatsCard } from "@/components/admin/StatsCard";
import { DistrictBreakdown } from "@/components/admin/DistrictBreakdown";
import { ExpiringBookings } from "@/components/admin/ExpiringBookings";
import { CreateBookingDialog } from "@/components/admin/CreateBookingDialog";
import { PaymentListDialog } from "@/components/admin/PaymentManagement";
import { 
  ViewBookingDialog, 
  AllBookingsDialog, 
  EditBookingDialog, 
  DeleteBookingDialog,
  getStatusLabel 
} from "@/components/admin/BookingManagement";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  useDashboardStats, 
  usePaymentStatsAnalytics, 
  useComplianceStats,
  useRevenueTrend 
} from "@/hooks/api/useAnalytics";
import { useBookings, useUpdateBooking, useDeleteBooking } from "@/hooks/api/useBookings";
import { 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building2, 
  TrendingUp, 
  IndianRupee, 
  AlertCircle, 
  Wallet, 
  ShieldAlert, 
  FileText,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatIndianRupee } from "@/lib/utils";

// --- HELPER: Generate Custom Booking ID (SRA/AY/XXXX) ---
const generateDisplayId = (booking: any, index: number) => {
  if (!booking) return "N/A";
  const dateSource = booking.startDate || booking.createdAt;
  let ay = "0000";
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
          ay = `${String(startYear).slice(-2)}${String(endYear).slice(-2)}`;
      }
  }
  const sequence = 1000 + index + 1;
  return `SRA/${ay}/${sequence}`;
};

const Dashboard = () => {
  const navigate = useNavigate(); 
  
  // --- 1. FETCH LIVE DATA FROM API ---
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: revenueTrend, isLoading: trendLoading } = useRevenueTrend(); 
  const { data: paymentStats } = usePaymentStatsAnalytics();
  const { data: complianceStats } = useComplianceStats();
  
  const { data: recentBookingsRes, refetch: refetchRecent } = useBookings({ limit: 100 });
  
  const [reportPage, setReportPage] = useState(1);
  const { data: allBookingsRes, refetch: refetchAll } = useBookings({ limit: 10, page: reportPage });
  const allBookings = allBookingsRes?.data || [];

  const updateBookingMutation = useUpdateBooking();
  const deleteBookingMutation = useDeleteBooking();

  // --- 2. DIALOG STATES ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Pending' | 'Partially Paid' | 'Paid'>('All');
  
  const [viewBooking, setViewBooking] = useState<any>(null);
  const [editBooking, setEditBooking] = useState<any>(null);
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);
  const [allBookingsOpen, setAllBookingsOpen] = useState(false);

  const rawBookings = recentBookingsRes?.data || [];
  const sortedForIndex = [...rawBookings].sort((a: any, b: any) => 
    new Date(a.startDate || a.createdAt).getTime() - new Date(b.startDate || b.createdAt).getTime()
  );
  
  const displayBookings = [...sortedForIndex].reverse().slice(0, 5);

  const openPaymentDetails = (filter: 'All' | 'Pending' | 'Partially Paid' | 'Paid') => {
    setPaymentFilter(filter);
    setIsPaymentOpen(true);
  };

  const handleEditSave = async (updatedData: any) => {
    try {
      await updateBookingMutation.mutateAsync({ 
          id: updatedData._id || updatedData.id, 
          data: updatedData 
      });
      toast.success("Booking updated successfully");
      setEditBooking(null);
      refetchRecent();
      refetchAll();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update booking");
    }
  };

  if (statsLoading || trendLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-muted-foreground">Live advertising platform overview.</p>
        </div>
        
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Booking
        </Button>
        <CreateBookingDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </div>

      {/* Compliance Alerts */}
      <h2 className="text-sm font-semibold text-destructive uppercase tracking-wider flex items-center gap-2 pt-2">
        <ShieldAlert className="h-4 w-4" /> Compliance Alerts
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Agreements Expiring" value={complianceStats?.expiringTenders || 0} icon={FileText} variant="danger" onClick={() => navigate('/admin/documents?tab=agreements')} className="cursor-pointer border-red-100" />
        <StatsCard title="Taxes Due (10 Days)" value={complianceStats?.pendingTaxes || 0} icon={Clock} variant="warning" onClick={() => navigate('/admin/documents?tab=taxes')} className="cursor-pointer border-amber-100" />
        <StatsCard title="Overdue Taxes" value={complianceStats?.overdueTaxes || 0} icon={AlertCircle} variant="danger" onClick={() => navigate('/admin/documents?tab=taxes')} className="cursor-pointer border-red-200" />
      </div>

      {/* Inventory Overview */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-2">Inventory Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard title="Total Media" value={stats?.totalMedia || 0} icon={MapPin} variant="primary" onClick={() => navigate('/admin/media')} />
        <StatsCard title="Available" value={stats?.available || 0} icon={CheckCircle} variant="success" onClick={() => navigate('/admin/media?status=Available')} />
        <StatsCard title="Booked" value={stats?.booked || 0} icon={XCircle} variant="danger" onClick={() => navigate('/admin/media?status=Booked')} />
        <StatsCard title="Coming Soon" value={stats?.comingSoon || 0} icon={Clock} variant="warning" onClick={() => navigate('/admin/media?status=Coming Soon')} />
        <StatsCard title="States" value={stats?.statesCount || 0} icon={Building2} variant="default" />
        <StatsCard title="Districts" value={stats?.districtsCount || 0} icon={TrendingUp} variant="default" />
      </div>

      {/* Financial Insights */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-4">Financial Insights</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Revenue Collected" value={`₹${((paymentStats?.totalRevenue || 0) / 100000).toFixed(1)} L`} icon={Wallet} variant="success" onClick={() => openPaymentDetails('Paid')} className="cursor-pointer" />
        <StatsCard title="Pending Dues" value={`₹${((paymentStats?.pendingDues || 0) / 100000).toFixed(1)} L`} icon={AlertCircle} variant="danger" onClick={() => openPaymentDetails('Pending')} className="border-red-200 cursor-pointer" />
        <StatsCard title="Partial Payments" value={paymentStats?.partialCount || 0} icon={IndianRupee} variant="warning" onClick={() => openPaymentDetails('Partially Paid')} className="cursor-pointer" />
      </div>

      <ExpiringBookings onViewBooking={setViewBooking} onViewReport={() => setAllBookingsOpen(true)} />

      <DistrictBreakdown />

      {/* Recent Bookings Table */}
      <Card className="p-6 bg-card border-border/50">
        <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
        {/* FIX: overflow-x-auto allows horizontal scrolling on mobile without hiding columns */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]"> {/* min-w forces scroll if screen is smaller */}
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">Booking ID</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">Media</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">Client</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">Amount</th>
              </tr>
            </thead>
            <tbody>
              {displayBookings.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No recent bookings found.</td></tr>
              ) : (
                displayBookings.map((booking: any) => {
                  const index = sortedForIndex.findIndex(b => (b._id || b.id) === (booking._id || booking.id));
                  return (
                    <tr 
                      key={booking._id} 
                      className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors" 
                      onClick={() => setEditBooking(booking)}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-medium text-primary hover:underline">
                          {generateDisplayId(booking, index)}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="secondary" className="font-mono">
                          {booking.mediaId?.name || "N/A"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium whitespace-nowrap">
                        {booking.customerId?.company || booking.customerId?.name || "Unknown"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant={booking.status === 'Active' ? 'success' : 'outline'}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-medium whitespace-nowrap">
                        ₹{formatIndianRupee(booking.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dialogs */}
      <PaymentListDialog 
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        bookings={allBookings}
        initialFilter={paymentFilter}
        onUpdateBooking={(updated: any) => updateBookingMutation.mutate({ id: updated._id, data: updated })}
        onDeleteBooking={(id: string) => setDeleteBookingId(id)}
      />

      {viewBooking && <ViewBookingDialog booking={viewBooking} open={!!viewBooking} onOpenChange={() => setViewBooking(null)} />}
      
      {editBooking && (
        <EditBookingDialog 
          booking={editBooking} 
          open={!!editBooking} 
          onOpenChange={() => setEditBooking(null)} 
          onSave={handleEditSave} 
        />
      )}

      {deleteBookingId && (
        <DeleteBookingDialog 
          booking={allBookings.find(b => (b._id || b.id) === deleteBookingId)} 
          open={!!deleteBookingId} 
          onOpenChange={() => setDeleteBookingId(null)} 
          onConfirm={(id: string) => { deleteBookingMutation.mutate(id); setDeleteBookingId(null); }} 
        />
      )}

      <AllBookingsDialog 
        open={allBookingsOpen} 
        onOpenChange={setAllBookingsOpen} 
        bookings={allBookings}
        customers={[]} 
        onEdit={(b: any) => setEditBooking(b)} 
        onDelete={(b: any) => setDeleteBookingId(b._id || b.id)}
        onView={(b: any) => { setAllBookingsOpen(false); setViewBooking(b); }}
        pagination={{ 
          currentPage: allBookingsRes?.pagination?.page || 1, 
          totalPages: allBookingsRes?.pagination?.totalPages || 1, 
          onPageChange: (page: number) => setReportPage(page) 
        }}
      />
    </div>
  );
};

export default Dashboard;