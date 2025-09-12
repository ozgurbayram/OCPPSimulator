import { useCallback, useRef } from 'react';
import type { OCPPFrame, PendingRequest } from '../types/ocpp';
import { createOCPPCall, createOCPPError, createOCPPResult, parseOCPPFrame, uuidv4 } from '../utils/ocpp';

export const useOCPPMessages = (send: (frame: any[]) => void, addFrame: (dir: 'in' | 'out', raw: any[]) => void) => {
  const pending = useRef(new Map<string, PendingRequest>());

  const call = useCallback((action: string, payload: any): Promise<any> => {
    const id = uuidv4();
    const frame = createOCPPCall(action, payload, id);

    return new Promise((resolve, reject) => {
      pending.current.set(id, { resolve, reject, action });
      try {
        send(frame);
        addFrame('out', frame);
      } catch (e) {
        pending.current.delete(id);
        reject(e);
      }
    });
  }, [send, addFrame]);

  const reply = useCallback((id: string, payload: any) => {
    const frame = createOCPPResult(id, payload);
    send(frame);
    addFrame('out', frame);
  }, [send, addFrame]);

  const replyError = useCallback((id: string, code: string, description: string, details: any) => {
    const frame = createOCPPError(id, code, description, details);
    send(frame);
    addFrame('out', frame);
  }, [send, addFrame]);

  const handleIncomingMessage = useCallback((frame: OCPPFrame) => {
    const { type, id, action } = parseOCPPFrame(frame.raw);
    
    if (type === 'CALLRESULT') {
      const pend = pending.current.get(id);
      pending.current.delete(id);
      if (pend) pend.resolve(frame.raw[2]);
    } else if (type === 'CALLERROR') {
      const pend = pending.current.get(id);
      pending.current.delete(id);
      if (pend) pend.reject(new Error(`${frame.raw[2]}: ${frame.raw[3]}`));
    } else if (type === 'CALL') {
      return { action, id, payload: frame.raw[3] || {} };
    }
    
    return null;
  }, []);

  return {
    call,
    reply,
    replyError,
    handleIncomingMessage
  };
};
