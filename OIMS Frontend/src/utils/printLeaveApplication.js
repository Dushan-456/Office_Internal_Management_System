/**
 * Print Leave Application Utility
 * Generates a formal, hard-copy style leave application form for printing.
 * Section D (Supporting Documents) starts on a new page with embedded images
 * and PDF handling.
 * 
 * @param {Object} leaveRequest - The leave request data object
 * @param {Object} applicant - The applicant's user data (name, empNo, epfNo, mobileNo, department, jobTitle)
 * @param {Object} siteConfig - Site configuration for branding
 */

const ASSET_BASE = import.meta.env.VITE_ASSET_URL || 'http://localhost:5000';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
const PDF_EXTENSION = 'pdf';

const getFileExtension = (filePath) => {
  return (filePath || '').split('.').pop().toLowerCase();
};

const isImage = (filePath) => IMAGE_EXTENSIONS.includes(getFileExtension(filePath));
const isPdf = (filePath) => getFileExtension(filePath) === PDF_EXTENSION;

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Builds the HTML for a single attachment based on its file type.
 * - Images: rendered as <img> tags to print inline
 * - PDFs: rendered as <iframe> embed (prints if browser supports it)
 *         plus a fallback "Open PDF" link
 * - Other: just the filename
 */
const buildAttachmentHtml = (attachmentPath, index) => {
  const fullUrl = `${ASSET_BASE}${attachmentPath}`;
  const fileName = attachmentPath.split('/').pop();

  if (isImage(attachmentPath)) {
    return `
      <div class="attachment-item">
        <div class="attachment-label">
          <span class="att-index">${index + 1}</span>
          <span class="att-name">${fileName}</span>
          <span class="att-type-badge att-image">IMAGE</span>
        </div>
        <div class="attachment-preview">
          <img src="${fullUrl}" alt="${fileName}" />
        </div>
      </div>
    `;
  }

  if (isPdf(attachmentPath)) {
    return `
      <div class="attachment-item">
        <div class="attachment-label">
          <span class="att-index">${index + 1}</span>
          <span class="att-name">${fileName}</span>
          <span class="att-type-badge att-pdf">PDF</span>
        </div>
        <div class="attachment-preview pdf-preview">
          <iframe src="${fullUrl}" title="${fileName}"></iframe>
          <div class="pdf-fallback no-print">
            <a href="${fullUrl}" target="_blank">⬇ Open PDF in new tab to print separately</a>
          </div>
          <div class="pdf-print-note print-only">
            <div class="pdf-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <strong>PDF Attachment:</strong> ${fileName}<br/>
            <span class="pdf-note-sub">This PDF document must be opened and printed separately from the system.</span>
          </div>
        </div>
      </div>
    `;
  }

  // Other file types — show filename only
  return `
    <div class="attachment-item">
      <div class="attachment-label">
        <span class="att-index">${index + 1}</span>
        <span class="att-name">${fileName}</span>
        <span class="att-type-badge att-other">FILE</span>
      </div>
      <div class="attachment-other">
        <p>This file type cannot be previewed. Please download and print separately.</p>
        <a href="${fullUrl}" target="_blank" class="no-print">⬇ Open File</a>
      </div>
    </div>
  `;
};

export const printLeaveApplication = (leaveRequest, applicant, siteConfig) => {
  const actingOfficer = leaveRequest.actingOfficerId;
  const approveOfficer = leaveRequest.approveOfficerId;

  const actingName = actingOfficer
    ? `${actingOfficer.firstName || ''} ${actingOfficer.lastName || ''}`.trim()
    : '—';
  const approveName = approveOfficer
    ? `${approveOfficer.firstName || ''} ${approveOfficer.lastName || ''}`.trim()
    : '—';

  // Build attachments section
  const hasAttachments = Array.isArray(leaveRequest.attachments) && leaveRequest.attachments.length > 0;
  const attachmentsHtml = hasAttachments
    ? leaveRequest.attachments.map((a, i) => buildAttachmentHtml(a, i)).join('')
    : '<div class="no-attachments">No supporting documents attached to this leave application.</div>';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Leave Application — ${applicant.firstName} ${applicant.lastName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1e293b;
      background: #fff;
      padding: 0;
      font-size: 11pt;
      line-height: 1.5;
    }

    .print-page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 10mm 15mm 8mm 15mm;
    }


    /* Header */
    .header {
      text-align: center;
      border-bottom: 3px double #1e293b;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }

    .header .org-name {
      font-size: 18pt;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      text-transform: uppercase;
    }

    .header .sub-title {
      font-size: 9pt;
      color: #64748b;
      letter-spacing: 2px;
      text-transform: uppercase;
      font-weight: 600;
      margin-top: 2px;
    }

    .header .form-title {
      font-size: 14pt;
      font-weight: 800;
      margin-top: 10px;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 3px;
    }

    .header .ref-line {
      font-size: 8pt;
      color: #94a3b8;
      margin-top: 6px;
      font-weight: 500;
    }

    /* Section */
    .section {
      margin-bottom: 15px;
    }

    .section-title {
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #475569;
      background: #f1f5f9;
      padding: 6px 12px;
      border-left: 4px solid #6366f1;
      margin-bottom: 10px;
    }

    /* Info Table */
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
    }

    .info-table td {
      padding: 6px 10px;
      vertical-align: top;
      border: 1px solid #e2e8f0;
    }

    .info-table .label {
      font-weight: 700;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      width: 140px;
      background: #f8fafc;
    }

    .info-table .value {
      font-weight: 600;
      font-size: 10pt;
      color: #1e293b;
    }

    /* Reason / Address box */
    .text-box {
      border: 1px solid #e2e8f0;
      padding: 10px 12px;
      min-height: 45px;
      font-size: 10pt;
      line-height: 1.6;
      color: #334155;
      background: #fafbfc;
      border-radius: 4px;
    }

    /* Approval Workflow */
    .approval-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 4px;
    }

    .approval-card {
      border: 1px solid #e2e8f0;
      padding: 14px;
      text-align: center;
    }

    .approval-card .role-label {
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      margin-bottom: 4px;
    }

    .approval-card .officer-name {
      font-size: 11pt;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 6px;
    }

    .approval-card .status-badge {
      display: inline-block;
      padding: 2px 12px;
      border-radius: 20px;
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-approved { background: #dcfce7; color: #166534; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .status-pending { background: #fef9c3; color: #854d0e; }

    .approval-card .decision-date {
      font-size: 7.5pt;
      color: #94a3b8;
      margin-top: 4px;
      font-weight: 500;
    }

    /* Signature area */
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-top: 30px;
      padding-top: 10px;
    }

    .signature-block {
      text-align: center;
    }

    .signature-block .sig-line {
      border-top: 1.5px solid #1e293b;
      margin-top: 50px;
      padding-top: 6px;
    }

    .signature-block .sig-label {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #475569;
    }

    .signature-block .sig-name {
      font-size: 8pt;
      font-weight: 500;
      color: #94a3b8;
      margin-top: 2px;
    }

    /* ============================================
       ATTACHMENTS — New Page with Image/PDF display
       ============================================ */
    .attachments-page {
      padding-top: 15mm;
    }

    .attachment-item {
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .attachment-label {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .att-index {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #6366f1;
      color: #fff;
      font-size: 8pt;
      font-weight: 800;
      flex-shrink: 0;
    }

    .att-name {
      font-size: 9pt;
      font-weight: 700;
      color: #1e293b;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .att-type-badge {
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 2px 10px;
      border-radius: 10px;
      flex-shrink: 0;
    }

    .att-image { background: #dbeafe; color: #1e40af; }
    .att-pdf { background: #fee2e2; color: #991b1b; }
    .att-other { background: #f1f5f9; color: #475569; }

    .attachment-preview {
      padding: 12px;
      text-align: center;
      background: #fafbfc;
    }

    .attachment-preview img {
      max-width: 100%;
      max-height: 700px;
      object-fit: contain;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
    }

    /* PDF iframe preview */
    .pdf-preview iframe {
      width: 100%;
      height: 600px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
    }

    .pdf-fallback {
      margin-top: 10px;
      padding: 8px 16px;
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 8px;
      font-size: 9pt;
    }

    .pdf-fallback a {
      color: #dc2626;
      font-weight: 700;
      text-decoration: none;
    }

    .pdf-fallback a:hover {
      text-decoration: underline;
    }

    /* PDF print note — shown only when printing */
    .pdf-print-note {
      padding: 20px;
      border: 2px dashed #fca5a5;
      border-radius: 8px;
      text-align: center;
      color: #991b1b;
      font-size: 10pt;
      line-height: 1.6;
      background: #fff5f5;
    }

    .pdf-print-note .pdf-icon {
      margin-bottom: 8px;
    }

    .pdf-print-note .pdf-note-sub {
      font-size: 8pt;
      color: #b91c1c;
      font-weight: 500;
    }

    .attachment-other {
      padding: 20px;
      text-align: center;
      color: #64748b;
      font-size: 9pt;
      background: #fafbfc;
    }

    .attachment-other a {
      display: inline-block;
      margin-top: 8px;
      color: #6366f1;
      font-weight: 700;
      text-decoration: none;
    }

    .no-attachments {
      padding: 30px;
      text-align: center;
      color: #94a3b8;
      font-style: italic;
      font-size: 10pt;
      border: 1px dashed #e2e8f0;
      border-radius: 8px;
    }

    /* Footer */
    .footer {
      margin-top: 25px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 7pt;
      color: #94a3b8;
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    /* Rejection */
    .rejection-box {
      border: 1.5px solid #fca5a5;
      background: #fff5f5;
      padding: 10px 12px;
      border-radius: 4px;
      margin-top: 8px;
    }

    .rejection-box .rej-label {
      font-size: 8pt;
      font-weight: 800;
      color: #dc2626;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .rejection-box .rej-text {
      font-size: 10pt;
      color: #991b1b;
      margin-top: 4px;
      font-weight: 500;
    }

    /* ============================================
       Print-specific 
       ============================================ */
    .print-only { display: none; }

    @media print {
      body { padding: 0; }
      .print-page { padding: 10mm 15mm; max-width: 100%; }
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      .pdf-preview iframe { display: none; } /* iframes don't print well */
      @page { margin: 5mm; }
    }

    /* Print button bar */
    .print-btn-bar {
      text-align: center;
      padding: 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .print-btn {
      background: #6366f1;
      color: white;
      border: none;
      padding: 10px 32px;
      border-radius: 10px;
      font-size: 11pt;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      letter-spacing: 0.5px;
    }

    .print-btn:hover {
      background: #4f46e5;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
  </style>
</head>
<body>

  <div class="print-btn-bar no-print">
    <button class="print-btn" onclick="window.print()">🖨️ Print Application</button>
  </div>

  <div class="print-page">
    <!-- HEADER -->
    <div class="header">
      <div class="org-name">${siteConfig.name || 'OIMS Portal'}</div>
      <div class="sub-title">${siteConfig.motto || 'Office Internal Management System'}</div>
      <div class="form-title">Leave Application Form</div>
      <div class="ref-line">Application Date: ${formatDate(leaveRequest.createdAt)} &nbsp;|&nbsp; Ref: ${leaveRequest.id || '—'}</div>
    </div>

    <!-- SECTION A: APPLICANT DETAILS -->
    <div class="section">
      <div class="section-title">Section A — Applicant Information</div>
      <table class="info-table">
        <tr>
          <td class="label">Full Name</td>
          <td class="value">${applicant.firstName || ''} ${applicant.lastName || ''}</td>
          <td class="label">Employee No</td>
          <td class="value">${applicant.employeeNo || '—'}</td>
        </tr>
        <tr>
          <td class="label">EPF No</td>
          <td class="value">${applicant.epfNo || '—'}</td>
          <td class="label">Mobile No</td>
          <td class="value">${applicant.mobileNo || '—'}</td>
        </tr>
        <tr>
          <td class="label">Department</td>
          <td class="value">${(applicant.department || '—').replace(/_/g, ' ')}</td>
          <td class="label">Designation</td>
          <td class="value">${(applicant.jobTitle || '—').replace(/_/g, ' ')}</td>
        </tr>
      </table>
    </div>

    <!-- SECTION B: LEAVE DETAILS -->
    <div class="section">
      <div class="section-title">Section B — Leave Details</div>
      <table class="info-table">
        <tr>
          <td class="label">Leave Type</td>
          <td class="value">${leaveRequest.leaveType || '—'}</td>
          <td class="label">Category</td>
          <td class="value">${leaveRequest.category || '—'}</td>
        </tr>
        <tr>
          <td class="label">From Date</td>
          <td class="value">${formatDate(leaveRequest.dateRange?.from)}</td>
          <td class="label">To Date</td>
          <td class="value">${formatDate(leaveRequest.dateRange?.to)}</td>
        </tr>
        <tr>
          <td class="label">Total Days</td>
          <td class="value" colspan="3">${leaveRequest.totalDays || 0} Working Day(s) (Excluding Weekends)</td>
        </tr>
      </table>
    </div>

    <!-- SECTION C: REASON & ADDRESS -->
    <div class="section">
      <div class="section-title">Section C — Reason & Contact</div>
      <table class="info-table">
        <tr>
          <td class="label">Reason for Leave</td>
          <td class="value" colspan="3">
            <div class="text-box">${leaveRequest.reason || '—'}</div>
          </td>
        </tr>
        <tr>
          <td class="label">Address While on Leave</td>
          <td class="value" colspan="3">
            <div class="text-box">${leaveRequest.addressWhileOnLeave || '—'}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- SECTION E: APPROVAL WORKFLOW -->
    <div class="section">
      <div class="section-title">Section E — Approval Workflow</div>
      <div class="approval-grid">
        <div class="approval-card">
          <div class="role-label">Acting Officer</div>
          <div class="officer-name">${actingName}</div>
          <span class="status-badge status-${leaveRequest.actingOfficerStatus || 'pending'}">
            ${(leaveRequest.actingOfficerStatus || 'pending').toUpperCase()}
          </span>
          <div class="decision-date">${leaveRequest.actingOfficerDecisionDate ? formatDateTime(leaveRequest.actingOfficerDecisionDate) : 'Awaiting decision'}</div>
        </div>
        <div class="approval-card">
          <div class="role-label">Department Head / Approver</div>
          <div class="officer-name">${approveName}</div>
          <span class="status-badge status-${leaveRequest.deptHeadStatus || 'pending'}">
            ${(leaveRequest.deptHeadStatus || 'pending').toUpperCase()}
          </span>
          <div class="decision-date">${leaveRequest.deptHeadDecisionDate ? formatDateTime(leaveRequest.deptHeadDecisionDate) : 'Awaiting decision'}</div>
        </div>
      </div>

      ${leaveRequest.rejectionReason ? `
        <div class="rejection-box">
          <div class="rej-label">Reason for Rejection</div>
          <div class="rej-text">${leaveRequest.rejectionReason}</div>
        </div>
      ` : ''}
    </div>

    <!-- SECTION F: SIGNATURES -->
    <div class="section">
      <div class="section-title">Section F — Signatures</div>
      <div class="signature-grid">
        <div class="signature-block">
          <div class="sig-line"></div>
          <div class="sig-label">Applicant</div>
          <div class="sig-name">${applicant.firstName || ''} ${applicant.lastName || ''}</div>
        </div>
        <div class="signature-block">
          <div class="sig-line"></div>
          <div class="sig-label">Acting Officer</div>
          <div class="sig-name">${actingName}</div>
        </div>
        <div class="signature-block">
          <div class="sig-line"></div>
          <div class="sig-label">Head of Department</div>
          <div class="sig-name">${approveName}</div>
        </div>
      </div>
    </div>

    <!-- FOOTER (Page 1) -->
    <div class="footer">
      This is a system-generated leave application from ${siteConfig.name || 'OIMS Portal'}. Printed on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}.
    </div>
  </div>

  <!-- ==========================================
       PAGE 2+: SUPPORTING DOCUMENTS
       ========================================== -->
  ${hasAttachments ? `
  <div class="print-page attachments-page">
    <div class="section">
      <div class="section-title">Section D — Supporting Documents (${leaveRequest.attachments.length} file${leaveRequest.attachments.length > 1 ? 's' : ''})</div>
      <p style="font-size: 8pt; color: #94a3b8; margin-bottom: 16px; font-weight: 500;">
        Applicant: <strong style="color: #1e293b;">${applicant.firstName || ''} ${applicant.lastName || ''}</strong> &nbsp;|&nbsp;
        Ref: <strong style="color: #1e293b;">${leaveRequest.id || '—'}</strong> &nbsp;|&nbsp;
        Leave: <strong style="color: #1e293b;">${formatDate(leaveRequest.dateRange?.from)} — ${formatDate(leaveRequest.dateRange?.to)}</strong>
      </p>
      ${attachmentsHtml}
    </div>

    <div class="footer">
      Supporting Documents — ${siteConfig.name || 'OIMS Portal'} Leave Application
    </div>
  </div>
  ` : ''}

</body>
</html>
`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
};
