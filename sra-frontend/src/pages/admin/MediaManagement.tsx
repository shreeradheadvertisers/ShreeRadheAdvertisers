import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, ArchiveRestore } from "lucide-react"; 
import { Link, useNavigate } from "react-router-dom"; 
import { MediaTable } from "@/components/admin/MediaTable";
import { mediaLocations, states, districts, mediaTypes, type MediaLocation } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RecycleBinDialog } from "@/components/admin/RecycleBinDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { PlusCircle, Download } from "lucide-react"; 

const MediaManagement = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // State for all media items (both active and deleted)
  const [allMedia, setAllMedia] = useState<MediaLocation[]>(mediaLocations);
  
  // State for dialogs
  const [recycleBinOpen, setRecycleBinOpen] = useState(false);
  
  // State for Soft Delete Confirmation
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const availableDistricts = stateFilter !== "all" ? districts[stateFilter] || [] : [];

  // --- ACTIONS ---

  // 1. Soft Delete (Move to Bin) - Using ISO Date string for accurate countdown
  const handleSoftDelete = () => {
    if (!itemToDelete) return;
    
    setAllMedia(prev => prev.map(item => 
      item.id === itemToDelete 
        ? { ...item, deleted: true, deletedAt: new Date().toISOString() } 
        : item
    ));
    
    toast({ 
      title: "Moved to Recycle Bin", 
      description: "Item will be permanently deleted in 30 days." 
    });
    setItemToDelete(null);
  };

  // 2. Restore (From Bin)
  const handleRestore = (id: string) => {
    setAllMedia(prev => prev.map(item => 
      item.id === id ? { ...item, deleted: false, deletedAt: undefined } : item
    ));
  };

  // 3. Permanent Delete
  const handlePermanentDelete = (id: string) => {
    setAllMedia(prev => prev.filter(item => item.id !== id));
  };

  // Filter Logic: Only show items that are NOT deleted
  const filteredMedia = allMedia.filter((media) => {
    if (media.deleted) return false; 

    const matchesSearch = 
      media.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      media.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      media.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesState = stateFilter === "all" || media.state === stateFilter;
    const matchesDistrict = districtFilter === "all" || media.district === districtFilter;
    const matchesType = typeFilter === "all" || media.type === typeFilter;
    const matchesStatus = statusFilter === "all" || media.status === statusFilter;

    return matchesSearch && matchesState && matchesDistrict && matchesType && matchesStatus;
  });

  // Get Deleted Items for Bin
  const deletedMedia = allMedia.filter(m => m.deleted === true);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Media Management</h1>
          <p className="text-muted-foreground">Manage all your outdoor advertising media locations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          {/* RECYCLE BIN BUTTON */}
          <Button 
            variant="outline" 
            className="relative"
            onClick={() => setRecycleBinOpen(true)}
          >
            <ArchiveRestore className="h-4 w-4 mr-2" />
            Recycle Bin
            {deletedMedia.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                {deletedMedia.length}
              </span>
            )}
          </Button>

          <Button onClick={() => navigate('/admin/media/new')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Media
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
          <CardDescription>Refine your media search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, city, ID..."
                className="pl-9 bg-background/50 border-gray-200 focus:border-primary/50 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={stateFilter} onValueChange={(val) => { setStateFilter(val); setDistrictFilter("all"); }}>
              <SelectTrigger className="bg-background/50"><SelectValue placeholder="State" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={districtFilter} onValueChange={setDistrictFilter} disabled={stateFilter === "all"}>
              <SelectTrigger className="bg-background/50"><SelectValue placeholder="District" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {availableDistricts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-background/50"><SelectValue placeholder="Media Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {mediaTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background/50"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Booked">Booked</SelectItem>
                <SelectItem value="Coming Soon">Coming Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <MediaTable 
            data={filteredMedia} 
            // We pass the ID to setItemToDelete to trigger the confirmation dialog
            onDelete={(id) => setItemToDelete(id)} 
          />
        </CardContent>
      </Card>

      {/* Step 1: Confirmation Dialog for Soft Delete */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Recycle Bin?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the media from the active list. 
              You can restore it later from the Recycle Bin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSoftDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Move to Bin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Step 2: Recycle Bin Dialog (Handles Restore & Permanent Delete) */}
      <RecycleBinDialog 
        open={recycleBinOpen} 
        onOpenChange={setRecycleBinOpen}
        deletedItems={deletedMedia}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
      />
    </div>
  );
};

export default MediaManagement;