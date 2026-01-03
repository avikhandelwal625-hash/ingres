import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/hooks/useLanguage';

const statusDataBase = [
  { nameKey: 'safe', value: 4793, color: 'hsl(var(--status-safe))' },
  { nameKey: 'semiCritical', value: 736, color: 'hsl(var(--status-semi-critical))' },
  { nameKey: 'critical', value: 311, color: 'hsl(var(--status-critical))' },
  { nameKey: 'overExploited', value: 1139, color: 'hsl(var(--status-over-exploited))' },
  { nameKey: 'saline', value: 110, color: 'hsl(var(--muted-foreground))' },
];

const stateWiseDataBase = [
  { stateKey: 'state_punjab', extraction: 165, safe: 15, critical: 85 },
  { stateKey: 'state_rajasthan', extraction: 137, safe: 45, critical: 55 },
  { stateKey: 'state_haryana', extraction: 133, safe: 25, critical: 75 },
  { stateKey: 'state_tamilnadu', extraction: 77, safe: 55, critical: 45 },
  { stateKey: 'state_karnataka', extraction: 71, safe: 60, critical: 40 },
  { stateKey: 'state_gujarat', extraction: 68, safe: 70, critical: 30 },
  { stateKey: 'state_maharashtra', extraction: 56, safe: 75, critical: 25 },
  { stateKey: 'state_up', extraction: 74, safe: 80, critical: 20 },
];

const rechargeData = [
  { component: 'Rainfall', value: 45, fill: 'hsl(var(--primary))' },
  { component: 'Canal Seepage', value: 18, fill: 'hsl(var(--accent))' },
  { component: 'Return Flow', value: 22, fill: 'hsl(var(--secondary))' },
  { component: 'Tanks/Ponds', value: 10, fill: 'hsl(var(--status-safe))' },
  { component: 'Others', value: 5, fill: 'hsl(var(--muted))' },
];

const yearlyTrend = [
  { year: '2017', safe: 4530, semiCritical: 681, critical: 253, overExploited: 1034 },
  { year: '2020', safe: 4520, semiCritical: 697, critical: 312, overExploited: 1186 },
  { year: '2022', safe: 4716, semiCritical: 736, critical: 311, overExploited: 1139 },
  { year: '2023', safe: 4793, semiCritical: 736, critical: 311, overExploited: 1139 },
  { year: '2024', safe: 4810, semiCritical: 725, critical: 305, overExploited: 1125 },
];

export function GroundwaterCharts() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('status');
  
  // Translate status data
  const statusData = statusDataBase.map(item => ({
    ...item,
    name: t(item.nameKey)
  }));
  
  // Translate state data
  const stateWiseData = stateWiseDataBase.map(item => ({
    ...item,
    state: t(item.stateKey)
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-primary animate-pulse" />
          {t('groundwaterStatus')} - India 2024
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="status">{t('groundwaterStatus')}</TabsTrigger>
            <TabsTrigger value="states">{t('stateWiseExtraction')}</TabsTrigger>
            <TabsTrigger value="recharge">{t('rechargeComponents')}</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Pie Chart */}
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} blocks`, 'Count']}
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Yearly Trend */}
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={yearlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area type="monotone" dataKey="safe" stackId="1" stroke="hsl(var(--status-safe))" fill="hsl(var(--status-safe))" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="semiCritical" stackId="1" stroke="hsl(var(--status-semi-critical))" fill="hsl(var(--status-semi-critical))" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="critical" stackId="1" stroke="hsl(var(--status-critical))" fill="hsl(var(--status-critical))" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="overExploited" stackId="1" stroke="hsl(var(--status-over-exploited))" fill="hsl(var(--status-over-exploited))" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap gap-4 justify-center pt-4 border-t border-border">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="states">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateWiseData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="state" type="category" width={80} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                  <Legend />
                  <Bar dataKey="extraction" name={`${t('extractionStage')} %`} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="recharge">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rechargeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="component" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}%`, 'Contribution']}
                  />
                  <Bar dataKey="value" name="Contribution %" radius={[4, 4, 0, 0]}>
                    {rechargeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
