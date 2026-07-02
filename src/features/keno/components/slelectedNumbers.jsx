import React from "react";
import { Box, Typography } from "@mui/material";

const SelectedNumbersRow = ({ selectedNumbers }) => {
  // We want to display up to 10 slots
  const maxSlots = 10;
  
  // Keno payouts structure
  const kenoPayouts = {
    1: { 1: 3.6 },
    2: { 1: 1, 2: 11 },
    3: { 1: 0, 2: 2.1, 3: 52 },
    4: { 1: 0, 2: 1.6, 3: 10.5, 4: 82 },
    5: { 1: 0, 2: 1, 3: 3.2, 4: 32, 5: 155 },
    6: { 1: 0, 2: 0, 3: 2.2, 4: 16, 5: 62, 6: 510 },
    7: { 1: 0, 2: 0, 3: 0, 4: 4, 5: 21, 6: 85, 7: 1020 },
    8: { 1: 0, 2: 0, 3: 0, 4: 5, 5: 16, 6: 52, 7: 210, 8: 2050 },
    9: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 10.5, 6: 26, 7: 130, 8: 1020, 9: 5200 },
    10: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 5, 6: 32, 7: 105, 8: 310, 9: 2050, 10: 10250 },
  };

  // Get the payout for the current number of selected numbers.
  // If the payout is 0, we return null, so nothing is rendered.
  const getPayoutForPosition = (position) => {
    const totalSelected = selectedNumbers.length;
    if (position > totalSelected) return null;
    
    const payout = kenoPayouts[totalSelected]?.[position];
    return payout === 0 || payout === undefined ? null : payout;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        backgroundColor: "transparent",
        padding: "8px",
      }}
    >
      {/* Numbers row */}
      <Box
        sx={{
          display: "flex",
          gap: 0.5,
        }}
      >
        {[...Array(maxSlots)].map((_, index) => {
          const num = selectedNumbers[index] ?? null;
          return (
            <Box
              key={index}
              sx={{
                width: "25px",
                height: "25px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: num ? "#283134" : "#1b1b1b",
                border: "1px solid #444",
                borderRadius: "4px",
              }}
            >
              {num && (
                <Typography
                  sx={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontFamily: "'Roboto Condensed', sans-serif",
                    fontSize: "14px",
                  }}
                >
                  {num}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
      
      {/* Odds row - only show odds that are non-zero */}
      {selectedNumbers.length > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            justifyContent: "flex-start",
          }}
        >
          {[...Array(selectedNumbers.length)].map((_, index) => {
            const payout = getPayoutForPosition(index + 1);
            return (
              <Box
                key={index}
                sx={{
                  width: "25px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {payout !== null && (
                  <Typography
                    sx={{
                      color: "#71cd95",
                      fontWeight: "bold",
                      fontSize: "10px",
                      textAlign: "center",
                    }}
                  >
                    {payout}x
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default SelectedNumbersRow;
