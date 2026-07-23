import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function MachinesPage() {
  const [machines, setMachines] = useState([]);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const res = await api.get("/machines");
      setMachines(res.data.data.machines || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async () => {
    const machineId = window.prompt("Machine ID");
    if (!machineId) return;

    const machineName = window.prompt("Machine Name");
    if (!machineName) return;

    const status =
      window.prompt("Status (Active/Inactive)", "Active") || "Active";

    try {
      await api.post("/machines", {
        machineId,
        machineName,
        status,
      });

      fetchMachines();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to create machine");
    }
  };

  const handleEdit = async (machine) => {
    const machineName = window.prompt(
      "Machine Name",
      machine.machineName
    );

    if (!machineName) return;

    const status =
      window.prompt("Status", machine.status) || machine.status;

    try {
      await api.put(`/machines/${machine._id}`, {
        machineName,
        status,
      });

      fetchMachines();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to update machine");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this machine?")) return;

    try {
      await api.delete(`/machines/${id}`);
      fetchMachines();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to delete machine");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Machines</h1>

        <button
          onClick={handleAdd}
          className="bg-teal-600 text-white px-4 py-2 rounded"
        >
          Add Machine
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Machine ID</th>
              <th className="p-3 text-left">Machine Name</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {machines.map((machine) => (
              <tr key={machine._id} className="border-t">
                <td className="p-3">{machine.machineId}</td>

                <td className="p-3">{machine.machineName}</td>

                <td className="p-3">{machine.status}</td>

                <td className="p-3 text-right">
                  <button
                    className="text-blue-600 mr-4"
                    onClick={() => handleEdit(machine)}
                  >
                    Edit
                  </button>

                  <button
                    className="text-red-600"
                    onClick={() => handleDelete(machine._id)}
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