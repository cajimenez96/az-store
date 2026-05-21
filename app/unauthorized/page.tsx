import { Button } from '@/components/ui/button'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Acceso no autorizado',
}

export default function UnauthorizedPage() {
  return (
    <div className='container mx-auto flex h-[calc(100vh-200px)] flex-col items-center justify-center space-y-4'>
      <h1 className='h1-bold text-4xl'>Acceso no autorizado</h1>
      <p className='text-muted-foreground'>
        No tenés permisos para acceder a esta página.
      </p>
      <Button asChild>
        <Link href='/'>Volver al Inicio</Link>
      </Button>
    </div>
  )
}
