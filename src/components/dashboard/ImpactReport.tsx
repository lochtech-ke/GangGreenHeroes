/**
 * ImpactReport Component
 * Generates detailed reports with evidence for stakeholders
 * Requirements: A10.4
 */

import React, { useState } from 'react';
import { dashboardService } from '../../services/dashboard.service';

interface ImpactReportProps {
  className?: string;
}

type ReportFormat = 'pdf' | 'csv' | 'json';

export const ImpactReport: React.FC<ImpactReportProps> = ({ className = '' }) => {
  const [forest, setForest] = useState<'kakamega' | 'karura' | 'mau' | 'all'>('all');
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Set default dates (last 90 days)
  React.useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    setPeriodEnd(end.toISOString().split('T')[0]);
    setPeriodStart(start.toISOString().split('T')[0]);
  }, []);

  const generateReport = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);

      // Fetch report data
      const reportData = await dashboardService.generateReportData(
        forest,
        periodStart ? new Date(periodStart).toISOString() : undefined,
        periodEnd ? new Date(periodEnd).toISOString() : undefined
      );

      // Generate report based on format
      switch (format) {
        case 'pdf':
          await generatePDFReport(reportData);
          break;
        case 'csv':
          generateCSVReport(reportData);
          break;
        case 'json':
          generateJSONReport(reportData);
          break;
      }

      setSuccess(`Report generated successfully in ${format.toUpperCase()} format!`);
    } catch (err) {
      console.error('[ImpactReport] Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const generatePDFReport = async (data: any) => {
    // For PDF generation, we'll create a printable HTML version
    // In production, you'd use a library like jsPDF or html2pdf
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window. Please allow popups.');
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impact Report - ${forest === 'all' ? 'All Forests' : forest}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { color: #10b981; border-bottom: 3px solid #10b981; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; }
            .metric-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin: 20px 0;
            }
            .metric-card {
              border: 1px solid #e5e7eb;
              padding: 15px;
              border-radius: 8px;
            }
            .metric-label { color: #6b7280; font-size: 14px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #111827; margin: 5px 0; }
            .metric-subtext { color: #9ca3af; font-size: 12px; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            th {
              background-color: #f9fafb;
              font-weight: 600;
              color: #374151;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>#GangGreen Impact Report</h1>
          <p><strong>Forest:</strong> ${forest === 'all' ? 'All Forests' : forest.charAt(0).toUpperCase() + forest.slice(1)}</p>
          <p><strong>Period:</strong> ${new Date(data.metrics.period_start).toLocaleDateString()} - ${new Date(data.metrics.period_end).toLocaleDateString()}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>

          <h2>Key Metrics</h2>
          <div class="metric-grid">
            <div class="metric-card">
              <div class="metric-label">Trees Planted</div>
              <div class="metric-value">${data.metrics.total_trees_planted.toLocaleString()}</div>
              <div class="metric-subtext">${data.metrics.total_carbon_sequestered_tons.toFixed(1)} tons CO₂ sequestered</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Area Restored</div>
              <div class="metric-value">${data.metrics.total_area_hectares.toFixed(1)} ha</div>
              <div class="metric-subtext">Across ${data.metrics.active_initiatives} initiatives</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Community Engagement</div>
              <div class="metric-value">${data.metrics.total_participants.toLocaleString()}</div>
              <div class="metric-subtext">Total participants</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Active Initiatives</div>
              <div class="metric-value">${data.metrics.active_initiatives}</div>
              <div class="metric-subtext">Currently ongoing</div>
            </div>
          </div>

          <h2>Forest Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Forest</th>
                <th>Trees Planted</th>
                <th>CO₂ Sequestered</th>
                <th>Area (ha)</th>
                <th>Community Members</th>
              </tr>
            </thead>
            <tbody>
              ${data.forestStats.map((f: any) => `
                <tr>
                  <td>${f.forest_name}</td>
                  <td>${f.trees_planted.toLocaleString()}</td>
                  <td>${f.carbon_sequestered_tons.toFixed(1)} tons</td>
                  <td>${f.total_area_hectares.toFixed(1)}</td>
                  <td>${f.community_members}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>Recent Activities</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${data.activities.slice(0, 20).map((a: any) => `
                <tr>
                  <td>${new Date(a.timestamp).toLocaleDateString()}</td>
                  <td>${a.title}</td>
                  <td>${a.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p><strong>#GangGreen Platform</strong> - Community-Powered Climate Action</p>
            <p>This report contains verified data from our conservation initiatives across Kenya's forests.</p>
            <p>For more information, visit our platform or contact our team.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const generateCSVReport = (data: any) => {
    // Generate CSV data
    const csvRows = [
      ['#GangGreen Impact Report'],
      ['Forest', forest === 'all' ? 'All Forests' : forest],
      ['Period Start', new Date(data.metrics.period_start).toLocaleDateString()],
      ['Period End', new Date(data.metrics.period_end).toLocaleDateString()],
      ['Generated', new Date().toLocaleString()],
      [],
      ['Key Metrics'],
      ['Metric', 'Value'],
      ['Trees Planted', data.metrics.total_trees_planted],
      ['Carbon Sequestered (tons)', data.metrics.total_carbon_sequestered_tons],
      ['Area Restored (ha)', data.metrics.total_area_hectares],
      ['Active Initiatives', data.metrics.active_initiatives],
      ['Total Participants', data.metrics.total_participants],
      [],
      ['Forest Breakdown'],
      ['Forest', 'Trees Planted', 'CO₂ Sequestered (tons)', 'Area (ha)', 'Community Members'],
      ...data.forestStats.map((f: any) => [
        f.forest_name,
        f.trees_planted,
        f.carbon_sequestered_tons,
        f.total_area_hectares,
        f.community_members
      ]),
      [],
      ['Recent Activities'],
      ['Date', 'Type', 'Title', 'Description'],
      ...data.activities.slice(0, 50).map((a: any) => [
        new Date(a.timestamp).toLocaleDateString(),
        a.type,
        a.title,
        a.description
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    downloadFile(csvContent, `impact-report-${forest}-${Date.now()}.csv`, 'text/csv');
  };

  const generateJSONReport = (data: any) => {
    const jsonData = {
      report: {
        title: '#GangGreen Impact Report',
        forest: forest === 'all' ? 'All Forests' : forest,
        period: {
          start: data.metrics.period_start,
          end: data.metrics.period_end
        },
        generated: new Date().toISOString()
      },
      metrics: data.metrics,
      forestStats: data.forestStats,
      trends: data.trends,
      activities: data.activities
    };

    const jsonContent = JSON.stringify(jsonData, null, 2);
    downloadFile(jsonContent, `impact-report-${forest}-${Date.now()}.json`, 'application/json');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Generate Impact Report</h2>
        <p className="text-gray-600 text-sm mt-1">
          Create detailed reports with evidence for stakeholders
        </p>
      </div>

      <div className="space-y-4">
        {/* Forest Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Forest
          </label>
          <select
            value={forest}
            onChange={(e) => setForest(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Forests</option>
            <option value="kakamega">Kakamega Forest</option>
            <option value="karura">Karura Forest</option>
            <option value="mau">Mau Forest</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Format
          </label>
          <div className="flex gap-3">
            {(['pdf', 'csv', 'json'] as ReportFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  format === fmt
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={generateReport}
          disabled={generating || !periodStart || !periodEnd}
          className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
            generating || !periodStart || !periodEnd
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {generating ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating Report...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Report Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Report Contents</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Key impact metrics (trees, carbon, area, participants)</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Forest-by-forest breakdown with detailed statistics</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Trend data showing progress over time</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Recent activities and verified evidence</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
