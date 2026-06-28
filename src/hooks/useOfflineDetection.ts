import { useEffect } from 'react'
import { toast } from '@/components/ui/Toast'

export function useOfflineDetection() {
  useEffect(() => {
    function onOffline() { toast('You are offline — changes cannot be saved until reconnected.', 'offline') }
    function onOnline() { toast('Back online!', 'success') }
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [])
}
