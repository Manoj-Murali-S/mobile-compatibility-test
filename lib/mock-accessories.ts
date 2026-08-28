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
