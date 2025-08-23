import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Calendar, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { BatchWithSummary } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function MessageHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("sent");
  const { toast } = useToast();
  
  const limit = 20;
  const offset = (currentPage - 1) * limit;

  // Get sent batches
  const { data: sentData, isLoading: sentLoading, error: sentError } = useQuery<{
    batches: BatchWithSummary[];
    total: number;
  }>({
    queryKey: ['/api/batches', 'sent', limit, offset],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('type', 'sent');
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());
      return fetch(`/api/batches?${params.toString()}`).then(res => res.json());
    },
    enabled: activeTab === 'sent'
  });

  // Get received batches
  const { data: receivedData, isLoading: receivedLoading, error: receivedError } = useQuery<{
    batches: BatchWithSummary[];
    total: number;
  }>({
    queryKey: ['/api/batches', 'received', limit, offset],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('type', 'received');
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());
      return fetch(`/api/batches?${params.toString()}`).then(res => res.json());
    },
    enabled: activeTab === 'received'
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  const handleExportBatch = async (batchId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/batches/${batchId}/export`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `${fileName} has been downloaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export batch file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const data = activeTab === 'sent' ? sentData : receivedData;
  const isLoading = activeTab === 'sent' ? sentLoading : receivedLoading;
  const error = activeTab === 'sent' ? sentError : receivedError;
  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <p className="text-red-600">Failed to load batch history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
      <CardHeader className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Batch History</h3>
            <p className="text-sm text-gray-600 mt-1">Daily batch files (last 30 days)</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="px-6 pt-6">
            <TabsList className="grid w-full grid-cols-2" data-testid="tabs-batch-history">
              <TabsTrigger value="sent" data-testid="tab-sent">Sent History</TabsTrigger>
              <TabsTrigger value="received" data-testid="tab-received">Received History</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="sent" className="mt-6">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-sent-batches">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Sent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name / Batch ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customers Messaged
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Channel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            <Skeleton className="h-4 w-48" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-6 w-20" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-8 w-24" />
                        </td>
                      </tr>
                    ))
                  ) : data && data.batches.length > 0 ? (
                    data.batches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-gray-50" data-testid={`row-sent-batch-${batch.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(batch.date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900" data-testid={`text-filename-${batch.id}`}>
                              {batch.fileName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm font-semibold text-gray-900">
                              {batch.customerCount.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-blue-100 text-blue-800">
                            {batch.channel}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            onClick={() => handleExportBatch(batch.id, batch.fileName)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                            data-testid={`button-export-${batch.id}`}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No sent batches found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="received" className="mt-6">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-received-batches">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Received
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name / Batch ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responses Collected
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categorization Summary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            <Skeleton className="h-4 w-48" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-16" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-8 w-24" />
                        </td>
                      </tr>
                    ))
                  ) : data && data.batches.length > 0 ? (
                    data.batches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-gray-50" data-testid={`row-received-batch-${batch.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(batch.date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900" data-testid={`text-filename-${batch.id}`}>
                              {batch.fileName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm font-semibold text-gray-900">
                              {batch.totalResponses?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              ✓ {batch.confirmed}
                            </Badge>
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              ✗ {batch.notConfirmed}
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-800 text-xs">
                              ? {batch.questions}
                            </Badge>
                            <Badge className="bg-gray-100 text-gray-800 text-xs">
                              • {batch.other}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            onClick={() => handleExportBatch(batch.id, batch.fileName)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                            data-testid={`button-export-${batch.id}`}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No received batches found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between items-center">
                <p className="text-sm text-gray-700" data-testid="text-pagination-info">
                  Showing <span className="font-medium">{offset + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(offset + limit, data.total)}
                  </span>{" "}
                  of <span className="font-medium">{data.total}</span> batches
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    data-testid="button-previous-page"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}