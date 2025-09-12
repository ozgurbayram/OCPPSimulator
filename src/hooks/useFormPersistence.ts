import { useCallback, useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { BatteryState, ConnectionConfig, OCPPFrame } from '../types/ocpp';

interface PersistenceData {
  config: Partial<ConnectionConfig>;
  battery: Partial<BatteryState>;
  frames: OCPPFrame[];
}

export const useFormPersistence = (
  form: UseFormReturn<ConnectionConfig>,
  batteryState: BatteryState,
  frames: OCPPFrame[]
) => {
  const saveToStorage = useCallback(() => {
    const data: PersistenceData = {
      config: form.getValues(),
      battery: {
        soc: batteryState.soc,
        power: batteryState.power,
        current: batteryState.current
      },
      frames: frames.slice(0, 100)
    };
    localStorage.setItem('ocpp_cp_sim_v3', JSON.stringify(data));
  }, [form, batteryState, frames]);

  const loadFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem('ocpp_cp_sim_v3');
      if (saved) {
        const data: PersistenceData = JSON.parse(saved);
        
        if (data.config) {
          // Set all form values at once to avoid multiple re-renders
          form.reset(data.config as ConnectionConfig);
        }
        
        return {
          battery: data.battery,
          frames: data.frames || []
        };
      }
    } catch (e) {
      console.error('Failed to load from storage:', e);
    }
    return { battery: {}, frames: [] };
  }, [form]);

  // Watch for form changes and save them with debounce
  const watchedValues = form.watch();
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToStorage();
    }, 500); // Debounce saves by 500ms

    return () => clearTimeout(timeoutId);
  }, [watchedValues, saveToStorage]);

  const saveImmediately = useCallback(() => {
    saveToStorage();
  }, [saveToStorage]);

  return {
    saveToStorage: saveImmediately,
    loadFromStorage
  };
};
