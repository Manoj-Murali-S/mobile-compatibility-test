'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, useAuth } from '@/lib/auth'

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editUser: User | null
  onSaveAdd: (email: string, pass: string, name: string, role: string) => Promise<void>
  onSaveEdit: (id: string, data: { role?: string, status?: string }) => Promise<void>
}

export function UserDialog({ open, onOpenChange, editUser, onSaveAdd, onSaveEdit }: UserDialogProps) {
  const { user: currentUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('viewer')
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      setError('')
      if (editUser) {
        setRole(editUser.role)
        setStatus(editUser.status)
      } else {
        setEmail('')
        setPassword('')
        setName('')
        setRole('viewer')
      }
    }
  }, [open, editUser])

  const handleSave = async () => {
    setError('')
    setLoading(true)
    try {
      if (editUser) {
        await onSaveEdit(editUser.id, { role, status })
      } else {
        if (!email || !password || !name) {
          throw new Error('All fields are required')
        }
        await onSaveAdd(email, password, name, role)
      }
      onOpenChange(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={setContainer} className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="space-y-4">
          {!editUser && (
            <>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  minLength={8}
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => {
                if (value) setRole(value)
              }}
              disabled={editUser && currentUser?.role !== 'superadmin' && editUser.role === 'superadmin' || false}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent container={container || undefined}>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {editUser && (
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => {
                  if (value) setStatus(value)
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent container={container || undefined}>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : editUser ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
