import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getAdminSettings, updateAdminSettings } from '../../../api/admin'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => getAdminSettings().then((r) => r.data),
  })

  useEffect(() => {
    if (data) {
      const flat = {}
      Object.values(data).flat().forEach((s) => { flat[s.key] = s.value })
      setSettings(flat)
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () => updateAdminSettings(Object.entries(settings).map(([key, value]) => ({ key, value }))),
    onSuccess: () => toast.success('Settings saved'),
    onError: () => toast.error('Failed to save'),
  })

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : 'Save all'}
        </Button>
      </div>
      {Object.entries(data ?? {}).map(([group, items]) => (
        <Card key={group}>
          <CardHeader><CardTitle className="text-base capitalize">{group}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div key={item.key} className="flex items-center gap-4">
                <label className="w-48 text-sm font-medium shrink-0">{item.key}</label>
                <Input value={settings[item.key] ?? ''} onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })} />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
