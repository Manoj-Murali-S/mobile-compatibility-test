/**
 * MobileSearch Component - Usage Examples
 *
 * This file demonstrates various ways to use the MobileSearch component
 */

'use client';

import { MobileSearch } from './mobile-search';
import { SearchItem } from '@/hooks/use-search';

// ===== EXAMPLE 1: Basic Usage =====
// Simple search with default behavior

interface Device extends SearchItem {
  id: string;
  name: string;
  brand: string;
  variants: number;
  accessories: number;
}

const devices: Device[] = [
  {
    id: '1',
    name: 'Galaxy S24',
    brand: 'Samsung',
    variants: 3,
    accessories: 45,
  },
  {
    id: '2',
    name: 'iPhone 15 Pro',
    brand: 'Apple',
    variants: 2,
    accessories: 38,
  },
  {
    id: '3',
    name: 'Redmi Note 12',
    brand: 'Xiaomi',
    variants: 4,
    accessories: 28,
  },
];

export function BasicExample() {
  return (
    <MobileSearch
      items={devices}
      searchFields={['name', 'brand']}
      placeholder="Find your mobile device..."
      onSearch={(query, brand) => {
        console.log('Searching:', query, 'in', brand);
      }}
      onSelect={(item) => {
        console.log('Selected:', item.name);
      }}
    />
  );
}

// ===== EXAMPLE 2: With Custom Rendering =====
// Custom result item appearance

export function CustomRenderExample() {
  return (
    <MobileSearch
      items={devices}
      searchFields={['name', 'brand']}
      renderResult={(item, query, isSelected) => (
        <div className={`flex items-center gap-3 ${isSelected ? 'text-accent' : ''}`}>
          <div className="h-8 w-8 rounded bg-accent/20 flex items-center justify-center">
            📱
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">{item.name}</div>
            <div className="text-xs text-muted-foreground">
              {item.variants} variants available
            </div>
          </div>
        </div>
      )}
      onSearch={(query, brand) => console.log('Search:', query)}
      onSelect={(item) => console.log('Selected:', item)}
    />
  );
}

// ===== EXAMPLE 3: Different Search Fields =====
// Search specific fields only

interface Product extends SearchItem {
  id: string;
  name: string;
  model: string;
  sku: string;
}

const products: Product[] = [
  { id: '1', name: 'Samsung Galaxy S24', model: 'SM-S921B', sku: 'SGS24-001' },
  { id: '2', name: 'Samsung Galaxy S24+', model: 'SM-S926B', sku: 'SGS24P-001' },
];

export function MultiFieldSearchExample() {
  return (
    <MobileSearch
      items={products}
      searchFields={['name', 'model', 'sku']}
      placeholder="Search by name, model, or SKU..."
      onSearch={(query) => console.log('Searching:', query)}
      onSelect={(item) => console.log('Selected:', item)}
    />
  );
}

// ===== EXAMPLE 4: With Loading and Empty States =====
// Customize loading and empty behaviors

export function WithStatesExample() {
  return (
    <MobileSearch
      items={devices}
      searchFields={['name']}
      showLoadingState={true}
      debounceMs={500}
      emptyStateMessage="No devices match your search"
      onSearch={(query) => {
        console.log('Searching with 500ms debounce:', query);
      }}
      onSelect={(item) => console.log('Selected:', item)}
    />
  );
}

// ===== EXAMPLE 5: Without Recent Searches =====
// Disable recent searches feature

export function WithoutRecentExample() {
  return (
    <MobileSearch
      items={devices}
      searchFields={['name', 'brand']}
      showRecentSearches={false}
      onSearch={(query) => console.log('Search:', query)}
      onSelect={(item) => console.log('Selected:', item)}
    />
  );
}

// ===== EXAMPLE 6: Different Brands/Categories =====
// Search within different brand contexts

export function BrandContextExample() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Samsung Devices</h3>
        <MobileSearch
          items={devices.filter(d => d.brand === 'Samsung')}
          searchFields={['name']}
          brand="Samsung"
          placeholder="Search Samsung models..."
          onSearch={(query, brand) => console.log('Searching in', brand)}
          onSelect={(item) => console.log('Selected:', item)}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">All Brands</h3>
        <MobileSearch
          items={devices}
          searchFields={['name', 'brand']}
          brand="All"
          placeholder="Search all brands..."
          onSearch={(query, brand) => console.log('Searching in', brand)}
          onSelect={(item) => console.log('Selected:', item)}
        />
      </div>
    </div>
  );
}

// ===== EXAMPLE 7: With Keyboard Shortcuts =====
// The component handles keyboard internally, but you can compose it

export function KeyboardExample() {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        Try pressing arrow keys (↑↓), Enter to select, or Esc to close
      </p>
      <MobileSearch
        items={devices}
        searchFields={['name', 'brand']}
        onSearch={(query) => console.log('Search:', query)}
        onSelect={(item) => {
          console.log('Selected via keyboard:', item.name);
        }}
      />
    </div>
  );
}

/**
 * Integration Notes:
 *
 * 1. REQUIRED: SearchItem Interface
 *    Your items must extend SearchItem with at least an 'id' field
 *
 * 2. Search Aliases
 *    Built-in aliases for common mobile models (S24 -> Galaxy S24, etc)
 *    Add more in lib/search-utils.ts SEARCH_ALIASES
 *
 * 3. Recent Searches
 *    Automatically saved to localStorage (max 5)
 *    Scoped by brand to keep searches organized
 *
 * 4. Keyboard Navigation
 *    ↑↓ Arrow keys: Navigate results
 *    Enter: Select current result
 *    Escape: Close dropdown / unfocus
 *    Type: Opens results if hidden
 *
 * 5. Debouncing
 *    Default 300ms debounce for search
 *    Adjustable via debounceMs prop
 *
 * 6. Accessibility (WCAG Compliant)
 *    - Combobox pattern implemented
 *    - ARIA labels on all interactive elements
 *    - Keyboard navigation built-in
 *    - Screen reader friendly
 */
