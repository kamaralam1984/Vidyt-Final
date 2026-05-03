// Rendered when SiteSettings.maintenanceMode is on for everyone except super-admin.
// The middleware rewrites the URL to /maintenance, so all paths land here.

export const dynamic = 'force-static';

export const metadata = {
  title: 'Vidyt — Scheduled Maintenance',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0F0F0F',
            color: '#fff',
            padding: '32px',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <div
              style={{
                fontSize: 48,
                marginBottom: 24,
                lineHeight: 1,
              }}
              aria-hidden
            >
              🛠️
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
              We&apos;ll be right back
            </h1>
            <p style={{ color: '#9CA3AF', lineHeight: 1.6, fontSize: 16 }}>
              Vidyt is undergoing scheduled maintenance. Please check back in a few minutes.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
