import { CALL, CALLERROR, CALLRESULT } from '../types/ocpp';

export const formatNumber = (n: number): string => Number(n).toFixed(2);

export const uuidv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const parseOCPPFrame = (raw: any[]): { type: string; action: string; id: string } => {
  try {
    const [t, mid, third] = raw;
    if (t === CALL) {
      return { type: 'CALL', action: third, id: mid };
    } else if (t === CALLRESULT) {
      return { type: 'CALLRESULT', action: '(result)', id: mid };
    } else if (t === CALLERROR) {
      return { type: 'CALLERROR', action: third, id: mid };
    }
    return { type: '', action: '', id: '' };
  } catch {
    return { type: '', action: '', id: '' };
  }
};

export const createOCPPCall = (action: string, payload: any, id: string): any[] => {
  return [CALL, id, action, payload];
};

export const createOCPPResult = (id: string, payload: any): any[] => {
  return [CALLRESULT, id, payload || {}];
};

export const createOCPPError = (id: string, code: string, description: string, details: any): any[] => {
  return [CALLERROR, id, code, description || '', details || {}];
};
