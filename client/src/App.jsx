import "./App.css";
import axios from "axios";
import { useContext } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { UserContext } from "./context/userContext";

axios.defaults.withCredentials = true;

function App() {
  const { user } = useContext(UserContext);

  const handleUnauthorizedResponse = () => {
    logoutUser();
    navigate("/");
  };

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response && error.response.status === 401) {
          handleUnauthorizedResponse();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <div className="body custom-font">
      {user ? (
        <Routes>
          <Route path="/" element={<h1>Welcome, {user.name}!</h1>} />
          <Route path="/dashboard" element={<h1>Dashboard</h1>} />
          <Route path="/profile" element={<h1>Profile</h1>} />
          <Route path="/settings" element={<h1>Settings</h1>} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<h1>Please log in</h1>} />
          <Route path="/login" element={<h1>Login Page</h1>} />
          <Route path="/register" element={<h1>Register Page</h1>} />
        </Routes>
      )}
    </div>
  );
}

export default App;
