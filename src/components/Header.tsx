import { Droplets, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '@/hooks/useLanguage';

export function Header() {
  const { t } = useLanguage();

  return (
    <header className="w-full bg-background/80 backdrop-blur-lg">
      <div className="flex h-14 items-center justify-between px-4 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-hero-gradient text-primary-foreground flex-shrink-0">
            <Droplets className="w-4 h-4" />
          </div>
          <div className="min-w-0 hidden sm:block">
            <h1 className="font-display text-sm font-bold text-foreground truncate">{t('title')}</h1>
            <p className="text-xs text-muted-foreground truncate">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <LanguageSelector />
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => window.open('https://ingres.iith.ac.in/home', '_blank')}
          >
            <span className="hidden lg:inline">{t('visitPortal')}</span>
            <span className="lg:hidden">Portal</span>
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </header>
  );
}
