import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resetPassword } from '../api/employeeApi';
import { siteConfig } from '../config/siteConfig';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress,
  Alert,
  InputAdornment,
  Avatar,
  Stack
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import KeyIcon from '@mui/icons-material/Key';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { motion } from 'framer-motion';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, { password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="min-h-screen mesh-gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[460px]"
      >
        <Paper 
          elevation={0} 
          className="glass-card p-10 rounded-[2.5rem] relative overflow-hidden"
        >
          <Box className="flex flex-col items-center mb-10 relative z-10">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="mb-6 p-1 rounded-2xl bg-white dark:bg-slate-800 shadow-xl"
            >
              <Avatar 
                sx={{ bgcolor: siteConfig.colors.primary, width: 64, height: 64, borderRadius: '16px' }}
              >
                <LockResetIcon sx={{ fontSize: 35, color: 'white' }} />
              </Avatar>
            </motion.div>
            <Typography variant="h4" className="font-extrabold tracking-tight text-center" sx={{ color: 'var(--text-heading)' }}>
              Set New <span style={{ color: siteConfig.colors.primary }}>Password</span>
            </Typography>
            <Typography variant="body2" className="text-slate-500 mt-2 font-medium text-center">
              Create a secure password for your OIMS account.
            </Typography>
          </Box>

          {success ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <Box className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon sx={{ fontSize: 40, color: '#10b981' }} />
              </Box>
              <Typography variant="h6" className="font-bold mb-2">Password Restored</Typography>
              <Typography variant="body2" className="text-slate-500 mb-8">
                Your new password has been successfully established. Redirecting to sign in page...
              </Typography>
              <CircularProgress size={30} sx={{ color: '#10b981' }} />
            </motion.div>
          ) : (
            <>
              {error && (
                <Alert severity="error" className="mb-6 rounded-2xl border-none shadow-sm" sx={{ bgcolor: '#fef2f2', color: '#991b1b', fontWeight: 600 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
                <Stack spacing={3}>
                  <TextField
                    label="New Password"
                    type="password"
                    variant="outlined"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <KeyIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' }
                      }
                    }}
                  />

                  <TextField
                    label="Confirm New Password"
                    type="password"
                    variant="outlined"
                    fullWidth
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' }
                      }
                    }}
                  />
                </Stack>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  fullWidth
                  className="btn-premium mt-4"
                  sx={{ py: 1.8, borderRadius: '15px', textTransform: 'none', fontWeight: 700, fontSize: '1rem' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Establish New Password'}
                </Button>
              </form>
            </>
          )}

          <Box className="mt-10 text-center relative z-10">
            <Typography variant="caption" className="text-slate-400 font-medium px-6 block">
              Ensure your new password contains letters, numbers, and symbols for maximum security.
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default ResetPasswordPage;
