import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

// Format "DD-MM-YYYY" to Date object
const parseDate = (dateStr) => {
  const [day, month, year] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day); // JS Date uses 0-indexed months
};

const formatDate = (date) =>
  date.toLocaleDateString("en-GB"); // Format as DD-MM-YYYY

const getDayName = (date) =>
  date.toLocaleDateString("en-US", { weekday: "long" });

const MarketChart = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const marketName = location.state?.marketName || "";
  const [marketId, setMarketId] = useState("");
  const [weeklyResults, setWeeklyResults] = useState([]);

  useEffect(() => {
    if (!marketName) return;
    const fetchMarketId = async () => {
      try {
        const res = await axios.get(
          `https://backend-pbn5.onrender.com/api/markets/get-market-id/${marketName}`
        );
        setMarketId(res.data.marketId);
      } catch (error) {
        console.error("❌ Error fetching Market ID:", error.message);
      }
    };
    fetchMarketId();
  }, [marketName]);

  useEffect(() => {
    if (!marketId) return;

    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        const res = await axios.get(
          `https://backend-pbn5.onrender.com/api/markets/get-results/${marketId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const rawData = res.data;
        const weeklyData = {};

        rawData.forEach((entry) => {
          const date = parseDate(entry.date);
          if (isNaN(date)) {
            console.warn("❌ Invalid date:", entry.date);
            return;
          }

          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

          const weekKey = `${formatDate(startOfWeek)} to ${formatDate(endOfWeek)}`;
          const dayName = getDayName(date); // "Monday", etc.

          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = {
              dateRange: weekKey,
              results: {},
              weekStart: startOfWeek.getTime(), // for sorting
            };
          }

          weeklyData[weekKey].results[dayName] = {
            left: entry.openNumber?.split("") || ["-", "-", "-"],
            center: entry.jodiResult || "-",
            right: entry.closeNumber?.split("") || ["-", "-", "-"],
          };
        });

        const sortedWeeks = Object.values(weeklyData).sort(
          (a, b) => b.weekStart - a.weekStart
        );

        setWeeklyResults(sortedWeeks);
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

      <h2 className="text-2xl font-bold text-center mb-4">
        Matka Market Panel Record
      </h2>

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
                      const dayData = week.results[day] || {
                        left: ["-", "-", "-"],
                        center: "-",
                        right: ["-", "-", "-"],
                      };

                      return (
                        <td key={idx} className="p-2 border border-gray-700">
                          <table className="w-full border-collapse border border-gray-500">
                            <tbody>
                              {[0, 1, 2].map((rowIndex) => (
                                <tr key={rowIndex} className="text-center">
                                  <td className="border border-gray-700 p-1">
                                    {dayData.left[rowIndex] || "-"}
                                  </td>
                                  <td className="border border-gray-700 p-1">
                                    {rowIndex === 1 ? (
                                      <strong className="text-2xl text-red-500">
                                        {dayData.center}
                                      </strong>
                                    ) : (
                                      ""
                                    )}
                                  </td>
                                  <td className="border border-gray-700 p-1">
                                    {dayData.right[rowIndex] || "-"}
                                  </td>
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
