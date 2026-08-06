# MobileSearch Component - Quick Start

## 30-Second Setup

```tsx
import { MobileSearch } from '@/components/mobile-search';

export function MySearch() {
  const items = [
    { id: '1', name: 'Galaxy S24', brand: 'Samsung', variants: 3, accessories: 45 },
    { id: '2', name: 'iPhone 15 Pro', brand: 'Apple', variants: 2, accessories: 38 },
  ];

  return (
    <MobileSearch
      items={items}
      searchFields={['name', 'brand']}
      brand="Samsung"
      onSearch={(query) => console.log('Search:', query)}
      onSelect={(item) => console.log('Selected:', item.name)}
    />
  );
}
```

Done! You now have:
- ✓ Instant filtering with debounce
- ✓ Keyboard navigation (↑↓ Enter Esc)
- ✓ Search aliases ("S24" → "Galaxy S24")
- ✓ Recent searches (localStorage)
- ✓ Loading states
- ✓ Empty states
- ✓ Full accessibility

## Live Demo

```bash
# View the interactive demo
http://localhost:3000/search-demo
```

## Required Interface

Items must have an `id` field:

```typescript
interface SearchItem {
  id: string;           // Required
  name: string;         // Required (searchable)
  [key: string]: any;   // Optional fields
}
```

## Key Features

| Feature | How to Use |
|---------|-----------|
| **Search** | Type to filter instantly |
| **Navigate** | ↑↓ arrow keys |
| **Select** | Press Enter |
| **Close** | Press Escape |
| **Recent** | Auto-saved in localStorage |
| **Aliases** | Edit `lib/search-utils.ts` |

## Keyboard Shortcuts

```
↑ ↓    Navigate results
Enter  Select current item
Esc    Close dropdown
Type   Filter results
```

## Common Customizations

### Custom Results Rendering

```tsx
<MobileSearch
  items={items}
  renderResult={(item, query, isSelected) => (
    <div className={isSelected ? 'text-accent' : ''}>
      <strong>{item.name}</strong>
      <small>{item.brand}</small>
    </div>
  )}
/>
```

### Adjust Debounce

```tsx
<MobileSearch
  items={items}
  debounceMs={500}  // Default is 300ms
/>
```

### Add Search Aliases

Edit `lib/search-utils.ts`:

```typescript
export const SEARCH_ALIASES: Record<string, string[]> = {
  'Galaxy S24': ['S24', 's24', 'S24', 'Galaxy S24'],
  'iPhone 15': ['IP15', 'iPhone 15', 'iphone 15'],
  'Redmi Note 12': ['Note 12', 'note 12', 'redmi note 12'],
};
```

### Disable Recent Searches

```tsx
<MobileSearch
  items={items}
  showRecentSearches={false}
/>
```

### Custom Empty Message

```tsx
<MobileSearch
  items={items}
  emptyStateMessage="No devices found. Try another search."
/>
```

## Files Reference

| File | Purpose |
|------|---------|
| `components/mobile-search.tsx` | Main component |
| `hooks/use-search.ts` | Debounced search logic |
| `hooks/use-keyboard-navigation.ts` | Keyboard handling |
| `lib/search-utils.ts` | Aliases & highlighting |
| `lib/storage-utils.ts` | Recent searches |
| `app/search-demo/page.tsx` | Demo & examples |

## Props Quick Reference

```typescript
<MobileSearch
  items={yourItems}                    // Required: array or single item
  searchFields={['name', 'brand']}     // Optional: fields to search
  placeholder="Search..."               // Optional: input placeholder
  brand="Samsung"                       // Optional: context for recent searches
  debounceMs={300}                     // Optional: debounce delay
  onSearch={(query, brand) => {...}}   // Optional: search callback
  onSelect={(item) => {...}}           // Optional: selection callback
  renderResult={(item, query) => ...}  // Optional: custom result renderer
  showRecentSearches={true}            // Optional: show recent searches
  showLoadingState={true}              // Optional: show skeleton UI
  emptyStateMessage="No results"       // Optional: empty state text
/>
```

## Real-World Example

```tsx
'use client';

import { MobileSearch } from '@/components/mobile-search';
import { useState } from 'react';

export function DeviceFinder() {
  const [selectedDevice, setSelectedDevice] = useState(null);

  const devices = [
    { id: '1', name: 'Galaxy S24 Ultra', brand: 'Samsung', year: 2024 },
    { id: '2', name: 'iPhone 15 Pro', brand: 'Apple', year: 2024 },
    { id: '3', name: 'Redmi Note 12', brand: 'Xiaomi', year: 2023 },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1>Find Your Device</h1>
      
      <MobileSearch
        items={devices}
        searchFields={['name', 'brand']}
        placeholder="Search devices..."
        onSearch={(query) => {
          console.log('Searching for:', query);
        }}
        onSelect={(item) => {
          setSelectedDevice(item);
          console.log('Selected:', item.name);
        }}
        renderResult={(item, query, isSelected) => (
          <div className={isSelected ? 'text-accent font-bold' : ''}>
            {item.name}
            <small className="text-muted-foreground ml-2">
              {item.brand} • {item.year}
            </small>
          </div>
        )}
      />

      {selectedDevice && (
        <div className="mt-6 p-4 bg-accent/10 rounded-lg">
          <h2>Selected Device</h2>
          <p>{selectedDevice.name}</p>
          <p className="text-muted-foreground">{selectedDevice.brand}</p>
        </div>
      )}
    </div>
  );
}
```

## Troubleshooting

**Q: Search not working?**
- Check items have `id` field
- Verify `searchFields` match your data
- Check browser console for errors

**Q: Keyboard navigation not working?**
- Ensure search input is focused
- Check for conflicting event listeners
- Verify `onSelect` callback is provided

**Q: Recent searches not persisting?**
- Check localStorage is enabled
- Verify brand parameter is consistent
- Check browser console for storage errors

**Q: Styling not matching my theme?**
- Component uses Tailwind design tokens
- Customize colors in `globals.css`
- Override via `renderResult` prop

## Next Steps

1. **Copy the component** to your project
2. **Import and use** in any page/component
3. **Customize aliases** for your data
4. **Style** with your theme
5. **Deploy** with confidence!

## Support

For more info, see:
- `MOBILE_SEARCH_IMPLEMENTATION.md` - Full technical details
- `components/MOBILE_SEARCH_README.md` - Complete API reference
- `components/mobile-search.examples.tsx` - 7 detailed examples
- `app/search-demo/page.tsx` - Interactive demo page

## Browser Support

✓ Chrome 90+
✓ Firefox 88+
✓ Safari 14+
✓ Mobile browsers

That's it! You're ready to search. 🚀
