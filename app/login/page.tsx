import { Suspense } from 'react';
import { AuthPageContent } from '../auth/page';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <AuthPageContent defaultIsLogin={true} />
    </Suspense>
  );
}
