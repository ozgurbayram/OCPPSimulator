import { QueryClient } from '@tanstack/react-query'
import { parseOCPPFrame, createOCPPCall, createOCPPResult, createOCPPError, uuidv4 } from '../../utils/ocpp'
import { saveFrames, type Frame as PersistedFrame } from './storage'
import { handleInboundFrame } from '@/services/inboundDispatcher'
import { store } from '@/store/store'
import { setTransactionId } from './ocppSlice'

type Pending = { resolve: (v: any) => void; reject: (e: any) => void; action: string }

interface Client {
  ws: WebSocket
  pending: Map<string, Pending>
}

const clients = new Map<string, Client>()

export function connectWs(
  id: string,
  url: string,
  protocol: string,
  queryClient: QueryClient,
  onOpen?: () => void,
  onClose?: () => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket(url, [protocol])
      const client: Client = { ws, pending: new Map() }
      clients.set(id, client)

      ws.onopen = () => {
        // remember queryClient for this id so we can push frames from helpers
        clientsQuery.set(id, queryClient)
        onOpen?.()
        pushFrame(queryClient, id, {
          ts: new Date().toISOString(),
          dir: 'out',
          type: 'OPEN',
          action: url,
          id: protocol,
          raw: ['OPEN', url, protocol],
        })
        resolve()
      }

      ws.onclose = (ev) => {
        onClose?.()
        pushFrame(queryClient, id, {
          ts: new Date().toISOString(),
          dir: 'in',
          type: 'CLOSE',
          action: String(ev.code),
          id: ev.reason || '',
          raw: ['CLOSE', ev.code, ev.reason],
        })
        clients.delete(id)
        clientsQuery.delete(id)
      }

      ws.onerror = (e) => {
        pushFrame(queryClient, id, {
          ts: new Date().toISOString(),
          dir: 'in',
          type: 'ERROR',
          action: String(e),
          id: '',
          raw: ['ERROR', String(e)],
        })
      }

      ws.onmessage = async (ev) => {
        try {
          const arr = JSON.parse(ev.data)
          const meta = parseOCPPFrame(arr)
          pushFrame(queryClient, id, {
            ts: new Date().toISOString(),
            dir: 'in',
            type: (meta.type || 'CALL') as any,
            action: meta.action,
            id: meta.id,
            raw: arr,
          })

          // resolve/reject pending by id
          if (meta.type === 'CALLRESULT') {
            const p = client.pending.get(meta.id)
            if (p) {
              client.pending.delete(meta.id)
              p.resolve(arr[2])
            }
          } else if (meta.type === 'CALLERROR') {
            const p = client.pending.get(meta.id)
            if (p) {
              client.pending.delete(meta.id)
              p.reject(new Error(`${arr[2]}: ${arr[3]}`))
            }
          } else if (meta.type === 'CALL' || arr[0] === 2) {
            // Handle inbound CALL using inbound dispatcher
            try {
              const reply = await handleInboundFrame(arr, {
                nowISO: () => new Date().toISOString(),
                sendCall: (action: string, payload: any) => callAction(id, action, payload),
                getActiveConnectorId: () => store.getState().ocpp.items[id]?.runtime?.connectorId,
                getTransactionId: () => store.getState().ocpp.items[id]?.runtime?.transactionId,
                // Hooks for remote start/stop flows
                startLocalFlow: async ({ connectorId, idTag }) => {
                  const state = store.getState()
                  const cp = state.ocpp.items[id]
                  const conn = connectorId ?? cp?.runtime?.connectorId ?? 1
                  const tag = idTag ?? cp?.runtime?.idTag ?? 'DEMO1234'
                  try {
                    await callAction(id, 'Authorize', { idTag: tag })
                  } catch {}
                  await callAction(id, 'StatusNotification', { connectorId: conn, status: 'Preparing', errorCode: 'NoError' })
                  const meterStart = Math.floor(1000 + Math.random() * 1000)
                  const res = await callAction(id, 'StartTransaction', { connectorId: conn, idTag: tag, meterStart, timestamp: new Date().toISOString() })
                  const txid = typeof res?.transactionId === 'number' ? res.transactionId : Math.floor(Math.random() * 100000)
                  store.dispatch(setTransactionId({ id, transactionId: txid }))
                },
                stopLocalFlow: async ({ transactionId }) => {
                  const state = store.getState()
                  const cp = state.ocpp.items[id]
                  const conn = cp?.runtime?.connectorId ?? 1
                  const tag = cp?.runtime?.idTag ?? 'DEMO1234'
                  await callAction(id, 'StopTransaction', { transactionId, idTag: tag, meterStop: Math.floor(1500 + Math.random() * 500), timestamp: new Date().toISOString(), reason: 'Remote' })
                  store.dispatch(setTransactionId({ id, transactionId: undefined }))
                  await callAction(id, 'StatusNotification', { connectorId: conn, status: 'Available', errorCode: 'NoError' })
                },
              } as any)
              if (reply) {
                client.ws.send(JSON.stringify(reply))
                // Log outbound reply
                const rmeta = parseOCPPFrame(reply as any)
                pushFrame(queryClient, id, {
                  ts: new Date().toISOString(),
                  dir: 'out',
                  type: (rmeta.type || 'CALLRESULT') as any,
                  action: rmeta.action,
                  id: rmeta.id,
                  raw: reply as any,
                })
              }
            } catch (err) {
              // If dispatcher threw, try to send a generic error
              try {
                const mid = Array.isArray(arr) ? arr[1] : ''
                const errFrame = createOCPPError(mid, 'InternalError', String(err), {})
                client.ws.send(JSON.stringify(errFrame))
                const emeta = parseOCPPFrame(errFrame as any)
                pushFrame(queryClient, id, {
                  ts: new Date().toISOString(),
                  dir: 'out',
                  type: (emeta.type || 'CALLERROR') as any,
                  action: emeta.action,
                  id: emeta.id,
                  raw: errFrame as any,
                })
              } catch {}
            }
          }
        } catch (err) {
          pushFrame(queryClient, id, {
            ts: new Date().toISOString(),
            dir: 'in',
            type: 'PARSE_ERR',
            action: String(err),
            id: '',
            raw: ['PARSE_ERR', String(err)],
          })
        }
      }
    } catch (e) {
      reject(e)
    }
  })
}

export function disconnectWs(id: string) {
  const c = clients.get(id)
  if (c) c.ws.close(1000, 'Client disconnect')
}

export function callAction(id: string, action: string, payload: any): Promise<any> {
  const c = clients.get(id)
  if (!c) throw new Error('No client for id ' + id)
  if (c.ws.readyState !== WebSocket.OPEN) throw new Error('WebSocket not open')
  const mid = uuidv4()
  const arr = createOCPPCall(action, payload, mid)
  c.ws.send(JSON.stringify(arr))
  // log sent CALL
  // Note: we don't have queryClient here, so we can't push directly.
  // We will piggyback on a queryClient from any active connect by storing it in a map.
  pushFrameForClient(id, {
    ts: new Date().toISOString(),
    dir: 'out',
    type: 'CALL',
    action,
    id: mid,
    raw: arr,
  })
  return new Promise((resolve, reject) => {
    c.pending.set(mid, { resolve, reject, action })
  })
}

export function replyResult(id: string, msgId: string, payload: any) {
  const c = clients.get(id)
  if (!c) throw new Error('No client for id ' + id)
  const arr = createOCPPResult(msgId, payload)
  c.ws.send(JSON.stringify(arr))
  pushFrameForClient(id, {
    ts: new Date().toISOString(),
    dir: 'out',
    type: 'CALLRESULT',
    action: '(result)',
    id: msgId,
    raw: arr,
  })
}

export function replyError(id: string, msgId: string, code: string, description: string, details: any) {
  const c = clients.get(id)
  if (!c) throw new Error('No client for id ' + id)
  const arr = createOCPPError(msgId, code, description, details)
  c.ws.send(JSON.stringify(arr))
  pushFrameForClient(id, {
    ts: new Date().toISOString(),
    dir: 'out',
    type: 'CALLERROR',
    action: code,
    id: msgId,
    raw: arr,
  })
}

export type Frame = {
  ts: string
  dir: 'in' | 'out'
  type: 'CALL' | 'CALLRESULT' | 'CALLERROR' | 'OPEN' | 'CLOSE' | 'ERROR' | 'PARSE_ERR'
  action: string
  id: string
  raw: any[]
}

export function pushFrame(queryClient: QueryClient, id: string, frame: Frame) {
  queryClient.setQueryData<Frame[] | undefined>(['frames', id], (prev) => {
    const next = [frame, ...(prev || [])]
    const bounded = next.length > 100 ? next.slice(0, 100) : next
    // persist to localStorage
    try { saveFrames(id, bounded as unknown as PersistedFrame[]) } catch {}
    return bounded
  })
}

// Maintain a per-id last used QueryClient to allow logging from helpers
const clientsQuery = new Map<string, QueryClient>()

// Wrap original pushFrame with a queryClient lookup
function pushFrameForClient(id: string, frame: Frame) {
  const qc = clientsQuery.get(id)
  if (!qc) return
  pushFrame(qc, id, frame)
}

// Patch connectWs to remember queryClient per client id
