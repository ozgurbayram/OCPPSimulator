import type { BatteryState } from '../types/ocpp';
import { BatteryVisualization } from './BatteryVisualization';

interface BatteryPanelProps {
  batteryState: BatteryState;
  connectorId: number;
}

export const BatteryPanel = ({ batteryState, connectorId }: BatteryPanelProps) => {
  return (
    <div className='bg-slate-800 border border-slate-600 rounded-xl'>
      <h2 className='text-xs font-semibold p-3 border-b border-slate-600 text-slate-300'>
        Batarya
      </h2>
      <div className='p-3'>
        <BatteryVisualization
          soc={batteryState.soc}
          power={batteryState.power}
          energy={batteryState.energy}
          current={batteryState.current}
          connector={connectorId}
        />
      </div>
    </div>
  );
};
