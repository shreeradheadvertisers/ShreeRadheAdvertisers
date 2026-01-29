/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function ActivityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filterUser, setFilterUser] = useState("all");
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterUser !== 'all') query.append('user', filterUser);
      
      const res = await apiClient.get(`/analytics/audit-logs?${query.toString()}`);
      setLogs((res as any).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filterUser]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiClient.get('/users');
      setUsers(res as any[]);
    // eslint-disable-next-line no-empty
    } catch(e) {}
  }, []);

  useEffect(() => { fetchLogs(); fetchUsers(); }, [fetchLogs, fetchUsers]);

  const handleDownload = async () => {
    try {
      // Direct browser download
      const token = localStorage.getItem('sra_admin_token');
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/analytics/audit-logs/export?user=${filterUser}`;
      
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Audit Trail</h1>
        <div className="flex gap-2">
           <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-[180px] bg-background">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map(u => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchLogs}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          <Button onClick={handleDownload} variant="secondary">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="py-3 px-4 text-left">Time</th>
                <th className="py-3 px-4 text-left">User</th>
                <th className="py-3 px-4 text-left">Action</th>
                <th className="py-3 px-4 text-left">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No logs found.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-muted/20">
                    <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                      {format(new Date(log.createdAt), "dd MMM, HH:mm")}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {log.user?.name || log.username || "System"}
                      <div className="text-xs text-muted-foreground font-normal">{log.user?.role}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="font-mono text-xs">{log.action}</Badge>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{log.module}</div>
                    </td>
                    <td className="py-3 px-4 max-w-md truncate" title={log.description}>
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}