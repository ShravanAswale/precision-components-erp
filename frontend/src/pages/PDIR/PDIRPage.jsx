import React, { useState, useEffect } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import api from "../../services/api";

export default function PDIRPage() {
  const [records, setRecords] = useState([]);
  const [operators, setOperators] = useState([]);
  const [components, setComponents] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");

  const [modalMode, setModalMode] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const initialFormData = {
    component: "",
    partName: "",
    partNumber: "",
    checkingOperator: "",
    packingOperator: "",
    qtyChecked: "",
    qtyRejected: "0",
    rejectionReason: "",
    remarks: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  // Same rejection types used in Production Entry
  const rejectionReasons = [
    "TOTAL LENGTH UNDERSIZE",
    "TOTAL LENGTH OVERSIZE",
    "OD UNDERSIZE",
    "OD OVERSIZE",
    "GROOVE OD OVERSIZE",
    "GROOVE UNEVEN",
    "GROOVE OD UNDERSIZE",
    "ROUGH SURFACE FINISH",
    "R/M PROBLEM",
    "ROD BEND",
    "PLATTING",
    "ID OVERSIZE",
    "ID UNDERSIZE",
    "THREADING GO NC",
    "THREADING NO-GO PASS",
    "CHAMFER OUT",
    "DRILL OUT",
    "FACE UNEVEN",
    "FLAT THREAD",
    "DRILL DEPTH UNDERSIZE",
    "DRILL DEPTH OVERSIZE",
    "TOOL MARK ON OD",
  ];

  // ==========================================
  // INITIAL DATA
  // ==========================================

  useEffect(() => {
    fetchPdirRecords();
    fetchOperators();
    fetchComponents();
  }, []);

  // ==========================================
  // FETCH PDIR
  // ==========================================

  const fetchPdirRecords = async () => {
    try {
      const res = await api.get("/pdirs");

      console.log("PDIR Response:", res.data);

      setRecords(res.data?.data?.pdirs || []);
    } catch (err) {
      console.error("Error fetching PDIR:", err);
    }
  };

  // ==========================================
  // FETCH OPERATORS
  // ==========================================

  const fetchOperators = async () => {
    try {
      const res = await api.get("/operators");

      console.log("Operators Response:", res.data);

      setOperators(res.data?.data?.operators || []);
    } catch (err) {
      console.error("Error loading operators:", err);
    }
  };

  // ==========================================
  // FETCH COMPONENTS
  // SAME ENDPOINT AS ADD PRODUCTION
  // ==========================================

  const fetchComponents = async () => {
    try {
      const res = await api.get("/components");

      console.log("Components Response:", res.data);

      setComponents(res.data?.data?.components || []);
    } catch (err) {
      console.error("Error loading components:", err);

      setComponents([]);
    }
  };

  // ==========================================
  // STATISTICS
  // ==========================================

  const totalPdirCount = records.length;

  const totalCheckedQty = records.reduce(
    (sum, record) => sum + Number(record.qtyChecked || 0),
    0
  );

  const totalRejections = records.reduce(
    (sum, record) => sum + Number(record.qtyRejected || 0),
    0
  );

  const today = new Date().toISOString().split("T")[0];

  const todayPdirCount = records.filter((record) => {
    return record.createdAt?.split("T")[0] === today;
  }).length;

  // ==========================================
  // FILTER
  // ==========================================

  const filteredRecords = records.filter((record) => {
    if (filterStatus === "Accepted") {
      return Number(record.qtyRejected || 0) === 0;
    }

    if (filterStatus === "Rejected") {
      return Number(record.qtyRejected || 0) > 0;
    }

    return true;
  });

  // ==========================================
  // OPEN MODAL
  // ==========================================

  const openFormModal = (mode, record = null) => {
    setModalMode(mode);

    if (record) {
      setSelectedRecord(record);

      setFormData({
        component: record.component?._id || record.component || "",
        partName: record.partName || "",
        partNumber: record.partNumber || "",
        checkingOperator:
          record.checkingOperator?._id || record.checkingOperator || "",
        packingOperator:
          record.packingOperator?._id || record.packingOperator || "",
        qtyChecked: record.qtyChecked ?? "",
        qtyRejected: record.qtyRejected ?? "0",
        rejectionReason: record.rejectionReason || "",
        remarks: record.remarks || "",
      });
    } else {
      setSelectedRecord(null);
      setFormData(initialFormData);
    }
  };

  // ==========================================
  // COMPONENT CHANGE
  // ==========================================

  const handleComponentChange = (e) => {
    const componentId = e.target.value;

    const selectedComponent = components.find(
      (component) => component._id === componentId
    );

    setFormData((prev) => ({
      ...prev,
      component: componentId,
      partName: selectedComponent?.componentName || "",
      partNumber: selectedComponent?.partNumber || "",
    }));
  };

  // ==========================================
  // REJECTED QTY
  // ==========================================

  const handleRejectedQtyChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      qtyRejected: value,
      rejectionReason:
        Number(value) > 0 ? prev.rejectionReason : "",
    }));
  };

  // ==========================================
  // ADD / UPDATE
  // ==========================================

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const checkedQty = Number(formData.qtyChecked || 0);
    const rejectedQty = Number(formData.qtyRejected || 0);

    if (!formData.component) {
      alert("Please select a component.");
      return;
    }

    if (!formData.partName || !formData.partNumber) {
      alert("Selected component details are missing.");
      return;
    }

    if (rejectedQty > checkedQty) {
      alert(
        "Rejected quantity cannot be greater than checked quantity."
      );
      return;
    }

    if (rejectedQty > 0 && !formData.rejectionReason) {
      alert("Please select Type of Rejection.");
      return;
    }

    const payload = {
      component: formData.component,
      partName: formData.partName,
      partNumber: formData.partNumber,
      checkingOperator: formData.checkingOperator,
      packingOperator: formData.packingOperator,
      qtyChecked: checkedQty,
      qtyRejected: rejectedQty,
      rejectionReason:
        rejectedQty > 0 ? formData.rejectionReason : "",
      remarks: formData.remarks,
    };

    console.log("PDIR Payload:", payload);

    try {
      if (modalMode === "add") {
        await api.post("/pdirs", payload);
      } else if (modalMode === "edit") {
        await api.put(
          `/pdirs/${selectedRecord._id}`,
          payload
        );
      }

      setModalMode(null);
      setSelectedRecord(null);
      setFormData(initialFormData);

      await fetchPdirRecords();
    } catch (err) {
      console.error("PDIR Save Error:", err);
      console.error("Backend Response:", err.response?.data);

      alert(
        err.response?.data?.message ||
          "Unable to save PDIR record."
      );
    }
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDeleteConfirm = async () => {
    if (!selectedRecord?._id) return;

    try {
      await api.delete(`/pdirs/${selectedRecord._id}`);

      setModalMode(null);
      setSelectedRecord(null);

      await fetchPdirRecords();
    } catch (err) {
      console.error("PDIR Delete Error:", err);

      alert(
        err.response?.data?.message ||
          "Unable to delete PDIR record."
      );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto antialiased">

      {/* HEADER */}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            PDIR Management
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage inspection reports and quality parameters.
          </p>
        </div>

        <button
          onClick={() => openFormModal("add")}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" />
          New PDIR
        </button>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
            <ClipboardCheck className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Total PDIR Logs
            </p>

            <p className="text-2xl font-bold">
              {totalPdirCount}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Total Checked Qty
            </p>

            <p className="text-2xl font-bold">
              {totalCheckedQty}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Total Rejections
            </p>

            <p className="text-2xl font-bold">
              {totalRejections}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Today's PDIR Logs
            </p>

            <p className="text-2xl font-bold">
              {todayPdirCount}
            </p>
          </div>
        </div>

      </div>

      {/* FILTER */}

      <div className="bg-white rounded-xl shadow-sm border p-5 flex justify-between items-center">

        <h2 className="text-sm font-semibold text-gray-700 uppercase">
          Quality Logs Output
        </h2>

        <div className="flex gap-2">
          {["All", "Accepted", "Rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm ${
                filterStatus === status
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

      </div>

      {/* TABLE */}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

        <div className="overflow-x-auto">

          <table className="min-w-full divide-y">

            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs">
                  Date
                </th>

                <th className="px-4 py-3 text-left text-xs">
                  Part Details
                </th>

                <th className="px-4 py-3 text-left text-xs">
                  Operators
                </th>

                <th className="px-4 py-3 text-left text-xs">
                  Checked
                </th>

                <th className="px-4 py-3 text-left text-xs">
                  Rejected
                </th>

                <th className="px-4 py-3 text-left text-xs">
                  Type of Rejection / Remarks
                </th>

                <th className="px-4 py-3 text-right text-xs">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">

              {filteredRecords.map((record) => (

                <tr
                  key={record._id}
                  className="hover:bg-gray-50"
                >

                  <td className="px-4 py-4 text-sm">
                    {record.createdAt
                      ? new Date(
                          record.createdAt
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="px-4 py-4 text-sm">

                    <span className="font-semibold block">
                      {record.partName}
                    </span>

                    <span className="text-teal-700 text-xs">
                      {record.partNumber}
                    </span>

                  </td>

                  <td className="px-4 py-4 text-sm">

                    <span className="block">
                      Check:{" "}
                      {record.checkingOperator?.name ||
                        "Unassigned"}
                    </span>

                    <span className="text-gray-400 text-xs">
                      Pack:{" "}
                      {record.packingOperator?.name ||
                        "Unassigned"}
                    </span>

                  </td>

                  <td className="px-4 py-4">
                    {record.qtyChecked}
                  </td>

                  <td className="px-4 py-4">
                    {record.qtyRejected}
                  </td>

                  <td className="px-4 py-4 text-sm">

                    <span className="font-semibold block">
                      {record.rejectionReason || "-"}
                    </span>

                    <span className="text-gray-400 text-xs">
                      {record.remarks || "-"}
                    </span>

                  </td>

                  <td className="px-4 py-4 text-right space-x-3">

                    <button
                      onClick={() =>
                        openFormModal("view", record)
                      }
                      className="text-gray-500"
                    >
                      <Eye className="w-4 h-4 inline" /> View
                    </button>

                    <button
                      onClick={() =>
                        openFormModal("edit", record)
                      }
                      className="text-teal-600"
                    >
                      <Edit2 className="w-4 h-4 inline" /> Edit
                    </button>

                    <button
                      onClick={() => {
                        setSelectedRecord(record);
                        setModalMode("delete");
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 inline" /> Delete
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        {filteredRecords.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No PDIR records found.
          </div>
        )}

      </div>

      {/* ADD / EDIT MODAL */}

      {(modalMode === "add" ||
        modalMode === "edit") && (

        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6">

            <div className="flex justify-between border-b pb-3 mb-4">

              <h3 className="font-bold">
                {modalMode === "add"
                  ? "Create PDIR Log Entry"
                  : "Modify PDIR Record"}
              </h3>

              <button
                type="button"
                onClick={() => setModalMode(null)}
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <form
              onSubmit={handleFormSubmit}
              className="space-y-4"
            >

              {/* COMPONENT */}

              <div>

                <label className="block text-sm mb-1">
                  Part Name *
                </label>

                <select
                  name="component"
                  value={formData.component}
                  onChange={handleComponentChange}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="">
                    Select Component
                  </option>

                  {components.map((component) => (
                    <option
                      key={component._id}
                      value={component._id}
                    >
                      {component.componentName}
                    </option>
                  ))}
                </select>

              </div>

              {/* PART NUMBER */}

              <div>

                <label className="block text-sm mb-1">
                  Part Number
                </label>

                <input
                  type="text"
                  value={formData.partNumber}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                />

              </div>

              <div className="grid grid-cols-2 gap-4">

                {/* CHECKING OPERATOR */}

                <div>

                  <label className="block text-sm mb-1">
                    Checking Operator *
                  </label>

                  <select
                    required
                    value={formData.checkingOperator}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        checkingOperator:
                          e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                  >
                    <option value="">
                      Select Checker
                    </option>

                    {operators.map((operator) => (
                      <option
                        key={operator._id}
                        value={operator._id}
                      >
                        {operator.name}
                      </option>
                    ))}
                  </select>

                </div>

                {/* PACKING OPERATOR */}

                <div>

                  <label className="block text-sm mb-1">
                    Packing Operator *
                  </label>

                  <select
                    required
                    value={formData.packingOperator}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        packingOperator:
                          e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                  >
                    <option value="">
                      Select Packer
                    </option>

                    {operators.map((operator) => (
                      <option
                        key={operator._id}
                        value={operator._id}
                      >
                        {operator.name}
                      </option>
                    ))}
                  </select>

                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm mb-1">
                    Quantity Checked *
                  </label>

                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.qtyChecked}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        qtyChecked:
                          e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />

                </div>

                <div>

                  <label className="block text-sm mb-1">
                    Quantity Rejected *
                  </label>

                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.qtyRejected}
                    onChange={(e) =>
                      handleRejectedQtyChange(
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />

                </div>

              </div>

              {/* REJECTION TYPE */}

              {Number(formData.qtyRejected) > 0 && (

                <div>

                  <label className="block text-sm mb-1">
                    Type of Rejection *
                  </label>

                  <select
                    required
                    value={formData.rejectionReason}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rejectionReason:
                          e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                  >
                    <option value="">
                      Select Type of Rejection
                    </option>

                    {rejectionReasons.map((reason) => (
                      <option
                        key={reason}
                        value={reason}
                      >
                        {reason}
                      </option>
                    ))}
                  </select>

                </div>

              )}

              {/* REMARKS */}

              <div>

                <label className="block text-sm mb-1">
                  Remarks
                </label>

                <textarea
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  rows="2"
                  className="w-full px-4 py-2 border rounded-lg"
                />

              </div>

              <div className="flex justify-end gap-2">

                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg"
                >
                  {modalMode === "add"
                    ? "Save PDIR"
                    : "Update PDIR"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* VIEW MODAL */}

      {modalMode === "view" &&
        selectedRecord && (

        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full space-y-3">

            <h3 className="text-lg font-bold border-b pb-2">
              {selectedRecord.partName} Details
            </h3>

            <p>
              <strong>Part Number:</strong>{" "}
              {selectedRecord.partNumber}
            </p>

            <p>
              <strong>Checking Operator:</strong>{" "}
              {selectedRecord.checkingOperator?.name ||
                "-"}
            </p>

            <p>
              <strong>Packing Operator:</strong>{" "}
              {selectedRecord.packingOperator?.name ||
                "-"}
            </p>

            <p>
              <strong>Quantity Checked:</strong>{" "}
              {selectedRecord.qtyChecked}
            </p>

            <p>
              <strong>Quantity Rejected:</strong>{" "}
              {selectedRecord.qtyRejected}
            </p>

            <p>
              <strong>Type of Rejection:</strong>{" "}
              {selectedRecord.rejectionReason ||
                "-"}
            </p>

            <p>
              <strong>Remarks:</strong>{" "}
              {selectedRecord.remarks || "-"}
            </p>

            <div className="flex justify-end">

              <button
                onClick={() => setModalMode(null)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

      {/* DELETE MODAL */}

      {modalMode === "delete" &&
        selectedRecord && (

        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">

            <h3 className="text-lg font-bold text-red-600 mb-4">
              Confirm Delete
            </h3>

            <p className="mb-6">
              Delete PDIR record for{" "}
              <strong>
                {selectedRecord.partName}
              </strong>
              ?
            </p>

            <div className="flex justify-end gap-3">

              <button
                onClick={() => setModalMode(null)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Delete
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}