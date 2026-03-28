import { redirect } from 'next/navigation';

/** Legacy URL — sab control ab `/admin/super` par hai. */
export default function PlansPageRedirect() {
  redirect('/admin/super');
}
