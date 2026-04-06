import errorimg from "../assets/404.webp";
import { CONTACT_ADMIN_EMAIL } from "../utils/Values";
import Button from "@mui/material/Button";
import HomeIcon from "@mui/icons-material/Home";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useNavigate } from "react-router-dom";
// import { useRouteError } from "react-router-dom";

const Error404Page = () => {
  const navigate = useNavigate();
  //  const errormsg = useRouteError();

  return (
    <div className="max-w-7xl mx-auto pt-10 text-center flex flex-col items-center pb-10 justify-center">
      <WarningAmberIcon className="text-amber-500 !text-5xl" />
      <h1 className="text-2xl font-semibold text-amber-500">Page Not Found.</h1>
      <p className="text-gray-600 mt-2">Sorry ! We couldn't find that page.</p>

      <img src={errorimg} alt="Error 404" className="md:w-1/2" />
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
      {/* <p>{errormsg.statusText}</p> */}
    </div>
  );
};

export default Error404Page;
