'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DetailsPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params.modelId) {
      router.replace(`/details?id=${params.modelId}`);
    } else {
      router.replace('/');
    }
  }, [params.modelId, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );
}
