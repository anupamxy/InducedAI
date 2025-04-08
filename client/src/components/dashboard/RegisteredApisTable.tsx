import { App } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateApp } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, FileText, MessageSquare, Wallet } from "lucide-react";

interface RegisteredApisTableProps {
  apps: App[];
}

export default function RegisteredApisTable({ apps }: RegisteredApisTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const toggleAppStatusMutation = useMutation({
    mutationFn: (params: { id: number, active: number }) => 
      updateApp(params.id, { active: params.active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/apps'] });
      toast({
        title: "Success",
        description: "App status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update app status",
        variant: "destructive",
      });
    }
  });
  
  const filteredApps = apps.filter(app => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return app.active === 1;
    if (statusFilter === "rate-limited") return app.usage >= 90;
    if (statusFilter === "disabled") return app.active === 0;
    return true;
  });
  
  const handleDisableClick = (app: App) => {
    setSelectedAppId(app.id);
    setIsConfirmOpen(true);
  };
  
  const confirmDisable = () => {
    if (selectedAppId) {
      const app = apps.find(a => a.id === selectedAppId);
      if (app) {
        toggleAppStatusMutation.mutate({
          id: selectedAppId,
          active: app.active === 1 ? 0 : 1,
        });
      }
    }
    setIsConfirmOpen(false);
  };
  
  const getAppIcon = (app: App) => {
    if (app.name.toLowerCase().includes('openai')) {
      return <FileText className="h-6 w-6" />;
    } else if (app.name.toLowerCase().includes('anthropic')) {
      return <MessageSquare className="h-6 w-6" />;
    } else if (app.name.toLowerCase().includes('weather')) {
      return <Wallet className="h-6 w-6" />;
    }
    return <FileText className="h-6 w-6" />;
  };
  
  const getStatusBadge = (app: App) => {
    if (app.active === 0) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
          Disabled
        </span>
      );
    } else if (app.usage >= 90) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
          Rate Limited
        </span>
      );
    }
    return (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
        Active
      </span>
    );
  };
  
  return (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-slate-200 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-slate-900">Registered APIs</h3>
            <p className="mt-1 text-sm text-slate-500">List of all your registered external APIs</p>
          </div>
          <div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All APIs</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="rate-limited">Rate Limited</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Base URL</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rate Limit</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Usage</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No APIs found. Please register an API to get started.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-blue-100 text-blue-600">
                          {getAppIcon(app)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{app.name}</div>
                          <div className="text-sm text-slate-500 font-mono">{app.appId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500 font-mono">{app.baseUrl}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{app.requestCount} req/{app.timeWindow}s</div>
                      <div className="text-sm text-slate-500 capitalize">{app.strategy.replace('-', ' ')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(app)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            app.usage >= 90 ? 'bg-amber-500' : 
                            app.usage >= 60 ? 'bg-blue-600' : 'bg-green-600'
                          }`} 
                          style={{ width: `${Math.min(100, app.usage)}%` }}>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {Math.round(app.usage * app.requestCount / 100)}/{app.requestCount} requests
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button variant="ghost" className="text-indigo-600 hover:text-indigo-900 p-0 h-auto">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-red-600 hover:text-red-900 p-0 h-auto"
                          onClick={() => handleDisableClick(app)}
                        >
                          {app.active === 1 ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredApps.length}</span> of <span className="font-medium">{filteredApps.length}</span> results
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedAppId && apps.find(a => a.id === selectedAppId)?.active === 1
                ? 'Disable API'
                : 'Enable API'
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAppId && apps.find(a => a.id === selectedAppId)?.active === 1
                ? 'This will disable the API and prevent any requests from being proxied through it.'
                : 'This will enable the API and allow requests to be proxied through it.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisable}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
