import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, MapPin, Calendar, CheckCircle, Loader2 } from "lucide-react";
import { useMedia, useUpdateMedia } from "@/hooks/api/useMedia";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { MediaLocation } from "@/lib/api/types";
import { useState } from "react";

const Maintenance = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: mediaResponse, isLoading } = useMedia({ status: 'Coming Soon', limit: 200 });
  const updateMedia = useUpdateMedia();
  const comingSoonMedia = mediaResponse?.data || [];
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleMakeAvailable = async (mediaId: string, mediaName: string) => {
    setUpdatingId(mediaId);
    try {
      await updateMedia.mutateAsync({ id: mediaId, data: { status: 'Available' } });
      toast({ title: "Status Updated", description: `${mediaName} is now Available.` });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update media status." });
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Coming Soon</h1>
          <p className="text-muted-foreground">Track and manage media locations that are coming soon</p>
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Coming Soon</h1>
        <p className="text-muted-foreground">Track and manage media locations that are coming soon</p>
      </div>

      {/* Summary */}
      <Card className="p-6 bg-warning/10 border-warning/20 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/admin/media?status=Coming+Soon')}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/20">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">{comingSoonMedia.length}</p>
            <p className="text-sm text-muted-foreground">Media locations marked as coming soon</p>
          </div>
        </div>
      </Card>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {comingSoonMedia.map((media: MediaLocation) => (
          <Card key={media._id || media.id} className="p-6 bg-card border-border/50 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" onClick={() => navigate(`/admin/media/${media._id || media.id}`)}>
            <div className="flex items-start justify-between mb-4">
              <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">Coming Soon</Badge>
              <span className="text-xs text-muted-foreground font-mono">{media.mediaId || media._id}</span>
            </div>

            <h3 className="font-semibold mb-2">{media.name}</h3>

            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
              <MapPin className="h-3.5 w-3.5" />
              <span>{media.city}, {media.district}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Calendar className="h-3.5 w-3.5" />
              <span>Added: {media.createdAt ? new Date(media.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>

            <div className="pt-4 border-t border-border flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/admin/media/${media._id || media.id}`); }}>
                View Details
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={updatingId === (media._id || media.id)}
                onClick={(e) => { e.stopPropagation(); handleMakeAvailable(media._id || media.id, media.name); }}
              >
                {updatingId === (media._id || media.id) ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                Make Available
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {comingSoonMedia.length === 0 && (
        <Card className="p-12 bg-card border-border/50 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
          <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
          <p className="text-muted-foreground">No media locations are currently marked as coming soon.</p>
        </Card>
      )}
    </div>
  );
};

export default Maintenance;