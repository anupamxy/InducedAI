import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerAppSchema } from "@shared/schema";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerApp } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";

interface RegisterApiFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RegisterApiForm({ open, onOpenChange }: RegisterApiFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof registerAppSchema>>({
    resolver: zodResolver(registerAppSchema),
    defaultValues: {
      name: "",
      baseUrl: "",
      strategy: "token-bucket",
      requestCount: 100,
      timeWindow: 60,
      authToken: ""
    }
  });
  
  const registerMutation = useMutation({
    mutationFn: (values: z.infer<typeof registerAppSchema>) => registerApp(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/apps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      onOpenChange(false);
      form.reset();
      toast({
        title: "API Registered",
        description: "Your API has been successfully registered.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  function onSubmit(values: z.infer<typeof registerAppSchema>) {
    registerMutation.mutate(values);
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <PlusCircle className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center">Register New API</DialogTitle>
          <DialogDescription className="text-center">
            Enter the details for the external API you want to proxy through our service.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., OpenAI API" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.example.com/v1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="strategy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Limiting Strategy</FormLabel>
                  <Select 
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a strategy" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="token-bucket">Token Bucket</SelectItem>
                      <SelectItem value="leaky-bucket">Leaky Bucket</SelectItem>
                      <SelectItem value="fixed-window">Fixed Window</SelectItem>
                      <SelectItem value="sliding-window">Sliding Window</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the appropriate rate limiting strategy for your API
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="requestCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Count</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="timeWindow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Window (seconds)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="60"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="authToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authentication Token (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Your API token for the external service"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Will be sent as a Bearer token in the Authorization header
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Registering..." : "Register API"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
