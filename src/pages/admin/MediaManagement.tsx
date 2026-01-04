/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MapPin, PlusCircle, Upload, Loader2, FileSpreadsheet, FileText, FileBox } from "lucide-react"; 
import { useNavigate } from "react-router-dom"; 
import { MediaTable } from "@/components/admin/MediaTable";
import { mediaTypes } from "@/lib/data"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useLocationData } from "@/contexts/LocationDataContext";
import { LocationManagementDialog } from "@/components/admin/LocationManagement";

// Live API Hooks and Types
import { useMedia, useDeleteMedia, useUpdateMedia } from "@/hooks/api/useMedia";
import { MediaLocation, MediaType, MediaStatus } from "@/lib/api/types";

const MediaManagement = () => {
  const navigate = useNavigate();
  const { activeState, districts } = useLocationData();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MediaLocation | null>(null);

  const { data: mediaResponse, isLoading, isError } = useMedia({
    state: activeState,
    district: districtFilter === "all" ? undefined : districtFilter,
    type: typeFilter === "all" ? undefined : (typeFilter as MediaType),
    status: statusFilter === "all" ? undefined : (statusFilter as MediaStatus),
    search: searchQuery || undefined
  });

  const deleteMedia = useDeleteMedia();
  const updateMedia = useUpdateMedia();

  // Export Logic
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const dataToExport = mediaResponse?.data || [];
    if (dataToExport.length === 0) {
      toast({ title: "No data", description: "No records available to export.", variant: "destructive" });
      return;
    }

    if (format === 'pdf') {
      window.print();
      return;
    }

    const headers = ["ID", "Name", "Type", "District", "City", "Status", "Price"];
    const csvContent = [
      headers.join(","),
      ...dataToExport.map(m => [
        m.id, `"${m.name}"`, m.type, m.district, m.city, m.status, m.pricePerMonth
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SRA_Media_Export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xls' : 'csv'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: `Data exported as ${format.toUpperCase()}.` });
  };

  const handleSoftDelete = async () => {
    if (!itemToDelete) return;
    try {
      const deleteId = itemToDelete._id || itemToDelete.id;
      await deleteMedia.mutateAsync(deleteId);
      toast({ title: "Moved to Recycle Bin" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setItemToDelete(null);
    }
  };

  const handleStatusToggle = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Available' ? 'Maintenance' : 'Available';
    updateMedia.mutate({ id, data: { status: nextStatus as MediaStatus } });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Media Management</h1>
          <p className="text-muted-foreground">Manage outdoor advertising locations</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <Button variant="outline" onClick={() => setLocationDialogOpen(true)}>
            <MapPin className="h-4 w-4 mr-2" /> Manage Locations
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileBox className="h-4 w-4 mr-2" /> Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Download Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2" /> Print PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => navigate('/admin/media/new')}>
            <PlusCircle className="h-4 w-4 mr-2" /> Add Media
          </Button>
        </div>
      </div>

      <Card className="print:hidden border-border/50 bg-card/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districts.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {mediaTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Booked">Booked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm overflow-hidden min-h-[400px]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Fetching billboards...</p>
            </div>
          ) : (
            <MediaTable 
              data={(mediaResponse?.data || []) as any} 
              onDelete={(id) => {
                const item = mediaResponse?.data.find(m => m._id === id);
                if (item) setItemToDelete(item);
              }}
              onEdit={(id) => navigate(`/admin/media/edit/${id}`)}
              onToggleStatus={handleStatusToggle}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Recycle Bin?</AlertDialogTitle>
            <AlertDialogDescription>Deactivate "{itemToDelete?.name}" for 30 days.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSoftDelete} className="bg-destructive">Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LocationManagementDialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen} />
    </div>
  );
};

export default MediaManagement;