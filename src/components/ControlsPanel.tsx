import type { UseFormReturn } from 'react-hook-form';
import type { ConnectionConfig } from '../types/ocpp';

interface ControlsPanelProps {
  form: UseFormReturn<ConnectionConfig>;
  onAction: (action: () => void) => void;
  actions: {
    sendBoot: () => void;
    sendHeartbeat: () => void;
    statusNotification: () => void;
    authorize: () => void;
    startTransaction: () => void;
    meterValues: () => void;
    stopTransaction: () => void;
  };
}

export const ControlsPanel = ({ form, onAction, actions }: ControlsPanelProps) => {
  const { register } = form;

  return (
    <div className='bg-slate-800 border border-slate-600 rounded-xl'>
      <h2 className='text-xs font-semibold p-3 border-b border-slate-600 text-slate-300'>
        Kontroller
      </h2>
      <div className='p-3 space-y-3'>
        <div className='grid grid-cols-3 gap-2'>
          <div>
            <label className='block text-xs text-slate-400 mb-1'>
              Connector
            </label>
            <input
              {...register('activeConnector', { valueAsNumber: true })}
              type='number'
              min='1'
              className='w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm'
            />
          </div>
          <div>
            <label className='block text-xs text-slate-400 mb-1'>
              Vendor
            </label>
            <input
              {...register('vendor')}
              className='w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm'
            />
          </div>
          <div>
            <label className='block text-xs text-slate-400 mb-1'>
              Model
            </label>
            <input
              {...register('model')}
              className='w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm'
            />
          </div>
        </div>

        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => onAction(actions.sendBoot)}
            className='px-3 py-2 bg-blue-600 text-white rounded font-semibold text-xs'
          >
            BootNotification
          </button>
          <button
            onClick={() => onAction(actions.sendHeartbeat)}
            className='px-3 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded font-semibold text-xs'
          >
            Heartbeat
          </button>
          <button
            onClick={() => onAction(actions.statusNotification)}
            className='px-3 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded font-semibold text-xs'
          >
            Status
          </button>
          <button
            onClick={() => onAction(actions.authorize)}
            className='px-3 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded font-semibold text-xs'
          >
            Authorize
          </button>
          <button
            onClick={() => onAction(actions.startTransaction)}
            className='px-3 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded font-semibold text-xs'
          >
            StartTx
          </button>
          <button
            onClick={() => onAction(actions.meterValues)}
            className='px-3 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded font-semibold text-xs'
          >
            MeterValues
          </button>
          <button
            onClick={() => onAction(actions.stopTransaction)}
            className='px-3 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded font-semibold text-xs'
          >
            StopTx
          </button>
        </div>
      </div>
    </div>
  );
};
