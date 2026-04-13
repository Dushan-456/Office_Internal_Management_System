import React from 'react';
import { Box, Typography } from '@mui/material';
const ComingSoon = ({ title }) => (
  <Box className="flex items-center justify-center h-96">
    <Typography variant="h4" color="textSecondary">{title} - Coming Soon</Typography>
  </Box>
);
export default ComingSoon;
