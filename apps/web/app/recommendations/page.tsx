// ВРЕМЕННО ЗАКОММЕНТИРОВАНО — вкладка «Подборка» скрыта из меню
//
// 'use client';
//
// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { recommendationsApi, type RecommendationResult } from '@/lib/api';
// import { RequestSelectionButton } from '@/components/leads/RequestSelectionButton';
//
// export default function RecommendationsPage() {
//   const [data, setData]       = useState<RecommendationResult | null>(null);
//   const [loading, setLoading] = useState(true);
//
//   useEffect(() => {
//     recommendationsApi
//       .get()
//       .then(setData)
//       .catch(() => null)
//       .finally(() => setLoading(false));
//   }, []);
//
//   return (
//     <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
//       ...
//     </main>
//   );
// }

export default function RecommendationsPage() {
  return null;
}
