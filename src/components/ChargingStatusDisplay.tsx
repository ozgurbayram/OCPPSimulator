import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Battery, Clock, Gauge, Zap, TrendingUp } from 'lucide-react';

interface MeterValue {
  timestamp: string;
  sampledValue: Array<{
    context: string;
    measurand: string;
    unit: string;
    value: string;
  }>;
}

interface ChargingDataVM {
  connectorId: number;
  transactionId?: number;
  meterValue: MeterValue[];
}

interface ChargingStatusDisplayProps {
  chargingData?: ChargingDataVM;
  isCharging: boolean;
  chargingType: 'AC' | 'DC';
  deviceSettings?: {
    deviceName?: string;
    maxPowerKw?: number;
    nominalVoltageV?: number;
    maxCurrentA?: number;
    connectors?: number;
    socketType?: string[];
  };
}

export function ChargingStatusDisplay({
  chargingData,
  isCharging,
  chargingType,
  deviceSettings,
}: ChargingStatusDisplayProps) {
  const latestMeterValue = chargingData?.meterValue?.[0];
  const sampledValues = latestMeterValue?.sampledValue || [];

  const find = (m: string) => sampledValues.find((v) => v.measurand === m);
  const energyValue = find('Energy.Active.Import.Register');
  const currentValue = find('Current.Offered') || find('Current.Import');
  const powerValue = find('Power.Active.Import');
  const voltageValue = find('Voltage');
  const socValue = find('SoC');

  const energyWh = energyValue ? Number.parseFloat(energyValue.value) : 0;
  const currentA = currentValue ? Number.parseFloat(currentValue.value) : 0;
  const powerKW = powerValue
    ? powerValue.unit?.toLowerCase() === 'kw'
      ? Number.parseFloat(powerValue.value)
      : Number.parseFloat(powerValue.value) / 1000
    : (currentA *
        (voltageValue ? Number.parseFloat(voltageValue.value) : 230)) /
      1000;
  const voltageV = voltageValue ? Number.parseFloat(voltageValue.value) : (deviceSettings?.nominalVoltageV || 230);
  const socPct = socValue ? Number.parseFloat(socValue.value) : undefined;

  const chargingProgress = chargingType === 'DC' && socPct !== undefined
    ? socPct
    : Math.min(100, (energyWh / 50000) * 100);

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Zap className='h-5 w-5' />
            Charging Status
            {chargingData && (
              <Badge variant='outline' className='ml-auto'>
                Connector {chargingData.connectorId}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-5'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3'>
              <div className='flex items-center gap-2'>
                {isCharging ? (
                  <Zap className='h-4 w-4 text-primary' />
                ) : (
                  <Battery className='h-4 w-4 text-muted-foreground' />
                )}
                <span className='text-sm font-medium'>Status</span>
              </div>
              <Badge
                variant={isCharging ? 'default' : 'secondary'}
                className='flex items-center gap-1.5 shrink-0'
              >
                {isCharging ? (
                  <Zap className='h-3 w-3' />
                ) : (
                  <Battery className='h-3 w-3' />
                )}
                {isCharging ? 'Charging' : 'Not Charging'}
              </Badge>
            </div>

            <div className='flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3'>
              <span className='text-sm font-medium'>Charging Type</span>
              <Badge variant='outline' className='shrink-0'>
                {chargingType}
              </Badge>
            </div>

            {deviceSettings?.deviceName && (
              <div className='flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 sm:col-span-2'>
                <span className='text-sm font-medium'>Device</span>
                <span className='text-xs sm:text-sm font-mono break-all text-right max-w-[60%]'>
                  {deviceSettings.deviceName}
                </span>
              </div>
            )}

            {chargingData?.transactionId && (
              <div className='flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 sm:col-span-2'>
                <span className='text-sm font-medium'>Transaction ID</span>
                <span className='text-xs sm:text-sm font-mono break-all text-right'>
                  {chargingData.transactionId}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {chargingType === 'DC' && socPct !== undefined && (
            <>
              <div className='space-y-2'>
                <div className='flex items-center justify-between flex-wrap gap-2'>
                  <div className='flex items-center gap-1'>
                    <Battery className='h-4 w-4 text-muted-foreground shrink-0' />
                    <span className='text-sm font-medium'>Battery SoC</span>
                  </div>
                  <span className='text-xl sm:text-2xl font-bold'>
                    {socPct.toFixed(1)}%
                  </span>
                </div>
                <Progress value={socPct} className='h-3' />
              </div>
              <Separator />
            </>
          )}

          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            <div className='rounded-lg border bg-muted/20 p-3 space-y-2'>
              <div className='flex items-center gap-1.5'>
                <Gauge className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                <span className='text-xs font-medium text-muted-foreground'>Power</span>
              </div>
              <div className='space-y-0.5'>
                <div className='text-lg sm:text-xl font-bold'>
                  {powerKW.toFixed(1)} kW
                </div>
                <div className='text-xs text-muted-foreground'>
                  Max: {deviceSettings?.maxPowerKw || 22} kW
                </div>
              </div>
            </div>

            <div className='rounded-lg border bg-muted/20 p-3 space-y-2'>
              <div className='flex items-center gap-1.5'>
                <Zap className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                <span className='text-xs font-medium text-muted-foreground'>Current</span>
              </div>
              <div className='space-y-0.5'>
                <div className='text-lg sm:text-xl font-bold'>
                  {currentA.toFixed(1)} A
                </div>
                <div className='text-xs text-muted-foreground'>
                  Max: {deviceSettings?.maxCurrentA || 32} A
                </div>
              </div>
            </div>

            <div className='rounded-lg border bg-muted/20 p-3 space-y-2'>
              <span className='text-xs font-medium text-muted-foreground'>Voltage</span>
              <div className='space-y-0.5'>
                <div className='text-lg sm:text-xl font-bold'>
                  {voltageV.toFixed(0)} V
                </div>
                <div className='text-xs text-muted-foreground'>
                  Nominal
                </div>
              </div>
            </div>

            <div className='rounded-lg border bg-muted/20 p-3 space-y-2'>
              <span className='text-xs font-medium text-muted-foreground'>Energy</span>
              <div className='space-y-0.5'>
                <div className='text-lg sm:text-xl font-bold'>
                  {(energyWh / 1000).toFixed(2)} kWh
                </div>
                <div className='text-xs text-muted-foreground'>
                  Delivered
                </div>
              </div>
            </div>
          </div>

          {isCharging && chargingType === 'AC' && (
            <>
              <Separator />
              <div className='rounded-lg border bg-gradient-to-br from-primary/10 via-primary/5 to-muted/30 dark:from-primary/5 dark:via-primary/3 dark:to-transparent p-4 space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='rounded-full bg-primary/15 dark:bg-primary/10 p-1.5 border border-primary/20 dark:border-primary/20'>
                      <TrendingUp className='h-4 w-4 text-primary dark:text-primary' />
                    </div>
                    <span className='text-sm font-semibold'>Session Progress</span>
                  </div>
                  <div className='flex items-baseline gap-1'>
                    <span className='text-2xl sm:text-3xl font-bold text-foreground dark:bg-gradient-to-r dark:from-primary dark:to-primary/60 dark:bg-clip-text dark:text-transparent'>
                      {chargingProgress.toFixed(1)}
                    </span>
                    <span className='text-sm font-medium text-muted-foreground'>%</span>
                  </div>
                </div>
                <div className='space-y-2'>
                  <div className='relative h-3 w-full overflow-hidden rounded-full bg-muted/60 dark:bg-muted/50 border border-border/50'>
                    <div 
                      className='h-full bg-gradient-to-r from-primary via-primary/95 to-primary/85 dark:from-primary dark:via-primary/90 dark:to-primary/80 transition-all duration-500 ease-out relative shadow-sm'
                      style={{ width: `${chargingProgress}%` }}
                    >
                      <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/20 animate-shimmer' />
                    </div>
                  </div>
                  <div className='flex items-center justify-between text-xs'>
                    <div className='flex items-center gap-1.5 text-muted-foreground'>
                      <Zap className='h-3 w-3' />
                      <span className='font-medium'>
                        {(energyWh / 1000).toFixed(2)} kWh
                      </span>
                      <span className='text-muted-foreground/70'>delivered</span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <span className='text-muted-foreground/70'>Target:</span>
                      <span className='font-semibold'>50 kWh</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {latestMeterValue && (
            <>
              <Separator />
              <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                <Clock className='h-3 w-3' />
                Last update:{' '}
                {new Date(latestMeterValue.timestamp).toLocaleTimeString()}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ChargingStatusDisplay;
