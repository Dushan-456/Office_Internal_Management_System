import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress,
  Alert
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Avatar from '@mui/material/Avatar';

const LoginPage = () => {
  const { login, isAuthenticated, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const [localErr, setLocalErr] = useState('');
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' }
  });

  // If already logged in, seamlessly redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data) => {
    setLocalErr('');
    const success = await login(data.email, data.password);
    if (success) {
      navigate('/');
    } else {
      setLocalErr('Invalid email or password. Please try again.');
    }
  };

  return (
    <Box className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Paper elevation={3} className="w-full max-w-md p-8 rounded-xl bg-white shadow-xl">
        <Box className="flex flex-col items-center mb-6">
          <Avatar className="bg-blue-600 mb-2">
            <LockOutlinedIcon />
          </Avatar>
          <Typography variant="h5" className="font-bold text-slate-800">
            Sign In to OIMS
          </Typography>
          <Typography variant="body2" className="text-slate-500 mt-1">
            Access your internal workspace
          </Typography>
        </Box>

        {(error || localErr) && (
          <Alert severity="error" className="mb-4">
            {error || localErr}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Controller
            name="email"
            control={control}
            rules={{ 
              required: 'Email is required',
              pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email Address"
                variant="outlined"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={isLoading}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            rules={{ required: 'Password is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isLoading}
              />
            )}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            className="mt-2 bg-blue-600 hover:bg-blue-700 py-3"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default LoginPage;
