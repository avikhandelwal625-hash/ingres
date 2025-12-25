import { Button } from '@/components/ui/button';
import { 
  Droplets, 
  MapPin, 
  TrendingUp, 
  AlertTriangle,
  HelpCircle,
  BarChart3
} from 'lucide-react';

interface QuickActionsProps {
  onSelect: (query: string) => void;
}

const quickActions = [
  {
    icon: Droplets,
    label: 'What is groundwater recharge?',
    query: 'What is groundwater recharge and how is it calculated in India?',
  },
  {
    icon: MapPin,
    label: 'Check state status',
    query: 'How can I check the groundwater status of a specific state or district?',
  },
  {
    icon: AlertTriangle,
    label: 'Over-exploited areas',
    query: 'Which areas in India are classified as over-exploited for groundwater?',
  },
  {
    icon: TrendingUp,
    label: 'Extraction stages',
    query: 'Explain the different stages of groundwater extraction and their classification criteria.',
  },
  {
    icon: BarChart3,
    label: 'Assessment methodology',
    query: 'What methodology is used for the annual groundwater assessment in India?',
  },
  {
    icon: HelpCircle,
    label: 'How to use INGRES',
    query: 'How can I use the INGRES portal to access groundwater data?',
  },
];

export function QuickActions({ onSelect }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {quickActions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          onClick={() => onSelect(action.query)}
          className="h-auto py-4 px-4 justify-start text-left gap-3 bg-card hover:bg-secondary/80 border-border/50 hover:border-primary/30 transition-all duration-200 group"
        >
          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <action.icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-foreground">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}
