import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';

const BetsHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bets, setBets] = useState([]);
  const marketName = location.state?.marketName; // Receive market name from previous page

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No token found, please log in again.");
      return;
    }

    const fetchBets = async () => {
      try {
        const response = await axios.get('https://only-backend-je4j.onrender.com/api/bets/user', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // Filter bets to only include those that match the passed marketName
        const filteredBets = response.data.bets.filter(bet => bet.marketName === marketName);
        setBets(filteredBets);
      } catch (error) {
        console.error('Error fetching bets:', error);
      }
    };

    fetchBets();
  }, [marketName]);

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4">
      {/* Header */}
      <div className="flex items-center bg-gray-800 p-3 rounded-lg shadow-md mb-5">
        <button onClick={() => navigate(-1)} className="mr-3 bg-transparent text-white p-2 rounded-full hover:bg-gray-700 transition duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-lg font-bold">{marketName ? `${marketName} Play History` : "Play History"}</h2>
      </div>

      {/* Bets Table */}
      {bets.length === 0 ? (
        <div className="text-center text-gray-400">No plays found.</div>
      ) : (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-2 text-left">Game</th>
                <th className="p-2 text-left">Play Type</th>
                <th className="p-2 text-left">Amount</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {bets.map((bet, index) => (
                <tr key={index} className="border-b border-gray-700 hover:bg-gray-700 transition">
                  <td className="p-2">{bet.gameName}</td>
                  <td className="p-2">{bet.number}</td>
                  <td className="p-2">{bet.amount}</td>
                  <td className="p-2 text-green-500">{bet.status}</td>
                  <td className="p-2">{new Date(bet.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BetsHistory;
