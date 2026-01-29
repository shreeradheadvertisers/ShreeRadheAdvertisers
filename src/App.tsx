import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationDataProvider } from "@/contexts/LocationDataContext";
import { RecycleBinProvider } from "@/contexts/RecycleBinContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import ScrollToTop from "./components/ScrollToTop";
import { useEffect } from "react";
import { logPageView } from "./lib/analytics";

// Public Pages
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import MediaDetail from "./pages/MediaDetail";
import Contact from "./pages/Contact";
import About from "./pages/About";
import EditMedia from "./pages/admin/EditMedia";

// Admin Pages
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Inquiries from "./pages/admin/Inquiries";
import MediaManagement from "./pages/admin/MediaManagement";
import AdminMediaDetail from "./pages/admin/AdminMediaDetail";
import AddMedia from "./pages/admin/AddMedia";
import Availability from "./pages/admin/Availability";
import Analytics from "./pages/admin/Analytics";
import Maintenance from "./pages/admin/Maintenance";
import CustomerBookings from "./pages/admin/CustomerBookings";
import Reports from "./pages/admin/Reports";
import Payments from "./pages/admin/Payments";
import NotFound from "./pages/NotFound";
import Documents from "./pages/admin/Documents";
import UserManagement from "./pages/admin/UserManagement";
import ActivityLogs from "./pages/admin/ActivityLogs";

const queryClient = new QueryClient();

// Google Analytics Route Tracker
const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    logPageView(); // Sends page view to Google every time URL changes
  }, [location]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RecycleBinProvider>
        <LocationDataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <RouteTracker />
              <ScrollToTop />
              <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/media/:id" element={<MediaDetail />} />
                  <Route path="/contact" element={<Contact />} />
                </Route>

                {/* Admin Login - Outside Protected Area */}
                <Route path="/admin/login" element={<Login />} />

                {/* Protected Admin Routes */}
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                  <Route index element={<Dashboard />} />
                  <Route path="inquiries" element={<Inquiries />} />
                  <Route path="media" element={<MediaManagement />} />
                  <Route path="media/new" element={<AddMedia />} />
                  <Route path="media/edit/:id" element={<EditMedia />} />
                  <Route path="media/:id" element={<AdminMediaDetail />} />
                  <Route path="bookings" element={<CustomerBookings />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="availability" element={<Availability />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="documents" element={<Documents />} />
                  <Route path="maintenance" element={<Maintenance />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="logs" element={<ActivityLogs />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LocationDataProvider>
      </RecycleBinProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;