import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileBottomNav from "./MobileBottomNav";
import { Box } from "@mui/material";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }} className="min-h-screen mesh-gradient-bg w-full">
      {/* Sidebar - Integrated Fixed/Drawer */}
      <Sidebar 
        mobileOpen={mobileOpen} 
        onClose={() => setMobileOpen(false)} 
      />
      
      {/* Main Content Area */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          width: { xs: '100%', sm: `calc(100% - 280)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Header - Sticky */}
        <Header onToggleMenu={handleDrawerToggle} />
        
        {/* Content Wrapper - Spacing for Header & Bottom Nav */}
        <Box className="p-4 md:p-8 mt-16 mb-20 md:mb-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Box>

        <MobileBottomNav />
      </Box>
    </Box>
  );
};

export default MainLayout;
