import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import "./App.css";

function App() {
  return (
    <>
      <ToastContainer />

      <Outlet />
    </>
  );
}

export default App;
