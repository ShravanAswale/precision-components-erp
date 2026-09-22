import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import api from "../../services/api";

export default function RejectionReasonPage() {
  const [reasons, setReasons] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const initialData = {
    reasonName: "",
    status: true,
  };

  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    fetchReasons();
  }, []);

  const fetchReasons = async () => {
    try {
      const res = await api.get("/rejection-reasons");
      setReasons(res.data.data.rejectionReasons || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        reasonName: formData.reasonName.trim(),
        status: formData.status,
      };

      if (editing) {
        await api.put(`/rejection-reasons/${editing._id}`, payload);
      } else {
        await api.post("/rejection-reasons", payload);
      }

      await fetchReasons();

      setModal(false);
      setEditing(null);
      setFormData(initialData);
    } catch (err) {
      console.error("Save Error:", err);
      alert(
        err.response?.data?.message || "Unable to save rejection reason"
      );
    }
  };

  const handleEdit = (reason) => {
    setEditing(reason);
    setFormData({
      reasonName: reason.reasonName,
      status: reason.status,
    });
    setModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this rejection reason?")) return;

    try {
      await api.delete(`/rejection-reasons/${id}`);
      fetchReasons();
    } catch (err) {
      console.error(err);
      alert("Unable to delete rejection reason");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Rejection Reason Master
          </h1>
          <p className="text-sm text-gray-500">
            Manage all rejection reasons used in Production & PDIR.
          </p>
        </div>

        <button
          onClick={() => {
            setEditing(null);
            setFormData(initialData);
            setModal(true);
          }}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} />
          Add Reason
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Reason</th>
              <th className="text-left p-4">Status</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {reasons.map((reason) => (
              <tr key={reason._id} className="border-t">
                <td className="p-4 font-medium">
                  {reason.reasonName}
                </td>

                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      reason.status
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {reason.status ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => handleEdit(reason)}
                    className="text-teal-600"
                  >
                    <Edit2 size={18} />
                  </button>

                  <button
                    onClick={() => handleDelete(reason._id)}
                    className="text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}

            {reasons.length === 0 && (
              <tr>
                <td
                  colSpan="3"
                  className="text-center p-8 text-gray-400"
                >
                  No rejection reasons found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg">
                {editing ? "Edit Reason" : "Add Rejection Reason"}
              </h3>

              <button onClick={() => setModal(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium">
                  Rejection Reason *
                </label>

                <input
                  type="text"
                  required
                  value={formData.reasonName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reasonName: e.target.value,
                    })
                  }
                  className="w-full mt-1 border rounded-lg px-4 py-2"
                  placeholder="Enter rejection reason"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>

                <select
                  value={String(formData.status)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value === "true",
                    })
                  }
                  className="w-full mt-1 border rounded-lg px-4 py-2"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="border px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg"
                >
                  {editing ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}