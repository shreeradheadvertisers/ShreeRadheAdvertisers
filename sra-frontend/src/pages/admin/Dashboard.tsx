import { StatsCard } from "@/components/admin/StatsCard";
import { DistrictBreakdown } from "@/components/admin/DistrictBreakdown";
import { ExpiringBookings } from "@/components/admin/ExpiringBookings";
import { CreateBookingDialog } from "@/components/admin/CreateBookingDialog";
import { Card } from "@/components/ui/card";
import { getDashboardStats, getChartData, recentBookings } from "@/lib/data";
import { MapPin, CheckCircle, XCircle, Clock, Building2, TrendingUp } from "lucide-react"; // Switched Wrench to Clock
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const stats = getDashboardStats();
  const { cityData, statusData, monthlyData } = getChartData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your advertising platform overview.</p>
        </div>
        <CreateBookingDialog />
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard 
          title="Total Media" 
          value={stats.total} 
          icon={MapPin}
          trend={{ value: 12, isPositive: true }}
          variant="primary"
        />
        <StatsCard 
          title="Available" 
          value={stats.available} 
          icon={CheckCircle}
          trend={{ value: 8, isPositive: true }}
          variant="success"
        />
        <StatsCard 
          title="Booked" 
          value={stats.booked} 
          icon={XCircle}
          trend={{ value: 15, isPositive: true }}
          variant="danger"
        />
        {/* CHANGED: Maintenance -> Coming Soon */}
        <StatsCard 
          title="Coming Soon" 
          value={stats.comingSoon} 
          icon={Clock}
          trend={{ value: 3, isPositive: true }}
          variant="warning"
        />
        <StatsCard 
          title="States" 
          value={stats.statesCount} 
          icon={Building2}
          variant="default"
        />
        <StatsCard 
          title="Districts" 
          value={stats.districtsCount} 
          icon={TrendingUp}
          variant="default"
        />
      </div>

      {/* Expiring Bookings Section */}
      <ExpiringBookings />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="lg:col-span-2 p-6 bg-card border-border/50">
          <h3 className="text-lg font-semibold mb-4">Media by City</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="p-6 bg-card border-border/50">
          <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Line Chart */}
      <Card className="p-6 bg-card border-border/50">
        <h3 className="text-lg font-semibold mb-4">Booking Trends (2024)</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="bookings" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--success))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* District Breakdown */}
      <DistrictBreakdown />

      {/* Recent Bookings */}
      <Card className="p-6 bg-card border-border/50">
        <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Booking ID</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Media ID</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Client</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Duration</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono">{booking.id}</td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary">{booking.mediaId}</Badge>
                  </td>
                  <td className="py-3 px-4">{booking.client}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {booking.startDate} - {booking.endDate}
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    ₹{booking.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;