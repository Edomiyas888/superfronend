import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";
import { CameraAlt, Close } from "@mui/icons-material";
import { Html5QrcodeScanner } from "html5-qrcode";
import { checkKenoTicket } from "@/features/keno/api/kenoApi";
import { kenoPayouts } from "../utils/kenoPayouts";
import { parseTicketCode } from "../utils/ticketCode";

export default function TicketCheckerDialog({ open, onClose, roundsData, scannedCode = "" }) {
  const [ticketCode, setTicketCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [result, setResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const inputRef = useRef(null);
  const hasAutoChecked = useRef(false);
  const scannerRef = useRef(null);
  const scannerDivId = "barcode-scanner";

  const parsed = useMemo(() => parseTicketCode(ticketCode), [ticketCode]);

  // Define handleCheck before the useEffects that use it
  const handleCheck = useCallback(async () => {
    setError("");
    setResult(null);
    if (!parsed?.roundNo || !parsed?.betId) {
      setError("Invalid code. Example: KENO:123:-Nabc123...");
      return;
    }

    console.log("Checking ticket:", ticketCode);
    console.log("Parsed:", parsed);

    try {
      setLoading(true);
      const data = await checkKenoTicket(ticketCode.trim());

      if (data.status === "pending") {
        setResult({
          status: "pending",
          roundNo: data.roundNo,
          bet: data.bet,
        });
        return;
      }

      setResult({
        status: "done",
        roundNo: data.roundNo,
        bet: data.bet,
        matches: data.matches,
        picks: data.bet?.selectedNumbers?.length,
        multiplier: data.multiplier,
        payout: data.payout ?? data.winnings,
        redeemed: data.bet?.settlementStatus === "settled" && (data.payout ?? 0) > 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to check ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [parsed, ticketCode]);

  // Handle scanned code from barcode scanner
  useEffect(() => {
    if (open && scannedCode && scannedCode !== ticketCode) {
      console.log("Barcode scanned:", scannedCode);
      setTicketCode(scannedCode);
      hasAutoChecked.current = false;
    }
  }, [open, scannedCode, ticketCode]);

  // Auto-check when a scanned code is set
  useEffect(() => {
    if (open && ticketCode && scannedCode && !hasAutoChecked.current && !loading) {
      console.log("Auto-checking scanned ticket");
      hasAutoChecked.current = true;
      handleCheck();
    }
  }, [open, ticketCode, scannedCode, loading, handleCheck]);

  // Focus input when dialog opens
  useEffect(() => {
    if (!open) {
      hasAutoChecked.current = false;
      return;
    }
    // Focus the input so a USB/Bluetooth scanner can type immediately.
    const t = setTimeout(() => {
      inputRef.current?.focus?.();
      inputRef.current?.select?.();
    }, 50);
    return () => clearTimeout(t);
  }, [open]);

  // Camera scanner management
  const startScanner = useCallback(() => {
    if (scannerRef.current) return; // Already running

    setCameraActive(true);
    
    setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          scannerDivId,
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
            formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8], // All barcode formats
          },
          false
        );

        scanner.render(
          (decodedText) => {
            console.log("Barcode scanned via camera:", decodedText);
            setTicketCode(decodedText);
            hasAutoChecked.current = false;
            stopScanner();
            
            // Auto-check after a short delay
            setTimeout(() => {
              if (!hasAutoChecked.current) {
                hasAutoChecked.current = true;
                handleCheck();
              }
            }, 100);
          },
          (errorMessage) => {
            // Ignore scan errors (happens continuously while scanning)
          }
        );

        scannerRef.current = scanner;
      } catch (err) {
        console.error("Error starting scanner:", err);
        setError("Failed to start camera. Please check permissions.");
        setCameraActive(false);
      }
    }, 100);
  }, [handleCheck]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Cleanup scanner when dialog closes
  useEffect(() => {
    if (!open) {
      stopScanner();
    }
  }, [open, stopScanner]);

  const handleRedeem = () => {
    if (!result || result.payout <= 0) {
      setError("No winnings on this ticket.");
      return;
    }
    if (result.redeemed) {
      setSuccess("Winnings were already credited to your SuperBet wallet.");
      return;
    }
    setSuccess("Winnings are credited automatically after each draw. Check your wallet balance.");
  };

  const handleClose = () => {
    stopScanner();
    setError("");
    setSuccess("");
    setResult(null);
    setTicketCode("");
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Check Ticket Winnings</span>
          {!cameraActive ? (
            <IconButton
              onClick={startScanner}
              color="primary"
              sx={{ ml: 2 }}
              title="Scan with Camera"
            >
              <CameraAlt />
            </IconButton>
          ) : (
            <IconButton
              onClick={stopScanner}
              color="error"
              sx={{ ml: 2 }}
              title="Stop Camera"
            >
              <Close />
            </IconButton>
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        {!cameraActive ? (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Paste the code printed under the barcode (example: <strong>KENO:123:-Nabc123...</strong>)
            </Typography>
            <Typography variant="caption" sx={{ mb: 2, color: 'text.secondary', display: 'block' }}>
              💡 Tip: Click the camera icon above to scan with your phone camera
            </Typography>
            <TextField
              fullWidth
              label="Ticket Code"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!loading) handleCheck();
                }
              }}
              placeholder="KENO:ROUND_NO:BET_ID"
              sx={{ mt: 1 }}
              inputRef={inputRef}
            />
          </>
        ) : (
          <Box>
            <Typography variant="body2" sx={{ mb: 2, textAlign: 'center', color: 'primary.main', fontWeight: 'bold' }}>
              📷 Point your camera at the barcode
            </Typography>
            <div id={scannerDivId} style={{ width: '100%', minHeight: '300px' }}></div>
            <Typography variant="caption" sx={{ mt: 2, textAlign: 'center', display: 'block', color: 'text.secondary' }}>
              Supports: Code128, Code39, EAN, UPC, and more
            </Typography>
          </Box>
        )}

        {!cameraActive && error && (
          <Typography sx={{ mt: 1, color: "error.main" }}>
            {error}
          </Typography>
        )}

        {!cameraActive && success && (
          <Typography sx={{ mt: 1, color: "success.main", fontWeight: "bold" }}>
            {success}
          </Typography>
        )}

        {!cameraActive && result && (
          <Box sx={{ mt: 2, p: 2, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 1 }}>
            <Typography sx={{ fontWeight: "bold" }}>
              Round: {result.roundNo}
            </Typography>
            <Typography>
              Bet: {result.bet?.betAmount} ETB
            </Typography>
            <Typography>
              Numbers: {Array.isArray(result.bet?.selectedNumbers) ? result.bet.selectedNumbers.join(", ") : ""}
            </Typography>

            {result.status === "pending" ? (
              <Typography sx={{ mt: 1, color: "#ef6c00", fontWeight: "bold" }}>
                Result: Not drawn yet (pending)
              </Typography>
            ) : (
              <>
                <Typography sx={{ mt: 1 }}>
                  Picks: {result.picks} | Matches: {result.matches} | x{result.multiplier}
                </Typography>
                <Typography
                  sx={{
                    mt: 1,
                    color: result.payout > 0 ? "#2e7d32" : "#c62828",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                  }}
                >
                  Won: {Number(result.payout || 0).toFixed(2)} ETB
                </Typography>

                {/* Redemption Status */}
                {result.redeemed ? (
                  <Box sx={{ mt: 2, p: 1, bgcolor: "#e3f2fd", borderRadius: 1 }}>
                    <Typography sx={{ color: "#1565c0", fontWeight: "bold" }}>
                      ✓ Already Redeemed
                    </Typography>
                    {result.redeemedAt && (
                      <Typography sx={{ color: "#1565c0", fontSize: "0.875rem" }}>
                        Redeemed on: {new Date(result.redeemedAt).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                ) : result.payout > 0 ? (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleRedeem}
                    disabled={redeeming || !currentUser}
                    sx={{
                      mt: 2,
                      backgroundColor: "#2e7d32",
                      "&:hover": { backgroundColor: "#1b5e20" },
                      fontWeight: "bold",
                    }}
                  >
                    {redeeming ? "Redeeming..." : `Redeem ${result.payout.toFixed(2)} ETB`}
                  </Button>
                ) : null}

                {!currentUser && result.payout > 0 && !result.redeemed && (
                  <Typography sx={{ mt: 1, color: "#ff6f00", fontSize: "0.875rem" }}>
                    Please login to redeem your winnings
                  </Typography>
                )}
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleCheck}
          disabled={loading}
          sx={{ backgroundColor: "#4ca46a", "&:hover": { backgroundColor: "#3d8355" } }}
        >
          {loading ? "Checking..." : "Check Ticket"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


