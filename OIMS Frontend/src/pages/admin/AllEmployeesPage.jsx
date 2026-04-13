import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEmployees, deleteEmployee, getEnums } from '../../api/employeeApi';
import { siteConfig } from '../../config/siteConfig';
import {
  Box, Typography, Paper, TextField, MenuItem, Button,
  CircularProgress, Avatar, IconButton, Chip, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Alert, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import useAuthStore from '../../store/useAuthStore';
import { motion } from 'framer-motion';

const AllEmployeesPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'ADMIN';
  const isDeptHead = currentUser?.role === 'DEPT_HEAD';

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState(isDeptHead ? currentUser.department : '');
  const [enums, setEnums] = useState(null);
  const [delDialog, setDelDialog] = useState({ open: false, id: null, name: '' });

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const SERVER_BASE = API_BASE.replace('/api/v1', '');

  useEffect(() => {
    const fetchEnums = async () => {
      try {
        const res = await getEnums();
        setEnums(res.data.data);
      } catch (err) { console.error(err); }
    };
    fetchEnums();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await getAllEmployees({
        page: page + 1,
        limit: rowsPerPage,
        search,
        department
      });
      setEmployees(res.data.data.employees);
      setTotal(res.data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, rowsPerPage, search, department]);

  const confirmDelete = async () => {
    try {
      await deleteEmployee(delDialog.id);
      setDelDialog({ open: false, id: null, name: '' });
      fetchEmployees();
    } catch (err) { console.error(err); }
  };

  return (
    <Box sx={{ px: { xs: 1, md: 0 } }}>
      <Box className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <Typography variant="h4" className="font-black tracking-tight" sx={{ color: 'var(--text-heading)' }}>
          {isDeptHead ? `${currentUser.department?.replace(/_/g, ' ')} ` : 'All '}
          <span style={{ color: siteConfig.colors.primary }}>Employees</span>
        </Typography>
        {isAdmin && (
          <Button 
            onClick={() => navigate('/employees/add')}
            variant="contained" 
            startIcon={<PersonAddIcon />}
            className="btn-premium"
            sx={{ px: 4, py: 1.5, borderRadius: '15px', textTransform: 'none', fontWeight: 800 }}
          >
            Add New Employee
          </Button>
        )}
      </Box>

      {/* Filters Bar */}
      <Paper className="glass-card p-4 rounded-3xl mb-8 flex flex-col md:flex-row gap-4 items-center">
        <TextField 
          placeholder="Search by name, ID or email..."
          fullWidth
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />,
              sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' }
            }
          }}
        />
        {isAdmin && (
          <TextField 
            select
            label="Filter by Department"
            size="small"
            sx={{ minWidth: 200 }}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}
          >
            <MenuItem value="">All Units</MenuItem>
            {enums?.departments?.map(d => <MenuItem key={d} value={d}>{d.replace(/_/g, ' ')}</MenuItem>)}
          </TextField>
        )}
      </Paper>

      {/* Modern Table */}
      <Paper className="glass-card rounded-[2.5rem] overflow-hidden w-full">
        <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
          <Table sx={{ minWidth: { xs: 300, sm: 500, md: 700 } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(99, 102, 241, 0.05)' }}>
                <TableCell sx={{ fontWeight: 800,  py: 3 }}>Identity</TableCell>
                <TableCell sx={{ fontWeight: 800,  display: { xs: 'none', md: 'table-cell' } }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 800,  display: { xs: 'none', md: 'table-cell' } }}>Role</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, pr: 4 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
              ) : employees.map((emp) => (
                <TableRow 
                  key={emp.id} 
                  hover 
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.04) !important' },
                    transition: 'background-color 0.2s'
                  }}
                >
                   <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                    <Box className="flex items-center gap-2 md:gap-4">
                      <Avatar 
                        src={emp.profilePicture ? `${SERVER_BASE}${emp.profilePicture}` : undefined} 
                        sx={{ 
                          width: { xs: 28, sm: 44 }, 
                          height: { xs: 28, sm: 44 }, 
                          bgcolor: siteConfig.colors.primary, 
                          color: 'white',
                          fontWeight: 800,
                          fontSize: { xs: '0.7rem', sm: '1rem' },
                          shadow: 1 
                        }}
                      >
                        {emp.firstName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" className="font-bold text-[0.75rem] md:text-sm" sx={{ color: 'var(--text-heading)' }}>{emp.firstName} {emp.lastName}</Typography>
                        <Typography variant="caption" className="text-slate-400 font-mono text-[0.55rem] md:text-[0.65rem]">{emp.employeeNo}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant="body2" className="font-bold truncate max-w-[150px]" sx={{ color: 'var(--text-muted)' }}>{emp.department?.replace(/_/g, ' ')}</Typography>
                    <Typography variant="caption" className="text-slate-400 block">{emp.jobTitle?.replace(/_/g, ' ')}</Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Chip 
                      label={emp.role} 
                      size="small"
                      sx={{ 
                        fontWeight: 800, 
                        fontSize: '0.6rem', 
                        bgcolor: emp.role === 'ADMIN' ? '#fef2f2' : emp.role === 'DEPT_HEAD' ? '#fef2f2' : '#f0fdf4',
                        color: emp.role === 'ADMIN' ? '#ef4444' : emp.role === 'DEPT_HEAD' ? '#df9d0fff' : '#16a34a',
                        border: `1px solid ${emp.role === 'ADMIN' ? '#fecaca' : emp.role === 'DEPT_HEAD' ? '#fecaca' : '#bbf7d0'}`
                      }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}>
                    <Box className="flex justify-end gap-1">
                      <IconButton 
                        onClick={(e) => { e.stopPropagation(); navigate(`/employees/${emp.id}`); }} 
                        sx={{ color: siteConfig.colors.primary }}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                      {isAdmin && (
                        <>
                          <IconButton 
                            onClick={(e) => { e.stopPropagation(); navigate(`/employees/edit/${emp.id}`); }} 
                            sx={{ color: siteConfig.colors.primary  }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            onClick={(e) => { e.stopPropagation(); setDelDialog({ open: true, id: emp.id, name: emp.firstName }); }} 
                            sx={{ color: '#ef4444' }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>

      {/* Delete Confirmation */}
      <Dialog 
        open={delDialog.open} 
        onClose={() => setDelDialog({ open: false })} 
        slotProps={{ 
          backdrop: { 
            sx: { 
              backdropFilter: 'blur(4px)', 
              backgroundColor: 'rgba(15, 23, 42, 0.5)' 
            } 
          } 
        }}
        PaperProps={{ 
          sx: { 
            borderRadius: '25px', 
            p: 1,
            bgcolor: 'var(--bg-main)', // Solid background
            backgroundImage: 'none' // Remove any MUI overlays
          } 
        }}
      >
        <DialogTitle className="font-black" sx={{ color: 'var(--text-heading)' }}>Confirm Deletion</DialogTitle>
        <DialogContent>Permanently remove <strong>{delDialog.name}</strong> from the institutional directory?</DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDelDialog({ open: false })} sx={{ textTransform: 'none', fontWeight: 800, color: '#64748b' }}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" sx={{ bgcolor: '#ef4444', transition: 'all 0.2s', '&:hover': { bgcolor: '#dc2626' }, borderRadius: '12px', textTransform: 'none', fontWeight: 800 }}>Execute Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllEmployeesPage;
