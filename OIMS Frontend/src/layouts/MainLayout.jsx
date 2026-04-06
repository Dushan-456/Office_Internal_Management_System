import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Box, Toolbar } from "@mui/material";

const MainLayout = () => {
  return (
    <Box sx={{ display: 'flex' }} className="min-h-screen bg-slate-50 w-full">
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
