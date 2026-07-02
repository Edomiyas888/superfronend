import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

/**
 * Hook to handle bet placement with the new Firebase auth system
 */
export const useBetPlacement = () => {
  const { currentUser, userBalance } = useAuth();

  const placeBet = async (selectedNumbers, betAmount) => {
    if (!currentUser) {
      throw new Error('Please login to place a bet');
    }

    if (userBalance < betAmount) {
      throw new Error('Insufficient balance');
    }

    if (!selectedNumbers || selectedNumbers.length === 0) {
      throw new Error('Please select numbers');
    }

    if (selectedNumbers.length > 10) {
      throw new Error('Maximum 10 numbers allowed');
    }

    if (betAmount < 2 || betAmount > 100000) {
      throw new Error('Bet amount must be between 2 and 100,000 Birr');
    }

    try {
      // Call the Firebase function to register the bet
      const response = await axios.post(
        'https://registerkenobet-44twbtecpa-uc.a.run.app',
        {
          userId: currentUser.uid,
          betAmount: betAmount,
          selectedNumbers: selectedNumbers
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return {
          success: true,
          betId: response.data.betId,
          newBalance: response.data.newBalance
        };
      } else {
        throw new Error(response.data.message || 'Failed to place bet');
      }
    } catch (error) {
      console.error('Error placing bet:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to place bet');
    }
  };

  return {
    placeBet,
    currentUser,
    userBalance
  };
};

