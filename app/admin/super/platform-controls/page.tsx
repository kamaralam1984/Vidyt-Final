import { redirect } from 'next/navigation';

/** Legacy URL — platform controls `UnifiedControlPanel` ke andar `/admin/super` par merge ho chuke hain. */
export default function PlatformControlsRedirect() {
  redirect('/admin/super');
}
