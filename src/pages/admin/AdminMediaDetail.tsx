/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useNavigate } from "react-router-dom";
import { getMediaById } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  MapPin, 
  Maximize, 
  Lightbulb, 
  Compass, 
  Calendar,
  Edit,
  TrendingUp,
  User
} from "lucide-react";
import { useMediaById } from "@/hooks/api/useMedia";
import { useBookings } from "@/hooks/api/useBookings"; // Import hook to get full booking data
import { isBackendConfigured } from "@/lib/api/config";
import { adaptMediaLocation } from "@/lib/services/dataService";
import { MediaLocation } from "@/lib/api/types";
import { format } from "date-fns"; // Import date formatter

const AdminMediaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 1. Fetch Media Details
  const { data: apiMedia, isLoading: isLoadingMedia } = useMediaById(id || '');
  
  // 2. Fetch Full Booking History (to get Customer Names & Status)
  const { data: bookingsData, isLoading: isLoadingBookings } = useBookings({ 
    mediaId: id,
    limit: 50 // Get the last 50 bookings
  });
  
  const media = (isBackendConfigured() && apiMedia 
    ? adaptMediaLocation(apiMedia as any)
    : getMediaById(id || '')) as MediaLocation | null;

  if (isBackendConfigured() && isLoadingMedia) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Media not found</h1>
        <Button onClick={() => navigate('/admin/media')}>Back to Media</Button>
      </div>
    );
  }

  const displayImage = media.imageUrl || media.image || 'https://placehold.co/800x450?text=Image+Not+Available';

  const statusVariant = 
    media.status === 'Available' ? 'success' :
    media.status === 'Booked' ? 'destructive' : 'warning';

  // Sort bookings: Newest first
  const sortedBookings = bookingsData?.data 
    ? [...bookingsData.data].sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{media.name}</h1>
              <Badge variant={statusVariant as any}>{media.status}</Badge>
            </div>
            <p className="text-muted-foreground font-mono">{media.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Passes mediaId to Availability page for auto-fill */}
          <Button variant="outline" onClick={() => navigate(`/admin/availability?mediaId=${media.id}`)}>
            <Calendar className="h-4 w-4 mr-2" />
            Manage Availability
          </Button>
          <Button onClick={() => navigate(`/admin/media/edit/${id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Media
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Media Image */}
          <Card className="overflow-hidden bg-card border-border/50 shadow-sm">
            <img 
              src={displayImage} 
              alt={media.name}
              className="w-full aspect-video object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/800x450?text=Error+Loading+Image';
              }}
            />
          </Card>

          {/* Specs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Maximize, label: 'Size', value: media.size || 'N/A', color: 'primary' },
              { icon: Lightbulb, label: 'Lighting', value: media.lighting || 'Non-Lit', color: 'warning' },
              { icon: Compass, label: 'Facing', value: media.facing || 'N/A', color: 'success' },
              { icon: MapPin, label: 'District', value: media.district || 'N/A', color: 'destructive' },
            ].map((spec) => (
              <Card key={spec.label} className="p-4 bg-card border-border/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${spec.color}/10`}>
                    <spec.icon className={`h-4 w-4 text-${spec.color}`} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{spec.label}</div>
                    <div className="font-medium text-sm">{spec.value}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* FIX: Improved Booking History */}
          <Card className="p-6 bg-card border-border/50">
            <h3 className="text-lg font-semibold mb-4">Booking History</h3>
            <div className="space-y-3">
              {isLoadingBookings ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : sortedBookings.length > 0 ? (
                sortedBookings.map((booking: any) => {
                  // FIX: Handle populated data in either customerId (raw) or customer (adapted)
                  const customerObj = booking.customer || (typeof booking.customerId === 'object' ? booking.customerId : null);
                  const customerName = customerObj?.company || customerObj?.name || "Deleted Customer";
                  
                  // FIX: Format dates
                  const startDate = format(new Date(booking.startDate), "dd MMM yyyy");
                  const endDate = format(new Date(booking.endDate), "dd MMM yyyy");
                  const isActive = booking.status === 'Active';

                  return (
                    <div 
                      key={booking._id || booking.id} 
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                        isActive ? 'bg-primary/5 border-primary/20' : 'bg-card border-border/50'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <User className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm">{customerName}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                                {startDate} — {endDate}
                            </div>
                          </div>
                          <Badge variant={isActive ? 'default' : 'outline'} className="text-[10px] h-5">
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No booking history available</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 bg-card border-border/50">
            <h3 className="font-semibold mb-4">Location Details</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Address</div>
                  <div className="text-muted-foreground">{media.address}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div>
                  <div className="text-muted-foreground text-xs uppercase">City</div>
                  <div className="font-medium">{media.city}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs uppercase">District</div>
                  <div className="font-medium">{media.district}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-muted-foreground text-xs uppercase">State</div>
                  <div className="font-medium">{media.state}</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border/50">
            <h3 className="font-semibold mb-4">Performance Metrics</h3>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Occupancy Rate</span>
                  <span className="font-medium">{media.occupancyRate}%</span>
                </div>
                <Progress value={media.occupancyRate} className="h-2" />
              </div>
              <div className="flex items-center justify-between py-3 border-t border-border">
                <span className="text-sm text-muted-foreground">Monthly Rate</span>
                <span className="font-medium">₹{media.pricePerMonth?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-t border-border">
                <span className="text-sm text-muted-foreground">Estimated Revenue</span>
                <span className="font-medium text-success">
                  ₹{((media.pricePerMonth * 12 * media.occupancyRate) / 100).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border/50">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Media Type</div>
                <div className="text-xl font-bold">{media.type}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminMediaDetail;