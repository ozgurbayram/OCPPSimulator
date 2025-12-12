import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import type { ChargePoint } from '@/features/ocpp/ocppSlice';
import { updateDeviceSettings, updateOcppConfiguration } from '@/features/ocpp/ocppSlice';
import { saveDeviceSettings, saveOcppConfiguration } from '@/features/ocpp/storage';
import { normalizeDeviceSettings, normalizeOcppConfiguration } from '@/constants/chargePointDefaults';
import type { DeviceSettings, OcppConfiguration } from '@/types/ocpp';
import { Settings, Zap, Wifi } from 'lucide-react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { DeviceSettingsForm } from './DeviceSettingsForm';
import { OcppConfigurationForm } from './OcppConfigurationForm';

interface ChargePointAdvancedConfigSheetProps {
  chargePoint: ChargePoint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChargePointAdvancedConfigSheet({
  chargePoint,
  open,
  onOpenChange,
}: ChargePointAdvancedConfigSheetProps) {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('device');

  const deviceSettings = normalizeDeviceSettings({
    deviceName:
      chargePoint.chargePointConfig?.deviceSettings?.deviceName ??
      `Simülatör-${chargePoint.id}`,
    ...(chargePoint.chargePointConfig?.deviceSettings || {}),
  });

  const ocppConfig = normalizeOcppConfiguration(
    chargePoint.chargePointConfig?.ocppConfig
  );

  const handleDeviceSettingsSave = (settings: DeviceSettings) => {
    const normalized = normalizeDeviceSettings(settings);
    dispatch(updateDeviceSettings({ id: chargePoint.id, deviceSettings: normalized }));
    saveDeviceSettings(chargePoint.id, normalized);
    onOpenChange(false);
  };

  const handleOcppConfigSave = (config: OcppConfiguration) => {
    const normalized = normalizeOcppConfiguration(config);
    dispatch(updateOcppConfiguration({ id: chargePoint.id, ocppConfig: normalized }));
    saveOcppConfiguration(chargePoint.id, normalized);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[90vw] lg:w-[85vw] xl:max-w-6xl overflow-y-auto p-0"
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <SheetTitle className="text-xl">Advanced Configuration</SheetTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {chargePoint.label}
                </p>
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 pt-6">
              <div className="flex items-center gap-2 border-b mb-6">
                <Button
                  variant={activeTab === 'device' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('device')}
                  className="rounded-b-none h-10 px-4 gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Device Settings
                </Button>
                <Button
                  variant={activeTab === 'ocpp' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('ocpp')}
                  className="rounded-b-none h-10 px-4 gap-2"
                >
                  <Wifi className="h-4 w-4" />
                  OCPP Configuration
                </Button>
              </div>
              
              <div className="pb-6">
                {activeTab === 'device' && (
                  <DeviceSettingsForm
                    deviceSettings={deviceSettings}
                    onSave={handleDeviceSettingsSave}
                    onCancel={handleCancel}
                  />
                )}
                
                {activeTab === 'ocpp' && (
                  <OcppConfigurationForm
                    ocppConfig={ocppConfig}
                    onSave={handleOcppConfigSave}
                    onCancel={handleCancel}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
