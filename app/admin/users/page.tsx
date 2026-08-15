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
      if (!api) return
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
    if (!api) return
    const res = await api.auth.updateUser(id, data)
    if (res.ok) {
      fetchUsers()
    } else {
      throw new Error(res.error)
    }
  }

  const handleAddUser = async (email: string, pass: string, name: string, role: string) => {
    const api = (window as any).electronAPI
    if (!api) return
    const res = await api.auth.register(email, pass, name, role)
    if (!res.ok) throw new Error(res.error)
    
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
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    u.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2 items-center">
                    {u.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => quickAction(u.id, { status: 'approved' })}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => quickAction(u.id, { status: 'rejected' })}>Reject</Button>
                      </>
                    )}
                    {u.status === 'approved' && u.id !== user.id && (
                       <Button size="sm" variant="destructive" onClick={() => quickAction(u.id, { status: 'rejected' })}>Revoke</Button>
                    )}
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
