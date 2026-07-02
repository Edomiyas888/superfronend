# Floating Leaderboard Component

## Overview
The FloatingLeaderboard component provides a floating action button that displays the monthly leaderboard when clicked. It shows the top 100 players with masked phone numbers and comprehensive statistics.

## Features

### 🎯 **Core Functionality**
- **Floating Action Button**: Fixed position button in bottom-right corner
- **Monthly Leaderboard**: Displays top 100 players for current month
- **Masked Phone Numbers**: Uses existing `PlayerUsername` component for privacy
- **Real-time Data**: Fetches fresh data from Firebase Cloud Functions
- **Responsive Design**: Works on both desktop and mobile devices

### 📊 **Data Display**
- **Rank**: Player position with special icons for top 3
- **Player**: Masked phone number/username
- **Points**: Total points earned (tiered system)
- **Bets**: Number of bets placed
- **Total Amount**: Total bet amount in birr

### 🎨 **Visual Features**
- **Gradient Design**: Green gradient matching the app theme
- **Rank Icons**: Gold, silver, bronze stars for top 3
- **Color-coded Ranks**: Different colors for different rank tiers
- **Loading States**: Smooth loading animations
- **Error Handling**: User-friendly error messages

## API Integration

### Endpoint Used
```
https://us-central1-finixkeno.cloudfunctions.net/getMonthlyLeaderboard
```

### Parameters
- `limit`: Number of players to fetch (default: 100)

### Response Format
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "clientExternalKey": "user123",
      "points": 1500,
      "betCount": 50,
      "totalBetAmount": 25000,
      "averageBetAmount": 500,
      "lastUpdated": 1703123456789
    }
  ],
  "monthKey": "2024-01",
  "year": 2024,
  "month": 1,
  "totalPlayers": 150
}
```

## Point System

The leaderboard uses a tiered point system:

| Bet Amount | Points |
|------------|--------|
| 1-9 birr   | 1 point |
| 10-99 birr | 5 points |
| 100-999 birr | 10 points |
| 1000-9999 birr | 50 points |
| 10000+ birr | 500 points |

## Usage

### Basic Integration
```jsx
import FloatingLeaderboard from './components/FloatingLeaderboard';

function App() {
  return (
    <div>
      {/* Your app content */}
      <FloatingLeaderboard />
    </div>
  );
}
```

### Styling
The component uses CSS classes defined in `App.css`:
- `.floating-leaderboard-fab`: Main button styling
- `.leaderboard-dialog`: Dialog background
- `.leaderboard-table`: Table styling

## Dependencies

### Required Packages
- `@mui/material`: UI components
- `@mui/icons-material`: Icons
- `axios`: HTTP requests
- `react`: Core React functionality

### Internal Dependencies
- `PlayerUsername`: For masked phone number display
- `App.css`: Custom styling

## Customization

### Button Position
Modify the CSS in `App.css`:
```css
.floating-leaderboard-fab {
  bottom: 20px !important;
  right: 20px !important;
}
```

### Colors
Update the gradient colors in the component or CSS:
```css
background: linear-gradient(45deg, #4CAF50 30%, #45a049 90%) !important;
```

### API Endpoint
Change the endpoint in the component:
```javascript
const response = await axios.get('YOUR_ENDPOINT_HERE');
```

## Error Handling

The component includes comprehensive error handling:
- Network errors
- API response errors
- Empty data states
- Loading states

All errors are displayed via Material-UI Snackbar with user-friendly messages.

## Performance

### Optimizations
- **Caching**: Data is cached until refresh is requested
- **Lazy Loading**: Data only loads when dialog is opened
- **Efficient Rendering**: Uses Material-UI's optimized components
- **Responsive Tables**: Sticky headers and scrollable content

### Memory Management
- Component unmounts cleanly
- No memory leaks from event listeners
- Efficient re-rendering with React hooks

## Mobile Responsiveness

The component is fully responsive:
- Smaller button on mobile devices
- Touch-friendly interactions
- Optimized table layout for small screens
- Proper dialog sizing

## Future Enhancements

Potential improvements:
- **Real-time Updates**: WebSocket integration for live updates
- **User Position**: Show current user's rank
- **Historical Data**: View previous months
- **Export Functionality**: Download leaderboard data
- **Notifications**: Alert users of rank changes

