/**
 * app/details/[modelId]/page.tsx
 *
 * Server component wrapper — required for static export compatibility.
 * generateStaticParams() pre-generates routes for all known mobile models.
 * The actual UI is in details-client.tsx (a 'use client' component).
 */

import DetailsClient from './details-client'

export function generateStaticParams() {
  return [{ modelId: 'dummy' }]
}

export default function DetailsPage() {
  return <DetailsClient />
}
