import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className=" w-full  ">
      {/* <Header /> */}

      <Outlet />
      {/* <Footer />
      <MobileBottomMenu/> */}
    </div>
  );
};

export default MainLayout;
