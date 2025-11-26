import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { socket } from "./services/socket";

import "./App.css";

function App() {
  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <>
      <ToastContainer />

      <Outlet />
    </>
  );
}

export default App;
