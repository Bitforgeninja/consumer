import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

// 🛠 Parse DD-MM-YYYY to a proper Date object
const parseDate = (str) => {
  const [day, month, year] = str.split("-");
  return new Date(`${year}-${month}-${day}`);
};

// 🛠 Format date as DD-MM-YYYY
const formatDate = (date) => {
  return date.toLocaleDateString("en-GB"); // Returns 31-12-2024
};

// 🛠 Get the day name
const getDayName = (date) => {
  return date.toLocaleDateString("en-US", { weekday: "long" }); // Returns: Monday
};

const MarketChart = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const marketName = location.state?.marketName || "";
  const [marketId, setMarketId] = useState("");
  const [weeklyResults, setWeeklyResults] = useState([]);

  useEffect(() => {
    if (!marketName) {
      console.error("❌ Market Name is missing. Cannot fetch Market ID.");
      return;
    }

    const fetchMarketId = async () => {
      try {
        const response = await axios.get(
          `https://backend-pbn5.onrender.com/api/markets/get-market-id/${marketName}`
        );
        if (response.data.marketId) {
          setMarketId(response.data.marketId);
        }
      } catch (error) {
        console.error("❌ Error fetching market ID:", error.message);
      }
    };

    fetchMarketId();
  }, [marketName]);

  useEffect(() => {
    if (!marketId) return;

    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(
          `https://backend-pbn5.onrender.com/api/markets/get-results/${marketId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const weeklyData = {};
        response.data.forEach((entry) => {
          const date = parseDate(entry.date);
          if (isNaN(date)) {
            console.warn("❌ Invalid date:", entry.date);
            return;
          }

          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay() + 1);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);

          const weekKey = `${formatDate(startOfWeek)} to ${formatDate(endOfWeek)}`;
          const dayName = getDayName(date);

          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = {
              dateRange: weekKey,
              results: {},
            };
          }

          weeklyData[weekKey].results[dayName] = {
            left: entry.openNumber.split(""),
            center: entry.jodiResult,
            right: entry.closeNumber.split(""),
          };
        });

        setWeeklyResults(Object.values(weeklyData));
      } catch (error) {
        console.error("❌ Error fetching market results:", error.message);
      }
    };

    fetchResults();
  }, [marketId, navigate]);

  return (
    <div className="p-4 bg-gray-900 text-white">
      <button
        className="text-white text-lg mb-4 flex items-center space-x-2 hover:scale-110 transition-transform"
        onClick={() => navigate(-1)}
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        <span>Back</span>
      </button>

      <h2 className="text-2xl font-bold text-center mb-4">Matka Market Panel Record</h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-700">
          <thead>
            <tr className="bg-yellow-500 text-black">
              <th className="p-2 border border-gray-700">Date Range</th>
              <th className="p-2 border border-gray-700">Monday</th>
              <th className="p-2 border border-gray-700">Tuesday</th>
              <th className="p-2 border border-gray-700">Wednesday</th>
              <th className="p-2 border border-gray-700">Thursday</th>
              <th className="p-2 border border-gray-700">Friday</th>
              <th className="p-2 border border-gray-700">Saturday</th>
              <th className="p-2 border border-gray-700">Sunday</th>
            </tr>
          </thead>
          <tbody>
            {weeklyResults.length > 0 ? (
              weeklyResults.map((week, index) => (
                <tr key={index} className="text-center bg-gray-800">
                  <td className="p-2 border border-gray-700 font-semibold text-yellow-400">
                    {week.dateRange}
                  </td>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                    (day, idx) => {
                      const dayData = week.results[day] || { left: ["-"], center: "-", right: ["-"] };
                      return (
                        <td key={idx} className="p-2 border border-gray-700">
                          <table className="w-full border-collapse border border-gray-500">
                            <tbody>
                              {dayData.left.map((_, rowIndex) => (
                                <tr key={rowIndex} className="text-center">
                                  <td className="border border-gray-700 p-1">{dayData.left[rowIndex]}</td>
                                  <td className="border border-gray-700 p-1">
                                    {rowIndex === 1 ? (
                                      <strong className="text-2xl text-red-500">{dayData.center}</strong>
                                    ) : (
                                      ""
                                    )}
                                  </td>
                                  <td className="border border-gray-700 p-1">{dayData.right[rowIndex]}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      );
                    }
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-4 text-yellow-400 text-center">
                  No results found for this market.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketChart;
