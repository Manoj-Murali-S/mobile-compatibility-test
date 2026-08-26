import { Suspense } from 'react';
import DetailsClient from './details-client';

export default function DetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <DetailsClient />
    </Suspense>
  );
}
