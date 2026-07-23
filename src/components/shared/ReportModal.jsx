import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createReport } from '../../api/reports'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { toast } from 'sonner'

export default function ReportModal({ open, onClose, type, id }) {
  const [reason, setReason] = useState('')

  const mutation = useMutation({
    mutationFn: () => createReport({ type, target_uuid: id, reason }),
    onSuccess: () => {
      toast.success('Report submitted')
      setReason('')
      onClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to submit report')
    },
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setReason(''); onClose() } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {type}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Reason</Label>
          <Textarea
            placeholder="Describe why you're reporting this..."
            rows={4}
            maxLength={2000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <p className="text-xs text-muted-foreground text-right">{reason.length}/2000</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!reason.trim() || mutation.isPending}
          >
            {mutation.isPending ? 'Submitting…' : 'Submit report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
