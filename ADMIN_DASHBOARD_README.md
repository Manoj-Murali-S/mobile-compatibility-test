# Admin Dashboard - Mobile Compatibility Finder

A comprehensive admin dashboard built with Next.js, TypeScript, Tailwind CSS, shadcn/ui components, and TanStack Table.

## Features

### Dashboard Overview
- **System Statistics**: Display total brands, mobiles, accessories, and active devices
- **Recent Activity Feed**: Shows all system actions with timestamps and status indicators
- **System Information**: Last backup time, last sync, compatibility groups count, database health
- **Quick Actions**: Fast-access buttons to key admin functions

### Brand Management
- View all mobile brands in a data table
- Add new brands with logo emoji and device count
- Edit existing brand information
- Delete brands from the system
- Status tracking (active/inactive)
- Dropdown menus for actions

### Mobile Management
- Complete mobile device database management
- Search/filter mobiles by model or brand
- Add new devices with full specifications
- Edit device information (model, brand, year, variants, accessories)
- Delete devices
- Status tracking (active, inactive, discontinued)
- Columns: Model, Brand, Release Year, Variants, Accessories, Status, Created Date

### Compatibility Groups
- Organize devices into compatibility groups
- Grid and table view of compatibility groups
- Add, edit, delete compatibility groups
- Assign devices and accessories to groups
- Status management
- Example groups: Flagship 2024, Mid-Range Devices, Budget Segment, Foldable, Gaming

### Data Import/Export
- **Import Excel Files**: Upload mobile and accessory data from Excel spreadsheets
- **Export to Excel**: Select which data categories to export (Brands, Mobiles, Accessories, Compatibility Groups)
- Template download with required column specifications
- Import result feedback (success, warnings, failed)
- Export history tracking

### Backup & Restore
- Full and incremental backup creation
- Backup history with dates and sizes
- Download, restore, and delete backups
- Automatic backup settings
- Retention policy management
- Latest backup highlight

### Settings
- **General Settings**: Application name, timezone, default language
- **System Information**: Version, database type, operational status
- **System Metrics**: Uptime, API calls, storage usage
- **Activity Log**: Complete audit trail of all admin actions
- **Danger Zone**: Irreversible actions with warnings

## Tech Stack

- **Framework**: Next.js 15 App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Tables**: TanStack Table
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **State Management**: React hooks
- **Data**: Mock data (in-memory)

## File Structure

```
app/admin/
├── page.tsx                    # Dashboard overview
├── brands/
│   └── page.tsx               # Brand management
├── mobiles/
│   └── page.tsx               # Mobile management
├── compatibility/
│   └── page.tsx               # Compatibility groups
├── import/
│   └── page.tsx               # Data import
├── export/
│   └── page.tsx               # Data export
├── backup/
│   └── page.tsx               # Backup & restore
├── settings/
│   └── page.tsx               # System settings
└── layout.tsx                 # Admin layout with sidebar

components/
├── admin-sidebar.tsx          # Navigation sidebar
└── admin/
    ├── brand-dialog.tsx       # Brand CRUD dialog
    ├── mobile-dialog.tsx      # Mobile CRUD dialog
    └── compatibility-dialog.tsx # Compatibility CRUD dialog

lib/
└── admin-mock-data.ts         # All mock data and types
```

## Mock Data

All data is stored in `lib/admin-mock-data.ts`:

- **Brands**: 6 brands with emojis, device counts, status
- **Mobiles**: 10 devices with full specifications
- **Compatibility Groups**: 5 groups with device/accessory counts
- **System Logs**: 6 activity entries with timestamps and status
- **Backup Records**: 4 backup files with types and sizes
- **Dashboard Stats**: Overall system statistics

## Component Usage

### Sidebar Navigation
```typescript
import { AdminSidebar } from '@/components/admin-sidebar'
```

### Brand Dialog (Create/Edit)
```typescript
import { BrandDialog } from '@/components/admin/brand-dialog'

<BrandDialog
  open={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  brand={selectedBrand}
  onSave={handleSaveBrand}
/>
```

### Mobile Dialog (Create/Edit)
```typescript
import { MobileDialog } from '@/components/admin/mobile-dialog'
```

### Compatibility Dialog (Create/Edit)
```typescript
import { CompatibilityDialog } from '@/components/admin/compatibility-dialog'
```

## shadcn/ui Components Used

- **Table**: Data tables with sorting and filtering
- **Dialog**: Modal forms for CRUD operations
- **Form**: Form inputs and validation
- **DropdownMenu**: Action menus
- **Card**: Data containers and statistics
- **Button**: Interactive elements
- **Badge**: Status indicators
- **Input**: Text inputs
- **Select**: Dropdown selections
- **Label**: Form labels
- **Checkbox**: Toggle selections
- **Textarea**: Multi-line text input
- **ScrollArea**: Scrollable content areas

## Features in Detail

### Dashboard Statistics
- Real-time stats from mock data
- Color-coded icons for each metric
- Percentage changes from previous period
- Quick access to related management pages

### Tables & Filtering
- **Brands**: Sortable by name, devices, status, dates
- **Mobiles**: Search by model/brand, filter by status
- **Compatibility**: View as cards or table format
- **System Logs**: Sortable by action, user, timestamp

### CRUD Operations
All create/edit dialogs include:
- Form validation
- Dropdown selections for related data
- Status selectors
- Auto-generated timestamps
- Cancel and save buttons

### Data Import
- Drag & drop file upload
- File size validation
- Template download
- Success/failure/warning reporting
- Duplicate detection

### Data Export
- Checkbox selection for data categories
- Export summary
- File generation and download
- Recent exports history
- Download links for previous exports

### Backup Management
- One-click backup creation
- Full and incremental backup types
- File size tracking
- Restore capability
- Delete functionality
- Backup retention policy display

## Styling

The admin dashboard uses a professional, clean design with:
- **Color Scheme**: Blue accent color (#3b82f6) throughout
- **Spacing**: Premium Apple-like spacing with generous padding
- **Borders**: Soft borders and subtle shadows
- **Typography**: Clear hierarchy with semantic sizing
- **Responsive**: Fully responsive from mobile to desktop
- **Dark Mode**: Full dark mode support via Tailwind's dark class

## Customization

### Adding New Sections
1. Create new page in `app/admin/[section]/page.tsx`
2. Add menu item to `components/admin-sidebar.tsx`
3. Create corresponding dialog component if needed
4. Add mock data to `lib/admin-mock-data.ts`

### Modifying Mock Data
Edit `lib/admin-mock-data.ts`:
- Add/remove items from arrays
- Update mock interfaces
- Modify statistics calculations

### Styling Customization
- Update Tailwind classes in components
- Modify color variables in `app/globals.css`
- Adjust spacing scale in `tailwind.config.ts`

## Future Enhancements

- Database integration (Neon PostgreSQL recommended)
- Real backend API instead of mock data
- User authentication and role-based access
- Advanced filtering and search
- Data pagination for large datasets
- Real-time updates via WebSocket
- CSV import/export in addition to Excel
- Scheduled automated backups
- Data validation and constraints
- Audit logging to database
- Performance analytics

## Performance Tips

- Mock data is kept in memory for instant operations
- Tables are virtualized for large datasets (future enhancement)
- Dialogs are lazy-loaded on demand
- Images use Next.js Image component
- CSS is optimized with Tailwind CSS purging

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari, Chrome Mobile

## Accessibility

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Color contrast compliance
- Focus management in dialogs
- Screen reader friendly

## License

Part of Mobile Compatibility Finder project.
