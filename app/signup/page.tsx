'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Navbar and links use `/signup`; canonical signup UI is `/auth?mode=signup`. */
export default function SignupRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth?mode=signup');
  }, [router]);

  return null;
}
