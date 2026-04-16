import React, { useState } from "react";
import { 
  Box, Typography, Paper, TextField, Button, 
  CircularProgress, Alert, InputAdornment, IconButton,
  Container, Stack
} from "@mui/material";
import { 
  Visibility, VisibilityOff, 
  LockOutlined as LockIcon,
  CheckCircleOutline as SuccessIcon 
} from "@mui/icons-material";
import { updatePassword } from "../api/employeeApi";
import { siteConfig } from "../config/siteConfig";
import useAuthStore from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const MandatoryPasswordChangePage = () => {
  const navigate = useNavigate();
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
  
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleVisibility = (field) => {
    setShowPass({ ...showPass, [field]: !showPass[field] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (formData.newPassword !== formData.confirmPassword) {
      return setError("New passwords do not match.");
    }

    if (formData.newPassword.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    setLoading(true);
    try {
      await updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      setSuccess(true);
      // Update store state
      await fetchCurrentUser();
      
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      className="min-h-screen flex items-center justify-center p-4"
      sx={{ 
        background: `radial-gradient(circle at 20% 20%, ${siteConfig.colors.primary}15, transparent), 
                     radial-gradient(circle at 80% 80%, ${siteConfig.colors.secondary}15, transparent)`,
        bgcolor: "var(--bg-main)"
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Paper 
            className="glass-card p-10 rounded-[3rem] shadow-2xl relative overflow-hidden"
            sx={{ border: "1px solid rgba(255, 255, 255, 0.4)" }}
          >
            {/* Header */}
            <Box className="text-center mb-10">
              <Box 
                className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg"
                sx={{ 
                  bgcolor: siteConfig.colors.primary, 
                  color: "white",
                  transform: "rotate(-5deg)"
                }}
              >
                <LockIcon sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h4" className="font-black mb-2" sx={{ color: "var(--text-heading)" }}>
                Security <span style={{ color: siteConfig.colors.primary }}>Enforcement</span>
              </Typography>
              <Typography variant="body2" className="text-slate-400 font-bold uppercase tracking-widest px-6">
                Your account is currently locked. Please update your credentials to restore institutional access.
              </Typography>
            </Box>

            {success ? (
              <Box className="text-center py-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <SuccessIcon sx={{ fontSize: 100, color: "#10b981", mb: 4 }} />
                </motion.div>
                <Typography variant="h6" className="font-bold mb-2">Password Synchronized!</Typography>
                <Typography variant="body2" className="text-slate-400">Restoring system access, please wait...</Typography>
              </Box>
            ) : (
              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  {error && <Alert severity="error" className="rounded-2xl">{error}</Alert>}
                  
                  <TextField
                    name="currentPassword"
                    label="Current Password"
                    type={showPass.current ? "text" : "password"}
                    fullWidth
                    required
                    value={formData.currentPassword}
                    onChange={handleChange}
                    slotProps={{
                      input: {
                        sx: { borderRadius: "18px", bgcolor: "var(--input-bg)" },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => toggleVisibility('current')} edge="end">
                              {showPass.current ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />

                  <TextField
                    name="newPassword"
                    label="New Secure Password"
                    type={showPass.new ? "text" : "password"}
                    fullWidth
                    required
                    value={formData.newPassword}
                    onChange={handleChange}
                    slotProps={{
                      input: {
                        sx: { borderRadius: "18px", bgcolor: "var(--input-bg)" },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => toggleVisibility('new')} edge="end">
                              {showPass.new ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />

                  <TextField
                    name="confirmPassword"
                    label="Confirm New Password"
                    type={showPass.confirm ? "text" : "password"}
                    fullWidth
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    slotProps={{
                      input: {
                        sx: { borderRadius: "18px", bgcolor: "var(--input-bg)" },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => toggleVisibility('confirm')} edge="end">
                              {showPass.confirm ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    sx={{ 
                      py: 2, 
                      borderRadius: "18px", 
                      fontWeight: 800, 
                      fontSize: "1rem",
                      bgcolor: siteConfig.colors.primary,
                      boxShadow: "0 15px 30px -10px rgba(99, 102, 241, 0.4)",
                      "&:hover": { bgcolor: siteConfig.colors.secondary }
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Update Credentials & Enter"}
                  </Button>
                </Stack>
              </form>
            )}
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default MandatoryPasswordChangePage;
