import React from "react";
import { AppProviders } from "./providers/AppProviders";
import { AppRouter } from "./router/AppRouter";
import { AuctbizSplashScreen } from "./components/common/AuctbizSplashScreen";

export default function App() {
  return (
    <>
      <AuctbizSplashScreen />
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </>
  );
}
