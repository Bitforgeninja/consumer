import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

// 🛠 Utility function to format dates as DD-MM-YYYY
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date)) return "Invalid Date"; // Prevents breaking due to bad data
  return date.toLocaleDateString("en-GB"); // Returns: 22-04-2019
};

// 🛠 Utility function to get the weekday name
const getDayName = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date)) return "Invalid Date";
  return date.toLocaleDateString("en-US", { weekday: "long" }); // Returns: Monday, Tuesday, etc.
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
        console.log("📢 Fetching Market ID for:", marketName);
        const response = await axios.get(
          `https://only-backend-je4j.onrender.com/api/markets/get-market-id/${marketName}`
        );

        if (response.data.marketId) {
          console.log("✅ Market ID Fetched:", response.data.marketId);
          setMarketId(response.data.marketId);
        }
      } catch (error) {
        console.error(
          "❌ Error fetching market ID:",
          error.response ? error.response.data : error.message
        );
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
          console.error("❌ No authentication token found! Redirecting to login...");
          navigate("/login");
          return;
        }

        console.log("📢 Fetching Market Results for Market ID:", marketId);
        console.log("🔑 Token being sent:", token);

        const response = await axios.get(
          `https://only-backend-je4j.onrender.com/api/markets/get-results/${marketId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("✅ API Response:", response.data);

        // 🔄 **Process data to group by week and map days correctly**
        const weeklyData = {};
        response.data.forEach((entry) => {
          const date = new Date(entry.date);
          if (isNaN(date)) {
            console.error(`❌ Invalid date in response: ${entry.date}`);
            return;
          }

          // Determine the start (Monday) and end (Sunday) of the week
          const startDate = new Date(date);
          startDate.setDate(date.getDate() - date.getDay() + 1); // Move to Monday
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6); // Move to Sunday

          const weekKey = `${formatDate(startDate)} to ${formatDate(endDate)}`;
          const dayName = getDayName(entry.date); // Get weekday name (Monday, Tuesday, etc.)

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

        console.log("✅ Transformed Weekly Data:", weeklyData);
        setWeeklyResults(Object.values(weeklyData));
      } catch (error) {
        console.error(
          "❌ Error fetching market results:",
          error.response ? error.response.data : error.message
        );
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
