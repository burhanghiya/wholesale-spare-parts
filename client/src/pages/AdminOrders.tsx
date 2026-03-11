import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function Page() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container py-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Page Under Development</h1>
        </div>
      </div>
      <div className="container py-8">
        <p className="text-muted-foreground">This page is coming soon.</p>
      </div>
    </div>
  );
}
