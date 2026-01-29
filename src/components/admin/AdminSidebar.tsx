import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, MapPin, PlusCircle, Calendar, BarChart3, 
  Clock, Users, FileText, CreditCard, ChevronLeft, 
  ChevronRight, LogOut, MessageSquare,
  UserCog, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

// Define navigation items with allowed roles
const navItems = [
  // Operational Items - Visible to Staff & Admins
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', roles: ['admin', 'staff', 'superadmin'] },
  { icon: MapPin, label: 'Media Management', path: '/admin/media', roles: ['admin', 'staff', 'superadmin'] },
  { icon: MessageSquare, label: 'Inquiries', path: '/admin/inquiries', roles: ['admin', 'staff', 'superadmin'] },
  { icon: PlusCircle, label: 'Add Media', path: '/admin/media/new', roles: ['admin', 'staff', 'superadmin'] },
  { icon: FileText, label: 'Documents', path: '/admin/documents', roles: ['admin', 'staff', 'superadmin'] },
  { icon: Users, label: 'Customer Bookings', path: '/admin/bookings', roles: ['admin', 'staff', 'superadmin'] },
  { icon: CreditCard, label: 'Payments', path: '/admin/payments', roles: ['admin', 'staff', 'superadmin'] },
  { icon: Calendar, label: 'Availability', path: '/admin/availability', roles: ['admin', 'staff', 'superadmin'] },
  { icon: Clock, label: 'Maintenance', path: '/admin/maintenance', roles: ['admin', 'staff', 'superadmin'] },

  // Management Items - STRICTLY Admin Only
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics', roles: ['admin', 'superadmin'] },
  { icon: FileText, label: 'Reports', path: '/admin/reports', roles: ['admin', 'superadmin'] },
  { icon: UserCog, label: 'User Management', path: '/admin/users', roles: ['admin', 'superadmin'] },
  { icon: ShieldCheck, label: 'Audit Logs', path: '/admin/logs', roles: ['admin', 'superadmin'] },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  // Get 'user' from auth context to check role
  const { logout, user } = useAuth(); 
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Filter Logic: Only show items that match the user's role
  const userRole = user?.role || 'staff'; // Default to staff if role is missing

  const filteredNavItems = navItems.filter(item => {
    // If roles are defined for the item, check if user has one of them
    if (item.roles) {
      return item.roles.includes(userRole);
    }
    // If no roles defined, show to everyone
    return true;
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          {collapsed ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
          ) : (
            <img src={logo} alt="Shree Radhe" className="h-14 w-auto" />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-3">
        <SidebarMenu className="space-y-1">
          {/* Map over filteredNavItems instead of navItems */}
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 h-auto rounded-lg transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Link to={item.path}>
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border space-y-2">
        <SidebarMenu className="space-y-2">
          <SidebarMenuItem>
            <SidebarMenuButton 
              className={cn(
                "w-full gap-3 h-auto py-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                collapsed && "justify-center"
              )}
              tooltip="Logout"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-full" 
              onClick={toggleSidebar}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}