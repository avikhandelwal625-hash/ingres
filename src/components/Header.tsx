import { Droplets, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-hero-gradient text-primary-foreground">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">INGRES ChatBot</h1>
            <p className="text-xs text-muted-foreground">India Ground Water Resource Estimation System</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.open('https://ingres.iith.ac.in/home', '_blank')}
        >
          <span className="hidden sm:inline">Visit INGRES Portal</span>
          <span className="sm:hidden">Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </div>
    </header>
  );
}
