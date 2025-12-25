import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, MapPin, PlusCircle, Calendar, BarChart3, 
  Clock, Users, FileText, CreditCard, ChevronLeft, 
  ChevronRight, ExternalLink, Trash2 
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
import logo from "@/assets/logo.png";

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: MapPin, label: 'Media Management', path: '/admin/media' },
  { icon: PlusCircle, label: 'Add Media', path: '/admin/media/new' },
  { icon: FileText, label: 'Documents', path: '/admin/documents' },
  { icon: Users, label: 'Customer Bookings', path: '/admin/bookings' },
  { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
  { icon: Calendar, label: 'Availability', path: '/admin/availability' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: FileText, label: 'Reports', path: '/admin/reports' },
  { icon: Clock, label: 'Coming Soon', path: '/admin/maintenance' },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          {collapsed ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
          ) : (
            <img src={logo} alt="Shree Radhe" className="h-10 w-auto" />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-3">
        <SidebarMenu className="space-y-1">
          {navItems.map((item) => {
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
              tooltip="Recycle Bin"
            >
              <Trash2 className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Recycle Bin</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton 
              variant="outline" 
              className={cn("w-full gap-3 h-auto py-2.5", collapsed && "justify-center")}
              onClick={() => navigate('/')}
              tooltip="Logout"
            >
              <ExternalLink className="h-5 w-5 shrink-0" />
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