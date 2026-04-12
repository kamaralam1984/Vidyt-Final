/**
 * Export Reports Service
 * Generates PDF, Excel, CSV reports
 */

import { AnalyticsOverview } from '@/services/analytics/advanced';
import { getAnalyticsOverview } from '@/services/analytics/advanced';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Generate CSV report
 */
export async function generateCSVReport(
  userId: string,
  data: any
): Promise<string> {
  const rows: string[] = [];
  
  // Header
  rows.push('Metric,Value');
  
  // Data rows
  if (data.overview) {
    rows.push(`Total Videos,${data.overview.totalVideos}`);
    rows.push(`Total Analyses,${data.overview.totalAnalyses}`);
    rows.push(`Average Viral Score,${data.overview.averageViralScore}`);
    rows.push(`Average Engagement Rate,${data.overview.averageEngagementRate}`);
  }
  
  if (data.topPerformers) {
    rows.push('');
    rows.push('Top Performing Videos');
    rows.push('Title,Viral Score,Views,Engagement Rate');
    data.topPerformers.forEach((video: any) => {
      rows.push(`"${video.title}",${video.viralScore},${video.views},${video.engagementRate}`);
    });
  }
  
  return rows.join('\n');
}

/**
 * Generate Excel report (simplified - returns CSV format)
 */
export async function generateExcelReport(
  userId: string,
  data: any
): Promise<string> {
  // For now, return CSV format
  // In production, use a library like exceljs
  return generateCSVReport(userId, data);
}

/**
 * Generate PDF report (simplified - returns HTML). White-label: pass companyName and logoUrl for branding.
 */
export async function generatePDFReport(
  userId: string,
  data: any,
  whiteLabel?: { companyName?: string; logoUrl?: string }
): Promise<string> {
  const brandName = whiteLabel?.companyName || 'Vid YT';
  const logoHtml = whiteLabel?.logoUrl ? `<img src="${whiteLabel.logoUrl}" alt="Logo" style="max-height: 48px; margin-bottom: 12px;" />` : '';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Analytics Report - ${brandName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .brand-header { margin-bottom: 20px; }
        h1 { color: #3b82f6; }
        .metric { margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #3b82f6; color: white; }
      </style>
    </head>
    <body>
      <div class="brand-header">${logoHtml}<h1>${brandName} - Analytics Report</h1></div>
      <div class="metric"><strong>Total Videos:</strong> ${data.overview?.totalVideos || 0}</div>
      <div class="metric"><strong>Total Analyses:</strong> ${data.overview?.totalAnalyses || 0}</div>
      <div class="metric"><strong>Average Viral Score:</strong> ${data.overview?.averageViralScore || 0}%</div>
      <div class="metric"><strong>Average Engagement Rate:</strong> ${data.overview?.averageEngagementRate || 0}%</div>
      
      ${data.topPerformers ? `
        <h2>Top Performing Videos</h2>
        <table>
          <tr>
            <th>Title</th>
            <th>Viral Score</th>
            <th>Views</th>
            <th>Engagement Rate</th>
          </tr>
          ${data.topPerformers.map((video: any) => `
            <tr>
              <td>${video.title}</td>
              <td>${video.viralScore}%</td>
              <td>${video.views.toLocaleString()}</td>
              <td>${video.engagementRate}%</td>
            </tr>
          `).join('')}
        </table>
      ` : ''}
      
      <p><small>Generated on ${new Date().toLocaleString()}</small></p>
    </body>
    </html>
  `;
  
  return html;
}

/**
 * Export analytics data
 */
export async function exportAnalytics(
  userId: string,
  format: 'pdf' | 'excel' | 'csv',
  options?: ExportOptions,
  workspaceId?: string
): Promise<{ content: string; filename: string; mimeType: string }> {
  // Get analytics data
  const overview = await getAnalyticsOverview(
    userId,
    options?.dateRange?.start,
    options?.dateRange?.end,
    workspaceId
  );

  const data = {
    overview,
    topPerformers: overview.topPerformingVideos,
  };

  let whiteLabel: { companyName?: string; logoUrl?: string } | undefined;
  try {
    await connectDB();
    
    if (workspaceId) {
      const Workspace = (await import('@/models/Workspace')).default;
      const workspace = await Workspace.findById(workspaceId).lean() as any;
      if (workspace) {
        whiteLabel = {
          companyName: workspace.name,
          logoUrl: workspace.logoUrl
        };
      }
    }

    if (!whiteLabel) {
      const user = await User.findById(userId).select('whiteLabelCompanyName whiteLabelLogoUrl companyName').lean();
      if (user?.whiteLabelCompanyName || user?.companyName || user?.whiteLabelLogoUrl) {
        whiteLabel = {
          companyName: user.whiteLabelCompanyName || user.companyName,
          logoUrl: user.whiteLabelLogoUrl,
        };
      }
    }
  } catch (_) {}

  let content: string;
  let filename: string;
  let mimeType: string;

  switch (format) {
    case 'csv':
      content = await generateCSVReport(userId, data);
      filename = `analytics-report-${Date.now()}.csv`;
      mimeType = 'text/csv';
      break;
    
    case 'excel':
      content = await generateExcelReport(userId, data);
      filename = `analytics-report-${Date.now()}.xlsx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      break;
    
    case 'pdf':
      content = await generatePDFReport(userId, data, whiteLabel);
      filename = `analytics-report-${Date.now()}.html`; // HTML for PDF conversion
      mimeType = 'text/html';
      break;
    
    default:
      throw new Error('Invalid export format');
  }

  return { content, filename, mimeType };
}
