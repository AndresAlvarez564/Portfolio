import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import { amplifyConfig } from "./config/amplify";
import "./index.css";
import App from "./App";

// Configure Amplify once at app startup before any auth calls are made
Amplify.configure(amplifyConfig);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
