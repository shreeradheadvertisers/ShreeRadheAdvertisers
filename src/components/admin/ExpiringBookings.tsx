/* eslint-disable @typescript-eslint/no-explicit-any */
import { AlertTriangle, Phone, ArrowRight, TrendingDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBookings } from "@/hooks/api/useBookings";

interface ExpiringBookingsProps {
  onViewBooking?: (booking: any) => void;
  onViewReport?: () => void;
}

export function ExpiringBookings({ onViewBooking, onViewReport }: ExpiringBookingsProps) {
  // Fetch active bookings
  const { data: bookingsRes } = useBookings({ status: 'Active' });
  const allBookings = bookingsRes?.data || [];

  const today = new Date();
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringBookings = allBookings
    .filter((b: any) => {
      const endDate = new Date(b.endDate);
      return endDate >= today && endDate <= thirtyDaysLater;
    })
    .map((b: any) => {
      const endDate = new Date(b.endDate);
      const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...b, daysLeft };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Note: Card is always rendered now to ensure it appears in the UI
  return (
    <Card className="border-none shadow-2xl bg-orange-600 text-white transition-all group overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform text-white">
        <TrendingDown className="h-32 w-32" />
      </div>
      
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-xl tracking-tight font-medium relative z-10">
            <AlertTriangle className="h-6 w-6" /> 
            Expiring Soon
          </CardTitle>
          <Badge className="bg-white/20 text-white border-none font-medium backdrop-blur-sm px-3">
            Action Required
          </Badge>
        </div>
        <p className="text-orange-50/80 text-sm relative z-10">
          {expiringBookings.length > 0 
            ? `Detecting ${expiringBookings.length} campaigns expiring within 30 days.`
            : "No campaigns currently expiring in the next 30 days."}
        </p>
      </CardHeader>

      {expiringBookings.length > 0 && (
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expiringBookings.slice(0, 3).map((booking: any, i) => (
              <div 
                key={booking._id} 
                className="flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all cursor-pointer animate-in fade-in slide-in-from-right duration-500"
                style={{ animationDelay: `${(i + 1) * 150}ms` }}
                onClick={() => onViewBooking?.(booking)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center font-medium shrink-0 shadow-inner text-lg">
                    {booking.daysLeft}d
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate uppercase tracking-tight">{booking.mediaId?.name || "Site N/A"}</p>
                    <p className="text-xs text-white/70 truncate">{booking.customerId?.company || booking.customerId?.name}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 shrink-0">
                   <a 
                     href={`tel:${booking.customerId?.phone}`} 
                     className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors"
                     onClick={(e) => e.stopPropagation()}
                   >
                     <Phone className="h-4 w-4" />
                   </a>
                   <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white">
                     <ChevronRight className="h-5 w-5" />
                   </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-center">
              <Button 
                  variant="outline" 
                  onClick={(e) => { e.stopPropagation(); onViewReport?.(); }}
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/20 gap-2 py-6 rounded-xl font-medium"
              >
                  Generate Detailed Expiry Report <ArrowRight className="h-4 w-4" />
              </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}