import { clsx } from 'clsx';
import { CDEStatus, StatusWithDate, getStatusName } from '../../types/cde';

interface StatusBadgeProps {
  status: CDEStatus | StatusWithDate | string;
  size?: 'sm' | 'md';
}

const STATUS_STYLES: Record<string, string> = {
  Published: 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800',
  Proposed: 'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800',
  Retired: 'bg-red-100 text-red-600 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
};

const STATUS_DOTS: Record<string, string> = {
  Published: 'bg-emerald-500',
  Proposed: 'bg-amber-500',
  Retired: 'bg-red-500',
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const name = getStatusName(status as CDEStatus | StatusWithDate);
  const style = STATUS_STYLES[name] || STATUS_STYLES['Proposed'];
  const dot = STATUS_DOTS[name] || STATUS_DOTS['Proposed'];

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      style
    )}>
      <span className={clsx('rounded-full', dot, size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2')} />
      {name}
    </span>
  );
}
