# Quick Start - Frontend Testing

## 30-Second Setup

### 1. Open Terminal 1 (Backend)
```bash
cd backend
python main.py
```
Wait for: "Server running on http://localhost:8000"

### 2. Open Terminal 2 (Frontend)
```bash
cd frontend
npm install
npm run dev
```
Wait for: Browser opens to http://localhost:3000

### 3. MetaMask
1. Open MetaMask extension
2. Switch to "Polygon Mumbai" network
3. Browser shows app automatically

**You're ready to test!**

---

## First Test (5 minutes)

1. Click **"Connect MetaMask"**
2. Select wallet account
3. Click **"Connect"**
4. You should see greeting + "Create Game" / "Join Game" buttons

**✅ If this works, Wallet Integration is OK**

---

## Second Test (10 minutes) - Single Player

1. Click **"Create Game"**
2. Enter **"5"** as bet amount
3. Click **"Create Bet"**
4. See **"Waiting for opponent..."** screen
5. Copy the shareable link shown
6. Click **"Roll Dice"**
7. Watch dice animation
8. See dice total and Drand round

**✅ If you see Drand data, Drand Integration is OK**

---

## Third Test (20 minutes) - Two Player

### Setup Two Accounts
- **Player 1:** Current MetaMask account
- **Player 2:** Use Incognito window or different browser

### Player 1
1. Click "Create Game" (bet amount: 5)
2. Copy the shareable link
3. Send link to Player 2

### Player 2 (Incognito Window)
1. Open the link
2. Click "Connect MetaMask"
3. Select different account
4. Click "Join Game"

### Both Players
1. Click "Roll Dice" for each round
2. Play 5 rounds (first to 2 wins)
3. See winner announced
4. (Optional) Click "Claim Winnings" if winner

**✅ Full game flow working**

---

## Test Checklist

### ✅ Quick Validation
- [ ] Page loads at localhost:3000
- [ ] MetaMask button visible
- [ ] Can connect wallet
- [ ] Wallet address shows in header
- [ ] Can create game
- [ ] Can see shareable link
- [ ] Can roll dice
- [ ] Dice total appears (1-12)
- [ ] Drand info visible
- [ ] "Verify" link works
- [ ] Can see results

### 🐛 If Something Breaks

**MetaMask not connecting?**
- Check MetaMask is open and unlocked
- Check you're on Mumbai network
- Try page refresh

**Drand not fetching?**
- Check internet connection
- Try "Roll Dice" again (retry available)
- Check browser console: F12 → Console

**Backend not responding?**
- Make sure server running: `python main.py`
- Check terminal shows "Server running on localhost:8000"
- Try page refresh

**Transaction failed?**
- Check you have testnet MATIC
- Get more from: https://faucet.polygon.technology/
- Check gas prices aren't too high

---

## Debugging

### Browser Console (F12)
Look for messages like:
```
[API] Placing bet with amount: 5
[DRAND] Fetching latest round...
[DRAND] Round 8739, randomness: 0x123abc...
[GAME] Rolling dice, total: 10
[API] Claiming winnings...
```

### Network Tab (F12 → Network)
Check these should all show **200 OK**:
- POST to `http://localhost:8000/api/bets/place`
- GET to `https://drandbeacon.io/api/public/latest`
- Responses should have game data

### Backend Logs
Terminal where you ran `python main.py` should show:
```
[2024-01-15] POST /api/bets/place - 200
[2024-01-15] GET /api/bets/abc123 - 200
[2024-01-15] POST /api/game/play - 200
```

---

## CommonIssues & Fixes

| Problem | Solution |
|---------|----------|
| Page blank | Refresh page, check console for errors |
| Button not clickable | Check MetaMask is connected first |
| Drand takes too long | Normal (external API), just wait or retry |
| Transaction stuck | Wait 1-2 minutes, check Polygonscan |
| Different players see different results | Refresh both pages |
| Can't join game | Link expired? Create new game |

---

## Next Steps

Once basic testing works:

1. **Read TESTING_GUIDE.md** for comprehensive scenarios
2. **Check DRAND_FORMULA.md** to understand the randomness
3. **Test full E2E** (create → join → 5 rounds → settlement)
4. **Try different bet amounts** (1, 10, 50 MATIC)
5. **Test on mobile** (use chrome devtools device toolbar)
6. **Check Polygonscan** for confirmed transactions

---

## Helpful Links

- **Drand Verification:** https://drandbeacon.io/
- **Polygon Explorer (Mumbai):** https://mumbai.polygonscan.com/
- **Testnet Faucet:** https://faucet.polygon.technology/
- **MetaMask Support:** https://support.metamask.io/

---

**Status:** Phase 4 Complete ✅  
Ready for testing!
