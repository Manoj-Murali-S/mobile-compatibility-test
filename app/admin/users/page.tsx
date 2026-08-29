'use client'

import { useEffect, useState } from 'react'
import { useAuth, User } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { UserDialog } from '@/components/admin/user-dialog'

export default function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const api = (window as any).electronAPI
      if (!api) {
        const response = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'all',
            sql: 'SELECT id, email, role, status, created_on, modified_on FROM users ORDER BY created_on DESC'
          })
        })
        const resData = await response.json()
        if (resData.ok) setUsers(resData.data)
        else setError(resData.error)
        return
      }
      const res = await api.auth.getUsers()
      if (res.ok) setUsers(res.data)
      else setError(res.error)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (id: string, data: { status?: string, role?: string }) => {
    const api = (window as any).electronAPI
    if (!api) {
      const updates = []
      const params = []
      if (data.status) { updates.push('status = ?'); params.push(data.status) }
      if (data.role) { updates.push('role = ?'); params.push(data.role) }
      if (updates.length > 0) {
        updates.push('modified_on = ?'); params.push(new Date().toISOString())
        params.push(id)
        const response = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'run',
            sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            params
          })
        })
        const resData = await response.json()
        if (!resData.ok) {
          let errorMsg = resData.error
          if (errorMsg.includes('UNIQUE constraint failed: users.email')) {
            errorMsg = 'Email already exists'
          }
          throw new Error(errorMsg)
        }
      }
      fetchUsers()
      return
    }
    const res = await api.auth.updateUser(id, data)
    if (res.ok) {
      fetchUsers()
    } else {
      let errorMsg = res.error
      if (errorMsg.includes('UNIQUE constraint failed: users.email')) {
        errorMsg = 'Email already exists'
      }
      throw new Error(errorMsg)
    }
  }

  const handleAddUser = async (email: string, pass: string, role: string) => {
    const api = (window as any).electronAPI
    if (!api) {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run',
          sql: 'INSERT INTO users (id, email, password_hash, name, role, status, created_on, modified_on) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          params: [id, email, 'dev-mock-hash', '', role || 'viewer', 'approved', now, now]
        })
      })
      const data = await response.json()
      if (!data.ok) {
        let errorMsg = data.error
        if (errorMsg.includes('UNIQUE constraint failed: users.email')) {
          errorMsg = 'Email already exists'
        }
        throw new Error(errorMsg)
      }
      fetchUsers()
      return
    }
    const res = await api.auth.register(email, pass, role)
    if (!res.ok) {
      let errorMsg = res.error
      if (errorMsg.includes('UNIQUE constraint failed: users.email')) {
        errorMsg = 'Email already exists'
      }
      throw new Error(errorMsg)
    }

    // Auto-approve users created by admin
    await api.auth.updateUser(res.user.id, { status: 'approved' })
    fetchUsers()
  }

  const openAddUser = () => {
    setEditingUser(null)
    setIsDialogOpen(true)
  }

  const openEditUser = (u: User) => {
    setEditingUser(u)
    setIsDialogOpen(true)
  }

  const quickAction = async (id: string, updates: { status: string }) => {
    try {
      await updateUser(id, updates)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const filteredUser = users.filter(u => u.role !== 'superadmin')

  if (user?.role !== 'superadmin' && user?.role !== 'admin') {
    return <div className="p-8"><p>You do not have permission to view this page.</p></div>
  }

  if (loading) return <div className="p-8">Loading users...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <Button onClick={openAddUser} className="gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {error && <p className="text-destructive mb-4">{error}</p>}

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Created On</th>
              <th className="px-4 py-3">Modified On</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users?.filter(u => u.role !== 'superadmin').map(u => (
              <tr key={u.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {u.created_on ? new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(u.created_on)) : 'N/A'}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {u.modified_on ? new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(u.modified_on)) : 'N/A'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2 items-center">
                    {/*  {u.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => quickAction(u.id, { status: 'approved' })}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => quickAction(u.id, { status: 'rejected' })}>Reject</Button>
                      </>
                    )}
                    {u.status === 'approved' && u.id !== user.id && (
                       <Button size="sm" variant="destructive" onClick={() => quickAction(u.id, { status: 'rejected' })}>Revoke</Button>
                    )} */}
                    <Button variant="ghost" size="sm" onClick={() => openEditUser(u)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editUser={editingUser}
        onSaveAdd={handleAddUser}
        onSaveEdit={updateUser}
      />
    </div>
  )
}
