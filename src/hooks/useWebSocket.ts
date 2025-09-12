import { useCallback, useState } from 'react';
import type { ConnectionConfig, ConnectionStatus, OCPPFrame } from '../types/ocpp';

export const useWebSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  const makeUrl = useCallback((config: ConnectionConfig): string => {
    const { csmsUrl, cpId, user, password } = config;
    let base = csmsUrl.trim();
    if (!base) throw new Error('URL required');
    if (!base.endsWith('/')) base += '/';

    const cp = encodeURIComponent(cpId.trim() || 'SIM_CP_0001');
    const url = new URL(base + cp);

    if (user.trim()) {
      url.username = user.trim();
      url.password = password;
    }

    return url.toString();
  }, []);

  const connect = useCallback((
    config: ConnectionConfig,
    onMessage: (frame: OCPPFrame) => void,
    onConnectionChange: (status: ConnectionStatus) => void
  ) => {
    const url = makeUrl(config);
    const { protocol } = config;
    const ws = new WebSocket(url, [protocol]);

    ws.onopen = () => {
      setSocket(ws);
      setStatus('connected');
      onConnectionChange('connected');
      onMessage({
        ts: new Date().toISOString(),
        dir: 'out',
        type: 'OPEN',
        action: url,
        id: protocol,
        raw: ['OPEN', url, protocol]
      });
    };

    ws.onclose = (ev) => {
      setSocket(null);
      setStatus('disconnected');
      onConnectionChange('disconnected');
      onMessage({
        ts: new Date().toISOString(),
        dir: 'in',
        type: 'CLOSE',
        action: ev.code.toString(),
        id: ev.reason || '',
        raw: ['CLOSE', ev.code, ev.reason]
      });
    };

    ws.onerror = (e) => {
      onMessage({
        ts: new Date().toISOString(),
        dir: 'in',
        type: 'ERROR',
        action: String(e),
        id: '',
        raw: ['ERROR', String(e)]
      });
    };

    ws.onmessage = (ev) => {
      try {
        const frame = JSON.parse(ev.data);
        onMessage({
          ts: new Date().toISOString(),
          dir: 'in',
          type: 'CALL',
          action: '',
          id: '',
          raw: frame
        });
      } catch (err) {
        onMessage({
          ts: new Date().toISOString(),
          dir: 'in',
          type: 'PARSE_ERR',
          action: String(err),
          id: '',
          raw: ['PARSE_ERR', String(err)]
        });
      }
    };
  }, [makeUrl]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close(1000, 'Client disconnect');
    }
  }, [socket]);

  const send = useCallback((frame: any[]) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not open');
    }
    socket.send(JSON.stringify(frame));
  }, [socket]);

  return {
    socket,
    status,
    connect,
    disconnect,
    send
  };
};
