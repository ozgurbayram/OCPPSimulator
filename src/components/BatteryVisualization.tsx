import { formatNumber } from '../utils/ocpp';

interface BatteryVisualizationProps {
  soc: number;
  power: number;
  energy: number;
  current: number;
  connector: number;
}

export const BatteryVisualization = ({ soc, power, energy, current, connector }: BatteryVisualizationProps) => {
  const fillWidth = Math.round(3.36 * soc);

  return (
    <div className='flex flex-col gap-3'>
      <div className='bg-slate-950 border border-slate-700 rounded-lg p-3'>
        <svg viewBox='0 0 420 220' className='w-full h-48'>
          <defs>
            <linearGradient id='batteryGradient' x1='0' x2='0' y1='1' y2='0'>
              <stop offset='0%' stopColor='#1a9fff' />
              <stop offset='100%' stopColor='#30c48d' />
            </linearGradient>
            <filter id='batteryGlow'>
              <feDropShadow
                dx='0'
                dy='0'
                stdDeviation='3'
                floodColor='#30c48d'
                floodOpacity='0.6'
              />
            </filter>
          </defs>
          <rect
            x='30'
            y='60'
            rx='10'
            width='340'
            height='100'
            fill='#0b0f17'
            stroke='#233154'
          />
          <rect
            x='370'
            y='85'
            rx='4'
            width='14'
            height='50'
            fill='#0b0f17'
            stroke='#233154'
          />
          <rect
            x='32'
            y='62'
            width={fillWidth}
            height='96'
            rx='8'
            fill='url(#batteryGradient)'
            filter='url(#batteryGlow)'
          />
          <text
            x='200'
            y='50'
            textAnchor='middle'
            className='text-2xl font-bold fill-slate-100'
          >
            {Math.round(soc)}%
          </text>
        </svg>
      </div>

      <div className='grid grid-cols-5 gap-2'>
        <div className='border border-slate-700 rounded-lg p-2 flex justify-between text-xs'>
          <span>SOC</span>
          <strong>{Math.round(soc)}</strong>
        </div>
        <div className='border border-slate-700 rounded-lg p-2 flex justify-between text-xs'>
          <span>kW</span>
          <strong>{formatNumber(power)}</strong>
        </div>
        <div className='border border-slate-700 rounded-lg p-2 flex justify-between text-xs'>
          <span>kWh</span>
          <strong>{formatNumber(energy)}</strong>
        </div>
        <div className='border border-slate-700 rounded-lg p-2 flex justify-between text-xs'>
          <span>A</span>
          <strong>{Math.round(current)}</strong>
        </div>
        <div className='border border-slate-700 rounded-lg p-2 flex justify-between text-xs'>
          <span>Conn</span>
          <strong>{connector}</strong>
        </div>
      </div>
    </div>
  );
};
