import { QueryClient } from '@tanstack/react-query'
import { parseOCPPFrame, createOCPPCall, createOCPPResult, createOCPPError, uuidv4 } from '../../utils/ocpp'
import { saveFrames, type Frame as PersistedFrame } from './storage'

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

      ws.onmessage = (ev) => {
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
  return new Promise((resolve, reject) => {
    c.pending.set(mid, { resolve, reject, action })
  })
}

export function replyResult(id: string, msgId: string, payload: any) {
  const c = clients.get(id)
  if (!c) throw new Error('No client for id ' + id)
  const arr = createOCPPResult(msgId, payload)
  c.ws.send(JSON.stringify(arr))
}

export function replyError(id: string, msgId: string, code: string, description: string, details: any) {
  const c = clients.get(id)
  if (!c) throw new Error('No client for id ' + id)
  const arr = createOCPPError(msgId, code, description, details)
  c.ws.send(JSON.stringify(arr))
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
    const bounded = next.length > 500 ? next.slice(0, 500) : next
    // persist to localStorage
    try { saveFrames(id, bounded as unknown as PersistedFrame[]) } catch {}
    return bounded
  })
}
