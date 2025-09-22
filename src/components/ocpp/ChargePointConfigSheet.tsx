import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ChargePoint, ConnectionConfig, Protocol } from '@/features/ocpp/ocppSlice';
import { renameChargePoint, updateConfig } from '@/features/ocpp/ocppSlice';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';

interface ChargePointConfigSheetProps {
  chargePoint: ChargePoint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormValues = {
  label: string;
  csmsUrl: string;
  cpId: string;
  protocol: Protocol;
};

const protocolOptions: Protocol[] = ['ocpp1.6', 'ocpp2.0.1'];

export function ChargePointConfigSheet({
  chargePoint,
  open,
  onOpenChange,
}: ChargePointConfigSheetProps) {
  const dispatch = useDispatch();
  const form = useForm<FormValues>({
    defaultValues: mapChargePointToForm(chargePoint),
  });

  useEffect(() => {
    if (open) {
      form.reset(mapChargePointToForm(chargePoint));
    }
  }, [chargePoint, form, open]);

  const submit = form.handleSubmit((values) => {
    const trimmed = {
      label: values.label.trim(),
      csmsUrl: values.csmsUrl.trim(),
      cpId: values.cpId.trim(),
      protocol: values.protocol,
    } satisfies FormValues;

    if (trimmed.label && trimmed.label !== chargePoint.label) {
      dispatch(renameChargePoint({ id: chargePoint.id, label: trimmed.label }));
    }

    const patch: Partial<ConnectionConfig> = {};
    if (trimmed.csmsUrl && trimmed.csmsUrl !== chargePoint.config.csmsUrl) {
      patch.csmsUrl = trimmed.csmsUrl;
    }
    if (trimmed.cpId && trimmed.cpId !== chargePoint.config.cpId) {
      patch.cpId = trimmed.cpId;
    }
    if (trimmed.protocol !== chargePoint.config.protocol) {
      patch.protocol = trimmed.protocol;
    }

    if (Object.keys(patch).length > 0) {
      dispatch(updateConfig({ id: chargePoint.id, patch }));
    }

    onOpenChange(false);
  });

  const protocolValue = form.watch('protocol');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right'>
        <SheetHeader>
          <SheetTitle>Edit Connection</SheetTitle>
        </SheetHeader>
        <form className='p-4 grid gap-3' onSubmit={submit}>
          <div className='grid gap-1'>
            <label htmlFor='label' className='text-sm font-medium'>
              Name
            </label>
            <Input id='label' {...form.register('label')} placeholder='CP name' />
          </div>
          <div className='grid gap-1'>
            <label htmlFor='csmsUrl' className='text-sm font-medium'>
              CSMS URL
            </label>
            <Input
              id='csmsUrl'
              {...form.register('csmsUrl', { required: true })}
              placeholder='ws://host/ocpp/'
            />
          </div>
          <div className='grid gap-1'>
            <label htmlFor='cpId' className='text-sm font-medium'>
              CP ID
            </label>
            <Input
              id='cpId'
              {...form.register('cpId', { required: true })}
              placeholder='SIM_001'
            />
          </div>
          <div className='grid gap-1'>
            <label className='text-sm font-medium'>Protocol</label>
            <Select
              value={protocolValue}
              onValueChange={(value) => form.setValue('protocol', value as Protocol, { shouldDirty: true })}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select protocol' />
              </SelectTrigger>
              <SelectContent>
                {protocolOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='pt-2 flex justify-end gap-2'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit'>Save changes</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function mapChargePointToForm(cp: ChargePoint): FormValues {
  return {
    label: cp.label,
    csmsUrl: cp.config.csmsUrl,
    cpId: cp.config.cpId,
    protocol: cp.config.protocol,
  };
}
