/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label";
import { 
  Download, RefreshCw, FileText, Calendar, CreditCard, Users, 
  MessageSquare, Filter, X, Search 
} from "lucide-react"; 
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom"; 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; 

// Constants for Filters
const MODULES = ["MEDIA", "BOOKING", "PAYMENT", "USER", "CUSTOMER", "AUTH", "SYSTEM", "REPORTS"];
const ACTIONS = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "EXPORT", "FAILED_LOGIN"];

export default function ActivityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); 

  // --- FILTERS STATE ---
  const [filterUser, setFilterUser] = useState("all");
  const [filterModule, setFilterModule] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      
      // Append filters if they are set
      if (filterUser !== 'all') query.append('user', filterUser);
      if (filterModule !== 'all') query.append('module', filterModule);
      if (filterAction !== 'all') query.append('action', filterAction);
      if (dateRange.start) query.append('startDate', dateRange.start);
      if (dateRange.end) query.append('endDate', dateRange.end);
      
      const res = await apiClient.get(`/api/analytics/audit-logs?${query.toString()}`);
      setLogs((res as any).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filterUser, filterModule, filterAction, dateRange]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/users');
      setUsers(res as any[]);
    } catch(e) { console.error(e); }
  }, []);

  useEffect(() => { fetchLogs(); fetchUsers(); }, [fetchLogs, fetchUsers]);

  const clearFilters = () => {
    setFilterUser("all");
    setFilterModule("all");
    setFilterAction("all");
    setDateRange({ start: "", end: "" });
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('sra_admin_token');
      // Build export URL with current filters
      const query = new URLSearchParams();
      if (filterUser !== 'all') query.append('user', filterUser);
      if (filterModule !== 'all') query.append('module', filterModule);
      if (filterAction !== 'all') query.append('action', filterAction);
      if (dateRange.start) query.append('startDate', dateRange.start);
      if (dateRange.end) query.append('endDate', dateRange.end);

      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/analytics/audit-logs/export?${query.toString()}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `logs-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) { alert("Download failed"); }
  };

  // 👇 DEEP LINK LOGIC
  const handleLogClick = (log: any) => {
    const { module, details } = log;
    if (!details) return;

    switch (module) {
      case 'MEDIA':
        if (details.mediaId) navigate(`/admin/media/${details.mediaId}`);
        break;
      case 'BOOKING':
        if (details.bookingId) navigate('/admin/bookings', { state: { viewBookingId: details.bookingId } });
        break;
      case 'PAYMENT':
        if (details.bookingId) navigate('/admin/payments', { state: { highlightBookingId: details.bookingId } });
        break;
      case 'CUSTOMER':
        if (details.contactId) navigate('/admin/inquiries', { state: { viewInquiryId: details.contactId } });
        break;
      default:
        break;
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'MEDIA': return <FileText className="h-3 w-3" />;
      case 'BOOKING': return <Calendar className="h-3 w-3" />;
      case 'PAYMENT': return <CreditCard className="h-3 w-3" />;
      case 'USER': return <Users className="h-3 w-3" />;
      case 'CUSTOMER': return <MessageSquare className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  const renderLogChanges = (log: any) => {
    if (!log.details || !log.details.changes || !Array.isArray(log.details.changes) || log.details.changes.length === 0) {
      return null;
    }
    return (
      <div className="mt-1 text-xs text-muted-foreground">
        <ul className="list-disc list-inside text-[11px] text-muted-foreground/90">
          {log.details.changes.map((change: string, idx: number) => (
            <li key={idx}>{change}</li>
          ))}
        </ul>
      </div>
    );
  };

  const hasActiveFilters = filterUser !== 'all' || filterModule !== 'all' || filterAction !== 'all' || dateRange.start || dateRange.end;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1>
          <p className="text-muted-foreground text-sm">Track system activities and user actions.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Unified Filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" /> 
                Filters
                {hasActiveFilters && (
                  <span className="flex h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium leading-none">Filter Logs</h4>
                  {hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters} 
                      className="h-auto p-0 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                
                <div className="grid gap-3">
                  {/* User Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">User</Label>
                    <Select value={filterUser} onValueChange={setFilterUser}>
                      <SelectTrigger>
                        <Users className="w-3 h-3 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="All Users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {users.map(u => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Module Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Module</Label>
                    <Select value={filterModule} onValueChange={setFilterModule}>
                      <SelectTrigger>
                        <FileText className="w-3 h-3 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="All Modules" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modules</SelectItem>
                        {MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Action Type</Label>
                    <Select value={filterAction} onValueChange={setFilterAction}>
                      <SelectTrigger><SelectValue placeholder="All Actions" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        {ACTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Start Date</Label>
                      <Input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">End Date</Label>
                      <Input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))} />
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" onClick={fetchLogs} disabled={loading} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button onClick={handleDownload} variant="secondary" className="hidden sm:flex">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button onClick={handleDownload} variant="secondary" size="icon" className="sm:hidden">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-t-4 border-t-primary/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="py-3 px-4 text-left w-[150px] font-medium text-muted-foreground">Time</th>
                <th className="py-3 px-4 text-left w-[180px] font-medium text-muted-foreground">User</th>
                <th className="py-3 px-4 text-left w-[140px] font-medium text-muted-foreground">Module</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Description & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 opacity-20" />
                      <p>No activity logs found matching your filters.</p>
                      {hasActiveFilters && <Button variant="link" onClick={clearFilters}>Clear Filters</Button>}
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const displayId = log.details?.customId || log.details?.mediaId;
                  const isClickable = ['MEDIA', 'BOOKING', 'PAYMENT', 'CUSTOMER'].includes(log.module) && log.details;

                  // Logic to read Snapshot fields OR Fallback to old 'user' object
                  const displayName = log.fullName || log.username || (log.user?.name) || "System";
                  const displayRole = log.role || (log.user?.role) || "System";
                  
                  // Handle filtering ID safely (New logs have string ID, old logs have object)
                  const userId = typeof log.user === 'string' ? log.user : log.user?._id;

                  return (
                    <tr key={log._id} className="hover:bg-muted/20 group transition-colors">
                      {/* 1. Time */}
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground align-top">
                        {format(new Date(log.createdAt), "MMM dd, HH:mm")}
                      </td>

                      {/* 2. User (UPDATED to use snapshot vars) */}
                      <td className="py-3 px-4 font-medium align-top">
                        <div 
                          className="cursor-pointer hover:text-primary hover:underline inline-block"
                          onClick={() => userId && setFilterUser(userId)}
                          title="Filter by this user"
                        >
                          <div className="flex items-center gap-2">
                             {/* Name */}
                            {displayName}
                            
                            {/* Deactivated Badge (Only works for old logs where populate worked) */}
                            {log.user?.deleted && (
                              <Badge variant="destructive" className="h-4 px-1 text-[9px] uppercase tracking-widest">
                                Deactivated
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground font-normal">{displayRole}</div>
                      </td>

                      {/* 3. Module */}
                      <td className="py-3 px-4 align-top">
                        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                          {log.action}
                        </Badge>
                        <div 
                          className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1.5 cursor-pointer hover:text-foreground"
                          onClick={() => setFilterModule(log.module)}
                          title="Filter by this module"
                        >
                          {getModuleIcon(log.module)}
                          {log.module}
                        </div>
                      </td>

                      {/* 4. Description */}
                      <td className="py-3 px-4 max-w-xl align-top">
                        <div 
                          className={`font-medium text-gray-900 ${isClickable ? "cursor-pointer hover:text-primary hover:underline" : ""}`}
                          onClick={() => handleLogClick(log)}
                          title={isClickable ? "Click to open details" : ""}
                        >
                          {log.description}
                          {displayId && <span className="ml-2 font-mono text-[11px] text-primary">({displayId})</span>}
                        </div>
                        {renderLogChanges(log)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}