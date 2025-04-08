import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { regenerateApiKey } from "@/lib/api";
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

interface ApiKeySectionProps {
  apiKey: string;
}

export default function ApiKeySection({ apiKey }: ApiKeySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get the first 8 and last 4 characters of the API key
  const maskedApiKey = apiKey ? `${apiKey.substring(0, 8)}${'*'.repeat(Math.max(0, apiKey.length - 12))}${apiKey.substring(apiKey.length - 4)}` : '';
  
  const regenerateKeyMutation = useMutation({
    mutationFn: regenerateApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "API Key Regenerated",
        description: "Your API key has been successfully regenerated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to regenerate API key. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleCopyClick = () => {
    navigator.clipboard.writeText(apiKey).then(() => {
      toast({
        title: "Copied!",
        description: "API key copied to clipboard",
      });
    });
  };
  
  const handleRegenerateClick = () => {
    setConfirmDialogOpen(true);
  };
  
  const confirmRegenerate = () => {
    regenerateKeyMutation.mutate();
    setConfirmDialogOpen(false);
  };
  
  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-slate-900">Your API Key</h3>
          <p className="mt-1 text-sm text-slate-500">Use this key to authenticate your requests to our service.</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-grow">
              <div className="relative rounded-md shadow-sm">
                <Input 
                  type="text" 
                  className="font-mono py-3 pr-10" 
                  value={isVisible ? apiKey : maskedApiKey} 
                  readOnly 
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setIsVisible(!isVisible)}
                  >
                    {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="ml-3">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={handleCopyClick}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="ml-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={handleRegenerateClick}
                disabled={regenerateKeyMutation.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will invalidate your current API key and generate a new one.
              Any services using the current key will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRegenerate}>
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
