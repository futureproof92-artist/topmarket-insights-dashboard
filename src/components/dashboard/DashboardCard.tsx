
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  footer?: React.ReactNode;
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const DashboardCard = ({
  title,
  value,
  description,
  footer,
  className,
  trend
}: DashboardCardProps) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className={cn(
            "text-xs font-medium flex items-center mt-1",
            trend.isPositive ? "text-green-500" : "text-red-500"
          )}>
            <span>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
            <span className="ml-1 text-muted-foreground">vs mes anterior</span>
          </div>
        )}
      </CardContent>
      {footer && <CardFooter className="pt-0">{footer}</CardFooter>}
    </Card>
  );
};
