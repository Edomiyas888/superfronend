import React from "react";
import { motion } from "framer-motion";
import newLogo from "../assets/fastloader.png"; // Update with your actual logo path
import CircularProgress from "@mui/material/CircularProgress";

const SplashScreen = () => {
  return (
    <div style={styles.container}>
      {/* Fade-in animation for logo */}
      <motion.img
        src={newLogo} 
        alt="Company Logo"
        style={styles.logo}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
      />
      
      {/* Loading Spinner */}
      <CircularProgress style={styles.spinner} color="primary" />
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#121212", // Dark background
  },
  logo: {
    width: "180px", // Adjust logo size as needed
    height: "auto",
    marginBottom: "20px",
  },
  spinner: {
    color: "#fff",
  },
};

export default SplashScreen;
