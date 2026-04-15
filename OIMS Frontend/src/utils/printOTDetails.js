/**
 * Print OT Details Utility
 * Generates a formal overtime statement for printing.
 * Filters out non-OT dates and focuses on earned hours.
 * 
 * @param {Array} records - Array of attendance records with pre-calculated dailyOT
 * @param {Object} employee - The employee's user data
 * @param {Object} settings - Calculation settings { dutyOnTime, dutyOffTime, includeMorningOT, year, month }
 * @param {Object} siteConfig - Site configuration for branding
 */

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '--:--';
  return new Date(dateStr).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

const formatOTDuration = (decimalHours) => {
  if (!decimalHours || decimalHours <= 0) return '00:00';
  const totalMinutes = Math.round(decimalHours * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const formatOTWordy = (decimalHours) => {
  const totalMinutes = Math.round(decimalHours * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs > 0) {
    return `${hrs} Hrs ${mins > 0 ? `${mins} Min` : ''}`;
  }
  return `${mins} Min`;
};

export const printOTDetails = (records, employee, settings, siteConfig) => {
  const { dutyOnTime, dutyOffTime, includeMorningOT, year, month } = settings;
  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' });

  // Filter only records with OT
  const otRecords = records.filter(r => r.dailyOT > 0).sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const totalHoursNumeric = otRecords.reduce((sum, r) => sum + r.dailyOT, 0);

  const tableRowsHtml = otRecords.map(row => `
    <tr>
      <td>${formatDate(row.date)}</td>
      <td>${formatTime(row.checkIn)}</td>
      <td>${formatTime(row.checkOut)}</td>
      <td class="text-center highlight-cell">${formatOTWordy(row.dailyOT)}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OT Statement — ${employee.firstName} ${employee.lastName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      color: #1e293b;
      background: #fff;
      font-size: 10pt;
      line-height: 1.5;
    }
    .print-page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 15mm 20mm;
    }

    /* Header */
    .header {
      text-align: center;
      border-bottom: 2px solid #1e293b;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    .org-name { font-size: 20pt; font-weight: 900; text-transform: uppercase; color: #0f172a; }
    .doc-title {
      font-size: 14pt;
      font-weight: 800;
      margin-top: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .period-line { font-size: 9pt; color: #64748b; font-weight: 600; margin-top: 5px; }

    /* Info Section */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 25px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-table td { padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
    .label { font-weight: 700; font-size: 8pt; color: #64748b; text-transform: uppercase; width: 100px; }
    .value { font-weight: 700; color: #0f172a; }

    /* Settings Box */
    .settings-summary {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px 18px;
      border-radius: 6px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .setting-item { display: flex; align-items: center; gap: 8px; font-size: 8.5pt; }
    .setting-label { font-weight: 800; color: #64748b; text-transform: uppercase; }
    .setting-val { font-weight: 900; color: #6366f1; }

    /* Data Table */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    table.data-table th {
      background: #0f172a;
      color: #fff;
      padding: 10px;
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      text-align: left;
    }
    table.data-table td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
      font-weight: 600;
      vertical-align: middle;
    }
    .text-center { text-align: center; }
    .highlight-cell { color: #4f46e5; font-weight: 800; }

    /* Summary Result */
    .summary-box {
      float: right;
      width: 250px;
      background: #0f172a;
      color: #fff;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin-top: 10px;
    }
    .total-label { font-size: 8pt; font-weight: 800; text-transform: uppercase; opacity: 0.7; }
    .total-val { font-size: 18pt; font-weight: 900; margin-top: 5px; }

    .clearfix::after { content: ""; clear: both; display: table; }

    /* Signatures */
    .signature-section {
      margin-top: 80px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 50px;
    }
    .sig-block { text-align: center; }
    .sig-line { border-top: 1.5px solid #1e293b; margin-top: 50px; padding-top: 10px; }
    .sig-label { font-size: 8pt; font-weight: 800; text-transform: uppercase; color: #64748b; }

    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 7pt;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 10px;
    }

    @media print {
      .no-print { display: none !important; }
      @page { margin: 0; }
    }

    .print-btn-bar {
      background: #f8fafc;
      padding: 15px;
      text-align: center;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .print-btn {
      background: #6366f1;
      color: #fff;
      border: none;
      padding: 10px 30px;
      border-radius: 8px;
      font-weight: 800;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="print-btn-bar no-print">
    <button class="print-btn" onclick="window.print()">🖨️ Print OT Statement</button>
  </div>

  <div class="print-page">
    <div class="header">
      <div class="org-name">${siteConfig.name || 'OIMS Portal'}</div>
      <div class="doc-title">Monthly Overtime Statement</div>
      <div class="period-line">Statement Period: ${monthName} ${year}</div>
    </div>

    <div class="info-grid">
      <table class="info-table">
        <tr>
          <td class="label">Employee Name</td>
          <td class="value">${employee.firstName} ${employee.lastName}</td>
        </tr>
        <tr>
          <td class="label">Designation</td>
          <td class="value">${(employee.jobTitle || '—').replace(/_/g, ' ')}</td>
        </tr>
        <tr>
          <td class="label">Department</td>
          <td class="value">${(employee.department || '—').replace(/_/g, ' ')}</td>
        </tr>
      </table>
      <table class="info-table">
        <tr>
          <td class="label">Employee No</td>
          <td class="value">${employee.employeeNo || '—'}</td>
        </tr>
        <tr>
          <td class="label">EPF/ETF No</td>
          <td class="value">${employee.epfNo || '—'}</td>
        </tr>
        <tr>
          <td class="label">Report Date</td>
          <td class="value">${new Date().toLocaleDateString()}</td>
        </tr>
      </table>
    </div>

    <div class="settings-summary">
      <div class="setting-item">
        <span class="setting-label">Duty Shift:</span>
        <span class="setting-val">${dutyOnTime} — ${dutyOffTime}</span>
      </div>
      <div class="setting-item">
        <span class="setting-label">Pre-Shift OT:</span>
        <span class="setting-val">${includeMorningOT ? 'ENABLED' : 'DISABLED'}</span>
      </div>
      <div class="setting-item">
        <span class="setting-label">OT Instances:</span>
        <span class="setting-val">${otRecords.length} Days</span>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Date of Attendance</th>
          <th>Check-In</th>
          <th>Check-Out</th>
          <th class="text-center">Hours Earned</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
        ${otRecords.length === 0 ? '<tr><td colspan="4" class="text-center" style="padding: 40px; color: #94a3b8; font-style: italic;">No overtime records found for this period.</td></tr>' : ''}
      </tbody>
    </table>

    <div class="clearfix">
      <div class="summary-box">
        <div class="total-label">Monthly OT Total</div>
        <div class="total-val">${formatOTWordy(totalHoursNumeric)}</div>
      </div>
    </div>

    <div class="signature-section">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Employee Signature</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Head of Department</div>
      </div>
    </div>

    <div class="footer">
      This is a computer-generated overtime statement from ${siteConfig.name || 'OIMS System'}. Official records are subject to audit.
    </div>
  </div>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
};
