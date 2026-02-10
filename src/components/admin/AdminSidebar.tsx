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
  const { logout, user } = useAuth(); 
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const userRole = user?.role || 'staff'; 

  const filteredNavItems = navItems.filter(item => {
    if (item.roles) {
      return item.roles.includes(userRole);
    }
    return true;
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      {/* HEADER: Left aligned and Big Enough */}
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-start w-full">
          {collapsed ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <MapPin className="h-6 w-6" />
            </div>
          ) : (
            // Logo: h-14 (56px) is large and readable. justify-start puts it on the left.
            <img 
              src={logo} 
              alt="Shree Radhe" 
              className="h-14 w-auto object-contain transition-all" 
            />
          )}
        </div>
      </SidebarHeader>

      {/* CONTENT: Compact items (py-2) to prevent overflow */}
      <SidebarContent className="p-2 scrollbar-thin scrollbar-thumb-sidebar-border">
        <SidebarMenu className="space-y-1 pb-10">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    // Reduced padding (py-2) to keep list compact
                    "flex items-center gap-3 px-3 py-2 h-auto rounded-lg transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Link to={item.path}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border space-y-1">
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton 
              className={cn(
                "w-full gap-3 h-auto py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                collapsed && "justify-center"
              )}
              tooltip="Logout"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-8" 
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