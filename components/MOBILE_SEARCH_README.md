# MobileSearch Component

A production-ready, reusable search component with advanced features for filtering mobile devices and other items. Built with React, TypeScript, Framer Motion, and shadcn/ui.

## Features

✓ **Instant Debounced Search** - 300ms configurable debounce for smooth filtering  
✓ **Smart Search Aliases** - Map user shortcuts to full names (e.g., "S24" → "Galaxy S24")  
✓ **Keyboard Navigation** - Arrow keys, Enter, Escape support with full accessibility  
✓ **Text Highlighting** - Highlights matching text in results  
✓ **Recent Searches** - Auto-saves last 5 searches to localStorage  
✓ **Loading States** - Skeleton UI while debouncing  
✓ **Empty States** - Helpful messaging when no results match  
✓ **Custom Rendering** - Fully customizable result items  
✓ **Accessibility** - WCAG compliant combobox pattern  

## Installation

The component requires these dependencies (already included in the project):

```bash
pnpm add framer-motion lucide-react
```

The component uses shadcn/ui components which are automatically added:

```bash
pnpm exec shadcn add button input
```

## Basic Usage

```tsx
import { MobileSearch } from '@/components/mobile-search';

export function SearchExample() {
  const devices = [
    {
      id: '1',
      name: 'Galaxy S24',
      brand: 'Samsung',
      variants: 3,
      accessories: 45,
    },
    // ... more devices
  ];

  return (
    <MobileSearch
      items={devices}
      searchFields={['name', 'brand']}
      placeholder="Search devices..."
      brand="Samsung"
      onSearch={(query, brand) => {
        console.log('Searching:', query, 'in', brand);
      }}
      onSelect={(item) => {
        console.log('Selected:', item.name);
      }}
    />
  );
}
```

## Props

```typescript
interface MobileSearchProps<T extends SearchItem> {
  // Required
  items: T[];                             // Array of items to search
  onSearch: (query: string, brand: string) => void;  // Search callback
  
  // Optional
  searchFields?: (keyof T)[];           // Fields to search (default: ['name'])
  placeholder?: string;                  // Input placeholder
  debounceMs?: number;                  // Debounce delay (default: 300)
  onSelect?: (item: T) => void;         // Selection callback
  renderResult?: (item, query, isSelected) => JSX.Element; // Custom result renderer
  brand?: string;                        // Current brand context
  showRecentSearches?: boolean;          // Show recent searches (default: true)
  showLoadingState?: boolean;            // Show loading skeleton (default: true)
  emptyStateMessage?: string;            // Empty state text
}
```

## SearchItem Interface

All items must extend the `SearchItem` interface:

```typescript
interface SearchItem {
  id: string;           // Unique identifier
  name: string;         // Display name (searchable)
  [key: string]: any;   // Additional properties
}
```

## Custom Search Aliases

Add search aliases in `lib/search-utils.ts`:

```typescript
export const SEARCH_ALIASES: Record<string, string[]> = {
  'Galaxy S24': ['S24', 's24', 'S24', 'Galaxy S24'],
  'iPhone 15 Pro': ['IP15P', 'iPhone 15 Pro', 'iphone 15 pro'],
  // Add more aliases...
};
```

Users can type any alias, and it will match the full model name.

## Custom Result Rendering

```tsx
<MobileSearch
  items={devices}
  renderResult={(item, query, isSelected) => (
    <div className={`flex items-center ${isSelected ? 'bg-accent' : ''}`}>
      <div className="flex-1">
        <div className="font-semibold">{item.name}</div>
        <div className="text-sm text-muted-foreground">
          {item.variants} variants available
        </div>
      </div>
      <span className="text-xs px-2 py-1 bg-muted rounded">
        {item.brand}
      </span>
    </div>
  )}
  onSearch={handleSearch}
  onSelect={handleSelect}
/>
```

## Keyboard Navigation

The component fully supports keyboard interaction:

| Key | Action |
|-----|--------|
| `↑↓` | Navigate through results |
| `Enter` | Select highlighted result |
| `Escape` | Close dropdown / unfocus |
| `Type` | Filter results instantly |

## Recent Searches

Recent searches are automatically saved to localStorage and scoped by brand:

- **Max 5 searches** stored per brand
- **Auto-deduplicated** - duplicate searches are moved to top
- **Persistent** across sessions
- **Removable** via X button on each item

To clear recent searches programmatically:

```typescript
import { clearRecentSearches } from '@/lib/storage-utils';

clearRecentSearches(); // Clears all
```

## Debouncing

The search debounces by default (300ms) to avoid excessive re-renders:

```tsx
<MobileSearch
  items={devices}
  debounceMs={500}  // Custom debounce delay
  onSearch={handleSearch}
/>
```

## Text Highlighting

Matching text is automatically highlighted in results:

```tsx
// Search query "S24" will highlight "S24" in "Galaxy S24"
// Rendered with bg-accent/20 and text-accent styling
```

## Empty State Handling

```tsx
<MobileSearch
  items={devices}
  emptyStateMessage="No devices match your search criteria"
  onSearch={handleSearch}
/>
```

The component shows:
- Empty state message when search returns no results
- Helpful suggestion to try different keywords
- Loading skeleton while debouncing

## Loading States

The component shows skeleton loading UI while debouncing:

```tsx
<MobileSearch
  items={devices}
  showLoadingState={true}  // Enable skeleton UI
  debounceMs={300}
  onSearch={handleSearch}
/>
```

## Accessibility

The component implements the **WCAG 2.1 Combobox pattern**:

- Semantic HTML with proper ARIA attributes
- `role="combobox"` on input
- `role="option"` on results
- `aria-expanded` indicates dropdown state
- `aria-autocomplete="list"` for autocomplete behavior
- Keyboard navigation fully supported
- Screen reader friendly

## Files Structure

```
components/
├── mobile-search.tsx           # Main component
├── mobile-search.examples.tsx  # Usage examples
└── MOBILE_SEARCH_README.md     # This file

hooks/
├── use-search.ts               # Debounced search hook
└── use-keyboard-navigation.ts  # Keyboard handler hook

lib/
├── search-utils.ts             # Text highlighting, aliases
└── storage-utils.ts            # localStorage management
```

## Custom Hooks

### useSearch

Handles debounced filtering with alias support:

```typescript
const { query, setQuery, isLoading, results, hasResults } = useSearch(
  items,
  ['name', 'brand'],  // Search fields
  300                 // Debounce ms
);
```

### useKeyboardNavigation

Manages keyboard interactions:

```typescript
const { selectedIndex, handleKeyDown, selectCurrent } = useKeyboardNavigation(
  results.length,
  (index) => console.log('Selected:', results[index]),
  () => console.log('Escaped')
);
```

## Performance

- **Debounced search** prevents excessive re-renders
- **Memoized callbacks** using useCallback
- **Virtual scrolling ready** - easily adaptable for 1000+ items
- **Framer Motion animations** use GPU acceleration

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Demo

See the full interactive demo at `/search-demo`:

```bash
# Navigate to
http://localhost:3000/search-demo
```

Features:
- Brand switching
- Live search with debounce
- Recent searches display
- Keyboard navigation testing
- Search history tracking

## Troubleshooting

### No results appearing

1. Check that `searchFields` match your item structure
2. Verify items have an `id` field (required by SearchItem interface)
3. Ensure items are passed as an array

### Recent searches not working

1. Check browser localStorage is enabled
2. Verify brand parameter is set consistently
3. Check browser console for storage errors

### Keyboard navigation not working

1. Ensure the search input is focused
2. Check for event listener conflicts
3. Verify `onSelect` callback is provided

## Examples

See `components/mobile-search.examples.tsx` for complete working examples:

1. Basic usage
2. Custom rendering
3. Multiple search fields
4. Loading and empty states
5. Different brands/categories
6. Keyboard shortcuts

## Contributing

When extending this component:

1. Keep the SearchItem interface minimal
2. Add new aliases to SEARCH_ALIASES
3. Maintain accessibility standards
4. Test keyboard navigation
5. Update this README with new features
