'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editUser: User | null
  onSaveAdd: (email: string, pass: string, role: string) => Promise<void>
  onSaveEdit: (id: string, data: { role?: string, status?: string, email?: string, password?: string }) => Promise<void>
}

export function UserDialog({ open, onOpenChange, editUser, onSaveAdd, onSaveEdit }: UserDialogProps) {
  const { user: currentUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('viewer')
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) {
      setEmail('')
      setPassword('')
      setRole('viewer')
      setStatus('pending')
      setError('')
      setEmailError('')
      setPasswordError('')
      setShowPassword(false)
    } else {
      setError('')
      setEmailError('')
      setPasswordError('')
      setShowPassword(false)
      if (editUser) {
        setRole(editUser.role)
        setStatus(editUser.status)
        setEmail(editUser.email)
        setPassword('')
      } else {
        setEmail('')
        setPassword('')
        setRole('viewer')
        setStatus('pending')
      }
    }
  }, [open, editUser])

  const handleSave = async () => {
    setError('')
    setEmailError('')
    setPasswordError('')
    setLoading(true)
    try {
      let hasError = false
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!email || !emailRegex.test(email)) {
        setEmailError('Valid email is required')
        hasError = true
      }
      
      if (!editUser || password) {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
        if (!password || !passwordRegex.test(password)) {
          setPasswordError('Password must be at least 8 characters long, contain 1 number, 1 symbol, and 1 uppercase letter')
          hasError = true
        }
      }

      if (hasError) {
        setLoading(false)
        return
      }

      if (editUser) {
        const updates: any = { role, email }
        if (password) updates.password = password
        await onSaveEdit(editUser.id, updates)
        toast.success('User updated successfully')
      } else {
        await onSaveAdd(email, password, role)
        toast.success('User created successfully')
      }
      onOpenChange(false)
    } catch (e: any) {
      setError(e.message)
      toast.error(e.message)
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
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError('')
              }}
              className="mt-1"
            />
            {emailError && <p className="text-sm text-destructive mt-1">{emailError}</p>}
          </div>
          <div>
            <Label htmlFor="password">
              {editUser ? 'New Password (leave blank to keep current)' : 'Password'}
            </Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (passwordError) setPasswordError('')
                }}
                className="pr-10"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && <p className="text-sm text-destructive mt-1">{passwordError}</p>}
          </div>

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
