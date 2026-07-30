'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AllClubRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/members/one-club');
  }, [router]);

  return (
    <div className="p-8 text-center text-slate-500 font-sans text-xs uppercase tracking-widest font-semibold">
      Mengalihkan ke Data Anggota...
    </div>
  );
}
