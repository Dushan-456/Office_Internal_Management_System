import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword } from '../api/employeeApi';
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
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { motion } from 'framer-motion';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your institutional email address.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch security link. Please verify your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="min-h-screen mesh-gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[460px]"
      >
        <Paper 
          elevation={0} 
          className="glass-card p-10 rounded-[2.5rem] relative overflow-hidden"
        >
          {/* Back Button */}
          <IconButton 
            onClick={() => navigate('/login')}
            className="absolute top-6 left-6 z-20"
            sx={{ bgcolor: 'rgba(255,255,255,0.5)', '&:hover': { bgcolor: 'white' } }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>

          <Box className="flex flex-col items-center mb-10 relative z-10">
            <motion.div
              whileHover={{ rotate: -10, scale: 1.1 }}
              className="mb-6 p-1 rounded-2xl bg-white dark:bg-slate-800 shadow-xl"
            >
              <Avatar 
                src={siteConfig.logo} 
                className="w-16 h-16 rounded-2xl" 
                variant="rounded"
              />
            </motion.div>
            <Typography variant="h4" className="font-extrabold tracking-tight text-center" sx={{ color: 'var(--text-heading)' }}>
              Password <span style={{ color: siteConfig.colors.primary }}>Recovery</span>
            </Typography>
            <Typography variant="body2" className="text-slate-500 mt-2 font-medium text-center">
              Restore access to your OIMS institutional account.
            </Typography>
          </Box>

          {success ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6"
            >
              <Box className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircleOutlineIcon sx={{ fontSize: 40, color: '#10b981' }} />
              </Box>
              <Typography variant="h6" className="font-bold mb-2">Check Your Email</Typography>
              <Typography variant="body2" className="text-slate-500 mb-8">
                A secure reset link has been dispatched to <strong>{email}</strong>. Please check your inbox and follow the instructions.
              </Typography>
              <Button 
                variant="outlined" 
                fullWidth 
                onClick={() => navigate('/login')}
                sx={{ borderRadius: '15px', py: 1.5, fontWeight: 700, textTransform: 'none' }}
              >
                Back to Sign In
              </Button>
            </motion.div>
          ) : (
            <>
              {error && (
                <Alert severity="error" className="mb-6 rounded-2xl border-none shadow-sm" sx={{ bgcolor: '#fef2f2', color: '#991b1b', fontWeight: 600 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
                <Typography variant="body2" className="text-slate-600 font-medium px-2">
                  Enter the email address associated with your account and we'll send you a link to reset your password.
                </Typography>
                
                <TextField
                  label="Institutional Email"
                  variant="outlined"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <MailOutlineIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' }
                    }
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  fullWidth
                  className="btn-premium mt-2"
                  sx={{ py: 1.8, borderRadius: '15px', textTransform: 'none', fontWeight: 700 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Secuity Link'}
                </Button>

                <Box className="text-center mt-2">
                  <Link to="/login" style={{ textDecoration: 'none' }}>
                    <Typography variant="body2" className="text-slate-500 font-bold hover:text-indigo-600 transition-colors">
                      Remembered your password? Sign In
                    </Typography>
                  </Link>
                </Box>
              </form>
            </>
          )}

          <Box className="mt-10 text-center relative z-10">
            <Typography variant="caption" className="text-slate-400 font-medium">
              OIMS Security Protocol • Multi-Factor Verification ready
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default ForgotPasswordPage;
