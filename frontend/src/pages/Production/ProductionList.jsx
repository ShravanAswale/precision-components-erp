import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";
import { calculateGrade } from "../../utils/calculateGrade";

export default function ProductionList() {
  const [filter, setFilter] = useState("all");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchProductions();
  }, []);

  // Fetch all production entries
  const fetchProductions = async () => {
    try {
      setLoading(true);

      const res = await api.get("/productions");

      setEntries(res.data.data.productions || []);
    } catch (err) {
      console.error("Error loading productions:", err);

      alert(
        err.response?.data?.message ||
          "Unable to load production entries"
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete Production Entry
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this production entry?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(id);

      await api.delete(`/productions/${id}`);

      // Remove deleted entry immediately from UI
      setEntries((previousEntries) =>
        previousEntries.filter((entry) => entry._id !== id)
      );

      alert("Production entry deleted successfully");
    } catch (err) {
      console.error("Error deleting production:", err);

      alert(
        err.response?.data?.message ||
          "Unable to delete production entry"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Filter Production Entries
  const filteredEntries = entries.filter((entry) => {
    switch (filter) {
      case "production":
        return Number(entry.rejectedQty || 0) === 0;

      case "rejections":
        return Number(entry.rejectedQty || 0) > 0;

      default:
        return true;
    }
  });

  // Grade Colors
  const gradeColors = {
    A: {
      bg: "#dcfce7",
      text: "#166534",
    },

    B: {
      bg: "#dbeafe",
      text: "#1e40af",
    },

    C: {
      bg: "#fef3c7",
      text: "#92400e",
    },

    D: {
      bg: "#fee2e2",
      text: "#991b1b",
    },
  };

  // Loading State
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading production entries...
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">

        <h1 className="text-2xl font-bold text-gray-800">
          Production & Rejection Logs
        </h1>

        <Link
          to="/production/add"
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          + New Production Entry
        </Link>

      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">

        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-teal-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>

        <button
          onClick={() => setFilter("production")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "production"
              ? "bg-teal-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Production
        </button>

        <button
          onClick={() => setFilter("rejections")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "rejections"
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Rejections
        </button>

      </div>

      {/* Production Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">

        <table className="min-w-full divide-y divide-gray-200">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operator
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Part
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shift
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Machine
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actual
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rejected
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>

              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>

            </tr>

          </thead>

          <tbody className="divide-y divide-gray-200">

            {filteredEntries.length === 0 ? (

              <tr>
                <td
                  colSpan="10"
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No production entries found.
                </td>
              </tr>

            ) : (

              filteredEntries.map((entry) => {

                const grade =
                  entry.grade ||
                  calculateGrade(entry.actualProduction);

                const gc =
                  gradeColors[grade] || {
                    bg: "#f3f4f6",
                    text: "#374151",
                  };

                return (

                  <tr
                    key={entry._id || entry.id}
                    className="hover:bg-gray-50 transition-colors"
                  >

                    {/* Date */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.date
                        ? new Date(entry.date).toLocaleDateString()
                        : "-"}
                    </td>

                    {/* Operator */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.operator?.name || "-"}
                    </td>

                    {/* Component */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">

                      {entry.component?.componentName || "-"}

                      <br />

                      <span className="text-xs text-gray-500">
                        {entry.component?.partNumber || ""}
                      </span>

                    </td>

                    {/* Shift */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.shift || "-"}
                    </td>

                    {/* Machine */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.machine?.machineName || "-"}
                    </td>

                    {/* Target */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.targetProduction || 0}
                    </td>

                    {/* Actual */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.actualProduction || 0}
                    </td>

                    {/* Rejected */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.rejectedQty || 0}
                    </td>

                    {/* Grade */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm">

                      <span
                        style={{
                          backgroundColor: gc.bg,
                          color: gc.text,
                        }}
                        className="px-2 py-1 text-xs font-semibold rounded-full"
                      >
                        Grade {grade}
                      </span>

                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">

                      <Link
                        to={`/production/edit/${entry._id || entry.id}`}
                        className="text-teal-600 hover:text-teal-900 mr-4"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(entry._id)}
                        disabled={deletingId === entry._id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === entry._id
                          ? "Deleting..."
                          : "Delete"}
                      </button>

                    </td>

                  </tr>

                );
              })

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}