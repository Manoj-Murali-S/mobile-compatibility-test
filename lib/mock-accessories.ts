export interface Accessory {
  id: string;
  name: string;
  icon: string;
  description: string;
  compatibleModels: string[];
  featured: boolean;
}

export interface AccessoryCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  accessories: Accessory[];
}

export const MOCK_ACCESSORIES: AccessoryCategory[] = [
  {
    id: 'tempered-glass',
    title: 'Tempered Glass',
    icon: '🛡️',
    description: 'Premium screen protection',
    accessories: [
      {
        id: 'tg-001',
        name: 'Ultra Clear Tempered Glass',
        icon: '✨',
        description: '9H hardness with crystal clear visibility',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy S24+',
          'Galaxy A55',
          'Galaxy A15',
        ],
        featured: true,
      },
      {
        id: 'tg-002',
        name: 'Privacy Screen Protector',
        icon: '🔐',
        description: 'Anti-spy technology for privacy',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy Note 24',
        ],
        featured: false,
      },
      {
        id: 'tg-003',
        name: 'Anti-Blue Light Glass',
        icon: '👁️',
        description: 'Reduces eye strain and blue light',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy S24+',
          'Galaxy A55',
        ],
        featured: true,
      },
    ],
  },
  {
    id: 'back-case',
    title: 'Back Case',
    icon: '📱',
    description: 'Protective back covers',
    accessories: [
      {
        id: 'bc-001',
        name: 'Silicone Protective Case',
        icon: '🎨',
        description: 'Soft silicone with anti-slip grip',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy S24+',
          'Galaxy A55',
          'Galaxy A15',
          'Galaxy Z Fold 6',
        ],
        featured: true,
      },
      {
        id: 'bc-002',
        name: 'Carbon Fiber Case',
        icon: '🔩',
        description: 'Premium carbon fiber finish',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy Note 24',
        ],
        featured: false,
      },
      {
        id: 'bc-003',
        name: 'Translucent Crystal Case',
        icon: '💎',
        description: 'Clear design shows off phone beauty',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy S24+',
          'Galaxy A55',
        ],
        featured: true,
      },
      {
        id: 'bc-004',
        name: 'Heavy Duty Armor Case',
        icon: '⚔️',
        description: 'Maximum military-grade protection',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy A55',
        ],
        featured: false,
      },
    ],
  },
  {
    id: 'silicone-cover',
    title: 'Silicone Cover',
    icon: '🧊',
    description: 'Soft silicone protection',
    accessories: [
      {
        id: 'sc-001',
        name: 'Soft Touch Silicone',
        icon: '🤚',
        description: 'Premium soft silicone with matte finish',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy S24+',
          'Galaxy A55',
          'Galaxy A15',
        ],
        featured: true,
      },
      {
        id: 'sc-002',
        name: 'Liquid Silicone Case',
        icon: '💧',
        description: 'Ultra smooth liquid silicone coating',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy S24+',
        ],
        featured: true,
      },
      {
        id: 'sc-003',
        name: 'Textured Silicone Grip',
        icon: '✋',
        description: 'Enhanced grip with textured surface',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy A55',
          'Galaxy Z Fold 6',
        ],
        featured: false,
      },
    ],
  },
  {
    id: 'flip-cover',
    title: 'Flip Cover',
    icon: '📖',
    description: 'Flip-style protective covers',
    accessories: [
      {
        id: 'fc-001',
        name: 'Leather Flip Cover',
        icon: '🥂',
        description: 'Premium leather with magnetic closure',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy S24+',
          'Galaxy Note 24',
        ],
        featured: true,
      },
      {
        id: 'fc-002',
        name: 'Canvas Flip Cover',
        icon: '🎒',
        description: 'Durable canvas material with stitching',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy A55',
        ],
        featured: true,
      },
      {
        id: 'fc-003',
        name: 'Wallet Flip Cover',
        icon: '💳',
        description: 'Built-in card slots and wallet',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy S24+',
          'Galaxy A55',
        ],
        featured: true,
      },
      {
        id: 'fc-004',
        name: 'Folio Stand Cover',
        icon: '🖼️',
        description: 'Multi-angle stand for content viewing',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy Z Fold 6',
          'Galaxy Tab S10',
        ],
        featured: false,
      },
    ],
  },
  {
    id: 'camera-protector',
    title: 'Camera Protector',
    icon: '📷',
    description: 'Lens protection and enhancement',
    accessories: [
      {
        id: 'cp-001',
        name: 'Camera Lens Protector',
        icon: '🔍',
        description: 'Tempered glass lens protection',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy S24+',
          'Galaxy A55',
        ],
        featured: true,
      },
      {
        id: 'cp-002',
        name: 'Lens Ring Protector',
        icon: '⭕',
        description: 'Metal ring guard for camera module',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy S24+',
        ],
        featured: true,
      },
      {
        id: 'cp-003',
        name: 'Anti-Glare Lens Film',
        icon: '🌙',
        description: 'Reduces glare and fingerprints',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
          'Galaxy S24+',
          'Galaxy A55',
        ],
        featured: false,
      },
      {
        id: 'cp-004',
        name: 'Camera Enhancing Lens',
        icon: '🎬',
        description: 'Optical enhancement for better photos',
        compatibleModels: [
          'Galaxy S24 Ultra',
          'Galaxy S24',
        ],
        featured: false,
      },
    ],
  },
];

export function getAccessoriesForModel(modelName: string): AccessoryCategory[] {
  return MOCK_ACCESSORIES.map((category) => ({
    ...category,
    accessories: category.accessories.filter((acc) =>
      acc.compatibleModels.includes(modelName)
    ),
  })).filter((category) => category.accessories.length > 0);
}

export function getAccessoryStats(modelName: string) {
  const accessories = getAccessoriesForModel(modelName);
  const totalCount = accessories.reduce(
    (sum, cat) => sum + cat.accessories.length,
    0
  );
  const categories = accessories.length;

  return {
    totalCount,
    categories,
    accessories,
  };
}
