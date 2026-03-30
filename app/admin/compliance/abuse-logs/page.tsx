import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AbuseMonitoringDashboard from '@/components/admin/AbuseMonitoringDashboard';

export const metadata = {
  title: 'Abuse Monitoring | ViralBoost Admin',
  description: 'Monitor and manage API abuse and suspicious activity',
};

export default async function AbuseLogs() {
  const headerList = headers();
  const userRole = headerList.get('x-user-role');

  // Verify super-admin access
  if (userRole !== 'super-admin' && userRole !== 'superadmin') {
    redirect('/dashboard');
  }

  return <AbuseMonitoringDashboard />;
}
