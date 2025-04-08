import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, User, LogOut } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { logout } from "@/lib/api";
import { useLocation } from "wouter";

interface HeaderProps {
  username?: string;
  onMobileMenuClick: () => void;
}

export default function Header({ username, onMobileMenuClick }: HeaderProps) {
  const [, navigate] = useLocation();
  
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      navigate('/login');
    }
  });
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMobileMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 6h-12a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12"></path>
          <path d="M8 6v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-2"></path>
          <line x1="12" y1="13" x2="16" y2="13"></line>
        </svg>
        <h1 className="text-xl font-semibold text-slate-800">ProxyRate</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {username && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 text-sm text-slate-700 hover:text-slate-900">
                <span>{username}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-pointer" onClick={() => {}}>
                <User className="mr-2 h-4 w-4" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
