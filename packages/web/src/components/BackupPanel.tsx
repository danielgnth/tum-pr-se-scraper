import { Button } from '@/components/ui/button'
import { useRef, useState } from 'react'
import { api } from '../api/client'

const LS_KEYS = [
  'course-favorites',
  'course-dismissed',
  'course-notes',
  'course-overrides',
  'course-ext-applications',
] as const

function collectBackup(): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const key of LS_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        data[key] = JSON.parse(raw)
      } catch {
        data[key] = raw
      }
    }
  }
  return data
}

function applyBackup(data: Record<string, unknown>) {
  for (const key of LS_KEYS) {
    if (key in data) {
      localStorage.setItem(key, JSON.stringify(data[key]))
    }
  }
}

interface Props {
  onClose: () => void
}

export function BackupPanel({ onClose }: Props) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSave() {
    if (!code.trim()) return
    setBusy(true)
    setStatus(null)
    try {
      const res = await api.api.backup.$post({ json: { code: code.trim(), data: collectBackup() } })
      if (!res.ok) throw new Error('Server error')
      setStatus({ type: 'success', message: 'Backup saved.' })
    } catch {
      setStatus({ type: 'error', message: 'Failed to save backup.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleRestore() {
    if (!code.trim()) return
    setBusy(true)
    setStatus(null)
    try {
      const res = await api.api.backup[':code'].$get({ param: { code: code.trim() } })
      if (res.status === 404) {
        setStatus({ type: 'error', message: 'No backup found for that code.' })
        return
      }
      if (!res.ok) throw new Error('Server error')
      applyBackup((await res.json()) as Record<string, unknown>)
      setStatus({ type: 'success', message: 'Restored. Reloading…' })
      setTimeout(() => window.location.reload(), 800)
    } catch {
      setStatus({ type: 'error', message: 'Failed to restore backup.' })
    } finally {
      setBusy(false)
    }
  }

  function handleExportFile() {
    const data = collectBackup()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tum-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as Record<string, unknown>
        applyBackup(data)
        setStatus({ type: 'success', message: 'Imported. Reloading…' })
        setTimeout(() => window.location.reload(), 800)
      } catch {
        setStatus({ type: 'error', message: 'Invalid backup file.' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Backup / Restore</span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Enter a personal code to save or restore via server, or export/import a local JSON file.
      </p>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        placeholder="Your backup code…"
        className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {status && (
        <p className={`text-xs ${status.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
          {status.message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleSave} disabled={busy || !code.trim()}>
          Save to server
        </Button>
        <Button size="sm" variant="outline" onClick={handleRestore} disabled={busy || !code.trim()}>
          Restore from server
        </Button>
        <Button size="sm" variant="outline" onClick={handleExportFile} disabled={busy}>
          Export to file
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          Import from file
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>
    </div>
  )
}
