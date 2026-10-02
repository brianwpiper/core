import { useStoreState } from '../app/AppContext';

const LABELS = {
  saved: 'Saved',
  saving: 'Saving',
  offline: 'Offline, will sync',
  retrying: 'Not synced yet, retrying',
};

export function SyncIndicator() {
  const { status, pending } = useStoreState();
  const label = LABELS[status];
  return (
    <span className={`sync ${status}`} role="status" aria-live="polite" title={pending ? `${pending} change(s) waiting to sync. Your work is saved on this device.` : 'All changes synced'}>
      {label}
    </span>
  );
}
