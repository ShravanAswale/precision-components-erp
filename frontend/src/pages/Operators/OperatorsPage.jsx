import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function OperatorsPage() {
  const [operators, setOperators] = useState([]);

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const res = await api.get("/operators");
      setOperators(res.data.data.operators || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async () => {
    const name = window.prompt("Enter Operator Name");
    if (!name) return;

    const shift =
      window.prompt("Enter Default Shift", "Morning") || "Morning";

    try {
      await api.post("/operators", {
        name,
        shift,
      });

      fetchOperators();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to create operator");
    }
  };

  const handleEdit = async (operator) => {
    const name = window.prompt(
      "Enter Operator Name",
      operator.name
    );

    if (!name) return;

    const shift =
      window.prompt(
        "Enter Default Shift",
        operator.shift
      ) || operator.shift;

    try {
      await api.put(`/operators/${operator._id}`, {
        name,
        shift,
      });

      fetchOperators();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to update operator");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this operator?")) return;

    try {
      await api.delete(`/operators/${id}`);
      fetchOperators();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to delete operator");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Manage Operators
        </h1>

        <button
          onClick={handleAdd}
          className="bg-teal-600 text-white px-4 py-2 rounded"
        >
          Add Operator
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Operator Name</th>
              <th className="p-3 text-left">Default Shift</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {operators.map((operator) => (
              <tr key={operator._id} className="border-t">
                <td className="p-3">{operator.name}</td>

                <td className="p-3">{operator.shift}</td>

                <td className="p-3 text-right">
                  <button
                    onClick={() => handleEdit(operator)}
                    className="text-blue-600 mr-4"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(operator._id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}