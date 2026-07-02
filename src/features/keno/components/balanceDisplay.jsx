import React, { useEffect, useState } from "react";
import { Stack, Box, Typography } from "@mui/material";
import axios from "axios";
import { getQueryParam } from "../utils/url";


const BalanceDisplay = () => {
  const [balance, setBalance] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchClientInfo = async () => {
      try {
        const response = await axios.get(`https://smartsoftsupport.onrender.com/api/get-client-info?token=${token}`);
        if (response.data.status === 'success') {
          const data = response.data.data;
          setBalance(data.newBalance || data.balance);
          setUsername(data.username);
        } else {
          console.error('Failed to retrieve client info.');
          const returnUrl = getQueryParam("return-url") || "https://finix.bet/#/returnurl";
          window.location.href = returnUrl;
        }
      } catch (error) {
        console.error('Error fetching client info:', error);
        const returnUrl = getQueryParam("return-url") || "https://finix.bet/#/returnurl";
        window.location.href = returnUrl;
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchClientInfo();

    // Poll for balance updates every 5 seconds
    const interval = setInterval(() => {
      fetchClientInfo();
    }, 5000);

    // Clear interval on component unmount
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!balance) {
    return <Typography>0 ETB</Typography>;
  }

  return (
    <Stack direction="row" sx={{ padding: 2, background: 'transparent', color: 'white' }}>
      <Typography sx={{ color: "#FBC02D", fontWeight: "bold", fontSize: "9px" }}>
        {username}
      </Typography>
      <Box width={5} />
      <Typography sx={{ color: "#FBC02D", fontWeight: "bold", fontSize: "9px" }}>
        {balance.toFixed(2)} ETB
      </Typography>
    </Stack>
  );
};
export default BalanceDisplay;