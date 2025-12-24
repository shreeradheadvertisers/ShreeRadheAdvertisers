import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

// Updated colors to match new system
const variantStyles = {
  default: 'bg-secondary/50 text-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-green-500/10 text-green-600',
  warning: 'bg-yellow-500/10 text-yellow-600', // Fixed warning color
  danger: 'bg-red-500/10 text-red-600',
};

// Updated icon colors
const iconStyles = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-green-600',
  warning: 'text-yellow-600', // Fixed icon color
  danger: 'text-red-600',
};

export function StatsCard({ title, value, icon: Icon, trend, variant = 'default' }: StatsCardProps) {
  return (
    <Card className="p-6 bg-card border-border/50 hover:border-border transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", variantStyles[variant])}>
          <Icon className={cn("h-6 w-6", iconStyles[variant])} />
        </div>
      </div>
    </Card>
  );
}