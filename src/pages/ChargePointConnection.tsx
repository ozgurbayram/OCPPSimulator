import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useOcppConnection } from '@/features/ocpp/hooks';
import type { RootState } from '@/store/store';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

export default function ChargePointConnection() {
  const { id } = useParams<{ id: string }>();
  const cp = useSelector((s: RootState) => (id ? s.ocpp.items[id] : undefined));
  if (!cp)
    return (
      <div className='text-sm text-muted-foreground'>Connection not found.</div>
    );
  const { connect, disconnect } = useOcppConnection(cp);

  return (
    <DashboardLayout>
      <div className='grid gap-3'>
        <div className='flex items-center justify-between'>
          <div className='text-lg font-semibold'>{cp.label}</div>
          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => connect.mutate({})}
              disabled={cp.status === 'connected' || connect.isPending}
            >
              Connect
            </Button>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => disconnect.mutate()}
              disabled={cp.status === 'disconnected'}
            >
              Disconnect
            </Button>
          </div>
        </div>
        <div className='text-sm text-muted-foreground'>
          CSMS: {cp.config.csmsUrl} • CP ID: {cp.config.cpId} • Protocol:{' '}
          {cp.config.protocol}
        </div>
      </div>
    </DashboardLayout>
  );
}
