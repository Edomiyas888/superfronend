
import React, { useEffect, useState } from "react";
import axios from "axios";
import SplashScreen from "./splashscreen";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase-config";

const API_VALIDATE_TOKEN = "https://smartsoftsupport.onrender.com/api/get-client-info";

const TokenValidator = ({ children }) => {
  // Token and game data states.
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  // Essential game data (not used in this example, but reserved for future use).
  const [roundNo, setRoundNo] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [roundsData, setRoundsData] = useState(null);
  const [userId, setUserId] = useState(null);

  // Helper to extract query parameters.
  const getQueryParam = (param) => {
    let searchParams;
    if (window.location.hash.includes("?")) {
      // For HashRouter: extract query params from the hash.
      searchParams = new URLSearchParams(window.location.hash.split("?")[1]);
    } else {
      // For BrowserRouter.
      searchParams = new URLSearchParams(window.location.search);
    }
    return searchParams.get(param);
  };

  // Validate token and fetch user info.
  useEffect(() => {
    const validateToken = async () => {
      const token = getQueryParam("token") || localStorage.getItem("token");
      const returnUrl = getQueryParam("return-url") || "https://finix.bet/#/returnurl";
      if (!token) {
        console.warn("No token found, redirecting...");
        window.location.href = returnUrl;
        return;
      }
      try {
        const response = await axios.get(`${API_VALIDATE_TOKEN}?token=${token}`);
        if (response.data && response.data.status === "success") {
          localStorage.setItem("token", token);
          // Assume the API returns the ClientExternalKey inside data.data.
          setUserId(response.data.data.ClientExternalKey);
          setIsTokenValid(true);
          // Token validated, so we can stop loading.
          setIsLoading(false);
        } else {
          console.error("Invalid token, redirecting...");
          window.location.href = returnUrl;
        }
      } catch (error) {
        console.error("API Error while validating token:", error);
        window.location.href = returnUrl;
      }
    };
    validateToken();
  }, []);

  // If still loading, show SplashScreen.
  if (isLoading) return <SplashScreen />;

  return children;
};

export default TokenValidator;
