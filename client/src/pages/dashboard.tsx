import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, BarChart3, Settings } from "lucide-react";
import MetricsOverview from "@/components/metrics-overview";
import ChartsSection from "@/components/charts-section";
import MessageHistory from "@/components/message-history";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface SystemConfig {
  mode: 'MOCKUP' | 'DEV' | 'PROD';
  retentionDays: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get system configuration
  const { data: systemConfig } = useQuery<SystemConfig>({
    queryKey: ['/api/config'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: lastUpdated } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
    enabled: false,
    select: () => new Date(),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries();
      toast({
        title: "Dashboard Updated",
        description: "All data has been refreshed successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastUpdated = (date?: Date) => {
    if (!date) return "Never";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-slate-50 min-h-screen font-inter">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <BarChart3 className="text-white text-lg h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-xl font-semibold text-gray-900" data-testid="header-title">
                    Delivery Dashboard
                  </h1>
                  {systemConfig && (
                    <Badge 
                      className={`text-xs ${
                        systemConfig.mode === 'PROD' 
                          ? 'bg-green-100 text-green-800' 
                          : systemConfig.mode === 'DEV'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                      data-testid="badge-mode"
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      {systemConfig.mode}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 hidden sm:block">
                  LINE OA Confirmation Monitoring
                  {systemConfig && (
                    <span className="ml-2">• {systemConfig.retentionDays} day retention</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <span>Last updated: {formatLastUpdated(lastUpdated)}</span>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-primary-600 hover:bg-primary-700"
                data-testid="button-refresh"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <MetricsOverview />
        <ChartsSection />
        <MessageHistory />
      </main>
    </div>
  );
}
