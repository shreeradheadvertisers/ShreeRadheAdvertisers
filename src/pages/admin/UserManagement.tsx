/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Edit, Key, Trash2 } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [passwordMode, setPasswordMode] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '', role: 'staff' });

  const fetchUsers = async () => {
    try {
      const data = await apiClient.get('/users');
      setUsers(data as any[]);
    } catch (err) { toast.error("Failed to fetch users"); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (passwordMode && editingUser) {
        await apiClient.put(`/users/${editingUser._id}/password`, { password: formData.password });
        toast.success("Password updated");
      } else if (editingUser) {
        await apiClient.put(`/users/${editingUser._id}`, formData);
        toast.success("User updated");
      } else {
        await apiClient.post('/users', formData);
        toast.success("User created");
      }
      setIsOpen(false);
      setEditingUser(null);
      setPasswordMode(false);
      setFormData({ name: '', username: '', email: '', password: '', role: 'staff' });
      fetchUsers();
    } catch (err) { toast.error("Operation failed"); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await apiClient.delete(`/users/${id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch (err) { toast.error("Delete failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => { setEditingUser(null); setPasswordMode(false); setIsOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username/Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user._id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.username} <br/><span className="text-xs text-muted-foreground">{user.email}</span></TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { 
                    setEditingUser(user); 
                    setFormData({ ...user, password: '' }); 
                    setPasswordMode(false);
                    setIsOpen(true); 
                  }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { 
                    setEditingUser(user); 
                    setFormData({ ...user, password: '' }); 
                    setPasswordMode(true);
                    setIsOpen(true); 
                  }}>
                    <Key className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(user._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {passwordMode ? 'Change Password' : editingUser ? 'Edit User' : 'Create User'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!passwordMode && (
              <>
                <Input placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <Input placeholder="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required disabled={!!editingUser} />
                <Input placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required disabled={!!editingUser} />
                <Select value={formData.role} onValueChange={val => setFormData({...formData, role: val})}>
                  <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            {(passwordMode || !editingUser) && (
              <Input placeholder="Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength={8} />
            )}
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}