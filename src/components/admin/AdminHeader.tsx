import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Bell, Trash2 } from "lucide-react"; // Import Trash2, removed ArchiveRestore
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

// Define the interface for the props
interface AdminHeaderProps {
  onOpenBin: () => void;
  binCount: number;
}

export function AdminHeader({ onOpenBin, binCount }: AdminHeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur transition-all duration-300 sm:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="hidden md:block">
          <h2 className="text-lg font-semibold tracking-tight">Admin Dashboard</h2>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Recycle Bin Button - Updated to Trash2 icon */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative" 
          onClick={onOpenBin}
          title="Recycle Bin"
        >
          <Trash2 className="h-5 w-5" /> {/* This matches the icon used inside the bin */}
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/placeholder.svg" alt={user?.name} />
                <AvatarFallback>{user?.name?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}