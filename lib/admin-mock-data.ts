'use client'

// Admin Dashboard Mock Data
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
  image?: string
  releaseYear: number
  variants: number
  accessories: number
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

// Mock Brands Data
export const mockBrands: AdminBrand[] = [
  {
    id: '1',
    name: 'Samsung',
    logo: '📱',
    deviceCount: 45,
    status: 'active',
    createdAt: '2024-01-15',
    updatedAt: '2024-08-06',
  },
  {
    id: '2',
    name: 'Apple',
    logo: '🍎',
    deviceCount: 28,
    status: 'active',
    createdAt: '2024-01-20',
    updatedAt: '2024-08-05',
  },
  {
    id: '3',
    name: 'Xiaomi',
    logo: '🟠',
    deviceCount: 38,
    status: 'active',
    createdAt: '2024-02-01',
    updatedAt: '2024-08-04',
  },
  {
    id: '4',
    name: 'Vivo',
    logo: '🔵',
    deviceCount: 32,
    status: 'active',
    createdAt: '2024-02-10',
    updatedAt: '2024-08-03',
  },
  {
    id: '5',
    name: 'Oppo',
    logo: '🟢',
    deviceCount: 29,
    status: 'active',
    createdAt: '2024-02-15',
    updatedAt: '2024-08-02',
  },
  {
    id: '6',
    name: 'Realme',
    logo: '⚡',
    deviceCount: 24,
    status: 'active',
    createdAt: '2024-02-20',
    updatedAt: '2024-08-01',
  },
]

// Mock Mobiles Data
export const mockMobiles: AdminMobile[] = [
  {
    id: '1',
    model: 'Galaxy S24 Ultra',
    brand: 'Samsung',
    releaseYear: 2024,
    variants: 4,
    accessories: 18,
    status: 'active',
    createdAt: '2024-01-20',
    updatedAt: '2024-08-05',
  },
  {
    id: '2',
    model: 'Galaxy S24',
    brand: 'Samsung',
    releaseYear: 2024,
    variants: 3,
    accessories: 16,
    status: 'active',
    createdAt: '2024-01-20',
    updatedAt: '2024-08-05',
  },
  {
    id: '3',
    model: 'Galaxy A55',
    brand: 'Samsung',
    releaseYear: 2024,
    variants: 3,
    accessories: 12,
    status: 'active',
    createdAt: '2024-02-15',
    updatedAt: '2024-08-04',
  },
  {
    id: '4',
    model: 'iPhone 16 Pro Max',
    brand: 'Apple',
    releaseYear: 2024,
    variants: 2,
    accessories: 20,
    status: 'active',
    createdAt: '2024-02-20',
    updatedAt: '2024-08-05',
  },
  {
    id: '5',
    model: 'iPhone 16 Pro',
    brand: 'Apple',
    releaseYear: 2024,
    variants: 2,
    accessories: 19,
    status: 'active',
    createdAt: '2024-02-20',
    updatedAt: '2024-08-05',
  },
  {
    id: '6',
    model: 'Redmi Note 13',
    brand: 'Xiaomi',
    releaseYear: 2024,
    variants: 3,
    accessories: 14,
    status: 'active',
    createdAt: '2024-03-10',
    updatedAt: '2024-08-03',
  },
  {
    id: '7',
    model: 'POCO X6 Pro',
    brand: 'Xiaomi',
    releaseYear: 2024,
    variants: 2,
    accessories: 11,
    status: 'active',
    createdAt: '2024-03-15',
    updatedAt: '2024-08-02',
  },
  {
    id: '8',
    model: 'Vivo X100',
    brand: 'Vivo',
    releaseYear: 2024,
    variants: 2,
    accessories: 15,
    status: 'active',
    createdAt: '2024-04-01',
    updatedAt: '2024-08-01',
  },
  {
    id: '9',
    model: 'OPPO Find X7',
    brand: 'Oppo',
    releaseYear: 2024,
    variants: 3,
    accessories: 13,
    status: 'active',
    createdAt: '2024-04-05',
    updatedAt: '2024-07-31',
  },
  {
    id: '10',
    model: 'Realme 13 Pro+',
    brand: 'Realme',
    releaseYear: 2024,
    variants: 2,
    accessories: 10,
    status: 'inactive',
    createdAt: '2024-04-10',
    updatedAt: '2024-07-30',
  },
]

// Mock Compatibility Groups
export const mockCompatibilityGroups: CompatibilityGroup[] = [
  {
    id: '1',
    name: 'Flagship 2024',
    description: 'Latest flagship devices from major brands',
    devices: 6,
    accessories: 28,
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Mid-Range Devices',
    description: 'Mid-range smartphones with comparable specs',
    devices: 12,
    accessories: 20,
    status: 'active',
    createdAt: '2024-02-01',
  },
  {
    id: '3',
    name: 'Budget Segment',
    description: 'Affordable smartphones for all users',
    devices: 18,
    accessories: 15,
    status: 'active',
    createdAt: '2024-02-15',
  },
  {
    id: '4',
    name: 'Foldable Devices',
    description: 'Premium foldable smartphones',
    devices: 4,
    accessories: 35,
    status: 'active',
    createdAt: '2024-03-01',
  },
  {
    id: '5',
    name: 'Gaming Phones',
    description: 'High-performance gaming devices',
    devices: 8,
    accessories: 25,
    status: 'inactive',
    createdAt: '2024-03-15',
  },
]

// Mock System Logs
export const mockSystemLogs: SystemLog[] = [
  {
    id: '1',
    action: 'Brand Created',
    user: 'admin@example.com',
    timestamp: '2024-08-06 14:30:00',
    status: 'success',
    details: 'Created new brand: Samsung Galaxy Series',
  },
  {
    id: '2',
    action: 'Mobile Updated',
    user: 'editor@example.com',
    timestamp: '2024-08-06 13:45:00',
    status: 'success',
    details: 'Updated Galaxy S24 Ultra accessories count',
  },
  {
    id: '3',
    action: 'Data Export',
    user: 'admin@example.com',
    timestamp: '2024-08-06 12:20:00',
    status: 'success',
    details: 'Exported all mobile data to CSV',
  },
  {
    id: '4',
    action: 'Backup Created',
    user: 'system',
    timestamp: '2024-08-06 10:00:00',
    status: 'success',
    details: 'Full system backup completed',
  },
  {
    id: '5',
    action: 'Data Import',
    user: 'admin@example.com',
    timestamp: '2024-08-05 16:30:00',
    status: 'warning',
    details: 'Imported 25 mobiles, 3 duplicates skipped',
  },
  {
    id: '6',
    action: 'Brand Deleted',
    user: 'admin@example.com',
    timestamp: '2024-08-05 15:00:00',
    status: 'success',
    details: 'Removed discontinued brand with 0 devices',
  },
]

// Mock Backup Records
export const mockBackupRecords: BackupRecord[] = [
  {
    id: '1',
    name: 'Full Backup 2024-08-06',
    size: '2.4 MB',
    type: 'full',
    createdAt: '2024-08-06 10:00:00',
    status: 'completed',
  },
  {
    id: '2',
    name: 'Incremental Backup 2024-08-05',
    size: '340 KB',
    type: 'incremental',
    createdAt: '2024-08-05 23:00:00',
    status: 'completed',
  },
  {
    id: '3',
    name: 'Full Backup 2024-07-31',
    size: '2.2 MB',
    type: 'full',
    createdAt: '2024-07-31 10:00:00',
    status: 'completed',
  },
  {
    id: '4',
    name: 'Incremental Backup 2024-07-28',
    size: '256 KB',
    type: 'incremental',
    createdAt: '2024-07-28 23:00:00',
    status: 'completed',
  },
]

// Dashboard Statistics
export const mockDashboardStats = {
  totalBrands: 6,
  totalMobiles: 184,
  totalAccessories: 456,
  totalCompatibilityGroups: 5,
  activeDevices: 178,
  inactiveDevices: 6,
  lastBackup: '2024-08-06 10:00:00',
  lastSync: '2024-08-06 14:30:00',
}

// Helper functions
export function getBrandCount(): number {
  return mockBrands.length
}

export function getMobileCount(): number {
  return mockMobiles.length
}

export function getActiveMobiles(): number {
  return mockMobiles.filter((m) => m.status === 'active').length
}

export function getTotalAccessories(): number {
  return mockMobiles.reduce((sum, m) => sum + m.accessories, 0)
}

export function getMobilesByBrand(brandName: string): AdminMobile[] {
  return mockMobiles.filter((m) => m.brand === brandName)
}
