import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

const CALL = 2;
const CALLRESULT = 3;
const CALLERROR = 4;

const formatNumber = (n) => Number(n).toFixed(2);

const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const BatteryVisualization = ({ soc, power, energy, current, connector }) => {
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
          {/* Battery outline */}
          <rect
            x='30'
            y='60'
            rx='10'
            width='340'
            height='100'
            fill='#0b0f17'
            stroke='#233154'
          />
          {/* Battery terminal */}
          <rect
            x='370'
            y='85'
            rx='4'
            width='14'
            height='50'
            fill='#0b0f17'
            stroke='#233154'
          />
          {/* Battery fill */}
          <rect
            x='32'
            y='62'
            width={fillWidth}
            height='96'
            rx='8'
            fill='url(#batteryGradient)'
            filter='url(#batteryGlow)'
          />
          {/* Percentage text */}
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

const NetworkTraffic = ({ frames, paused, onTogglePause, onCopy, onClear }) => {
  const [filter, setFilter] = useState({ dir: 'all', kind: 'all', q: '' });
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

  const FilterChip = ({ active, onClick, children }) => (
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

export default function OCPPSimulator() {
  const [status, setStatus] = useState('disconnected');
  const [socket, setSocket] = useState(null);
  const [pending] = useState(new Map());
  const [currentTransactionId, setCurrentTransactionId] = useState(null);
  const [frames, setFrames] = useState([]);
  const [paused, setPaused] = useState(false);

  // Battery state
  const [soc, setSoc] = useState(45);
  const [power, setPower] = useState(0);
  const [current, setCurrent] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [meterStart, setMeterStart] = useState(0);
  const [energyWh, setEnergyWh] = useState(0);

  // Timers
  const heartbeatTimer = useRef(null);
  const txTimer = useRef(null);
  const powerTimer = useRef(null);

  const { register, handleSubmit, watch, setValue, getValues } = useForm({
    defaultValues: {
      csmsUrl: 'wss://example-csms/ocpp/',
      cpId: 'SIM_CP_0001',
      protocol: 'ocpp1.6',
      user: '',
      password: '',
      vendor: 'EVS-Sim',
      model: 'Browser-CP',
      activeConnector: 1,
    },
  });

  const connectorId = watch('activeConnector') || 1;

  // Save to localStorage
  const saveToStorage = useCallback(() => {
    const data = {
      ...getValues(),
      soc,
      power,
      current,
      frames: frames.slice(0, 100),
    };
    localStorage.setItem('ocpp_cp_sim_v3', JSON.stringify(data));
  }, [getValues, soc, power, current, frames]);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ocpp_cp_sim_v3');
      if (saved) {
        const data = JSON.parse(saved);
        Object.keys(data).forEach((key) => {
          if (
            key !== 'frames' &&
            key !== 'soc' &&
            key !== 'power' &&
            key !== 'current'
          ) {
            setValue(key, data[key]);
          }
        });
        if (data.frames) setFrames(data.frames);
        if (typeof data.soc === 'number') setSoc(data.soc);
        if (typeof data.power === 'number') setPower(data.power);
        if (typeof data.current === 'number') setCurrent(data.current);
      }
    } catch (e) {
      console.error('Failed to load from storage:', e);
    }
  }, [setValue]);

  // Auto-save changes
  useEffect(() => {
    saveToStorage();
  }, [saveToStorage]);

  const addFrame = useCallback(
    (dir, raw) => {
      const ts = new Date();
      let type = '';
      let action = '';
      let id = '';

      try {
        const [t, mid, third] = raw;
        if (t === CALL) {
          type = 'CALL';
          action = third;
          id = mid;
        } else if (t === CALLRESULT) {
          type = 'CALLRESULT';
          action = '(result)';
          id = mid;
        } else if (t === CALLERROR) {
          type = 'CALLERROR';
          action = third;
          id = mid;
        }
      } catch {}

      const rec = { ts: ts.toISOString(), dir, type, action, id, raw };

      if (!paused) {
        setFrames((prev) => {
          const newFrames = [rec, ...prev];
          return newFrames.length > 500 ? newFrames.slice(0, 500) : newFrames;
        });
      }
    },
    [paused]
  );

  const wsSend = useCallback(
    (frame) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not open');
      }
      socket.send(JSON.stringify(frame));
      addFrame('out', frame);
    },
    [socket, addFrame]
  );

  const call = useCallback(
    (action, payload) => {
      const id = uuidv4();
      const frame = [CALL, id, action, payload];

      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject, action });
        try {
          wsSend(frame);
        } catch (e) {
          pending.delete(id);
          reject(e);
        }
      });
    },
    [pending, wsSend]
  );

  const reply = useCallback(
    (id, payload) => {
      wsSend([CALLRESULT, id, payload || {}]);
    },
    [wsSend]
  );

  const replyError = useCallback(
    (id, code, desc, det) => {
      wsSend([CALLERROR, id, code, desc || '', det || {}]);
    },
    [wsSend]
  );

  // OCPP message handlers
  const handlers = {
    RemoteStartTransaction: async (id, p) => {
      try {
        await call('Authorize', { idTag: p?.idTag || 'REMOTE' });
        await startTransaction(p?.idTag || 'REMOTE');
        reply(id, { status: 'Accepted' });
      } catch {
        reply(id, { status: 'Rejected' });
      }
    },
    RemoteStopTransaction: async (id) => {
      try {
        await stopTransaction('REMOTE');
        reply(id, { status: 'Accepted' });
      } catch {
        reply(id, { status: 'Rejected' });
      }
    },
    Reset: (id) => reply(id, { status: 'Accepted' }),
    GetConfiguration: (id, p) => {
      const keys = p?.key || [];
      const conf = [{ key: 'HeartbeatInterval', readonly: false, value: '60' }];
      reply(id, {
        configurationKey: keys.length
          ? conf.filter((c) => keys.includes(c.key))
          : conf,
        unknownKey: [],
      });
    },
    ChangeAvailability: (id) => reply(id, { status: 'Accepted' }),
    ChangeConfiguration: (id) => reply(id, { status: 'Accepted' }),
  };

  // Charging simulation
  const beginCharge = useCallback(() => {
    setStatus('charging');
    const targetKw = 7.4;
    setPower(targetKw);
    setCurrent(32);

    clearInterval(powerTimer.current);
    clearInterval(txTimer.current);

    powerTimer.current = setInterval(() => {
      const jitter = (Math.random() - 0.5) * 0.6;
      const cur = Math.max(1, targetKw + jitter);
      setPower(cur);
      setCurrent(32 + Math.round(jitter * 3));
      setSoc((prev) => Math.min(100, prev + 0.5));
    }, 1500);

    txTimer.current = setInterval(() => {
      setEnergyWh((prev) => {
        const newEnergyWh = prev + power * (5 / 3600) * 1000;
        setEnergy((newEnergyWh - meterStart) / 1000);
        return newEnergyWh;
      });

      call('MeterValues', {
        connectorId,
        transactionId: currentTransactionId || 0,
        meterValue: [
          {
            timestamp: new Date().toISOString(),
            sampledValue: [
              {
                value: String(Math.floor(energyWh)),
                measurand: 'Energy.Active.Import.Register',
                unit: 'Wh',
              },
            ],
          },
        ],
      }).catch(() => {});

      if (soc >= 100) {
        stopTransaction().catch(() => {});
      }
    }, 5000);
  }, [
    power,
    meterStart,
    energyWh,
    connectorId,
    currentTransactionId,
    call,
    soc,
  ]);

  const endCharge = useCallback(() => {
    setStatus('idle');
    clearInterval(txTimer.current);
    clearInterval(powerTimer.current);
    setPower(0);
    setCurrent(0);
  }, []);

  // OCPP functions
  const sendBoot = async () => {
    const { vendor, model } = getValues();
    const payload = {
      chargePointVendor: vendor || 'EVS-Sim',
      chargePointModel: model || 'Browser-CP',
      firmwareVersion: '3.0.0',
    };

    const r = await call('BootNotification', payload);
    const iv = Math.max(5, r?.interval || 60);

    clearInterval(heartbeatTimer.current);
    heartbeatTimer.current = setInterval(() => {
      call('Heartbeat', {}).catch(() => {});
    }, iv * 1000);
  };

  const sendHeartbeat = () => call('Heartbeat', {});

  const statusNotification = (status = 'Available', errorCode = 'NoError') => {
    return call('StatusNotification', {
      connectorId,
      errorCode,
      status,
      timestamp: new Date().toISOString(),
    });
  };

  const authorize = (idTag = 'DEMO1234') => call('Authorize', { idTag });

  const startTransaction = async (idTag = 'DEMO1234') => {
    const newMeterStart = Math.floor(1000 + Math.random() * 1000);
    setMeterStart(newMeterStart);
    setEnergyWh(newMeterStart);

    const ts = new Date().toISOString();
    const res = await call('StartTransaction', {
      connectorId,
      idTag,
      meterStart: newMeterStart,
      timestamp: ts,
    });

    const transactionId =
      res?.transactionId || Math.floor(Math.random() * 100000);
    setCurrentTransactionId(transactionId);
    beginCharge();
    return res;
  };

  const meterValues = () => {
    return call('MeterValues', {
      connectorId,
      transactionId: currentTransactionId || 0,
      meterValue: [
        {
          timestamp: new Date().toISOString(),
          sampledValue: [
            {
              value: String(Math.floor(energyWh)),
              measurand: 'Energy.Active.Import.Register',
              unit: 'Wh',
            },
          ],
        },
      ],
    });
  };

  const stopTransaction = async (idTag = 'DEMO1234') => {
    const ts = new Date().toISOString();
    const meterStop = Math.floor(energyWh);

    const res = await call('StopTransaction', {
      transactionId: currentTransactionId || 0,
      idTag,
      meterStop,
      timestamp: ts,
      reason: 'Local',
    });

    endCharge();
    return res;
  };

  // Connection functions
  const makeUrl = () => {
    const { csmsUrl, cpId, user, password } = getValues();
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
  };

  const connect = () => {
    const url = makeUrl();
    const { protocol } = getValues();
    const ws = new WebSocket(url, [protocol]);

    ws.onopen = () => {
      setSocket(ws);
      setStatus('connected');
      addFrame('out', ['OPEN', url, protocol]);
    };

    ws.onclose = (ev) => {
      setSocket(null);
      setStatus('disconnected');
      clearInterval(heartbeatTimer.current);
      endCharge();
      addFrame('in', ['CLOSE', ev.code, ev.reason]);
    };

    ws.onerror = (e) => {
      addFrame('in', ['ERROR', String(e?.message || e)]);
    };

    ws.onmessage = async (ev) => {
      try {
        const frame = JSON.parse(ev.data);
        addFrame('in', frame);

        const [type, id, third, fourth] = frame;

        if (type === CALLRESULT) {
          const pend = pending.get(id);
          pending.delete(id);
          if (pend) pend.resolve(third);
        } else if (type === CALLERROR) {
          const pend = pending.get(id);
          pending.delete(id);
          if (pend) pend.reject(new Error(`${third}: ${fourth}`));
        } else if (type === CALL) {
          const handler = handlers[third];
          if (handler) {
            await handler(id, fourth || {});
          } else {
            replyError(id, 'NotImplemented', `Action ${third} not handled`, {});
          }
        }
      } catch (err) {
        addFrame('in', ['PARSE_ERR', String(err)]);
      }
    };
  };

  const disconnect = () => {
    if (socket) {
      socket.close(1000, 'Client disconnect');
    }
  };

  const handleConnect = () => {
    try {
      connect();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleAction = (action) => {
    action().catch((e) => alert(e.message || e));
  };

  return (
    <div className='min-h-screen bg-slate-950 text-slate-100'>
      {/* Header */}
      <header className='p-4 bg-slate-800 border-b border-slate-600 flex items-center gap-3'>
        <h1 className='text-base font-semibold'>OCPP 1.6J CP Simulator — v3</h1>
        <span
          className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs border ${
            status === 'connected'
              ? 'bg-green-900 border-green-700 text-green-200'
              : status === 'charging'
              ? 'bg-blue-900 border-blue-700 text-blue-200'
              : 'bg-slate-700 border-slate-600 text-slate-300'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              status === 'connected'
                ? 'bg-green-400'
                : status === 'charging'
                ? 'bg-blue-400'
                : 'bg-slate-400'
            }`}
          />
          {status}
        </span>
      </header>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-3 p-3'>
        {/* Left Column - Connection */}
        <div className='space-y-3'>
          <div className='bg-slate-800 border border-slate-600 rounded-xl'>
            <h2 className='text-xs font-semibold p-3 border-b border-slate-600 text-slate-300'>
              Bağlantı
            </h2>
            <div className='p-3 space-y-3'>
              <div>
                <label className='block text-xs text-slate-400 mb-1'>
                  CSMS URL
                </label>
                <input
                  {...register('csmsUrl')}
                  placeholder='wss://host/path/'
                  className='w-full px-2 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm'
                />
              </div>

              <div className='flex gap-2'>
                <div className='flex-1'>
                  <label className='block text-xs text-slate-400 mb-1'>
                    CP ID
                  </label>
                  <input
                    {...register('cpId')}
                    className='w-full px-2 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm'
                  />
                </div>
                <div className='flex-1'>
                  <label className='block text-xs text-slate-400 mb-1'>
                    Protokol
                  </label>
                  <select
                    {...register('protocol')}
                    className='w-full px-2 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm'
                  >
                    <option value='ocpp1.6'>ocpp1.6</option>
                    <option value='ocpp2.0.1'>ocpp2.0.1</option>
                  </select>
                </div>
              </div>

              <details className='mt-2'>
                <summary className='text-xs text-slate-400 cursor-pointer'>
                  Auth
                </summary>
                <div className='flex gap-2 mt-2'>
                  <input
                    {...register('user')}
                    placeholder='username'
                    className='flex-1 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm'
                  />
                  <input
                    {...register('password')}
                    type='password'
                    placeholder='password'
                    className='flex-1 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm'
                  />
                </div>
              </details>

              <div className='flex gap-2 pt-2'>
                <button
                  onClick={handleConnect}
                  disabled={status === 'connected' || status === 'charging'}
                  className='px-3 py-2 bg-blue-600 text-white rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm'
                >
                  Connect
                </button>
                <button
                  onClick={disconnect}
                  disabled={status === 'disconnected'}
                  className='px-3 py-2 bg-slate-700 text-slate-200 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm'
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className='bg-slate-800 border border-slate-600 rounded-xl'>
            <h2 className='text-xs font-semibold p-3 border-b border-slate-600 text-slate-300'>
              Kontroller
            </h2>
            <div className='p-3 space-y-3'>
              <div className='grid grid-cols-3 gap-2'>
                <div>
                  <label className='block text-xs text-slate-400 mb-1'>
                    Connector
                  </label>
                  <input
                    {...register('activeConnector', { valueAsNumber: true })}
                    type='number'
                    min='1'
                    className='w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm'
                  />
                </div>
                <div>
                  <label className='block text-xs text-slate-400 mb-1'>
                    Vendor
                  </label>
                  <input
                    {...register('vendor')}
                    className='w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm'
                  />
                </div>
                <div>
                  <label className='block text-xs text-slate-400 mb-1'>
                    Model
                  </label>
                  <input
                    {...register('model')}
                    className='w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm'
                  />
                </div>
              </div>

              <div className='flex flex-wrap gap-2'>
                <button
                  onClick={() => handleAction(sendBoot)}
                  className='px-3 py-2 bg-blue-600 text-white rounded font-semibold text-xs'
                >
                  BootNotification
                </button>
                <button
                  onClick={() => handleAction(sendHeartbeat)}
                  className='px-3 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded font-semibold text-xs'
                >
                  Heartbeat
                </button>
                <button
                  onClick={() => handleAction(statusNotification)}
                  className='px-3 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded font-semibold text-xs'
                >
                  Status
                </button>
                <button
                  onClick={() => handleAction(authorize)}
                  className='px-3 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded font-semibold text-xs'
                >
                  Authorize
                </button>
                <button
                  onClick={() => handleAction(startTransaction)}
                  className='px-3 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded font-semibold text-xs'
                >
                  StartTx
                </button>
                <button
                  onClick={() => handleAction(meterValues)}
                  className='px-3 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded font-semibold text-xs'
                >
                  MeterValues
                </button>
                <button
                  onClick={() => handleAction(stopTransaction)}
                  className='px-3 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded font-semibold text-xs'
                >
                  StopTx
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Battery */}
        <div className='bg-slate-800 border border-slate-600 rounded-xl'>
          <h2 className='text-xs font-semibold p-3 border-b border-slate-600 text-slate-300'>
            Batarya
          </h2>
          <div className='p-3'>
            <BatteryVisualization
              soc={soc}
              power={power}
              energy={energy}
              current={current}
              connector={connectorId}
            />
          </div>
        </div>
      </div>

      {/* Network Traffic - Full Width */}
      <div className='px-3 pb-3'>
        <NetworkTraffic
          frames={frames}
          paused={paused}
          onTogglePause={() => setPaused(!paused)}
          onCopy={() => {
            const data = JSON.stringify(frames, null, 2);
            navigator.clipboard.writeText(data);
          }}
          onClear={() => {
            setFrames([]);
            saveToStorage();
          }}
        />
      </div>
    </div>
  );
}
