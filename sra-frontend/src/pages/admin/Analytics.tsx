import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getChartData, getDistrictStats, mediaTypes } from "@/lib/data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { TrendingUp, Award, MapPin, Calendar } from "lucide-react";
import { useState } from "react";

const Analytics = () => {
  const { cityData, statusData, monthlyData } = getChartData();
  const districtStats = getDistrictStats();
  const [timeRange, setTimeRange] = useState('year');

  // Calculate best performers
  const bestCity = cityData[0];
  const bestDistrict = districtStats.sort((a, b) => b.totalMedia - a.totalMedia)[0];
  const bestMediaType = mediaTypes.reduce((best, type) => {
    const count = districtStats.reduce((sum, d) => sum + d.byType[type].total, 0);
    return count > (best?.count || 0) ? { type, count } : best;
  }, null as { type: string; count: number } | null);

  // Performance by media type
  const mediaTypePerformance = mediaTypes.map(type => {
    const total = districtStats.reduce((sum, d) => sum + d.byType[type].total, 0);
    const booked = districtStats.reduce((sum, d) => sum + d.byType[type].booked, 0);
    const occupancy = total > 0 ? Math.round((booked / total) * 100) : 0;
    return { type, total, booked, occupancy };
  }).filter(m => m.total > 0);

  const radarData = mediaTypePerformance.map(m => ({
    subject: m.type,
    A: m.occupancy,
    fullMark: 100,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Analytics & Insights</h1>
          <p className="text-muted-foreground">Deep dive into your advertising performance metrics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Best Performing City</p>
              <p className="text-2xl font-bold">{bestCity?.name}</p>
              <p className="text-sm text-primary">{bestCity?.count} locations</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-success/10 to-transparent border-success/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/20">
              <Award className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Top District</p>
              <p className="text-2xl font-bold">{bestDistrict?.district}</p>
              <p className="text-sm text-success">{bestDistrict?.totalMedia} media</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Popular Media Type</p>
              <p className="text-2xl font-bold">{bestMediaType?.type}</p>
              <p className="text-sm text-purple-500">{bestMediaType?.count} units</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Media Type Performance */}
        <Card className="p-6 bg-card border-border/50">
          <h3 className="text-lg font-semibold mb-4">Media Type Performance</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mediaTypePerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="type" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" name="Total" radius={[0, 4, 4, 0]} />
                <Bar dataKey="booked" fill="hsl(var(--success))" name="Booked" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Occupancy Radar */}
        <Card className="p-6 bg-card border-border/50">
          <h3 className="text-lg font-semibold mb-4">Occupancy Rate by Type</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Radar name="Occupancy %" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Seasonal Demand */}
      <Card className="p-6 bg-card border-border/50">
        <h3 className="text-lg font-semibold mb-4">Seasonal Demand Analysis</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Peak Season:</span> October - December shows highest booking rates. Consider premium pricing during this period.
          </p>
        </div>
      </Card>

      {/* Comparison Table */}
      <Card className="p-6 bg-card border-border/50">
        <h3 className="text-lg font-semibold mb-4">Media Type Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium">Media Type</th>
                <th className="text-center py-3 px-4 font-medium">Total Units</th>
                <th className="text-center py-3 px-4 font-medium">Booked</th>
                <th className="text-center py-3 px-4 font-medium">Available</th>
                <th className="text-center py-3 px-4 font-medium">Occupancy Rate</th>
              </tr>
            </thead>
            <tbody>
              {mediaTypePerformance.map((item) => (
                <tr key={item.type} className="border-b border-border/50">
                  <td className="py-3 px-4 font-medium">{item.type}</td>
                  <td className="py-3 px-4 text-center">{item.total}</td>
                  <td className="py-3 px-4 text-center text-destructive">{item.booked}</td>
                  <td className="py-3 px-4 text-center text-success">{item.total - item.booked}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${item.occupancy}%` }}
                        />
                      </div>
                      <span>{item.occupancy}%</span>
                    </div>
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

export default Analytics;
