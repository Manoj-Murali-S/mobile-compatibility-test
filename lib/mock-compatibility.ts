import type { Mobile } from '@/lib/mock-data'

export type AccessoryType =
  | 'tempered-glass'
  | 'back-case'
  | 'silicone-cover'
  | 'flip-cover'
  | 'camera-protector'

export interface CompatibilityDevice extends Mobile {
  matchedAccessory: string
}

export const ACCESSORY_TYPES: Array<{
  id: AccessoryType
  label: string
  shortLabel: string
  icon: string
}> = [
  { id: 'tempered-glass', label: 'Tempered Glass', shortLabel: 'Tempered', icon: '▣' },
  { id: 'back-case', label: 'Back Case', shortLabel: 'Back Case', icon: '▧' },
  { id: 'silicone-cover', label: 'Silicone Cover', shortLabel: 'Silicone', icon: '◈' },
  { id: 'flip-cover', label: 'Flip Cover', shortLabel: 'Flip', icon: '▤' },
  { id: 'camera-protector', label: 'Camera Protector', shortLabel: 'Camera', icon: '◎' },
]

const makeDevice = (
  id: string,
  brand: string,
  model: string,
  matchedAccessory: string,
  year = '2024',
): CompatibilityDevice => ({
  id,
  brand,
  model,
  year,
  variants: ['Standard fit'],
  image: '▣',
  accessories: 0,
  matchedAccessory,
})

const COMPATIBILITY_GROUPS: Record<string, Record<AccessoryType, CompatibilityDevice[]>> = {
  's24': {
    'tempered-glass': [
      makeDevice('nokia-5510', 'Nokia', 'Nokia 5510', 'S24 tempered glass'),
      makeDevice('mi-note-11', 'Xiaomi', 'Mi Note 11', 'S24 tempered glass'),
      makeDevice('redmi-note-13', 'Redmi', 'Redmi Note 13', 'S24 tempered glass'),
      makeDevice('oppo-reno-12', 'Oppo', 'Oppo Reno 12', 'S24 tempered glass'),
    ],
    'back-case': [
      makeDevice('s24-plus', 'Samsung', 'Galaxy S24+', 'S24 back case'),
      makeDevice('s24-ultra', 'Samsung', 'Galaxy S24 Ultra', 'S24 back case'),
    ],
    'silicone-cover': [
      makeDevice('s24-plus-silicone', 'Samsung', 'Galaxy S24+', 'S24 silicone cover'),
      makeDevice('a55-silicone', 'Samsung', 'Galaxy A55', 'S24 silicone cover'),
    ],
    'flip-cover': [
      makeDevice('note-24-flip', 'Samsung', 'Galaxy Note 24', 'S24 flip cover'),
      makeDevice('a55-flip', 'Samsung', 'Galaxy A55', 'S24 flip cover'),
    ],
    'camera-protector': [
      makeDevice('s24-plus-camera', 'Samsung', 'Galaxy S24+', 'S24 camera protector'),
      makeDevice('s24-ultra-camera', 'Samsung', 'Galaxy S24 Ultra', 'S24 camera protector'),
    ],
  },
  'iphone-15': {
    'tempered-glass': [
      makeDevice('iphone-15-pro', 'Apple', 'iPhone 15 Pro', 'iPhone 15 tempered glass', '2023'),
      makeDevice('iphone-16', 'Apple', 'iPhone 16', 'iPhone 15 tempered glass'),
    ],
    'back-case': [
      makeDevice('iphone-15-pro-max', 'Apple', 'iPhone 15 Pro Max', 'iPhone 15 back case', '2023'),
      makeDevice('iphone-16', 'Apple', 'iPhone 16', 'iPhone 15 back case'),
    ],
    'silicone-cover': [
      makeDevice('iphone-15-pro', 'Apple', 'iPhone 15 Pro', 'iPhone 15 silicone cover', '2023'),
    ],
    'flip-cover': [
      makeDevice('iphone-15-pro-max', 'Apple', 'iPhone 15 Pro Max', 'iPhone 15 flip cover', '2023'),
    ],
    'camera-protector': [
      makeDevice('iphone-15-pro', 'Apple', 'iPhone 15 Pro', 'iPhone 15 camera protector', '2023'),
      makeDevice('iphone-15-pro-max', 'Apple', 'iPhone 15 Pro Max', 'iPhone 15 camera protector', '2023'),
    ],
  },
}

const ALIASES: Record<string, string> = {
  'galaxy s24': 's24',
  's24 ultra': 's24',
  's24+': 's24',
  'iphone 15 pro': 'iphone-15',
  'iphone15': 'iphone-15',
}

export function getCompatibilityKey(query: string) {
  const normalized = query.trim().toLowerCase()
  return ALIASES[normalized] ?? Object.keys(COMPATIBILITY_GROUPS).find((key) => normalized.includes(key)) ?? normalized
}

export function getCompatibleDevices(query: string, type: AccessoryType) {
  const key = getCompatibilityKey(query)
  return COMPATIBILITY_GROUPS[key]?.[type] ?? []
}

export function hasCompatibilityData(query: string) {
  return Boolean(COMPATIBILITY_GROUPS[getCompatibilityKey(query)])
}
