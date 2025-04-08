import { Stats } from "@/lib/api";

interface StatisticCardsProps {
  stats: Stats;
}

export default function StatisticCards({ stats }: StatisticCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dl>
            <dt className="text-sm font-medium text-slate-500 truncate">Total APIs</dt>
            <dd className="mt-1 text-3xl font-semibold text-slate-900">{stats.totalApps}</dd>
          </dl>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dl>
            <dt className="text-sm font-medium text-slate-500 truncate">Total Requests Today</dt>
            <dd className="mt-1 text-3xl font-semibold text-slate-900">{stats.totalRequestsToday.toLocaleString()}</dd>
          </dl>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dl>
            <dt className="text-sm font-medium text-slate-500 truncate">Rate Limited Requests</dt>
            <dd className="mt-1 text-3xl font-semibold text-amber-500">{stats.rateLimitedRequests.toLocaleString()}</dd>
          </dl>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dl>
            <dt className="text-sm font-medium text-slate-500 truncate">Queued Requests</dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-600">{stats.queuedRequests}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
