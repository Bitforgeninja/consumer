import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const TriplePana = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const marketName = location.state?.marketName;  // Ensuring we use the market name passed via location state

  const [input, setInput] = useState("");
  const [points, setPoints] = useState("");
  const [bets, setBets] = useState([]);
  const [placedBets, setPlacedBets] = useState([]);
  const [coins, setCoins] = useState(0);  // Assume some default value or fetched from API
  const [error, setError] = useState("");
  const [betType, setBetType] = useState("Open");

  useEffect(() => {
    fetchWalletBalanceAndBets();
  }, []);

  const fetchWalletBalanceAndBets = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError("You need to log in to see your balance and bets.");
      return;
    }

    try {
      const [walletResponse, betsResponse] = await Promise.all([
        axios.get('https://only-backend-je4j.onrender.com/api/wallet/balance', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        axios.get('https://only-backend-je4j.onrender.com/api/bets/user/', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      setCoins(walletResponse.data.walletBalance);
      setPlacedBets(betsResponse.data.bets.filter(bet => bet.gameName === "Triple Pana" && bet.marketName === marketName && bet.status === "pending"));
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data!");
    }
  };

  const handleAddBet = () => {
    if (!input || !points) {
      setError("Both input and points are required!");
      return;
    }

    if (!/^\d{3}$/.test(input)) {
      setError("Input must be a three-digit number!");
      return;
    }

    if (parseInt(points) <= 0) {
      setError("Points must be greater than 0!");
      return;
    }

    const newBet = {
      betId: Math.random().toString(36).substr(2, 9),
      input,
      points,
      betType,
      isPlaced: false,
      isWin: false
    };

    setBets([...bets, newBet]);
    setInput("");
    setPoints("");
    setError("");
  };

  const handleDeleteBet = (index) => {
    setBets(bets.filter((_, i) => i !== index));
  };

  const handlePlaceBet = async () => {
    const totalPoints = bets.reduce((sum, bet) => sum + parseInt(bet.points, 10), 0);

    if (totalPoints === 0) {
      setError("No bets to place!");
      return;
    }

    if (coins < totalPoints) {
      setError("Insufficient coins!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You need to log in to place bets.");
      return;
    }

    try {
      const responses = await Promise.all(
        bets.map(bet =>
          axios.post(
            "https://only-backend-je4j.onrender.com/api/bets/place",
            {
              marketName,
              gameName: "Triple Pana",
              number: bet.input,
              amount: bet.points,
              winningRatio: 9,
              betType
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )
        )
      );

      const confirmedBets = responses.map((resp, index) => ({
        ...bets[index],
        isPlaced: true,
        status: resp.data.status || "Pending"
      }));

      setPlacedBets([...placedBets, ...confirmedBets]);
      setCoins(coins - totalPoints);
      setBets([]);
      setError("");
      alert("Submitted successfully!");
    } catch (error) {
      console.error("Error placing bets:", error);
      setError("Failed submitting!");
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4">
      <header className="flex items-center bg-gray-800 p-3 shadow-md mb-4">
        <button onClick={() => navigate(-1)} className="mr-3 bg-transparent text-white p-1 rounded-full hover:bg-gray-700 transition duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-lg font-bold">Triple Pana</h2>
        <div className="ml-auto bg-yellow-500 text-gray-900 px-3 py-1 rounded-full font-bold text-sm">
          💰 Coins: {coins}
        </div>
      </header>

      <div className="flex justify-center mb-4">
        <button onClick={() => setBetType("Open")} className={`px-4 py-1 rounded-l-md font-bold text-sm ${betType === "Open" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400"} hover:bg-purple-700 transition duration-300`}>
          Open
        </button>
        <button onClick={() => setBetType("Close")} className={`px-4 py-1 rounded-r-md font-bold text-sm ${betType === "Close" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400"} hover:bg-purple-700 transition duration-300`}>
          Close
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <input type="text" placeholder="Enter Triple Pana (3-digit)" value={input} onChange={(e) => setInput(e.target.value)} className="col-span-1 px-3 py-2 bg-white text-black rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-600" />
        <input type="number" placeholder="Enter Points" value={points} onChange={(e) => setPoints(e.target.value)} className="col-span-1 px-3 py-2 bg-white text-black rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-600" />
        <button onClick={handleAddBet} className="col-span-1 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-md font-bold text-sm transition duration-300">
          Proceed
        </button>
      </div>

      {error && (
        <div className="bg-red-600 text-white px-3 py-2 rounded-md text-center text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-gray-800 p-4 rounded-md shadow-md mb-4">
        <h3 className="text-base font-bold mb-3">Current Bets</h3>
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-700 text-left">
              <th className="px-3 py-2">Triple Pana</th>
              <th className="px-3 py-2">Points</th>
              <th className="px-3 py-2">Open/Close</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {bets.map((bet, index) => (
              <tr key={bet.betId} className="border-b border-gray-700">
                <td className="px-3 py-2">{bet.input}</td>
                <td className="px-3 py-2">{bet.points}</td>
                <td className="px-3 py-2">{bet.betType}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => handleDeleteBet(index)} className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded-md text-white font-bold text-xs transition duration-300">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={handlePlaceBet} className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-md font-bold text-sm transition duration-300 mb-4">
        Submit
      </button>

      <div className="bg-gray-800 p-4 rounded-md shadow-md">
        <h3 className="text-base font-bold mb-3">Placed Bets</h3>
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-700 text-left">
              <th className="px-3 py-2">Triple Pana</th>
              <th className="px-3 py-2">Points</th>
              <th className="px-3 py-2">Bet Type</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {placedBets.map((bet) => (
              <tr key={bet._id} className="border-b border-gray-700">
                <td className="px-3 py-2">{bet.number}</td>
                <td className="px-3 py-2">{bet.amount}</td>
                <td className="px-3 py-2">{bet.betType}</td>
                <td className="px-3 py-2">
                  {bet.status === "win" ? (
                    <span className="text-green-500 font-bold">Win</span>
                  ) : (
                    <span className="text-yellow-500 font-bold">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TriplePana;
