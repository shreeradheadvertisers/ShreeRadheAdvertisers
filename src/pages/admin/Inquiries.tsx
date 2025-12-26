/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useContactSubmissions, useMarkAsAttended } from "@/hooks/api/useContacts";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { 
  CheckCircle2, Clock, User, MessageSquare, 
  Phone, Calendar, Search, Eye, Inbox, TrendingUp
} from "lucide-react";
import { format } from "date-fns";

export default function Inquiries() {
  const { data: response, isLoading } = useContactSubmissions();
  const markAsAttended = useMarkAsAttended();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);

  const allInquiries = response?.data || [];
  
  // Filter logic
  const filteredInquiries = allInquiries.filter(inq => 
    inq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inq.phone.includes(searchTerm) ||
    inq.inquiryId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingInquiries = filteredInquiries.filter(inq => !inq.attended);
  const recentAttended = filteredInquiries
    .filter(inq => inq.attended)
    .sort((a, b) => new Date(b.attendedAt || 0).getTime() - new Date(a.attendedAt || 0).getTime())
    .slice(0, 6);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inquiry Management</h1>
          <p className="text-muted-foreground text-sm">Review and respond to quote requests from your website.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg"><Inbox className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Total Leads</p>
              <p className="text-2xl font-bold">{allInquiries.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-destructive/10 rounded-lg"><Clock className="h-5 w-5 text-destructive" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Pending</p>
              <p className="text-2xl font-bold">{allInquiries.filter(i => !i.attended).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-success/10 rounded-lg"><TrendingUp className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Conversion Rate</p>
              <p className="text-2xl font-bold">
                {allInquiries.length > 0 ? Math.round((allInquiries.filter(i => i.attended).length / allInquiries.length) * 100) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ACTIVE LEADS TABLE */}
      <Card className="shadow-md border-t-4 border-t-destructive">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-destructive" />
            Urgent Leads
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40 text-[11px] uppercase tracking-wider">
              <TableRow>
                <TableHead className="pl-6">Lead ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Snippet</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell></TableRow>
              ) : pendingInquiries.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center italic text-muted-foreground">No leads found matching your search.</TableCell></TableRow>
              ) : (
                pendingInquiries.map((item) => (
                  <TableRow key={item._id} className="group cursor-pointer hover:bg-muted/30" onClick={() => setSelectedInquiry(item)}>
                    <TableCell className="font-mono text-[10px] pl-6 text-muted-foreground">#{item.inquiryId}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {item.name} <Badge variant="outline" className="text-[9px] font-normal py-0">{item.phone}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground italic">
                      "{item.message}"
                    </TableCell>
                    <TableCell className="text-right pr-6 space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-8 bg-success hover:bg-success/90 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsAttended.mutate(item._id);
                        }}
                        disabled={markAsAttended.isPending}
                      >
                        Attend
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* RECENT HISTORY GRID */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-widest px-1">
          <CheckCircle2 className="h-4 w-4 text-success" /> Recent History
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentAttended.map((item) => (
            <Card key={item._id} className="bg-muted/10 border-none shadow-sm hover:ring-1 ring-success/20 transition-all">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-muted-foreground">#{item.inquiryId}</span>
                  <Badge className="bg-success/10 text-success border-none text-[9px]">Resolved</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center text-success text-xs font-bold">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-none">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Attended on {format(new Date(item.attendedAt!), "MMM d, yyyy")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* DETAIL MODAL */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Inquiry Details <Badge variant="outline">#{selectedInquiry?.inquiryId}</Badge>
            </DialogTitle>
            <DialogDescription>Full details of the customer's request.</DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Customer Name</p>
                  <p className="text-sm font-medium flex items-center gap-2"><User className="h-3.5 w-3.5 text-primary" /> {selectedInquiry.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Phone Number</p>
                  <p className="text-sm font-medium flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /> {selectedInquiry.phone}</p>
                </div>
              </div>
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg border">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Inquiry Message
                </p>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {selectedInquiry.message}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInquiry(null)}>Close</Button>
            {!selectedInquiry?.attended && (
              <Button 
                className="bg-success hover:bg-success/90 text-white"
                onClick={() => {
                  markAsAttended.mutate(selectedInquiry?._id);
                  setSelectedInquiry(null);
                }}
              >
                Mark as Attended
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}