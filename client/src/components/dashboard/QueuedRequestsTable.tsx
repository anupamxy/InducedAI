import { QueuedRequestWithTimes } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelQueuedRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, FileText, Wallet } from "lucide-react";

interface QueuedRequestsTableProps {
  requests: QueuedRequestWithTimes[];
}

export default function QueuedRequestsTable({ requests }: QueuedRequestsTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const cancelRequestMutation = useMutation({
    mutationFn: (id: number) => cancelQueuedRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queued-requests'] });
      toast({
        title: "Success",
        description: "Request cancelled successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel request",
        variant: "destructive",
      });
    }
  });
  
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  const formatRemainingTime = (ms: number) => {
    if (ms < 1000) return "Processing soon";
    return `~${formatTime(ms)} remaining`;
  };
  
  const getApiIcon = (appId: string) => {
    // Simple mapping based on appId first character
    const char = appId.charAt(0);
    if (char === 'a' || char === '1') {
      return <MessageSquare className="h-5 w-5" />;
    } else if (char === 'b' || char === '2') {
      return <Wallet className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-slate-900">Queued Requests</h3>
        <p className="mt-1 text-sm text-slate-500">Requests waiting to be processed due to rate limits</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">API</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time in Queue</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estimated Processing</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No queued requests
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-md bg-purple-100 text-purple-600">
                        {getApiIcon(request.appId)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-slate-900">
                          {/* Get the API name from the appId (since we don't have a join) */}
                          {request.appId}
                        </div>
                        <div className="text-sm text-slate-500">{request.path}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-500">{formatTime(request.timeInQueue)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-500">{formatRemainingTime(request.estimatedWaitTime)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:text-red-900 p-0 h-auto"
                      onClick={() => cancelRequestMutation.mutate(request.id)}
                      disabled={cancelRequestMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
