import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

type StatusType = 'safe' | 'semi-critical' | 'critical' | 'over-exploited';

interface StatusBadgeProps {
  status: StatusType;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusTranslationKeys: Record<StatusType, { labelKey: string; descKey: string }> = {
  safe: {
    labelKey: 'safe',
    descKey: 'statusSafeDesc',
  },
  'semi-critical': {
    labelKey: 'semiCritical',
    descKey: 'statusSemiCriticalDesc',
  },
  critical: {
    labelKey: 'critical',
    descKey: 'statusCriticalDesc',
  },
  'over-exploited': {
    labelKey: 'overExploited',
    descKey: 'statusOverExploitedDesc',
  },
};

export function StatusBadge({ status, showLabel = true, size = 'md' }: StatusBadgeProps) {
  const { t } = useLanguage();
  const config = statusTranslationKeys[status];
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-medium',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm',
        size === 'lg' && 'px-4 py-1.5 text-base',
        status === 'safe' && 'bg-status-safe-bg text-status-safe',
        status === 'semi-critical' && 'bg-status-semi-critical-bg text-status-semi-critical',
        status === 'critical' && 'bg-status-critical-bg text-status-critical',
        status === 'over-exploited' && 'bg-status-over-exploited-bg text-status-over-exploited'
      )}
    >
      <span
        className={cn(
          'rounded-full',
          size === 'sm' && 'w-1.5 h-1.5',
          size === 'md' && 'w-2 h-2',
          size === 'lg' && 'w-2.5 h-2.5',
          status === 'safe' && 'bg-status-safe',
          status === 'semi-critical' && 'bg-status-semi-critical',
          status === 'critical' && 'bg-status-critical',
          status === 'over-exploited' && 'bg-status-over-exploited'
        )}
      />
      {showLabel && <span>{t(config.labelKey)}</span>}
    </div>
  );
}

export function StatusLegend() {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-wrap gap-3 p-4 bg-card rounded-xl border border-border">
      <h4 className="w-full text-sm font-semibold text-foreground mb-2">{t('statusCategories')}</h4>
      {(Object.keys(statusTranslationKeys) as StatusType[]).map((status) => (
        <div key={status} className="flex items-center gap-2">
          <StatusBadge status={status} size="sm" />
          <span className="text-xs text-muted-foreground">{t(statusTranslationKeys[status].descKey)}</span>
        </div>
      ))}
    </div>
  );
}
