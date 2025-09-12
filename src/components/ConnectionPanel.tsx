import type { UseFormReturn } from 'react-hook-form';
import type { ConnectionConfig, ConnectionStatus } from '../types/ocpp';

interface ConnectionPanelProps {
  form: UseFormReturn<ConnectionConfig>;
  status: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const ConnectionPanel = ({ form, status, onConnect, onDisconnect }: ConnectionPanelProps) => {
  const { register } = form;

  return (
    <div className='bg-slate-800 border border-slate-600 rounded-xl'>
      <h2 className='text-xs font-semibold p-3 border-b border-slate-600 text-slate-300'>
        Bağlantı
      </h2>
      <div className='p-3 space-y-3'>
        <div>
          <label className='block text-xs text-slate-400 mb-1'>
            CSMS URL
          </label>
          <input
            {...register('csmsUrl')}
            placeholder='wss://host/path/'
            className='w-full px-2 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm'
          />
        </div>

        <div className='flex gap-2'>
          <div className='flex-1'>
            <label className='block text-xs text-slate-400 mb-1'>
              CP ID
            </label>
            <input
              {...register('cpId')}
              className='w-full px-2 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm'
            />
          </div>
          <div className='flex-1'>
            <label className='block text-xs text-slate-400 mb-1'>
              Protokol
            </label>
            <select
              {...register('protocol')}
              className='w-full px-2 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm'
            >
              <option value='ocpp1.6'>ocpp1.6</option>
              <option value='ocpp2.0.1'>ocpp2.0.1</option>
            </select>
          </div>
        </div>

        <details className='mt-2'>
          <summary className='text-xs text-slate-400 cursor-pointer'>
            Auth
          </summary>
          <div className='flex gap-2 mt-2'>
            <input
              {...register('user')}
              placeholder='username'
              className='flex-1 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm'
            />
            <input
              {...register('password')}
              type='password'
              placeholder='password'
              className='flex-1 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm'
            />
          </div>
        </details>

        <div className='flex gap-2 pt-2'>
          <button
            onClick={onConnect}
            disabled={status === 'connected' || status === 'charging'}
            className='px-3 py-2 bg-blue-600 text-white rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm'
          >
            Connect
          </button>
          <button
            onClick={onDisconnect}
            disabled={status === 'disconnected'}
            className='px-3 py-2 bg-slate-700 text-slate-200 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm'
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};
