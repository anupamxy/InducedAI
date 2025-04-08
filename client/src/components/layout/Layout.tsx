import Header from "./Header";
import Sidebar from "./Sidebar";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: getMe
  });
  
  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar && !sidebar.contains(event.target as Node) && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileSidebarOpen]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        username={userData?.username}
        onMobileMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />
      
      <div className="flex-1 flex">
        <Sidebar isOpen={isMobileSidebarOpen} />
        
        <main className="flex-1 p-6 overflow-auto bg-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}
