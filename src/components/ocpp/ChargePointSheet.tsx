import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDispatch } from 'react-redux'
import { addChargePoint } from '@/features/ocpp/ocppSlice'
import { useNavigate } from 'react-router-dom'

interface Props { open: boolean; onOpenChange: (open: boolean) => void }

type FormValues = { label?: string; csmsUrl: string; cpId: string; protocol: 'ocpp1.6' | 'ocpp2.0.1' | string }

export function ChargePointSheet({ open, onOpenChange }: Props) {
  const form = useForm<FormValues>({ defaultValues: { label: '', csmsUrl: 'ws://localhost:9000/ocpp/', cpId: 'SIM_CP', protocol: 'ocpp1.6' } })
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const onSubmit = form.handleSubmit((values) => {
    const action: any = dispatch(addChargePoint({ label: values.label?.trim() || undefined, config: { csmsUrl: values.csmsUrl.trim(), cpId: values.cpId.trim(), protocol: values.protocol as any } }))
    const id: string = action.payload.id
    onOpenChange(false)
    navigate(`/cp/${id}`)
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right'>
        <SheetHeader>
          <SheetTitle>New Charge Point</SheetTitle>
        </SheetHeader>
        <form className='p-4 grid gap-3' onSubmit={onSubmit}>
          <div className='grid gap-1'>
            <label htmlFor='label' className='text-sm font-medium'>Name</label>
            <Input id='label' placeholder='CP name (optional)' {...form.register('label')} />
          </div>
          <div className='grid gap-1'>
            <label htmlFor='csmsUrl' className='text-sm font-medium'>CSMS URL</label>
            <Input id='csmsUrl' placeholder='ws://host/ocpp/' {...form.register('csmsUrl', { required: true })} />
          </div>
          <div className='grid gap-1'>
            <label htmlFor='cpId' className='text-sm font-medium'>CP ID</label>
            <Input id='cpId' placeholder='SIM_001' {...form.register('cpId', { required: true })} />
          </div>
          <div className='grid gap-1'>
            <label htmlFor='protocol' className='text-sm font-medium'>Protocol</label>
            <select id='protocol' className='h-9 rounded-md border px-3 text-sm' {...form.register('protocol')}>
              <option value='ocpp1.6'>ocpp1.6</option>
              <option value='ocpp2.0.1'>ocpp2.0.1</option>
            </select>
          </div>
          <div className='pt-2 flex justify-end gap-2'>
            <Button type='button' variant='ghost' onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type='submit'>Create</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
