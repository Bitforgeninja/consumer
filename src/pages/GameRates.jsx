import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GameRates = () => {
  const navigate = useNavigate();
  const [gameRates, setGameRates] = useState([]); // Updated to store rates from the API

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await axios.get('https://only-backend-je4j.onrender.com/api/admin/winning-ratios', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setGameRates(response.data.winningRatios);
      } catch (error) {
        console.error('Failed to fetch game rates:', error);
        // Handle error or show message to user
      }
    };

    fetchRates();
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen p-5">
      {/* Header */}
      <div className="flex items-center bg-gray-800 p-3 rounded-lg shadow-md mb-5">
        <button
          onClick={() => navigate(-1)}
          className="mr-3 bg-transparent text-white p-2 rounded-full hover:bg-gray-700 transition duration-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <h2 className="text-lg font-bold">Game Rates</h2>
      </div>

      {/* Game Rates Table */}
      <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-3 text-center">Game Rates</h3>
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-700 text-left">
              <th className="p-3">Game</th>
              <th className="p-3">Rate</th>
            </tr>
          </thead>
          <tbody>
            {gameRates.map((rate) => (
              <tr
                key={rate._id}
                className="border-b border-gray-700 hover:bg-gray-700 transition"
              >
                <td className="p-3">{rate.gameName}</td>
                <td className="p-3">1:{rate.ratio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Disclaimer Section */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg mt-5">
        <h3 className="text-lg font-bold mb-2">Disclaimer</h3>
        <p className="text-sm text-gray-300">
          Game rates are subject to change without prior notice. Please verify
          the rates before placing your bets.
        </p>
      </div>
    </div>
  );
};

export default GameRates;
