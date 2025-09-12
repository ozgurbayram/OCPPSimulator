import { useState } from 'react';
import type { NetworkTrafficFilter, OCPPFrame } from '../types/ocpp';

interface NetworkTrafficProps {
  frames: OCPPFrame[];
  paused: boolean;
  onTogglePause: () => void;
  onCopy: () => void;
  onClear: () => void;
}

const FilterChip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-2 py-1 rounded-full border text-xs cursor-pointer ${
      active
        ? 'bg-slate-700 border-slate-600'
        : 'bg-slate-800 border-slate-600 hover:bg-slate-700'
    }`}
  >
    {children}
  </button>
);

export const NetworkTraffic = ({ frames, paused, onTogglePause, onCopy, onClear }: NetworkTrafficProps) => {
  const [filter, setFilter] = useState<NetworkTrafficFilter>({ dir: 'all', kind: 'all', q: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFrames = frames.filter((frame) => {
    if (filter.dir !== 'all' && frame.dir !== filter.dir) return false;
    if (filter.kind !== 'all' && frame.type !== filter.kind) return false;
    if (
      searchQuery &&
      !`${frame.action} ${frame.id}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className='bg-slate-800 border border-slate-600 rounded-xl overflow-hidden'>
      <h2 className='sticky top-0 bg-slate-800 text-xs font-semibold p-3 border-b border-slate-600 text-slate-300'>
        Ağ Trafiği
      </h2>
      <div className='p-3'>
        <div className='flex gap-2 flex-wrap items-center mb-2'>
          <FilterChip
            active={filter.dir === 'all' && filter.kind === 'all'}
            onClick={() => setFilter({ dir: 'all', kind: 'all', q: '' })}
          >
            Tümü
          </FilterChip>
          <FilterChip
            active={filter.dir === 'out'}
            onClick={() => setFilter({ ...filter, dir: 'out' })}
          >
            →
          </FilterChip>
          <FilterChip
            active={filter.dir === 'in'}
            onClick={() => setFilter({ ...filter, dir: 'in' })}
          >
            ←
          </FilterChip>
          <FilterChip
            active={filter.kind === 'CALL'}
            onClick={() => setFilter({ ...filter, kind: 'CALL' })}
          >
            CALL
          </FilterChip>
          <FilterChip
            active={filter.kind === 'CALLRESULT'}
            onClick={() => setFilter({ ...filter, kind: 'CALLRESULT' })}
          >
            RESULT
          </FilterChip>
          <FilterChip
            active={filter.kind === 'CALLERROR'}
            onClick={() => setFilter({ ...filter, kind: 'CALLERROR' })}
          >
            ERROR
          </FilterChip>

          <div className='ml-auto flex gap-2 items-center'>
            <input
              type='text'
              placeholder='ara'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='max-w-48 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-slate-100'
            />
            <button
              onClick={onTogglePause}
              className='px-3 py-1 bg-slate-700 text-slate-200 rounded text-xs font-semibold'
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={onCopy}
              className='px-3 py-1 bg-slate-700 text-slate-200 rounded text-xs font-semibold'
            >
              Copy
            </button>
            <button
              onClick={onClear}
              className='px-3 py-1 bg-slate-700 text-slate-200 rounded text-xs font-semibold'
            >
              Clear
            </button>
          </div>
        </div>

        <div className='overflow-auto max-h-96'>
          <table className='w-full border-separate border-spacing-y-1'>
            <thead className='sticky top-0 bg-slate-800'>
              <tr>
                <th className='text-left text-xs font-semibold text-slate-400 p-2'>
                  Saat
                </th>
                <th className='text-left text-xs font-semibold text-slate-400 p-2'>
                  Yön
                </th>
                <th className='text-left text-xs font-semibold text-slate-400 p-2'>
                  Tip
                </th>
                <th className='text-left text-xs font-semibold text-slate-400 p-2'>
                  Aksiyon
                </th>
                <th className='text-left text-xs font-semibold text-slate-400 p-2'>
                  Id
                </th>
                <th className='text-left text-xs font-semibold text-slate-400 p-2'>
                  Detay
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFrames.map((frame, idx) => (
                <tr
                  key={idx}
                  className='bg-slate-900 border border-slate-600 hover:-translate-y-px transition-transform'
                >
                  <td className='p-2 text-xs'>
                    {new Date(frame.ts).toLocaleTimeString()}
                  </td>
                  <td
                    className={`p-2 text-xs font-bold ${
                      frame.dir === 'out' ? 'text-blue-400' : 'text-green-400'
                    }`}
                  >
                    {frame.dir === 'out' ? '→' : '←'}
                  </td>
                  <td
                    className={`p-2 text-xs ${
                      frame.type === 'CALL'
                        ? 'text-blue-300'
                        : frame.type === 'CALLRESULT'
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {frame.type}
                  </td>
                  <td className='p-2 text-xs'>{frame.action}</td>
                  <td className='p-2 text-xs font-mono'>{frame.id}</td>
                  <td className='p-2'>
                    <details className='bg-slate-950 border-t border-dashed border-slate-600 p-2'>
                      <summary className='cursor-pointer text-xs text-slate-400'>
                        detay
                      </summary>
                      <pre className='text-xs mt-2 whitespace-pre-wrap font-mono'>
                        {JSON.stringify(frame.raw, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
