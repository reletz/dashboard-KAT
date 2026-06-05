import React from "react";
import ReactDOM from "react-dom/client";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./auth/msalConfig";
import { DemoAuthProvider } from "./auth/useAuth";
import App from "./App";
import "./index.css";

// MsalProvider selalu dipasang agar useMsal() tidak throw, bahkan di demo mode.
const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <DemoAuthProvider>
          <App />
        </DemoAuthProvider>
      </MsalProvider>
    </React.StrictMode>,
  );
});
