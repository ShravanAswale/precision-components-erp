import React, { useState, useEffect } from "react";
import {
  Wrench,
  CheckCircle,
  AlertTriangle,
  Flame,
  Search,
  RotateCcw,
  Eye,
  Edit2,
  Trash2,
  Plus,
  X
} from "lucide-react";
import api from "../../services/api";

const statusStyles = {
  "Available": { bg: "bg-green-50", text: "text-green-700", border: "border-green-100" },
  "Calibration Due": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
  "Sent For Repair": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
  "Under Repair": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100" },
  "Received": { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" }
};

// Helper utility function to clean Mongoose ISO timestamps cleanly for input date components
const formatDate = (isoString) => {
  if (!isoString) return "";
  return isoString.split("T")[0];
};

export default function GageManagementPage() {
  const [gages, setGages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal interaction configurations
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'view' | 'delete' | null
  const [selectedGage, setSelectedGage] = useState(null);
  
  // Form Input States
  const [formData, setFormData] = useState({
    gageName: "",
    gageNumber: "",
    description: "",
    certificateNumber: "",
    rangeSize: "",
    usedForPart: "",
    agencyName: "",
    agencyLocation: "",
    issueDate: "",
    purchaseDate: "",
    calibrationPeriod: "",
    calibrationDueDate: "",
    repairReminderDate: "",
    status: "Available",
    sentForRepair: false,
    sentForRepairDate: "",
    expectedReturnDate: "",
    receivedDate: "",
    remarks: ""
  });

  useEffect(() => {
    fetchGageRecords();
  }, []);

  const fetchGageRecords = async () => {
    try {
      const res = await api.get("/gages");
      setGages(res.data.data.gages || []);
    } catch (err) {
      console.error("Error loading Gage asset database registry:", err);
    }
  };

  // Calculate live statistical counters directly from database array parameters
  const totalGages = gages.length;
  const availableCount = gages.filter(g => g.status === "Available").length;
  const dueCount = gages.filter(g => g.status === "Calibration Due").length;
  const repairCount = gages.filter(g => g.status === "Under Repair" || g.status === "Sent For Repair").length;

  const filteredGages = gages.filter((gage) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = gage.gageName.toLowerCase().includes(query) || gage.gageNumber.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || gage.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
  };

  // Calculates calibration due date by adding months to the issue date
  const calcDueDate = (issueDate, periodMonths) => {
    if (!issueDate || !periodMonths) return "";
    const date = new Date(issueDate);
    date.setMonth(date.getMonth() + Number(periodMonths));
    return date.toISOString().split("T")[0];
  };

  const openFormModal = (mode, gage = null) => {
    setModalMode(mode);
    if (gage) {
      setSelectedGage(gage);
      setFormData({
        gageName: gage.gageName || "",
        gageNumber: gage.gageNumber || "",
        description: gage.description || "",
        certificateNumber: gage.certificateNumber || "",
        rangeSize: gage.rangeSize || "",
        usedForPart: gage.usedForPart || "",
        agencyName: gage.agencyName || "",
        agencyLocation: gage.agencyLocation || "",
        issueDate: formatDate(gage.issueDate),
        purchaseDate: formatDate(gage.purchaseDate),
        calibrationPeriod: gage.calibrationPeriod || "",
        calibrationDueDate: formatDate(gage.calibrationDueDate),
        repairReminderDate: formatDate(gage.repairReminderDate),
        status: gage.status || "Available",
        sentForRepair: gage.sentForRepair || false,
        sentForRepairDate: formatDate(gage.sentForRepairDate),
        expectedReturnDate: formatDate(gage.expectedReturnDate),
        receivedDate: formatDate(gage.receivedDate),
        remarks: gage.remarks || ""
      });
    } else {
      setSelectedGage(null);
      setFormData({
        gageName: "",
        gageNumber: "",
        description: "",
        certificateNumber: "",
        rangeSize: "",
        usedForPart: "",
        agencyName: "",
        agencyLocation: "",
        issueDate: new Date().toISOString().split("T")[0],
        purchaseDate: "",
        calibrationPeriod: "",
        calibrationDueDate: "",
        repairReminderDate: "",
        status: "Available",
        sentForRepair: false,
        sentForRepairDate: "",
        expectedReturnDate: "",
        receivedDate: "",
        remarks: ""
      });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Build payload — strip empty optional date strings to undefined so Mongoose doesn't cast "" as a Date
    const payload = {
      ...formData,
      purchaseDate: formData.purchaseDate || undefined,
      repairReminderDate: formData.repairReminderDate || undefined,
      sentForRepairDate: formData.sentForRepairDate || undefined,
      expectedReturnDate: formData.expectedReturnDate || undefined,
      receivedDate: formData.receivedDate || undefined
    };

    try {
      if (modalMode === "add") {
        await api.post("/gages", payload);
      } else if (modalMode === "edit") {
        await api.put(`/gages/${selectedGage._id}`, payload);
      }
      setModalMode(null);
      fetchGageRecords();
    } catch (err) {
      alert(err.response?.data?.message || "Error updating gage validation index rules.");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/gages/${selectedGage._id}`);
      setModalMode(null);
      fetchGageRecords();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to clear index configuration asset.");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto antialiased">
      
      {/* PAGE HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gauge Management</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor inspection criteria, calibration deadlines and asset maintenance updates.</p>
        </div>
        <button
          onClick={() => openFormModal("add")}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> Add Gauge
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg"><Wrench className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Gauges</p>
            <p className="text-2xl font-bold text-gray-900">{totalGages}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Available</p>
            <p className="text-2xl font-bold text-gray-900">{availableCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Calibration Due</p>
            <p className="text-2xl font-bold text-gray-900">{dueCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Flame className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">In Repair Pipeline</p>
            <p className="text-2xl font-bold text-gray-900">{repairCount}</p>
          </div>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search Gauge Name / Number</label>
            <input
              type="text"
              placeholder="Search by name or serial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="w-full md:w-64">
            <label className="block text-xs font-medium text-gray-500 mb-1">Operational Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="All">All Statuses</option>
              {Object.keys(statusStyles).map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <button
            onClick={handleResetFilters}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 bg-white font-medium"
          >
            <RotateCcw className="w-4 h-4" /> Reset Filters
          </button>
        </div>
      </div>

      {/* GAGE TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gauge Number</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gauge Name</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Certificate No.</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Range / Size</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Used For Part</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue Date</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Calibration Period</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Calibration Due</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGages.map((gage) => {
                const style = statusStyles[gage.status] || statusStyles["Received"];
                return (
                  <tr key={gage._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-teal-700">{gage.gageNumber}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">{gage.gageName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{gage.description || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gage.certificateNumber || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gage.rangeSize || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{gage.usedForPart || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(gage.issueDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gage.calibrationPeriod? `${gage.calibrationPeriod} Month${gage.calibrationPeriod > 1 ? "s" : ""}` : "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-800">{formatDate(gage.calibrationDueDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                        {gage.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button onClick={() => openFormModal("view", gage)} className="text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"><Eye className="w-4 h-4" /> View</button>
                      <button onClick={() => openFormModal("edit", gage)} className="text-teal-600 hover:text-teal-900 inline-flex items-center gap-1"><Edit2 className="w-4 h-4" /> Edit</button>
                      <button onClick={() => { setSelectedGage(gage); setModalMode("delete"); }} className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"><Trash2 className="w-4 h-4" /> Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredGages.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">No gauges found in registry.</div>
        )}
      </div>

      {/* ADD / EDIT FORM MODAL */}
      {(modalMode === "add" || modalMode === "edit") && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">{modalMode === "add" ? "New Gauge Entry" : `Edit Gauge: ${formData.gageNumber}`}</h3>
              <button onClick={() => setModalMode(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gauge Name *</label>
                  <input type="text" required value={formData.gageName} onChange={(e) => setFormData({ ...formData, gageName: e.target.value })} className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500" placeholder="e.g. Vernier Caliper 0–150mm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gauge Number / Serial ID *</label>
                  <input type="text" required value={formData.gageNumber} onChange={(e) => setFormData({ ...formData, gageNumber: e.target.value })} className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Number</label>
                  <input type="text" value={formData.certificateNumber} onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })} className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500" placeholder="e.g. CERT-2024-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Range / Size</label>
                  <input type="text" value={formData.rangeSize} onChange={(e) => setFormData({ ...formData, rangeSize: e.target.value })} className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500" placeholder="e.g. 0–150mm" />
                </div>
                <div>
                  {/* Re-calculates calibration due date when issue date changes */}
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
                  <input type="date" required value={formData.issueDate} onChange={(e) => {
                    const newIssueDate = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      issueDate: newIssueDate,
                      calibrationDueDate: calcDueDate(newIssueDate, prev.calibrationPeriod),
                    }));
                  }} className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  {/* Selecting period auto-fills the calibration due date */}
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calibration Period (Months) *</label>
                  <select
                    required
                    value={formData.calibrationPeriod === "" ? "" : String(formData.calibrationPeriod)}
                    onChange={(e) => {
                      const period = Number(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        calibrationPeriod: period,
                        calibrationDueDate: calcDueDate(prev.issueDate, period),
                      }));
                    }}
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Period</option>
                    {[1, 3, 6, 12, 18, 24, 36].map((m) => (
                      <option key={m} value={m}>
                        {m} {m === 1 ? "Month" : "Months"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calibration Due Date *
                    {formData.calibrationPeriod && formData.issueDate && (
                      <span className="ml-2 text-xs font-normal text-teal-600">(auto-calculated)</span>
                    )}
                  </label>
                  <input type="date" required value={formData.calibrationDueDate} onChange={(e) => setFormData({ ...formData, calibrationDueDate: e.target.value })} className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Repair Reminder Date</label>
                  <input type="date" value={formData.repairReminderDate} onChange={(e) => setFormData({ ...formData, repairReminderDate: e.target.value })} className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
              </div>

              {/* Part usage and agency details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Used For Part</label>
                  <input type="text" value={formData.usedForPart} onChange={(e) => setFormData({ ...formData, usedForPart: e.target.value })} className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500" placeholder="e.g. Gear Box Casing" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
                  <input type="text" value={formData.agencyName} onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })} className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500" placeholder="e.g. ABC Calibration Labs" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agency Location</label>
                  <input type="text" value={formData.agencyLocation} onChange={(e) => setFormData({ ...formData, agencyLocation: e.target.value })} className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500" placeholder="e.g. Pune, Maharashtra" />
                </div>
              </div>

              {/* Maintenance Pipeline Controls toggling explicit schema states */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="sentForRepair" checked={formData.sentForRepair} onChange={(e) => setFormData({ ...formData, sentForRepair: e.target.checked })} className="rounded text-teal-600 focus:ring-teal-500" />
                  <label htmlFor="sentForRepair" className="text-sm font-medium text-gray-700">Sent for External Repair</label>
                </div>

                {formData.sentForRepair && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Expected Return Date</label>
                      <input type="date" value={formData.expectedReturnDate} onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })} className="w-full px-4 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>
                )}

                {modalMode === "edit" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mark Received Date (Sets Asset Available)</label>
                    <input type="date" value={formData.receivedDate} onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })} className="w-full px-4 py-2 border rounded-lg text-sm" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Classification override</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 border rounded-lg text-sm bg-white">
                  {Object.keys(statusStyles).map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} rows="2" className="w-full px-4 py-2 border rounded-lg text-sm resize-none" />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setModalMode(null)} className="px-5 py-2 border text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 bg-white">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* READONLY VIEW DETAILS MODAL */}
      {modalMode === "view" && selectedGage && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <div>
                <span className="text-xs font-bold text-teal-600 uppercase bg-teal-50 px-2 py-0.5 rounded border border-teal-100">{selectedGage.gageNumber}</span>
                <h3 className="text-lg font-bold text-gray-800 mt-1">{selectedGage.gageName}</h3>              </div>
              <button onClick={() => setModalMode(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <div><strong>Issue Date:</strong> {formatDate(selectedGage.issueDate) || "-"}</div>
                <div><strong>Purchase Date:</strong> {formatDate(selectedGage.purchaseDate) || "-"}</div>
                <div><strong>Description:</strong> {selectedGage.description || "-"}</div>
                <div><strong>Certificate No.:</strong> {selectedGage.certificateNumber || "-"}</div>
                <div><strong>Range / Size:</strong> {selectedGage.rangeSize || "-"}</div>
                <div><strong>Used For Part:</strong> {selectedGage.usedForPart || "-"}</div>
                <div><strong>Agency Name:</strong> {selectedGage.agencyName || "-"}</div>
                <div><strong>Agency Location:</strong> {selectedGage.agencyLocation || "-"}</div>
                <div><strong>Calibration Period:</strong> {selectedGage.calibrationPeriod ? `${selectedGage.calibrationPeriod} Month${selectedGage.calibrationPeriod > 1 ? "s" : ""}` : "-"}</div>
                <div><strong>Calibration Due:</strong> <span className="text-amber-700 font-semibold">{formatDate(selectedGage.calibrationDueDate)}</span></div>
                <div><strong>Reminder Date:</strong> {formatDate(selectedGage.repairReminderDate) || "-"}</div>
                <div><strong>Sent for Repair:</strong> {selectedGage.sentForRepair ? "Yes" : "No"}</div>
                {selectedGage.sentForRepairDate && <div><strong>Repair Out Date:</strong> {formatDate(selectedGage.sentForRepairDate)}</div>}
                {selectedGage.expectedReturnDate && <div><strong>Expected Return:</strong> {formatDate(selectedGage.expectedReturnDate)}</div>}
                {selectedGage.receivedDate && <div><strong>Received Date:</strong> {formatDate(selectedGage.receivedDate)}</div>}
              </div>
              <div className="pt-2 border-t">
                <strong>Current Status: </strong> 
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyles[selectedGage.status]?.bg} ${statusStyles[selectedGage.status]?.text}`}>
                  {selectedGage.status}
                </span>
              </div>
              <p className="text-xs bg-gray-50 p-2 rounded text-gray-500 mt-2"><strong>Remarks History:</strong> {selectedGage.remarks || "No supplementary remarks found."}</p>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setModalMode(null)} className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {modalMode === "delete" && selectedGage && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="w-6 h-6" /></div>
              <h3 className="text-lg font-bold">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-gray-600">
              Are you certain you wish to delete gauge entry <span className="font-semibold text-gray-900">{selectedGage.gageNumber}</span>? This action is permanent.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModalMode(null)} className="px-4 py-2 border rounded-lg text-sm text-gray-700 bg-white">Cancel</button>
              <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg">Delete Resource</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}