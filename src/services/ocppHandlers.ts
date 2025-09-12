
export interface OCPPHandlers {
  call: (action: string, payload: any) => Promise<any>;
  reply: (id: string, payload: any) => void;
  replyError: (id: string, code: string, description: string, details: any) => void;
  startTransaction: (idTag?: string) => Promise<any>;
  stopTransaction: (idTag?: string) => Promise<any>;
}

export const createOCPPHandlers = (
  call: OCPPHandlers['call'],
  reply: OCPPHandlers['reply'],
  _replyError: OCPPHandlers['replyError'],
  startTransaction: OCPPHandlers['startTransaction'],
  stopTransaction: OCPPHandlers['stopTransaction']
) => ({
  RemoteStartTransaction: async (id: string, p: any) => {
    try {
      await call('Authorize', { idTag: p?.idTag || 'REMOTE' });
      await startTransaction(p?.idTag || 'REMOTE');
      reply(id, { status: 'Accepted' });
    } catch {
      reply(id, { status: 'Rejected' });
    }
  },
  RemoteStopTransaction: async (id: string) => {
    try {
      await stopTransaction('REMOTE');
      reply(id, { status: 'Accepted' });
    } catch {
      reply(id, { status: 'Rejected' });
    }
  },
  Reset: (id: string) => reply(id, { status: 'Accepted' }),
  GetConfiguration: (id: string, p: any) => {
    const keys = p?.key || [];
    const conf = [{ key: 'HeartbeatInterval', readonly: false, value: '60' }];
    reply(id, {
      configurationKey: keys.length
        ? conf.filter((c) => keys.includes(c.key))
        : conf,
      unknownKey: [],
    });
  },
  ChangeAvailability: (id: string) => reply(id, { status: 'Accepted' }),
  ChangeConfiguration: (id: string) => reply(id, { status: 'Accepted' }),
});
