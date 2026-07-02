import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { ref, onValue, set, push } from 'firebase/database';
import { rtdb } from '../firebase-config';
import NewKenoPlay from './newkenoplay';
import KenoDrawAnimation from './KenoDrawAnimation';

const KenoGameFlow = () => {
  const [gamePhase, setGamePhase] = useState('betting'); // 'betting' or 'drawing'
  const [countdown, setCountdown] = useState(50);
  const [roundNo, setRoundNo] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [placedBets, setPlacedBets] = useState([]);
  const [userId, setUserId] = useState(null);
  const [balance, setBalance] = useState(0);

  // Fetch user info from API
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      console.warn("No token found in localStorage");
      return;
    }

    const fetchClientInfo = async () => {
      try {
        const response = await fetch(`https://smartsoftsupport.onrender.com/api/get-client-info?token=${storedToken}`);
        const data = await response.json();
        if (data.status === "success" && data.data?.ClientExternalKey) {
          setUserId(data.data.ClientExternalKey);
          console.log("User ID:", data.data.ClientExternalKey);
          
          // Get balance if available
          if (data.data.Balance !== undefined) {
            setBalance(data.data.Balance);
          }
        }
      } catch (error) {
        console.error("Error fetching client info:", error);
      }
    };

    fetchClientInfo();
  }, []);

  // Subscribe to Firebase for round data
  useEffect(() => {
    // Subscribe to current round number
    const currentRoundNoRef = ref(rtdb, "kenoGame/currentRoundNo");
    const unsubscribeRoundNo = onValue(currentRoundNoRef, (snapshot) => {
      const round = snapshot.val();
      if (round) {
        setRoundNo(round);
        console.log("Current round from Firebase:", round);
      }
    });

    return () => {
      unsubscribeRoundNo();
    };
  }, []);

  // Subscribe to round data when roundNo changes
  useEffect(() => {
    if (roundNo === null) return;

    const roundDataRef = ref(rtdb, `kenoGame/rounds/${roundNo}`);
    const unsubscribeRoundData = onValue(roundDataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log("Round data from Firebase:", data);
        
        // Update countdown from Firebase
        if (data.countdown !== undefined) {
          const newCountdown = data.countdown;
          setCountdown(newCountdown);
          
          // Switch to drawing phase when countdown hits 0
          if (newCountdown === 0 && gamePhase === 'betting') {
            console.log("Switching to drawing phase");
            setGamePhase('drawing');
          }
          
          // Switch back to betting phase when countdown resets (new round starts)
          if (newCountdown > 0 && gamePhase === 'drawing') {
            console.log("New round starting, switching to betting phase");
            setGamePhase('betting');
            setCalledNumbers([]);
            setPlacedBets([]);
          }
        }

        // Update called numbers from Firebase
        if (data.calledNumbers && typeof data.calledNumbers === "object") {
          const numbersArray = Object.keys(data.calledNumbers)
            .sort((a, b) => Number(a) - Number(b))
            .map(key => data.calledNumbers[key]);
          setCalledNumbers(numbersArray);
          console.log("Called numbers from Firebase:", numbersArray);
        } else {
          // Clear called numbers if none exist
          if (gamePhase === 'betting') {
            setCalledNumbers([]);
          }
        }

        // Load user's bets from Firebase for this round
        if (data.bets && userId) {
          const userBets = Object.values(data.bets).filter(bet => bet.userId === userId);
          setPlacedBets(userBets);
          console.log("Loaded user bets from Firebase:", userBets);
        }
      }
    });

    return () => {
      unsubscribeRoundData();
    };
  }, [roundNo, gamePhase, userId]);

  // Don't use local countdown - rely on Firebase only
  // The countdown and phase switching is controlled by Firebase

  // Handle bet placement
  const handlePlaceBet = async (bet) => {
    if (!userId) {
      console.error("User ID not available. Cannot place bet.");
      alert("Please log in to place a bet.");
      return;
    }

    if (!roundNo) {
      console.error("Round number not available. Cannot place bet.");
      alert("Game round not loaded. Please wait.");
      return;
    }

    try {
      // Create bet object with user info
      const betData = {
        userId: userId,
        selectedNumbers: bet.selectedNumbers,
        betAmount: bet.betAmount,
        timestamp: Date.now(),
        roundNo: roundNo
      };

      // Save bet to Firebase using push to create unique bet ID
      const betsRef = ref(rtdb, `kenoGame/rounds/${roundNo}/bets`);
      const newBetRef = push(betsRef);
      await set(newBetRef, betData);

      // Add to local state for UI
      setPlacedBets(prev => [...prev, { ...betData, betId: newBetRef.key }]);
      
      console.log('Bet successfully placed to Firebase:', betData);
      
      // Optional: Show success message to user
      // You can add a toast notification here
      
    } catch (error) {
      console.error("Error placing bet to Firebase:", error);
      alert("Failed to place bet. Please try again.");
    }
  };

  // Handle drawing animation completion
  const handleDrawComplete = (drawnNumbers) => {
    console.log('Drawing complete! Numbers:', drawnNumbers);
    
    // Calculate winnings for placed bets
    calculateWinnings(drawnNumbers);
    
    // Firebase will automatically start a new round
    // No need to manually reset - the useEffect will handle phase switching
    // when Firebase updates the countdown to > 0
  };

  // Calculate winnings based on matches
  const calculateWinnings = (drawnNumbers) => {
    placedBets.forEach(bet => {
      const matches = bet.selectedNumbers.filter(num => drawnNumbers.includes(num)).length;
      console.log(`Bet with ${bet.selectedNumbers.length} numbers matched ${matches}`);
      // Calculate payout based on keno payout table
      // You can add your payout table logic here
    });
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh' }}>
      {gamePhase === 'betting' ? (
        <NewKenoPlay 
          countdown={countdown}
          roundNo={roundNo}
          onPlaceBet={handlePlaceBet}
          placedBets={placedBets}
          calledNumbers={calledNumbers}
          balance={balance}
          userId={userId}
        />
      ) : (
        <KenoDrawAnimation 
          drawNumber={roundNo}
          calledNumbers={calledNumbers}
          onComplete={handleDrawComplete}
        />
      )}
    </Box>
  );
};

export default KenoGameFlow;

