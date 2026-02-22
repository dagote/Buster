# Frontend Testing Guide

## Prerequisites

You need three components running:
1. **Backend Server** (Python Flask) - `localhost:8000`
2. **Frontend** (React Vite) - `localhost:3000`
3. **MetaMask** - Browser extension

## Setup

### 1. Start Backend Server
From the project root:
```bash
cd backend
python main.py
# Should print: "Server running on http://localhost:8000"
```

### 2. Start Frontend Dev Server
In a new terminal:
```bash
cd frontend
npm install  # Only needed first time
npm run dev
# Should open http://localhost:3000 automatically
# Or go to http://localhost:3000 manually
```

### 3. MetaMask Setup
1. Install MetaMask extension if not already done
2. Create or import a test wallet
3. Add Polygon Mumbai testnet:
   - Network RPC: `https://rpc-mumbai.maticvigil.com`
   - Chain ID: `80001`
   - Symbol: `MATIC`
4. Get testnet MATIC from faucet:
   - https://faucet.polygon.technology/
   - Enter your address
   - Wait for MATIC to arrive (1-2 minutes)

## Test Scenarios

### Scenario 1: MetaMask Connection

**Steps:**
1. Open http://localhost:3000
2. Click "Connect MetaMask" button
3. MetaMask popup appears
4. Select account and click "Connect"

**Expected Results:**
✅ Button text changes to "Disconnect"
✅ Your wallet address appears in header
✅ GameRoom component becomes visible
✅ Refresh page - wallet stays connected (localStorage persistence)

**Debugging:**
- If MetaMask doesn't popup, check browser permissions
- If chain doesn't match, switch to Mumbai in MetaMask dropdown
- If nothing happens, check browser console for errors: F12 → Console

---

### Scenario 2: Create Game

**Setup:** Player 1 is connected with MetaMask

**Steps:**
1. Click "Create Game" button
2. Enter bet amount (e.g., "5" MATIC)
3. Click "Create Bet"

**Expected Results:**
✅ Loading indicator appears
✅ Server calls backend `/api/bets/place`
✅ Game moves to "waiting" screen
✅ Shareable link appears: e.g., `http://localhost:3000/game/abc123`
✅ Copy button works (links to clipboard)
✅ Shows "Waiting for opponent to join..."

**Debugging:**
- If error appears, check console (F12 → Console)
- If server not found, ensure backend is running: `python main.py`
- If API fails, check vite.config.js proxy setting

---

### Scenario 3: Join Game (Two Player Test)

**Setup:** 
- Player 1 has created game and has link
- Player 2 is ready in a different browser/account

**Player 1 Steps:**
1. Create game (see Scenario 2)
2. Copy shareable link
3. Send link to Player 2

**Player 2 Steps:**
1. Open link in browser (or different account in same browser)
2. Click "Connect MetaMask" (if not connected)
3. Link includes game ID, should show join screen
4. Click "Join Game"
5. Confirm bet amount matches

**Expected Results:**
✅ Player 2 can see bet details
✅ Clicking "Join Game" calls backend `/api/bets/{betId}/join`
✅ Both players move to "playing" screen
✅ Same bet amount shown for both

**Debugging:**
- If link doesn't work, clear ?gameId query param from URL
- If join fails, ensure game still waiting for opponent
- Check network tab (F12 → Network) for API calls

---

### Scenario 4: Play Dice Game (5 Rounds)

**Setup:** Two players connected and in "playing" screen

**Both Players:**
1. See round counter (Round 1 of 5)
2. See score (0-0 initially)
3. Click "Roll Dice" button

**Expected Results:**

**First Roll:**
✅ Button changes to "Rolling..."
✅ Status shows "Fetching Drand data..."
✅ Frontend makes request to: `https://drandbeacon.io/api/public/latest`
✅ After ~3 seconds, dice animation plays
✅ Two dice appear with numbers (e.g., 4 and 6)
✅ Total shows (e.g., "Total: 10")
✅ Drand info visible:
   - Drand Round number
   - "Verify on Drand Beacon" link
✅ Score updates (Player 1: 1, Player 2: 0 or vice versa)
✅ Round counter updates (Round 2 of 5)

**Rounds 2-5:**
✅ Same behavior for each round
✅ Score accumulates
✅ Game checks for winner (first to win 2 rounds)

**Game Completion (Before Round 5 if someone reaches 2 wins):**
✅ "Playing" screen replaced with "Completed" screen
✅ Calls backend `/api/game/play` for settlement
✅ Transitions to ResultsBoard component

**Debugging:**
- If "Fetching Drand" never completes, check internet connection
- If Drand API unavailable, you'll see error message (retry available)
- If dice don't animate, check CSS loading (you should see rolling animation)
- Check browser console for JavaScript errors

---

### Scenario 5: View Results & Verify

**Setup:** Game completed

**Results Screen Shows:**
✅ Winner banner (green if won, orange if lost)
✅ Game details:
   - Your address
   - Opponent address
   - Bet amount
   - Your rolls (list of dice totals)
   - Opponent rolls (list of dice totals)
   - Final score (e.g., "You: 2, Opponent: 1")

**Verification Section:**
✅ "3-Step Verification Guide":
   1. "Find the Drand round in the results"
   2. "Go to https://drandbeacon.io/round/{number}"
   3. "Calculate: (randomness % 12) + 1 and verify match"

✅ Formula displayed:
   ```
   total = (drandValue % 12) + 1
   ```

✅ "Verify on Drand Beacon" button links to:
   ```
   https://drandbeacon.io/round/{drandRound}
   ```

**If Winner:**
✅ "Claim Winnings" button visible
✅ Shows claimable amount (original + winnings)

**Debugging:**
- Links not working: check Drand website is accessible
- Formula not showing: check console for errors
- Wrong winner: check Drand values and manual calculation

---

### Scenario 6: Claim Winnings

**Setup:** Player won the game

**Steps:**
1. View Results screen
2. Click "Claim Winnings" button
3. MetaMask approval popup appears
4. Confirm transaction

**Expected Results:**
✅ Transaction submitted to Polygon Mumbai
✅ Loading state shown
✅ Transaction hash visible
✅ After ~2 minutes: "Winnings claimed successfully!"
✅ Transaction visible at: `https://mumbai.polygonscan.com/tx/{hash}`

**Debugging:**
- If MetaMask popup doesn't appear, check browser permissions
- If transaction fails:
  - Reason: Usually insufficient gas or balance
  - Solution: Get more testnet MATIC from faucet
- If Polygonscan doesn't show transaction: Network might be busy, wait 5 minutes

---

### Scenario 7: Play Again

**Setup:** Game completed (winner or loser)

**Steps:**
1. On ResultsBoard, click "Play Again"
2. Should return to GameRoom setup screen

**Expected Results:**
✅ Back to create/join game options
✅ Wallet still connected
✅ Can create new game or join with new link

---

## Key Testing Checklist

### Wallet Integration
- [ ] MetaMask connects from button click
- [ ] Wallet address persists after page refresh
- [ ] Disconnect button works
- [ ] Switching accounts in MetaMask updates app

### Game Creation/Joining
- [ ] Can create game with various bet amounts
- [ ] Shareable link is generated and copyable
- [ ] Other player can join using link
- [ ] Both players see same game state

### Dice Rolling
- [ ] Drand data fetches successfully
- [ ] Dice animation plays for ~3 seconds
- [ ] Final total matches formula: `(drandValue % 12) + 1`
- [ ] Drand round number displayed
- [ ] Verification link works

### Scoring & Match Logic
- [ ] Best of 5 tracked correctly (first to 2 wins)
- [ ] Can win in Round 3, 4, or 5
- [ ] Score updates visible in real-time
- [ ] Round counter accurate

### Results & Settlement
- [ ] Winner correctly determined
- [ ] Results show all 5 rolls (or up to winner)
- [ ] Drand data visible in results
- [ ] Verification guide clear
- [ ] Claim winnings button works (for winner)

### Responsive Design
- [ ] Works on desktop (1920x1080)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x812)
- [ ] Text readable on all sizes
- [ ] Buttons easy to click on mobile

---

## Error Scenarios to Test

### Network Errors
1. Turn off internet during Drand fetch
   - Expected: Error message appears, can retry
2. Backend server crashes
   - Expected: API calls fail, user sees error
3. MetaMask network switched mid-game
   - Expected: Transaction fails gracefully

### Edge Cases
1. Player closes browser during game
   - Expected: Can rejoin with same link
2. Two players roll simultaneously
   - Expected: Both score counted correctly
3. Try to join already-full game
   - Expected: Error message, cannot proceed
4. Insufficient balance for bet
   - Expected: Cannot place bet

### Time Issues
1. Very slow network (simulate with DevTools throttling)
   - Expected: UI shows loading states, patient
2. Drand takes 10+ seconds to fetch
   - Expected: UI remains responsive, doesn't freeze

---

## Debugging Tips

### Check Console Logs
Open DevTools: `F12` → `Console` → Look for:
- `[API] Placing bet...` (showing API calls)
- Network requests to `localhost:8000`
- Network requests to `drandbeacon.io`

### Check Network Tab
`F12` → `Network` → Check:
- API calls to `/api/bets/place` (should be 200 OK)
- API calls to `/api/bets/{betId}/join` (should be 200 OK)
- Requests to `drandbeacon.io` (should be 200 OK)
- Requests to `localhost:8000` (should be 200 OK)

### Simulate Network Issues
`F12` → `Network` → Throttle dropdown:
- Set to "Slow 3G" to test slow network
- Set to "Offline" to test network failure
- Watch how app responds

### Check State
Open React DevTools extension:
- Expand component tree
- Check props and state
- Verify game state matches expected
- Check if values updating correctly

---

## Performance Expectations

### Load Time
- Page load: < 2 seconds
- MetaMask connection: < 1 second
- Drand fetch: < 2 seconds
- Transaction submission: < 5 seconds

### Network
- API calls: ~100ms average
- Drand fetch: ~1000-2000ms (from external API)
- Transaction confirmation: ~30-60 seconds (blockchain confirmation)

---

## Success Criteria

### Minimal Test (15 minutes)
✅ MetaMask connects
✅ Can create game
✅ Can roll dice and see Drand data
✅ Can see results

### Full Test (45 minutes)
✅ All above + two-player test
✅ Complete 5-round game
✅ View results and verify on Drand Beacon
✅ Claim winnings on-chain

---

## Next Steps After Testing

If all tests pass:
1. **Note any issues** in console or during gameplay
2. **Document any bugs** (browser, steps to reproduce, expected vs actual)
3. **Test with different wallets** (different accounts)
4. **Test on different networks** (testnet → mainnet later)
5. **Proceed to Phase 5**: Integration Testing with full E2E scenarios

If issues found:
1. Check frontend logs in browser console
2. Check backend logs in terminal
3. Check network requests in DevTools
4. Report issues with screenshots + console logs
