import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface UsageGraphProps {
  dailyStats: Record<string, number>;
}

export default function UsageGraph({ dailyStats }: UsageGraphProps) {
  const [timeRange, setTimeRange] = useState("7days");
  
  // Get the days in proper format for display
  const days = Object.keys(dailyStats);
  const stats = Object.values(dailyStats);
  
  // Find the maximum value to scale the graph
  const maxValue = Math.max(...stats, 1);
  
  // Format dates for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 border-b border-slate-200 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-slate-900">API Usage Metrics</h3>
          <p className="mt-1 text-sm text-slate-500">Request volume over time</p>
        </div>
        <div>
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="h-64 flex items-end">
          <div className="flex-1 flex items-end space-x-2">
            {stats.map((value, index) => {
              // Calculate height percentage (minimum 5% for visibility)
              const heightPercentage = value === 0 ? 0 : Math.max(5, (value / maxValue) * 100);
              
              return (
                <div
                  key={index}
                  className="bg-blue-500 rounded-t w-full"
                  style={{ height: `${heightPercentage}%` }}
                ></div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          {days.map((day, index) => (
            <div key={index}>{formatDate(day)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
