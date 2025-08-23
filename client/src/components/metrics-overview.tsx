import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Inbox, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { DashboardMetrics } from "@shared/schema";

export default function MetricsOverview() {
  const { data: metrics, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
  });

  if (error) {
    return (
      <section className="mb-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600">Failed to load metrics</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const metricCards = [
    {
      title: "Total Sent",
      value: metrics?.totalSent || 0,
      change: "+12%",
      changeText: "vs yesterday",
      icon: Send,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      testId: "metric-total-sent"
    },
    {
      title: "Total Received",
      value: metrics?.totalReceived || 0,
      change: "+8%",
      changeText: `${metrics?.responseRate.toFixed(1) || 0}% response rate`,
      icon: Inbox,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      testId: "metric-total-received"
    },
    {
      title: "Confirmed",
      value: metrics?.confirmed || 0,
      change: "+15%",
      changeText: `${metrics && metrics.totalReceived > 0 ? ((metrics.confirmed / metrics.totalReceived) * 100).toFixed(0) : 0}% of responses`,
      icon: CheckCircle,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      valueColor: "text-green-600",
      testId: "metric-confirmed"
    },
    {
      title: "Pending",
      value: metrics?.pending || 0,
      change: null,
      changeText: `${metrics && metrics.totalSent > 0 ? ((metrics.pending / metrics.totalSent) * 100).toFixed(1) : 0}% no response`,
      icon: Clock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      valueColor: "text-amber-600",
      testId: "metric-pending"
    }
  ];

  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {metricCards.map((metric, index) => (
          <Card
            key={metric.title}
            className="metric-card mobile-metric bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            data-testid={metric.testId}
          >
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <p className={`text-3xl font-bold mt-2 ${metric.valueColor || 'text-gray-900'}`}>
                      {metric.value.toLocaleString()}
                    </p>
                  )}
                  <div className="flex items-center mt-2">
                    {metric.change && (
                      <span className="inline-flex items-center text-sm font-medium text-green-700">
                        <TrendingUp className="text-xs mr-1 h-3 w-3" />
                        {metric.change}
                      </span>
                    )}
                    <span className={`text-sm text-gray-500 ${metric.change ? 'ml-2' : ''}`}>
                      {metric.changeText}
                    </span>
                  </div>
                </div>
                <div className={`${metric.iconBg} p-3 rounded-lg`}>
                  <metric.icon className={`${metric.iconColor} text-xl h-6 w-6`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
