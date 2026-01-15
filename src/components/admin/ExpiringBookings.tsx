/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "react-router-dom";
import { AlertTriangle, Phone, Mail, Calendar, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBookings } from "@/hooks/api/useBookings";
import { format } from "date-fns";

export function ExpiringBookings() {
  // Fetch active bookings from API
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

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return 'destructive';
    if (days <= 14) return 'warning';
    return 'secondary';
  };

  if (expiringBookings.length === 0) return null;

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Expiring Soon - Follow Up Required
          </CardTitle>
          <Badge variant="outline">{expiringBookings.length} bookings</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {expiringBookings.map((booking: any) => (
          <div key={booking._id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border">
            <div className="shrink-0">
              <Badge variant={getUrgencyColor(booking.daysLeft)}>{booking.daysLeft} days left</Badge>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm truncate">{booking.mediaId?.name || "N/A"}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {booking.mediaId?.city}, {booking.mediaId?.district}
                  </p>
                </div>
              </div>

              <div className="p-2 rounded bg-background/50 space-y-1">
                <p className="text-sm font-medium">{booking.customerId?.company || booking.customerId?.name}</p>
                <div className="flex items-center gap-4 pt-1">
                  <a href={`tel:${booking.customerId?.phone}`} className="text-xs text-primary flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {booking.customerId?.phone}
                  </a>
                  <a href={`mailto:${booking.customerId?.email}`} className="text-xs text-primary flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {booking.customerId?.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(booking.startDate), 'dd/MM/yyyy')}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-medium text-foreground">{format(new Date(booking.endDate), 'dd/MM/yyyy')}</span>
              </div>
            </div>

            <div className="shrink-0">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/admin/media/${booking.mediaId?._id}`}>View</Link>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}