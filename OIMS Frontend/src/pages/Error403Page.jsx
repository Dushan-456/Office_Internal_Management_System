import { useNavigate } from "react-router-dom";
import errorimage from "../assets/error403.jpg";
import HomeIcon from "@mui/icons-material/Home";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Button } from "@mui/material";
import { CONTACT_ADMIN_EMAIL } from "../utils/Values";

const Error403Page = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-7xl mx-auto pt-10 text-center flex flex-col items-center h-screen pb-10 justify-center">
      <WarningAmberIcon className="text-red-600 !text-5xl" />
      <h1 className="text-2xl font-semibold text-red-600">Access Denied</h1>
      <p className="text-gray-600 mt-2">
        You do not have permission to view this page.
      </p>
      <img src={errorimage} alt="Error 403" />
      <Button
        variant="outlined"
        onClick={() => navigate("/")}
        startIcon={<HomeIcon />}
      >
        Go to Home
      </Button>
      <br />
      <p>
        Please contact{" "}
        <a href={CONTACT_ADMIN_EMAIL} className="text-blue-500 font-bold">
          System Administrator
        </a>{" "}
        if you believe this is an error in website.{" "}
      </p>
    </div>
  );
};

export default Error403Page;
