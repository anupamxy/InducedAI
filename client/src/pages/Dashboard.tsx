import Layout from "@/components/layout/Layout";
import StatisticCards from "@/components/dashboard/StatisticCards";
import ApiKeySection from "@/components/dashboard/ApiKeySection";
import RegisteredApisTable from "@/components/dashboard/RegisteredApisTable";
import QueuedRequestsTable from "@/components/dashboard/QueuedRequestsTable";
import UsageGraph from "@/components/dashboard/UsageGraph";
import RegisterApiForm from "@/components/forms/RegisterApiForm";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMe, getStats, getApps, getQueuedRequests } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export default function Dashboard() {
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  
  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: getMe
  });
  
  // Fetch statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: getStats,
    refetchInterval: 10000 // Refresh every 10 seconds
  });
  
  // Fetch registered apps
  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['/api/apps'],
    queryFn: getApps
  });
  
  // Fetch queued requests
  const { data: queuedRequestsData, isLoading: queuedRequestsLoading } = useQuery({
    queryKey: ['/api/queued-requests'],
    queryFn: getQueuedRequests,
    refetchInterval: 5000 // Refresh every 5 seconds
  });
  
  if (userLoading || statsLoading || appsLoading || queuedRequestsLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="animate-pulse bg-gray-200 h-8 w-48 rounded"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg h-24">
                <div className="px-4 py-5 sm:p-6">
                  <div className="animate-pulse bg-gray-200 h-4 w-24 rounded mb-2"></div>
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <Button onClick={() => setRegisterModalOpen(true)}>
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Register New API
          </Button>
        </div>
        
        {/* Statistics Cards */}
        {statsData && <StatisticCards stats={statsData} />}
        
        {/* API Key Section */}
        {userData && <ApiKeySection apiKey={userData.apiKey} />}
        
        {/* Registered APIs Table */}
        {appsData && <RegisteredApisTable apps={appsData} />}
        
        {/* Queued Requests Table */}
        {queuedRequestsData && queuedRequestsData.length > 0 && (
          <QueuedRequestsTable requests={queuedRequestsData} />
        )}
        
        {/* Usage Graph */}
        {statsData && <UsageGraph dailyStats={statsData.dailyStats} />}
        
        {/* Register API Modal */}
        <RegisterApiForm
          open={registerModalOpen}
          onOpenChange={setRegisterModalOpen}
        />
      </div>
    </Layout>
  );
}
