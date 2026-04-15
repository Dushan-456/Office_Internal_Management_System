import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, FormControl, Select, MenuItem,
  CircularProgress, Divider, Alert, AlertTitle, Chip, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Papa from 'papaparse';
import { attendanceApi } from '../../api/attendanceApi';
import { siteConfig } from '../../config/siteConfig';

const AdminAttendancePage = () => {
  // File state
  const [file, setFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  // Column mapping state
  const [fingerPrintIdCol, setFingerPrintIdCol] = useState('');
  const [dateCol, setDateCol] = useState('');
  const [timeCol, setTimeCol] = useState('');
  const [timeFormat, setTimeFormat] = useState('24h');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null); // { success, summary/message, duplicates }
  const [dragOver, setDragOver] = useState(false);

  // Auto-detect common column name variations
  const autoDetectColumn = (headers, patterns) => {
    for (const header of headers) {
      const lower = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const pattern of patterns) {
        if (lower.includes(pattern)) return header;
      }
    }
    return '';
  };

  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile || !selectedFile.name.endsWith('.csv')) {
      setResult({ success: false, message: 'Please select a valid CSV file.' });
      return;
    }

    setFile(selectedFile);
    setResult(null);

    // Parse CSV headers and preview with PapaParse
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setPreviewRows(results.data.slice(0, 10));
        setTotalRows(results.data.length);

        // Auto-detect columns
        setFingerPrintIdCol(autoDetectColumn(headers, ['fingerid', 'fingerprintid', 'finger', 'fpid', 'employeeid', 'empid']));
        setDateCol(autoDetectColumn(headers, ['date', 'day', 'att_date', 'attdate']));
        setTimeCol(autoDetectColumn(headers, ['time', 'punchtime', 'clocktime', 'att_time']));
      },
      error: (err) => {
        setResult({ success: false, message: `Failed to parse CSV: ${err.message}` });
      }
    });
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!file || !fingerPrintIdCol || !dateCol || !timeCol) {
      setResult({ success: false, message: 'Please select a file and map all required columns.' });
      return;
    }

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('config', JSON.stringify({
      fingerPrintIdCol,
      dateCol,
      timeCol,
      timeFormat,
    }));

    try {
      const res = await attendanceApi.uploadCSV(formData);
      setResult(res.data);
    } catch (err) {
      const errData = err.response?.data;
      setResult(errData || { success: false, message: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCsvHeaders([]);
    setPreviewRows([]);
    setTotalRows(0);
    setFingerPrintIdCol('');
    setDateCol('');
    setTimeCol('');
    setTimeFormat('24h');
    setResult(null);
  };

  const isMappingComplete = fingerPrintIdCol && dateCol && timeCol;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-12">
      {/* Header */}
      <div className="mb-8">
        <Typography variant="h4" className="font-black tracking-tight mb-2" sx={{ color: 'var(--text-heading)' }}>
          Add <span style={{ color: siteConfig.colors.primary }}>Attendance</span>
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--text-muted)' }}>
          Upload CSV files from biometric machines to import attendance records.
        </Typography>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
        {/* ═══════════════════ LEFT PANEL: Upload & Preview (60%) ═══════════════════ */}
        <div className="w-full lg:w-[60%] flex-shrink-0 min-w-0 space-y-6">

          {/* Drop Zone */}
          <div>
                      {/* Result Section */}
          {result && (
            <div className="space-y-4">
              {result.success ? (
                <Alert
                  className="!bg-green-800 !text-white"
                  icon={<CheckCircleOutlineIcon fontSize="inherit" />}
                  sx={{ borderRadius: '1.5rem', p: 3, fontWeight: 700, '& .MuiAlert-message': { width: '100%' } }}
                >
                  <AlertTitle className="font-black">Upload Successful!</AlertTitle>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center p-3 rounded-xl bg-white/80">
                      <Typography variant="h5" className="font-black text-green-600">{result.summary?.recordsInserted || 0}</Typography>
                      <Typography variant="caption" className="font-bold text-slate-500">Records Inserted</Typography>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-white/80">
                      <Typography variant="h5" className="font-black text-blue-600">{result.summary?.punchedDays || 0}</Typography>
                      <Typography variant="caption" className="font-bold text-slate-500">Punched Days</Typography>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-white/80">
                      <Typography variant="h5" className="font-black text-orange-600">{result.summary?.absentDaysCreated || 0}</Typography>
                      <Typography variant="caption" className="font-bold text-slate-500">Absent Days Created</Typography>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-white/80">
                      <Typography variant="h5" className="font-black text-slate-600">{result.summary?.totalProcessed || 0}</Typography>
                      <Typography variant="caption" className="font-bold text-slate-500">CSV Rows Processed</Typography>
                    </div>
                  </div>

                  {result.summary?.unmatchedFingerprints?.length > 0 && (
                    <Alert severity="warning" sx={{ borderRadius: '1rem', mt: 3 }}>
                      <AlertTitle className="font-black">Unmatched Fingerprint IDs</AlertTitle>
                      <Typography variant="body2">
                        The following fingerprint IDs have no linked user account. Records were saved but won't appear in any employee's "My Attendance" page:
                      </Typography>
                      <Box className="flex flex-wrap gap-2 mt-2">
                        {result.summary.unmatchedFingerprints.map(fp => (
                          <Chip key={fp} label={fp} size="small" color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
                        ))}
                      </Box>
                    </Alert>
                  )}
                </Alert>
              ) : (
                <Alert
                  severity="error"
                  icon={<ErrorOutlineIcon fontSize="inherit" />}
                  sx={{ borderRadius: '1.5rem', p: 3, fontWeight: 700, '& .MuiAlert-message': { width: '100%' } }}
                >
                  <AlertTitle className="font-black">Upload Failed</AlertTitle>
                  <Typography variant="body2" className="font-medium">{result.message}</Typography>

                  {result.duplicates && result.duplicates.length > 0 && (
                    <Box className="mt-4">
                      <Typography variant="body2" className="font-bold mb-2">Conflicting records:</Typography>
                      <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
                        <table className="min-w-full text-xs">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 text-left font-black">FingerPrint ID</th>
                              <th className="px-3 py-2 text-left font-black">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.duplicates.map((d, i) => (
                              <tr key={i} className="border-t">
                                <td className="px-3 py-1.5 font-mono font-bold">{d.fingerPrintId}</td>
                                <td className="px-3 py-1.5">{d.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Box>
                  )}
                </Alert>
              )}
            </div>
          )}
          </div>
          <Paper
            className="glass-card rounded-[2rem] border-2 border-dashed transition-all duration-300 cursor-pointer"
            sx={{
              borderColor: dragOver ? siteConfig.colors.primary : 'rgba(255,255,255,0.15)',
              bgcolor: dragOver ? `${siteConfig.colors.primary}08` : 'transparent',
              '&:hover': { borderColor: `${siteConfig.colors.primary}60` }
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('csv-file-input').click()}
          >
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
            <Box className="flex flex-col items-center justify-center py-16 px-6 text-center">
              {file ? (
                <>
                  <UploadFileIcon sx={{ fontSize: 48, color: siteConfig.colors.primary, mb: 2 }} />
                  <Typography variant="h6" className="font-black" sx={{ color: 'var(--text-heading)' }}>
                    {file.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-muted)', mt: 1 }}>
                    {(file.size / 1024).toFixed(1)} KB • {totalRows} rows detected
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    sx={{ mt: 2, textTransform: 'none', fontWeight: 700 }}
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                  >
                    Change File
                  </Button>
                </>
              ) : (
                <>
                  <CloudUploadIcon sx={{ fontSize: 56, color: 'var(--text-muted)', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" className="font-bold" sx={{ color: 'var(--text-heading)' }}>
                    Drop your CSV file here
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-muted)', mt: 1 }}>
                    or click to browse • Only .csv files accepted
                  </Typography>
                </>
              )}
            </Box>
          </Paper>

          {/* Preview Table */}
          {previewRows.length > 0 && (
            <Paper className="glass-card rounded-[2rem] overflow-hidden shadow-sm border border-white/10">
              <Box className="px-6 py-4 flex justify-between items-center" sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <Typography variant="subtitle2" className="font-black uppercase tracking-widest" sx={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  CSV Preview — First {previewRows.length} of {totalRows} rows
                </Typography>
                {isMappingComplete && (
                  <Box className="flex gap-2">
                    {[{ label: 'FP ID', col: fingerPrintIdCol }, { label: 'Date', col: dateCol }, { label: 'Time', col: timeCol }].map(m => (
                      <Chip key={m.label} label={`${m.label}: ${m.col}`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                    ))}
                  </Box>
                )}
              </Box>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left font-black text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>#</th>
                      {csvHeaders.map(h => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left font-black text-xs uppercase tracking-wider"
                          style={{
                            color: [fingerPrintIdCol, dateCol, timeCol].includes(h) ? siteConfig.colors.primary : 'var(--text-muted)',
                            backgroundColor: [fingerPrintIdCol, dateCol, timeCol].includes(h) ? `${siteConfig.colors.primary}10` : 'transparent'
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2 font-bold" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                        {csvHeaders.map(h => (
                          <td
                            key={h}
                            className="px-4 py-2 font-medium"
                            style={{
                              color: [fingerPrintIdCol, dateCol, timeCol].includes(h) ? 'var(--text-heading)' : 'var(--text-muted)',
                              fontWeight: [fingerPrintIdCol, dateCol, timeCol].includes(h) ? 700 : 400
                            }}
                          >
                            {row[h] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Paper>
          )}


        </div>

        {/* ═══════════════════ RIGHT PANEL: Settings (40%) ═══════════════════ */}
        <Box sx={{ display: { xs: 'none', lg: 'block' }, width: '40%', flexShrink: 0, position: 'sticky', top: '6rem', alignSelf: 'flex-start' }}>
          <Paper className="glass-card p-8 rounded-[2.5rem] border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />

            <Typography variant="h6" className="font-black mb-6 relative z-10" sx={{ color: 'var(--text-heading)' }}>
              Column Mapping
            </Typography>
            <Typography variant="body2" className="mb-6 relative z-10" sx={{ color: 'var(--text-muted)' }}>
              Map CSV columns to the required fields. Auto-detected where possible.
            </Typography>

            <div className="space-y-5 relative z-10">
              {/* FingerPrint ID Column */}
              <div>
                <Typography variant="caption" className="font-bold text-slate-400 uppercase block mb-1">
                  FingerPrint ID Column *
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={fingerPrintIdCol}
                    onChange={(e) => setFingerPrintIdCol(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="" disabled><em>Select column...</em></MenuItem>
                    {csvHeaders.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                  </Select>
                </FormControl>
              </div>

              {/* Date Column */}
              <div>
                <Typography variant="caption" className="font-bold text-slate-400 uppercase block mb-1">
                  Date Column *
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={dateCol}
                    onChange={(e) => setDateCol(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="" disabled><em>Select column...</em></MenuItem>
                    {csvHeaders.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                  </Select>
                </FormControl>
              </div>

              {/* Time Column */}
              <div>
                <Typography variant="caption" className="font-bold text-slate-400 uppercase block mb-1">
                  Time Column *
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={timeCol}
                    onChange={(e) => setTimeCol(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="" disabled><em>Select column...</em></MenuItem>
                    {csvHeaders.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                  </Select>
                </FormControl>
              </div>

              <Divider className="opacity-20" />

              {/* Time Format */}
              <div>
                <Typography variant="caption" className="font-bold text-slate-400 uppercase block mb-2">
                  Time Format
                </Typography>
                <ToggleButtonGroup
                  value={timeFormat}
                  exclusive
                  onChange={(e, val) => val && setTimeFormat(val)}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      '&.Mui-selected': {
                        bgcolor: `${siteConfig.colors.primary}20`,
                        color: siteConfig.colors.primary,
                        borderColor: `${siteConfig.colors.primary}40`,
                      }
                    }
                  }}
                >
                  <ToggleButton value="24h">24 Hour</ToggleButton>
                  <ToggleButton value="12h">12 Hour (AM/PM)</ToggleButton>
                </ToggleButtonGroup>
              </div>

              <Divider className="opacity-20" />

              {/* Upload Button */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                onClick={handleUpload}
                disabled={!file || !isMappingComplete || uploading}
                sx={{
                  borderRadius: '16px',
                  py: 1.8,
                  fontWeight: 800,
                  textTransform: 'none',
                  fontSize: '1rem',
                  bgcolor: siteConfig.colors.primary,
                  boxShadow: `0 8px 24px ${siteConfig.colors.primary}40`,
                  '&:hover': {
                    bgcolor: siteConfig.colors.accent,
                    boxShadow: `0 12px 32px ${siteConfig.colors.accent}50`,
                  },
                  '&:disabled': {
                    bgcolor: 'rgba(0,0,0,0.08)',
                  }
                }}
              >
                {uploading ? 'Processing...' : 'Upload & Process'}
              </Button>

              {/* Reset Button */}
              {file && (
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<RestartAltIcon />}
                  onClick={handleReset}
                  sx={{ borderRadius: '16px', textTransform: 'none', fontWeight: 700, borderColor: 'rgba(0,0,0,0.1)' }}
                >
                  Reset All
                </Button>
              )}

              {/* Mapping Status */}
              {file && !isMappingComplete && (
                <Alert severity="info" sx={{ borderRadius: '1rem', mt: 2 }}>
                  <Typography variant="body2" className="font-bold">
                    Please map all required columns (*) before uploading.
                  </Typography>
                </Alert>
              )}
            </div>
          </Paper>
        </Box>
      </div>
    </div>
  );
};

export default AdminAttendancePage;
