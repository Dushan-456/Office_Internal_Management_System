import AppRouter from "./routes/AppRouter";
import useAuthStore from "./store/useAuthStore";
import { useEffect } from "react";

const App = () => {
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <AppRouter />
  );
}

export default App
