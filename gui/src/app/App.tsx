import { appRouter } from "./router";
import "./App.css";
import { RouterProvider } from "react-router-dom";

function App() {
  return <RouterProvider router={appRouter} />;
}

export default App;
