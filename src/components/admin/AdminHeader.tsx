import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Bell, Trash2, KeyRound, LogOut } from "lucide-react"; 
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

// Define the interface for the props
interface AdminHeaderProps {
  onOpenBin: () => void;
  binCount: number;
}

export function AdminHeader({ onOpenBin, binCount }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State for the Password Dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Get user initials safely
  const initials = user?.name 
    ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'U';

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur transition-all duration-300 sm:px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold tracking-tight">Admin Dashboard</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Recycle Bin Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative" 
            onClick={onOpenBin}
            title="Recycle Bin"
          >
            <Trash2 className="h-5 w-5" />
            {binCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                {binCount}
              </span>
            )}
          </Button>

          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          
          <ThemeToggle />

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="" alt={user?.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold mt-1">
                    {user?.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Change Password Item */}
              <DropdownMenuItem onClick={() => setShowPasswordDialog(true)} className="cursor-pointer">
                <KeyRound className="mr-2 h-4 w-4" />
                Change Password
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Logout Item */}
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Render Dialog Component */}
      <ChangePasswordDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog} />
    </>
  );
}