
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChartContainerProps {
  title: string;
  description?: string;
  data: any[];
  type?: 'bar' | 'line';
  series: {
    name: string;
    dataKey: string;
    color: string;
  }[];
}

export const ChartContainer = ({
  title,
  description,
  data,
  type = 'bar',
  series,
}: ChartContainerProps) => {
  const isMobile = useIsMobile();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {type === 'bar' ? (
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(22, 22, 26, 0.9)',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: '#fff'
                }} 
              />
              <Legend />
              {series.map((s) => (
                <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} fill={s.color} />
              ))}
            </BarChart>
          ) : (
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(22, 22, 26, 0.9)',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: '#fff'
                }} 
              />
              <Legend />
              {series.map((s) => (
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.color}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
