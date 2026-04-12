import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Box } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

const MainLayout = () => {
  return (
    <Box sx={{ display: 'flex' }} className="min-h-screen mesh-gradient-bg w-full">
      {/* Sidebar - Integrated Fixed */}
      <Sidebar />
      
      {/* Main Content Area */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          width: { sm: `calc(100% - 280px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Header - Sticky */}
        <Header />
        
        {/* Content Wrapper - Spacing for Header */}
        <Box className="p-4 md:p-8 mt-16 flex-1">
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
      </Box>
    </Box>
  );
};

export default MainLayout;
