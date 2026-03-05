/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  Area, Legend, ComposedChart
} from 'recharts';
import {
  TrendingUp, MapPin, IndianRupee, Users, Zap,
  Activity, ArrowUpRight, LayoutDashboard,
  ShieldCheck, BarChart3, TrendingDown,
  Globe, AlertTriangle, Clock, Banknote, Info, ChevronRight, CheckCircle2, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  useCityLossData,
  useVacantSites,
  useRevenueTrend,
  useStateRevenue,
  useDashboardStats,
  useOccupancyData,
} from "@/hooks/api/useAnalytics";

// Helper to format Indian currency
const formatCurrency = (value: number): string => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)} K`;
  return `₹${value.toLocaleString('en-IN')}`;
};

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const Analytics = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('year');

  // State for the interactive Drill-Down
  const [drillDown, setDrillDown] = useState<{
    open: boolean;
    title: string;
    type: 'critical' | 'portfolio' | 'city' | 'type' | 'expiring' | 'cityLoss' | null;
    selectedCity?: string;
  }>({ open: false, title: '', type: null });

  // API Hooks - fetch live data from backend
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: apiCityLoss, isLoading: cityLossLoading } = useCityLossData();
  const { data: apiVacantSites, isLoading: vacantSitesLoading } = useVacantSites(drillDown.selectedCity || null);
  const { data: apiStateRevenue, isLoading: stateRevLoading } = useStateRevenue();
  const { data: apiRevenueTrend, isLoading: trendLoading } = useRevenueTrend();
  const { data: apiOccupancy } = useOccupancyData();

  // Derived stats from dashboard API
  const stats = dashboardStats;
  const totalPortfolioValue = stats?.grossRevenue || 0;
  const revenueCollected = stats?.totalRevenue || 0;
  const pendingPayments = stats?.pendingPayments || 0;
  const totalVacant = stats?.available || 0;

  // City loss derived values
  const cityLossData = apiCityLoss || [];
  const totalRevenueLoss = cityLossData.reduce((sum, c) => sum + c.loss, 0);
  const bestRevenueState = (apiStateRevenue && apiStateRevenue.length > 0) ? apiStateRevenue[0] : null;

  // --- ENHANCED CALCULATIONS (from API data) ---
  const analyticsData = useMemo(() => {
    // Revenue trend + forecast
    const sourceMonthlyData = apiRevenueTrend || [];

    const lastThreeMonths = sourceMonthlyData.slice(-3);
    const avgGrowth = lastThreeMonths.length >= 3
      ? (lastThreeMonths[2].revenue / Math.max(lastThreeMonths[0].revenue, 1)) - 1
      : 0.1;
    const baseRevenue = lastThreeMonths.length > 0 ? lastThreeMonths[lastThreeMonths.length - 1].revenue : 0;

    const forecast = sourceMonthlyData.length > 0 ? [
      ...sourceMonthlyData.map((d: any) => ({ ...d, type: 'actual', target: Math.round(d.revenue * 1.15) })),
      { month: 'Next (F)', revenue: Math.round(baseRevenue * (1 + avgGrowth / 3)), type: 'forecast', target: Math.round(baseRevenue * 1.2) },
      { month: 'Next+1 (F)', revenue: Math.round(baseRevenue * (1 + avgGrowth / 2)), type: 'forecast', target: Math.round(baseRevenue * 1.25) }
    ] : [];

    // State revenue for charts
    const stateRev = apiStateRevenue || [];

    // Vacancy distribution from city loss data
    const aging = cityLossData.length > 0 ? [
      { range: '1-2 Vacant', count: cityLossData.filter(c => c.count <= 2).length, fill: '#10b981' },
      { range: '3-5 Vacant', count: cityLossData.filter(c => c.count > 2 && c.count <= 5).length, fill: '#6366f1' },
      { range: '6-10 Vacant', count: cityLossData.filter(c => c.count > 5 && c.count <= 10).length, fill: '#f59e0b' },
      { range: '10+ Vacant', count: cityLossData.filter(c => c.count > 10).length, fill: '#ef4444' },
    ] : [];

    return { forecast, stateRev, aging, revenueLossByCity: cityLossData };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiCityLoss, apiStateRevenue, apiRevenueTrend, cityLossData]);

  // Occupancy-based performance data
  const occupancyBuckets = useMemo(() => {
    if (!apiOccupancy || apiOccupancy.length === 0) return [];
    const highOcc = apiOccupancy.filter((m: any) => m.occupancyRate >= 75).length;
    const medOcc = apiOccupancy.filter((m: any) => m.occupancyRate >= 50 && m.occupancyRate < 75).length;
    const lowOcc = apiOccupancy.filter((m: any) => m.occupancyRate >= 25 && m.occupancyRate < 50).length;
    const veryLow = apiOccupancy.filter((m: any) => m.occupancyRate < 25).length;
    return [
      { range: 'High (75%+)', count: highOcc, fill: '#10b981' },
      { range: 'Medium (50-75%)', count: medOcc, fill: '#6366f1' },
      { range: 'Low (25-50%)', count: lowOcc, fill: '#f59e0b' },
      { range: 'Very Low (<25%)', count: veryLow, fill: '#ef4444' },
    ].filter(b => b.count > 0);
  }, [apiOccupancy]);



  // --- DRILL DOWN MODAL CONTENT ---
  const renderModalContent = () => {
    if (!drillDown.type) return null;

    // City Specific Loss Drill-down
    if (drillDown.type === 'cityLoss' || drillDown.type === 'critical') {
      if (vacantSitesLoading && drillDown.selectedCity) {
        return (
          <div className="py-20 text-center">
            <Loader2 className="h-10 w-10 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading vacant sites for {drillDown.selectedCity}...</p>
          </div>
        );
      }

      const displayList = drillDown.selectedCity
        ? (apiVacantSites?.sites || [])
        : [];

      if (displayList.length === 0 && !drillDown.selectedCity) {
        return (
          <div className="py-20 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Click a city from the loss tracker to view vacant site details.</p>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-destructive/5 border-destructive/20 shadow-none">
              <CardContent className="pt-6">
                <p className="text-xs text-destructive/70 font-bold uppercase mb-1">Monthly Loss</p>
                <p className="text-2xl font-black text-destructive">
                  {formatCurrency(apiVacantSites?.monthlyLoss || displayList.reduce((sum, s) => sum + s.pricePerMonth, 0))}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-none shadow-none">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Vacant Units</p>
                <p className="text-2xl font-black">{apiVacantSites?.count || displayList.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-none shadow-none">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Avg. Vacancy</p>
                <p className="text-2xl font-black">
                  {displayList.length > 0 ? Math.round(displayList.reduce((sum, s) => sum + s.daysVacant, 0) / displayList.length) : 0} Days
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Days Vacant</TableHead>
                  <TableHead className="text-right">Price/Mo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      No vacant sites found for this city.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayList.map((site) => (
                    <TableRow key={site.id} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => { setDrillDown(prev => ({ ...prev, open: false })); navigate(`/admin/media/${site.id}`); }}>
                      <TableCell>
                        <div className="font-medium text-sm">{site.name}</div>
                        <div className="text-[10px] text-muted-foreground">{site.address}</div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{site.type}</Badge></TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("font-bold", site.daysVacant > 60 ? "bg-rose-500" : "bg-amber-500")}>
                          {site.daysVacant} Days
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">₹{site.pricePerMonth.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    if (drillDown.type === 'portfolio') {
      const stateRevData = analyticsData.stateRev;
      if (stateRevData.length === 0) {
        return (
          <div className="py-20 text-center">
            <Info className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No state revenue data available yet. Add bookings to see the breakdown.</p>
          </div>
        );
      }
      return (
        <div className="space-y-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateRevData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} fontSize={12} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stateRevData.map((s: any) => (
                <TableRow key={s.name} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setDrillDown(prev => ({ ...prev, open: false })); navigate(`/admin/media?status=all&state=${encodeURIComponent(s.name)}`); }}>
                  <TableCell className="font-bold">{s.name}</TableCell>
                  <TableCell className="text-right font-medium">{s.count || '-'}</TableCell>
                  <TableCell className="text-right font-mono text-success font-bold">{formatCurrency(s.value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    return (
      <div className="py-20 text-center">
        <Info className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground italic">Fetching data for {drillDown.title}...</p>
      </div>
    );
  };

  // Loading state
  if (statsLoading || trendLoading) {
    return (
      <div className="space-y-6 p-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" /> Executive Intelligence Cabinet
          </h1>
          <p className="text-muted-foreground">Interactive business modeling. Click city lists or cards for deep-dive analysis.</p>
        </div>
        <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-xl border border-border/50 shadow-sm">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px] border-none shadow-none bg-transparent focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="year">Fiscal Year 2024</SelectItem>
              <SelectItem value="quarter">Q4 Deep-Dive</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-2 shadow-lg"><BarChart3 className="h-4 w-4" /> Export Audit</Button>
        </div>
      </div>

      {/* --- KPI TILES (Live API Data) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-l-primary shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group" onClick={() => setDrillDown({ open: true, title: 'Portfolio Value Breakdown', type: 'portfolio' })}>
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
            <Banknote className="h-5 w-5 text-primary group-hover:animate-bounce" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold">{formatCurrency(totalPortfolioValue)}</h3>
            <p className="text-xs font-semibold mt-1 text-success flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Collected: {formatCurrency(revenueCollected)}
            </p>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-success shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group" onClick={() => setDrillDown({ open: true, title: 'State Revenue Breakdown', type: 'portfolio' })}>
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-muted-foreground">Best Performing State</p>
            <MapPin className="h-5 w-5 text-success group-hover:animate-pulse" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold">{bestRevenueState?.name || 'N/A'}</h3>
            <p className="text-xs font-semibold mt-1 text-success">
              {bestRevenueState ? `${formatCurrency(bestRevenueState.value)} from ${bestRevenueState.count} bookings` : 'No revenue data yet'}
            </p>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group" onClick={() => setDrillDown({ open: true, title: 'Revenue Leakage Audit', type: 'critical' })}>
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-muted-foreground">Revenue at Risk</p>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold">{formatCurrency(totalRevenueLoss)}</h3>
            <p className="text-xs font-semibold mt-1 text-destructive font-mono underline decoration-dotted">
              {totalVacant} vacant sites · {formatCurrency(pendingPayments)} pending
            </p>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all group cursor-pointer" onClick={() => navigate('/admin/media')}>
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-muted-foreground">Inventory Summary</p>
            <Zap className="h-5 w-5 text-purple-500 group-hover:animate-pulse" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold">{stats?.totalMedia || 0} Sites</h3>
            <p className="text-xs font-semibold mt-1 text-purple-600">
              {stats?.booked || 0} Booked · {stats?.available || 0} Available · {stats?.comingSoon || 0} Coming Soon
            </p>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid grid-cols-4 w-full lg:w-[600px] mb-8 bg-muted/50 p-1">
          <TabsTrigger value="revenue" className="gap-2 font-bold"><IndianRupee className="h-4 w-4" /> Performance</TabsTrigger>
          <TabsTrigger value="strategy" className="gap-2 font-bold"><Globe className="h-4 w-4" /> Expansion</TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2 font-bold"><Zap className="h-4 w-4" /> Yield</TabsTrigger>
          <TabsTrigger value="clients" className="gap-2 font-bold"><Users className="h-4 w-4" /> Health</TabsTrigger>
        </TabsList>

        {/* PERFORMANCE TAB */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6">Gap Analysis & Predictive Forecast</h3>
              {analyticsData.forecast.length > 0 ? (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analyticsData.forecast}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Area type="monotone" dataKey="target" fill="hsl(var(--primary)/0.05)" stroke="hsl(var(--primary)/0.2)" strokeDasharray="5 5" name="Target" />
                      <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={45} name="Revenue">
                        {analyticsData.forecast.map((entry, index) => (
                          <Cell key={index} fill={entry.type === 'forecast' ? '#94a3b8' : '#6366f1'} opacity={entry.type === 'forecast' ? 0.4 : 1} />
                        ))}
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-muted-foreground">No revenue trend data yet. Create bookings with payments to see forecasts.</p>
                  </div>
                </div>
              )}
            </Card>

            {/* INTERACTIVE: City Loss Tracker */}
            <Card className="p-6 shadow-sm border-none bg-rose-50/50 dark:bg-rose-950/20">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <TrendingDown className="h-5 w-5" /> City Revenue Loss
              </h3>
              <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mb-6 italic">Click a city to see vacant site aging.</p>
              {cityLossLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : cityLossData.length > 0 ? (
                <div className="space-y-4">
                  {cityLossData.slice(0, 5).map(city => (
                    <div
                      key={city.name}
                      className="flex justify-between items-center p-3 bg-white dark:bg-card rounded-lg border border-rose-100 dark:border-rose-900 shadow-sm cursor-pointer hover:border-rose-400 hover:shadow-md transition-all group"
                      onClick={() => setDrillDown({
                        open: true,
                        title: `Vacancy Details: ${city.name}`,
                        type: 'cityLoss',
                        selectedCity: city.name
                      })}
                    >
                      <div>
                        <p className="font-bold text-sm text-rose-900 dark:text-rose-300 group-hover:text-rose-600 transition-colors">{city.name}</p>
                        <p className="text-[10px] text-rose-500 font-bold uppercase">{city.count} Vacant Units</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-rose-700 dark:text-rose-400">{formatCurrency(city.loss)}/mo</p>
                        <ChevronRight className="h-4 w-4 text-rose-300" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No vacant sites! All media is booked or in use.</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* EXPANSION TAB */}
        <TabsContent value="strategy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* State Revenue Distribution */}
            <Card className="p-6 border-none shadow-sm bg-emerald-50/50 dark:bg-emerald-950/20">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" /> State Revenue Leaders
              </h3>
              {stateRevLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : analyticsData.stateRev.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.stateRev.slice(0, 5).map((state: any, idx: number) => (
                    <div
                      key={state.name}
                      className="flex justify-between items-center p-4 bg-white dark:bg-card rounded-xl border border-emerald-100 dark:border-emerald-900 shadow-sm cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
                      onClick={() => navigate(`/admin/media?status=all&state=${encodeURIComponent(state.name)}`)}
                    >
                      <div>
                        <p className="font-bold text-emerald-900 dark:text-emerald-300 group-hover:text-emerald-600 transition-colors">{state.name}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500 font-bold">{state.count} Bookings</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={idx === 0 ? "bg-emerald-600" : "bg-emerald-500/80"}>
                          {formatCurrency(state.value)}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Globe className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground">No state revenue data yet.</p>
                </div>
              )}
            </Card>

            {/* State Revenue Pie Chart */}
            <Card className="p-6 border-none shadow-sm bg-muted/20">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                Revenue Distribution <ArrowUpRight className="h-5 w-5 text-primary" />
              </h3>
              {analyticsData.stateRev.length > 0 ? (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.stateRev}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        dataKey="value"
                        nameKey="name"
                        paddingAngle={4}
                      >
                        {analyticsData.stateRev.map((_: any, index: number) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend verticalAlign="bottom" iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-muted-foreground">Add bookings to see revenue distribution.</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* YIELD TAB */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Occupancy Distribution */}
            <Card className="p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Occupancy Rate Distribution</h3>
              {occupancyBuckets.length > 0 ? (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={occupancyBuckets} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="count" nameKey="range">
                        {occupancyBuckets.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-muted-foreground">No occupancy data available yet.</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Vacancy by City */}
            <Card className="p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" /> Vacancy by City
              </h3>
              {analyticsData.aging.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analyticsData.aging} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="count" nameKey="range">
                        {analyticsData.aging.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                    <p className="text-muted-foreground">No vacant sites to analyze.</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* HEALTH TAB */}
        <TabsContent value="clients" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Key Metrics */}
            <Card className="lg:col-span-1 p-6 border-none shadow-sm">
              <h3 className="text-lg font-bold mb-8">Key Metrics</h3>
              <div className="space-y-6">
                <div className="space-y-2 cursor-pointer hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors" onClick={() => navigate('/admin/bookings')}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Total Customers</span>
                    <span className="font-bold text-purple-700">{stats?.totalCustomers || 0}</span>
                  </div>
                  <Progress value={Math.min((stats?.totalCustomers || 0) * 10, 100)} className="h-2 bg-purple-100" />
                </div>
                <div className="space-y-2 cursor-pointer hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors" onClick={() => navigate('/admin/bookings')}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Active Bookings</span>
                    <span className="font-bold text-purple-700">{stats?.activeBookings || 0}</span>
                  </div>
                  <Progress value={stats?.totalMedia ? Math.round(((stats?.activeBookings || 0) / stats.totalMedia) * 100) : 0} className="h-2 bg-purple-100" />
                </div>
                <div className="space-y-2 cursor-pointer hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors" onClick={() => navigate('/admin/payments')}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Collection Rate</span>
                    <span className="font-bold text-purple-700">
                      {totalPortfolioValue > 0 ? `${Math.round((revenueCollected / totalPortfolioValue) * 100)}%` : '0%'}
                    </span>
                  </div>
                  <Progress value={totalPortfolioValue > 0 ? Math.round((revenueCollected / totalPortfolioValue) * 100) : 0} className="h-2 bg-purple-100" />
                </div>
                <div className="space-y-2 cursor-pointer hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors" onClick={() => navigate('/admin/inquiries')}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Inquiries</span>
                    <span className="font-bold text-purple-700">{stats?.totalInquiries || 0} total · {stats?.newInquiries || 0} new</span>
                  </div>
                  <Progress value={stats?.totalInquiries ? Math.round(((stats?.newInquiries || 0) / stats.totalInquiries) * 100) : 0} className="h-2 bg-purple-100" />
                </div>
              </div>
            </Card>

            {/* ACTIONABLE CRITICAL SITES CARD */}
            <Card
              className="lg:col-span-2 border-none shadow-xl bg-destructive text-white cursor-pointer hover:brightness-110 transition-all group overflow-hidden relative"
              onClick={() => setDrillDown({ open: true, title: 'Critical Vacancy Action List', type: 'critical' })}
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform">
                <TrendingDown className="h-32 w-32" />
              </div>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-xl tracking-tight">
                    <TrendingDown className="h-6 w-6" /> Revenue Leakage Summary
                  </CardTitle>
                  <Badge className="bg-white/20 text-white border-none">Immediate Action</Badge>
                </div>
                <p className="text-destructive-foreground/80 text-sm">
                  Vacant sites losing potential revenue. Click cities below to drill down.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cityLossData.length > 0 ? (
                    <>
                      {cityLossData.slice(0, 3).map((city, i) => (
                        <div
                          key={city.name}
                          className="flex items-center justify-between p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 group-hover:translate-x-2 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDrillDown({
                              open: true,
                              title: `Vacancy Details: ${city.name}`,
                              type: 'cityLoss',
                              selectedCity: city.name
                            });
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center font-bold">#{i+1}</div>
                            <div>
                              <p className="font-mono text-sm font-bold">{city.name}</p>
                              <p className="text-xs text-white/70">{city.count} vacant sites</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{formatCurrency(city.loss)}/mo</p>
                          </div>
                        </div>
                      ))}
                      <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                        <p className="text-lg font-black">Total Monthly Loss: {formatCurrency(totalRevenueLoss)}</p>
                        <p className="text-xs text-white/60 mt-1">Across {cityLossData.reduce((sum, c) => sum + c.count, 0)} vacant sites in {cityLossData.length} cities</p>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <CheckCircle2 className="h-10 w-10 text-white/50 mx-auto mb-3" />
                      <p className="text-white/80">No revenue leakage detected. All sites are booked!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* --- DRILL DOWN DIALOG --- */}
      <Dialog open={drillDown.open} onOpenChange={(open) => setDrillDown(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-2xl",
                (drillDown.type === 'critical' || drillDown.type === 'cityLoss') ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              )}>
                {(drillDown.type === 'critical' || drillDown.type === 'cityLoss') ? <TrendingDown className="h-6 w-6" /> : <Activity className="h-6 w-6" />}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">{drillDown.title}</DialogTitle>
                <DialogDescription>
                  Reviewing detailed telemetry and performance logs.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Separator className="mt-6" />

          <div className="flex-1 overflow-y-auto p-6">
            {renderModalContent()}
          </div>

          <div className="p-6 border-t bg-muted/20 flex justify-between items-center">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              <ShieldCheck className="h-3 w-3 inline mr-1" /> Live Data Stream
            </p>
            <Button onClick={() => setDrillDown(prev => ({ ...prev, open: false }))}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Analytics;