import { Button } from '@/components/ui/button';
import { 
  Droplets, 
  MapPin, 
  TrendingUp, 
  AlertTriangle,
  HelpCircle,
  BarChart3,
  LucideIcon
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface QuickActionsProps {
  onSelect: (query: string) => void;
}

interface QuickAction {
  icon: LucideIcon;
  labelKey: string;
  query: string;
}

const quickActions: QuickAction[] = [
  {
    icon: Droplets,
    labelKey: 'qa_groundwaterRecharge',
    query: 'What is groundwater recharge and how is it calculated in India?',
  },
  {
    icon: MapPin,
    labelKey: 'qa_checkStateStatus',
    query: 'How can I check the groundwater status of a specific state or district?',
  },
  {
    icon: AlertTriangle,
    labelKey: 'qa_overExploitedAreas',
    query: 'Which areas in India are classified as over-exploited for groundwater?',
  },
  {
    icon: TrendingUp,
    labelKey: 'qa_extractionStages',
    query: 'Explain the different stages of groundwater extraction and their classification criteria.',
  },
  {
    icon: BarChart3,
    labelKey: 'qa_assessmentMethodology',
    query: 'What methodology is used for the annual groundwater assessment in India?',
  },
  {
    icon: HelpCircle,
    labelKey: 'qa_howToUseIngres',
    query: 'How can I use the INGRES portal to access groundwater data?',
  },
];

export function QuickActions({ onSelect }: QuickActionsProps) {
  const { t } = useLanguage();
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {quickActions.map((action) => (
        <Button
          key={action.labelKey}
          variant="outline"
          onClick={() => onSelect(action.query)}
          className="h-auto py-4 px-4 justify-start text-left gap-3 bg-card hover:bg-secondary/80 border-border/50 hover:border-primary/30 transition-all duration-200 group"
        >
          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <action.icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-foreground">{t(action.labelKey)}</span>
        </Button>
      ))}
    </div>
  );
}
