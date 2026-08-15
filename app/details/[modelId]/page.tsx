/**
 * app/details/[modelId]/page.tsx
 *
 * Server component wrapper — required for static export compatibility.
 * generateStaticParams() pre-generates routes for all known mobile models.
 * The actual UI is in details-client.tsx (a 'use client' component).
 */

import { getAllMobiles } from '@/lib/mock-data'
import DetailsClient from './details-client'

// Pre-generate routes for all known mobile models at build time.
// Additional models added via SQLite Admin are still reachable at runtime
// because the client component reads the modelId from useParams() dynamically.
export function generateStaticParams() {
  return getAllMobiles().map((mobile) => ({
    modelId: mobile.model.toLowerCase().replace(/\s+/g, '-'),
  }))
}

export default function DetailsPage() {
  return <DetailsClient />
}
