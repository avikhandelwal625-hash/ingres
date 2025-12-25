import { Droplets, Database, Globe2, BarChart3 } from 'lucide-react';
import { StatusLegend } from './StatusBadge';
import { QuickActions } from './QuickActions';

interface WelcomeScreenProps {
  onQuickAction: (query: string) => void;
}

const features = [
  {
    icon: Database,
    title: 'Comprehensive Data',
    description: 'Access groundwater assessment data for all blocks, mandals, and taluks across India',
  },
  {
    icon: Globe2,
    title: 'State-wise Analysis',
    description: 'Explore recharge rates, extraction levels, and categorization by region',
  },
  {
    icon: BarChart3,
    title: 'Historical Trends',
    description: 'Compare year-over-year changes in groundwater resources and extraction',
  },
];

export function WelcomeScreen({ onQuickAction }: WelcomeScreenProps) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-hero-gradient text-primary-foreground animate-float mx-auto">
            <Droplets className="w-10 h-10" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Welcome to <span className="text-gradient">INGRES AI</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your intelligent assistant for India's groundwater resource data. 
            Ask questions about recharge rates, extraction levels, and regional assessments.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Status Legend */}
        <StatusLegend />

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-foreground">Quick Questions</h3>
          <QuickActions onSelect={onQuickAction} />
        </div>

        {/* Attribution */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Developed by Central Ground Water Board (CGWB) & IIT Hyderabad
          </p>
        </div>
      </div>
    </div>
  );
}
