import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function ComponentsPage() {
  const [components, setComponents] = useState([]);

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      const res = await api.get("/components");
      setComponents(res.data.data.components || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async () => {
    const componentName = window.prompt("Enter Part Name");
    if (!componentName) return;

    const partNumber = window.prompt("Enter Part Number");
    if (!partNumber) return;

    try {
      await api.post("/components", {
        componentName,
        partNumber,
      });

      fetchComponents();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to create component");
    }
  };

  const handleEdit = async (component) => {
    const componentName = window.prompt(
      "Enter Part Name",
      component.componentName
    );

    if (!componentName) return;

    const partNumber = window.prompt(
      "Enter Part Number",
      component.partNumber
    );

    if (!partNumber) return;

    try {
      await api.put(`/components/${component._id}`, {
        componentName,
        partNumber,
      });

      fetchComponents();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to update component");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this component?")) return;

    try {
      await api.delete(`/components/${id}`);
      fetchComponents();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to delete component");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Components</h1>

        <button
          onClick={handleAdd}
          className="bg-teal-600 text-white px-4 py-2 rounded"
        >
          Add Component
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Part Name</th>
              <th className="p-3 text-left">Part Number</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {components.map((component) => (
              <tr key={component._id} className="border-t">
                <td className="p-3">{component.componentName}</td>

                <td className="p-3">{component.partNumber}</td>

                <td className="p-3 text-right">
                  <button
                    onClick={() => handleEdit(component)}
                    className="text-blue-600 mr-4"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(component._id)}
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