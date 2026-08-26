// Admin Dashboard Types
export interface AdminBrand {
  id: string
  name: string
  logo: string
  deviceCount: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface AdminMobile {
  id: string
  model: string
  brand: string
  brandId: string
  image?: string
  status: 'active' | 'inactive' | 'discontinued'
  createdAt: string
  updatedAt: string
}

export interface CompatibilityGroup {
  id: string
  name: string
  description: string
  devices: number
  accessories: number
  status: 'active' | 'inactive'
  createdAt: string
}

export interface SystemLog {
  id: string
  action: string
  user: string
  timestamp: string
  status: 'success' | 'error' | 'warning'
  details: string
}

export interface BackupRecord {
  id: string
  name: string
  size: string
  type: 'full' | 'incremental'
  createdAt: string
  status: 'completed' | 'failed' | 'in-progress'
}
