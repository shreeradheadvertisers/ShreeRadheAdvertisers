/* eslint-disable @typescript-eslint/no-explicit-any */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch"; 
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Eye,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Power,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MediaLocation } from "@/lib/api/types";

interface MediaTableProps {
    data: MediaLocation[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    onPageChange: (page: number) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    onToggleStatus: (id: string, currentStatus: string) => void;
    onToggleVisibility: (id: string, currentVal: boolean) => void; 
}

export function MediaTable({
    data,
    pagination,
    onPageChange,
    onDelete,
    onEdit,
    onToggleStatus,
    onToggleVisibility, 
}: MediaTableProps) {
    const navigate = useNavigate();

    const statusVariant = (status: string) => {
        if (status === "Available") return "success";
        if (status === "Booked") return "destructive";
        if (status === "Maintenance") return "warning";
        return "secondary";
    };

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="w-[100px] pl-6">ID</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>City / District</TableHead>
                            <TableHead>Type</TableHead>
                            {/* Added Price Column */}
                            <TableHead>Price</TableHead>
                            <TableHead>Public</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((media) => {
                            const itemId = media._id || media.id;
                            const isPublic = (media as any).isPublic !== false;

                            return (
                                <TableRow key={itemId} className="hover:bg-muted/10 group">
                                    <TableCell className="font-mono text-[10px] pl-6 text-muted-foreground">
                                        {media.id}
                                    </TableCell>
                                    <TableCell className="font-semibold text-sm">
                                        {media.name}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {media.city}, {media.district}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] font-medium"
                                        >
                                            {media.type}
                                        </Badge>
                                    </TableCell>
                                    
                                    {/* Added Price Cell */}
                                    <TableCell className="text-sm font-medium">
                                        ₹{media.pricePerMonth?.toLocaleString() || "0"}
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={isPublic}
                                                onCheckedChange={(checked) => onToggleVisibility(itemId, checked)}
                                                className="data-[state=checked]:bg-green-600 scale-90"
                                            />
                                            <span className="text-[10px] text-muted-foreground w-8">
                                                {isPublic ? "Visible" : "Hidden"}
                                            </span>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <Badge
                                            variant={statusVariant(media.status)}
                                            className="text-[10px] font-bold"
                                        >
                                            {media.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="pr-6">
                                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => navigate(`/admin/media/${itemId}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-orange-500 hover:bg-orange-50"
                                                onClick={() => onToggleStatus(itemId, media.status || "Available")}
                                            >
                                                <Power className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-primary hover:bg-primary/5"
                                                onClick={() => onEdit(itemId)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                onClick={() => onDelete(itemId)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={8} // Updated from 7 to 8 to match new column count
                                    className="text-center py-12 text-muted-foreground italic"
                                >
                                    No records found on this page.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Footer */}
            {pagination && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/10">
                    <p className="text-xs text-muted-foreground">
                        Showing Page <span className="font-bold">{pagination.page}</span> of{" "}
                        <span className="font-bold">{pagination.totalPages}</span> (
                        <span className="font-bold">{pagination.total}</span> total)
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === 1}
                            onClick={() => onPageChange(pagination.page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={
                                pagination.page === pagination.totalPages ||
                                pagination.totalPages === 0
                            }
                            onClick={() => onPageChange(pagination.page + 1)}
                        >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}