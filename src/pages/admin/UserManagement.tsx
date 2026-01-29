/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs
import { toast } from "sonner";
import { 
  Plus, Edit, Key, Trash2, Loader2, AlertCircle, Eye, EyeOff, 
  RotateCcw, CheckCircle2 // New Icons
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns"; // Ensure date-fns is installed or use native date

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [passwordMode, setPasswordMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Tab State for Soft Delete
  const [activeTab, setActiveTab] = useState("active"); 

  // General Form State
  const [formData, setFormData] = useState({ name: '', username: '', email: '', role: 'staff' });
  
  // Password State
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);

  // Fetch Users based on Active Tab
  const fetchUsers = useCallback(async () => {
    try {
      const statusParam = activeTab === 'deleted' ? 'deleted' : 'active';
      const response = await apiClient.get<any>(`/api/users?status=${statusParam}`);
      
      let userData: any[] = [];
      
      // Data Extraction Logic
      if (Array.isArray(response)) {
        userData = response;
      } else if (response.data && Array.isArray(response.data)) {
        userData = response.data;
      } else if (response.users && Array.isArray(response.users)) {
        userData = response.users;
      } else if (response.data && response.data.users && Array.isArray(response.data.users)) {
        userData = response.data.users;
      }

      setUsers(userData);

    } catch (err) { 
      console.error("Fetch Error:", err);
      toast.error("Failed to fetch users"); 
      setUsers([]); 
    }
  }, [activeTab]); // Re-run when tab changes

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset states
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEditingUser(null);
      setPasswordMode(false);
      setFormData({ name: '', username: '', email: '', role: 'staff' });
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setErrorMsg(null);
      setShowNewPass(false);
      setShowConfPass(false);
    }
    setIsOpen(open);
  };

  const openPasswordDialog = (user: any) => {
    setEditingUser(user);
    setPasswordMode(true);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setErrorMsg(null);
    setIsOpen(true);
  };

  const openEditDialog = (user: any) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name, 
      username: user.username, 
      email: user.email, 
      role: user.role 
    });
    setPasswordMode(false);
    setIsOpen(true);
  };

  const openAddDialog = () => {
    setEditingUser(null);
    setFormData({ name: '', username: '', email: '', role: 'staff' });
    setPasswordData({ newPassword: '', confirmPassword: '' }); 
    setPasswordMode(false);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (passwordMode && editingUser) {
        if (!passwordData.newPassword || !passwordData.confirmPassword) throw new Error("Please fill in both fields.");
        if (passwordData.newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
        if (passwordData.newPassword !== passwordData.confirmPassword) throw new Error("Passwords do not match.");

        await apiClient.put(`/api/users/${editingUser._id}/password`, { password: passwordData.newPassword });
        toast.success("Password updated successfully");
      } else if (editingUser) {
        await apiClient.put(`/api/users/${editingUser._id}`, formData);
        toast.success("User updated successfully");
      } else {
        await apiClient.post('/api/users', { ...formData, password: passwordData.newPassword || 'SRA@staff123' });
        toast.success("User created successfully");
      }

      handleOpenChange(false);
      fetchUsers();
    } catch (err: any) {
      const msg = err.message || err.response?.data?.message || "Operation failed";
      if (passwordMode) setErrorMsg(msg);
      else toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Soft Delete
  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to deactivate this user?")) return;
    try {
      await apiClient.delete(`/api/users/${id}`);
      toast.success("User deactivated");
      fetchUsers();
    } catch (err) { toast.error("Deactivation failed"); }
  };

  // Restore User
  const handleRestore = async (id: string) => {
    try {
      await apiClient.patch(`/api/users/${id}/restore`);
      toast.success("User restored successfully");
      fetchUsers();
    } catch (err) { toast.error("Restore failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage system access and roles.</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Tabs for Active / Deactivated */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Active Staff
            </TabsTrigger>
            <TabsTrigger value="deleted" className="gap-2 text-destructive data-[state=active]:text-destructive">
              <Trash2 className="h-4 w-4" /> Deactivated
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username/Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>
                {activeTab === 'deleted' ? 'Deactivated On' : 'Created At'}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(users) && users.length > 0 ? (
              users.map((user: any) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">
                    {user.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.username}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                          {user.role}
                      </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {user.deletedAt 
                      ? <span className="text-destructive">{format(new Date(user.deletedAt), 'dd MMM yyyy')}</span> 
                      : (user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : 'N/A')
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    {activeTab === 'active' ? (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)} title="Edit Details">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openPasswordDialog(user)} title="Change Password">
                            <Key className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(user._id)} title="Deactivate User">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      // Restore Action for Deactivated Users
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-primary hover:text-primary border-primary/20 hover:bg-primary/5 gap-2"
                        onClick={() => handleRestore(user._id)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Restore
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No {activeTab === 'deleted' ? 'deactivated' : 'active'} users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {passwordMode ? 'Reset Password' : editingUser ? 'Edit User' : 'Create User'}
            </DialogTitle>
            {passwordMode && editingUser && (
                <DialogDescription>
                    Changing password for <span className="font-semibold text-foreground">{editingUser.username}</span>
                </DialogDescription>
            )}
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
            )}

            {!passwordMode && (
              <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" placeholder="johndoe" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required disabled={!!editingUser} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={formData.role} onValueChange={val => setFormData({...formData, role: val})}>
                        <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required disabled={!!editingUser} />
                </div>
                
                {!editingUser && (
                   <div className="space-y-2 pt-2 border-t">
                      <Label htmlFor="initPass">Initial Password (Optional)</Label>
                      <div className="relative">
                        <Input 
                          id="initPass" 
                          type={showNewPass ? "text" : "password"}
                          placeholder="Default: SRA@staff123" 
                          value={passwordData.newPassword} 
                          onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} 
                          className="pr-10"
                        />
                        <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                          {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                   </div>
                )}
              </div>
            )}

            {passwordMode && (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label htmlFor="newPass">New Password</Label>
                    <div className="relative">
                      <Input 
                          id="newPass" 
                          type={showNewPass ? "text" : "password"}
                          placeholder="Min 8 characters" 
                          value={passwordData.newPassword} 
                          onChange={e => { setErrorMsg(null); setPasswordData({...passwordData, newPassword: e.target.value}); }} 
                          required minLength={8} className="pr-10"
                      />
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                        {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confPass">Confirm Password</Label>
                    <div className="relative">
                      <Input 
                          id="confPass" 
                          type={showConfPass ? "text" : "password"}
                          placeholder="Re-enter new password" 
                          value={passwordData.confirmPassword} 
                          onChange={e => { setErrorMsg(null); setPasswordData({...passwordData, confirmPassword: e.target.value}); }} 
                          required className="pr-10"
                      />
                      <button type="button" onClick={() => setShowConfPass(!showConfPass)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                        {showConfPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {passwordMode ? 'Update Password' : 'Save User'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}