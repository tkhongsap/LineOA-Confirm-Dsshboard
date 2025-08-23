import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ChartData, CategoryData } from "@shared/schema";
import { useState } from "react";

export default function ChartsSection() {
  const [chartPeriod, setChartPeriod] = useState("7");

  const { data: chartData, isLoading: chartLoading } = useQuery<ChartData[]>({
    queryKey: ['/api/dashboard/chart-data', chartPeriod],
    queryFn: () => fetch(`/api/dashboard/chart-data?days=${chartPeriod}`).then(res => res.json()),
  });

  const { data: categoryData, isLoading: categoryLoading } = useQuery<CategoryData[]>({
    queryKey: ['/api/dashboard/category-data'],
  });

  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends Chart */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Daily Message Trends
              </CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Sent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Received</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64" data-testid="chart-daily-trends">
              {chartLoading ? (
                <Skeleton className="h-full w-full" />
              ) : chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sent" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fill="#3b82f6"
                      fillOpacity={0.1}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="received" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fill="#10b981"
                      fillOpacity={0.1}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No chart data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Response Categories Chart */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Response Categories
              </CardTitle>
              <Select value={chartPeriod} onValueChange={setChartPeriod} data-testid="select-period">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64" data-testid="chart-categories">
              {categoryLoading ? (
                <Skeleton className="h-full w-full" />
              ) : categoryData && categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="40%"
                      outerRadius={80}
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No category data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
