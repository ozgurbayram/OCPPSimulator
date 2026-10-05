import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { faultCatalogue, activateConnectorFault, clearConnectorFault } from '@/features/ocpp/faults';
import { useOcppConnection } from '@/features/ocpp/hooks';
import type { ChargePoint } from '@/features/ocpp/ocppSlice';
import { setTransactionId, updateConnector, updateConnectorStatus } from '@/features/ocpp/ocppSlice';
import { useBatteryState } from '@/hooks/useBatteryState';
import { trackChargingStarted, trackChargingStopped, trackFault, trackOcppAction } from '@/lib/analytics';
import { getMeterForCp } from '@/services/meterModel';
import { Plug, Power, Activity, Lock, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';

type PanelForm = {
  vendor: string;
  model: string;
};

interface ControlsPanelProps {
  cp: ChargePoint;
  deviceSettings?: {
    connectors?: number;
    socketType?: string[];
    deviceName?: string;
    batteryStartPercent?: number;
  };
}

export const ControlsPanel = ({ cp, deviceSettings }: ControlsPanelProps) => {
  const dispatch = useDispatch();
  const { call } = useOcppConnection(cp);
  const connected = cp.status === 'connected';
  const { beginCharge, endCharge, setMeterStart } = useBatteryState();
  const numConnectors = deviceSettings?.connectors || 1;
  const [selectedConnectorId, setSelectedConnectorId] = useState(1);
  const [selectedFaultCode, setSelectedFaultCode] = useState<(typeof faultCatalogue)[number]['errorCode']>('HighTemperature');

  const form = useForm<PanelForm>({
    defaultValues: {
      vendor: 'EVS-Sim',
      model: deviceSettings?.deviceName || 'Browser-CP',
    },
  });

  useEffect(() => {
    if (selectedConnectorId > numConnectors) {
      setSelectedConnectorId(1);
    }
  }, [numConnectors, selectedConnectorId]);

  const connectorId = selectedConnectorId;
  const activeConnector = cp.runtime?.connectors?.find(c => c.id === connectorId);
  const hasActiveFault = activeConnector?.status === 'Faulted' && !!activeConnector.activeFaultCode;
  const activeFaultDefinition = faultCatalogue.find((fault) => fault.errorCode === activeConnector?.activeFaultCode);
  const selectedFaultDefinition = faultCatalogue.find((fault) => fault.errorCode === selectedFaultCode);
  const sameFaultAlreadyActive = hasActiveFault && activeConnector?.activeFaultCode === selectedFaultCode;

  const onBoot = () => {
    const v = form.getValues();
    call.mutate({
      action: 'BootNotification',
      payload: {
        chargePointVendor: v.vendor || 'EVS-Sim',
        chargePointModel: v.model || 'Browser-CP',
      },
    }, {
      onSuccess: () => trackOcppAction('BootNotification', 'success'),
      onError: () => trackOcppAction('BootNotification', 'failure'),
    });
  };

  const onHeartbeat = () => {
    call.mutate({ action: 'Heartbeat', payload: {} }, {
      onSuccess: () => trackOcppAction('Heartbeat', 'success'),
      onError: () => trackOcppAction('Heartbeat', 'failure'),
    });
  };

  const onStatus = () => {
    call.mutate({
      action: 'StatusNotification',
      payload: {
        connectorId,
        status: 'Available',
        errorCode: 'NoError',
      },
    }, {
      onSuccess: () => trackOcppAction('StatusNotification', 'success', connectorId),
      onError: () => trackOcppAction('StatusNotification', 'failure', connectorId),
    });
    dispatch(updateConnectorStatus({ id: cp.id, connectorId, status: 'Available' }));
  };

  const onAuthorize = () => {
    call.mutate({
      action: 'Authorize',
      payload: { idTag: cp.runtime?.connectors?.find(c => c.id === connectorId)?.idTag || 'DEMO1234' },
    }, {
      onSuccess: () => trackOcppAction('Authorize', 'success', connectorId),
      onError: () => trackOcppAction('Authorize', 'failure', connectorId),
    });
  };

  const onStartTx = async () => {
    const meterStart = Math.floor(1000 + Math.random() * 1000);
    try {
      await call.mutateAsync({
        action: 'Authorize',
        payload: { idTag: cp.runtime?.connectors?.find(c => c.id === connectorId)?.idTag || 'DEMO1234' },
      });
    } catch {}
    const res = await call.mutateAsync({
      action: 'StartTransaction',
      payload: {
        connectorId,
        idTag: cp.runtime?.connectors?.find(c => c.id === connectorId)?.idTag || 'DEMO1234',
        meterStart,
        timestamp: new Date().toISOString(),
      },
    });
    const txid =
      typeof (res as any)?.transactionId === 'number'
        ? (res as any).transactionId
        : Math.floor(Math.random() * 100000);
    dispatch(setTransactionId({ id: cp.id, connectorId, transactionId: txid }));
    trackChargingStarted({
      sessionKey: `${cp.id}:${connectorId}`,
      protocol: cp.config.protocol,
      connectorId,
      meterStartWh: meterStart,
      startSocPercent: deviceSettings?.batteryStartPercent,
    });
    await call.mutateAsync({
      action: 'StatusNotification',
      payload: {
        connectorId,
        status: 'Charging',
        errorCode: 'NoError',
      },
    });
    dispatch(updateConnectorStatus({ id: cp.id, connectorId, status: 'Charging' }));
    // begin local battery simulation and periodic MeterValues pushes
    setMeterStart(meterStart);
    beginCharge(() => {
      onMeterValues();
    });
  };

  const onMeterValues = () => {
    const meter = getMeterForCp(cp.id);
    meter?.tick().catch(() => {});
  };

  const onStopTx = async () => {
    const tx = cp.runtime?.connectors?.find(c => c.id === connectorId)?.transactionId || 0;
    let meterStop = 0;
    let endSocPercent: number | undefined;
    try {
      const m = getMeterForCp(cp.id);
      await m?.tick();
      const st = m?.getState(connectorId);
      meterStop = Math.floor(Math.max(0, Number(st?.energyWh || 0)));
      endSocPercent = typeof st?.socPct === 'number' ? st.socPct : undefined;
    } catch {}
    await call.mutateAsync({
      action: 'StopTransaction',
      payload: {
        transactionId: tx,
        idTag: cp.runtime?.connectors?.find(c => c.id === connectorId)?.idTag || 'DEMO1234',
        meterStop,
        timestamp: new Date().toISOString(),
        reason: 'Local',
      },
    });
    dispatch(setTransactionId({ id: cp.id, connectorId, transactionId: undefined }));
    trackChargingStopped({
      sessionKey: `${cp.id}:${connectorId}`,
      protocol: cp.config.protocol,
      connectorId,
      meterStopWh: meterStop,
      endSocPercent,
      reason: 'local',
    });
    await call.mutateAsync({
      action: 'StatusNotification',
      payload: {
        connectorId,
        status: 'Available',
        errorCode: 'NoError',
      },
    });
    dispatch(updateConnectorStatus({ id: cp.id, connectorId, status: 'Available' }));
    endCharge();
  };

  const onUnlockCable = async () => {
    await call.mutateAsync({
      action: 'StatusNotification',
      payload: {
        connectorId,
        status: 'Available',
        errorCode: 'NoError',
      },
    });
    trackOcppAction('UnlockConnector', 'success', connectorId);
  };

  const onSimulateFault = async () => {
    if (!activeConnector || !connected) return;
    if (sameFaultAlreadyActive) return;

    const nextConnector = activateConnectorFault(activeConnector, selectedFaultCode);
    dispatch(
      updateConnector({
        id: cp.id,
        connectorId,
        updates: {
          status: nextConnector.status,
          errorCode: nextConnector.errorCode,
          lastNonFaultStatus: nextConnector.lastNonFaultStatus,
          activeFaultCode: nextConnector.activeFaultCode,
        },
      })
    );

    await call.mutateAsync({
      action: 'StatusNotification',
      payload: {
        connectorId,
        status: 'Faulted',
        errorCode: selectedFaultCode,
        timestamp: new Date().toISOString(),
      },
    });
    trackFault('simulated', connectorId, selectedFaultCode, selectedFaultDefinition?.category);
  };

  const onClearFault = async () => {
    if (!activeConnector || !hasActiveFault || !connected) return;

    const nextConnector = clearConnectorFault(activeConnector);
    dispatch(
      updateConnector({
        id: cp.id,
        connectorId,
        updates: {
          status: nextConnector.status,
          errorCode: nextConnector.errorCode,
          lastNonFaultStatus: nextConnector.lastNonFaultStatus,
          activeFaultCode: nextConnector.activeFaultCode,
        },
      })
    );

    await call.mutateAsync({
      action: 'StatusNotification',
      payload: {
        connectorId,
        status: nextConnector.status,
        errorCode: 'NoError',
        timestamp: new Date().toISOString(),
      },
    });
    trackFault('cleared', connectorId, activeConnector.activeFaultCode, activeFaultDefinition?.category);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Plug className='h-5 w-5' />
          OCPP Controls
          {deviceSettings?.deviceName && (
            <Badge variant='outline' className='ml-auto'>
              {deviceSettings.deviceName}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3'>
          <span className='font-medium text-sm'>Connector</span>
          <Select value={selectedConnectorId.toString()} onValueChange={(value) => setSelectedConnectorId(Number(value))}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: numConnectors }, (_, i) => i + 1).map(id => (
                <SelectItem key={id} value={id.toString()}>
                  {id} - {deviceSettings?.socketType?.[id - 1] || 'Type2'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-4'>
          <div className='space-y-2.5'>
            <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide'>
              <AlertTriangle className='h-3.5 w-3.5' />
              Fault Simulation
            </div>
            <div className='space-y-3 rounded-lg border bg-muted/20 p-3'>
              <div className='flex items-center justify-between gap-2 text-xs text-muted-foreground'>
                <span>Error</span>
                <Select value={selectedFaultCode} onValueChange={(value) => setSelectedFaultCode(value as (typeof faultCatalogue)[number]['errorCode'])}>
                  <SelectTrigger className='w-52'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {faultCatalogue.map((fault) => (
                      <SelectItem key={fault.errorCode} value={fault.errorCode}>
                        {fault.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='rounded-md border bg-background/60 p-2 text-xs text-muted-foreground'>
                {hasActiveFault && activeFaultDefinition ? (
                  <div className='space-y-1'>
                    <div className='font-medium text-foreground'>🔴 {activeFaultDefinition.label}</div>
                    <div>Connector {connectorId}</div>
                    <div>{activeFaultDefinition.description}</div>
                  </div>
                ) : (
                  <div className='text-muted-foreground'>No active fault</div>
                )}
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <Button
                  size='sm'
                  variant='destructive'
                  onClick={onSimulateFault}
                  disabled={!connected || !activeConnector || sameFaultAlreadyActive}
                  className='h-9 text-xs sm:text-sm'
                >
                  Simulate Fault
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={onClearFault}
                  disabled={!connected || !hasActiveFault}
                  className='h-9 text-xs sm:text-sm'
                >
                  Clear Fault
                </Button>
              </div>
            </div>
          </div>

          <div className='space-y-2.5'>
            <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide'>
              <Activity className='h-3.5 w-3.5' />
              Connection & Status
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2'>
              <Button 
                size='sm' 
                onClick={onBoot} 
                disabled={!connected}
                className='h-9 text-xs sm:text-sm'
              >
                BootNotification
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={onHeartbeat}
                disabled={!connected}
                className='h-9 text-xs sm:text-sm'
              >
                Heartbeat
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={onStatus}
                disabled={!connected}
                className='h-9 text-xs sm:text-sm'
              >
                Status
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={onAuthorize}
                disabled={!connected}
                className='h-9 text-xs sm:text-sm'
              >
                Authorize
              </Button>
            </div>
          </div>

          <Separator />

          <div className='space-y-2.5'>
            <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide'>
              <Power className='h-3.5 w-3.5' />
              Transaction
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
              <Button
                size='sm'
                variant='secondary'
                onClick={onStartTx}
                disabled={
                  !connected || !!cp.runtime?.connectors?.find(c => c.id === connectorId)?.transactionId
                }
                className='h-9 text-xs sm:text-sm'
              >
                StartTx
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={onMeterValues}
                disabled={!connected}
                className='h-9 text-xs sm:text-sm'
              >
                MeterValues
              </Button>
              <Button
                size='sm'
                variant='destructive'
                onClick={onStopTx}
                disabled={
                  !connected || !cp.runtime?.connectors?.find(c => c.id === connectorId)?.transactionId
                }
                className='h-9 text-xs sm:text-sm'
              >
                StopTx
              </Button>
            </div>
          </div>

          <Separator />

          <div className='space-y-2.5'>
            <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide'>
              <Lock className='h-3.5 w-3.5' />
              Connector Control
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md'>
              <Button
                size='sm'
                variant='secondary'
                onClick={onUnlockCable}
                disabled={!connected}
                className='h-9 text-xs sm:text-sm'
              >
                Unlock Cable
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ControlsPanel;
