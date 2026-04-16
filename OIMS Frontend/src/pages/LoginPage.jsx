import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
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
  IconButton,
  Avatar
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import KeyIcon from '@mui/icons-material/Key';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const { login, isAuthenticated, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localErr, setLocalErr] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErr('');
    
    if (!email || !password) {
      setLocalErr('Please fill in all fields');
      return;
    }

    const success = await login(email, password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <Box className="min-h-screen mesh-gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px]"
      >
        <Paper 
          elevation={0} 
          className="glass-card p-10 rounded-[2.5rem] relative overflow-hidden"
        >
          {/* Decorative Circles */}
          <Box className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl" sx={{ bgcolor: `${siteConfig.colors.primary}20` }} />
          <Box className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl" sx={{ bgcolor: `${siteConfig.colors.secondary}20` }} />

          <Box className="flex flex-col items-center mb-10 relative z-10">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="mb-6 p-1 rounded-2xl bg-white dark:bg-slate-800 shadow-xl"
            >
              <Avatar 
                src={siteConfig.logo} 
                className="w-16 h-16 rounded-2xl" 
                variant="rounded"
              />
            </motion.div>
            <Typography variant="h4" className="font-extrabold tracking-tight text-center" sx={{ color: 'var(--text-heading)' }}>
              Welcome to <span style={{ color: siteConfig.colors.primary }}>OIMS</span>
            </Typography>
            <Typography variant="body2" className="text-slate-500 mt-2 font-medium">
              {siteConfig.motto}
            </Typography>
          </Box>

          {(error || localErr) && (
            <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <Alert 
                severity="error" 
                className="mb-6 rounded-2xl border-none shadow-sm"
                sx={{ bgcolor: '#fef2f2', color: '#991b1b', fontWeight: 600 }}
              >
                {error || localErr}
              </Alert>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
            <TextField
              label="Email Address"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
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

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        sx={{ color: '#94a3b8' }}
                      >
                        {showPassword ? <VisibilityOff size={20} /> : <Visibility size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' }
                }
              }}
            />

            <Box className="flex justify-end -mt-2">
              <Button 
                onClick={() => navigate('/forgot-password')}
                variant="text" 
                size="small"
                sx={{ 
                  textTransform: 'none', 
                  color: siteConfig.colors.primary, 
                  fontWeight: 700,
                  '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                }}
              >
                Forgot Password?
              </Button>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isLoading}
              className="btn-premium mt-4"
              sx={{ 
                py: 1.8, 
                borderRadius: '15px', 
                textTransform: 'none', 
                fontSize: '1rem', 
                fontWeight: 700 
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In Now'}
            </Button>
          </form>

          <Box className="mt-8 text-center relative z-10">
            <Typography variant="caption" className="text-slate-400 font-medium">
              Secured Internal Management Portal • Est. 2024
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default LoginPage;
