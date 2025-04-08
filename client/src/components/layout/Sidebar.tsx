import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Link2, FileText, BarChart2, UserCircle, Settings } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  return (
    <nav
      id="sidebar"
      className={cn(
        "bg-white border-r border-slate-200 w-56 p-4 transition-all duration-300 ease-in-out z-20",
        "absolute inset-y-0 left-0 transform md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2">Main</p>
          <div className="space-y-1">
            <Link href="/dashboard">
              <a className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium",
                isActive("/dashboard") 
                  ? "bg-primary bg-opacity-10 text-primary"
                  : "text-slate-700 hover:bg-slate-100"
              )}>
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </a>
            </Link>
            <Link href="/apis">
              <a className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium",
                isActive("/apis") 
                  ? "bg-primary bg-opacity-10 text-primary"
                  : "text-slate-700 hover:bg-slate-100"
              )}>
                <Link2 className="h-5 w-5" />
                <span>API Management</span>
              </a>
            </Link>
            <Link href="/logs">
              <a className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium",
                isActive("/logs") 
                  ? "bg-primary bg-opacity-10 text-primary"
                  : "text-slate-700 hover:bg-slate-100"
              )}>
                <FileText className="h-5 w-5" />
                <span>Request Logs</span>
              </a>
            </Link>
            <Link href="/analytics">
              <a className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium",
                isActive("/analytics") 
                  ? "bg-primary bg-opacity-10 text-primary"
                  : "text-slate-700 hover:bg-slate-100"
              )}>
                <BarChart2 className="h-5 w-5" />
                <span>Analytics</span>
              </a>
            </Link>
          </div>
        </div>
        
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2">Settings</p>
          <div className="space-y-1">
            <Link href="/account">
              <a className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium",
                isActive("/account") 
                  ? "bg-primary bg-opacity-10 text-primary"
                  : "text-slate-700 hover:bg-slate-100"
              )}>
                <UserCircle className="h-5 w-5" />
                <span>Account</span>
              </a>
            </Link>
            <Link href="/api-keys">
              <a className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium",
                isActive("/api-keys") 
                  ? "bg-primary bg-opacity-10 text-primary"
                  : "text-slate-700 hover:bg-slate-100"
              )}>
                <Settings className="h-5 w-5" />
                <span>API Keys</span>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
