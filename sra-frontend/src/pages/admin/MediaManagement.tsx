import { MediaTable } from "@/components/admin/MediaTable";
import { Button } from "@/components/ui/button";
import { PlusCircle, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MediaManagement = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Media Management</h1>
          <p className="text-muted-foreground">Manage all your outdoor advertising media locations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate('/admin/media/new')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Media
          </Button>
        </div>
      </div>

      <MediaTable />
    </div>
  );
};

export default MediaManagement;
