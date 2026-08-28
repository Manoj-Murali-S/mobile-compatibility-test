export interface Mobile {
  id: string
  brand: string
  model: string
  image?: string
  accessories?: number
}

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

