export const CALL = 2;
export const CALLRESULT = 3;
export const CALLERROR = 4;

export type OCPPFrameType = typeof CALL | typeof CALLRESULT | typeof CALLERROR;

export interface OCPPFrame {
  ts: string;
  dir: 'in' | 'out';
  type: 'CALL' | 'CALLRESULT' | 'CALLERROR' | 'OPEN' | 'CLOSE' | 'ERROR' | 'PARSE_ERR';
  action: string;
  id: string;
  raw: any[];
}

export interface ConnectionConfig {
  csmsUrl: string;
  cpId: string;
  protocol: 'ocpp1.6' | 'ocpp2.0.1';
  user: string;
  password: string;
  vendor: string;
  model: string;
  activeConnector: number;
}

export interface BatteryState {
  soc: number;
  power: number;
  current: number;
  energy: number;
  meterStart: number;
  energyWh: number;
}

export interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  action: string;
}

export type ConnectionStatus = 'disconnected' | 'connected' | 'charging' | 'idle';

export interface NetworkTrafficFilter {
  dir: 'all' | 'in' | 'out';
  kind: 'all' | 'CALL' | 'CALLRESULT' | 'CALLERROR';
  q: string;
}
