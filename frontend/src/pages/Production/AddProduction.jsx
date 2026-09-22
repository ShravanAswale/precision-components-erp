import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { calculateGrade } from "../../utils/calculateGrade";
import api from "../../services/api";

export default function AddProduction() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Step 1: Updated formData
  const [formData, setFormData] = useState({
    operator: "",
    partName: "",
    partNo: "",
    date: new Date().toISOString().split("T")[0],
    shift: "",
    machine: "",
    startQty: "",
    exitQty: "",
    difference: "",
    opn: "",
    cycleTime: "",
    machineRunTime: "",
    targetProd: "",
    actualProd: "",
    qtyRejected: "0",
    rejections: [],
    remarks: "",
  });

  const [rejectionReasons, setRejectionReasons] = useState([]);

  const [grade, setGrade] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [operators, setOperators] = useState([]);
  const [machines, setMachines] = useState([]);
  const [components, setComponents] = useState([]);

  useEffect(() => {
    setGrade(calculateGrade(formData.actualProd));

    fetchOperators();
    fetchMachines();
    fetchComponents();
    fetchRejectionReasons();
  }, []);

  useEffect(() => {
    setGrade(calculateGrade(formData.actualProd));
  }, [formData.actualProd]);

  const fetchOperators = async () => {
    try {
      const res = await api.get("/operators");
      setOperators(res.data.data.operators);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchMachines = async () => {
    try {
      const res = await api.get("/machines");
      setMachines(res.data.data.machines);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchComponents = async () => {
    try {
      const res = await api.get("/components");
      setComponents(res.data.data.components);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchRejectionReasons = async () => {
    try {
      const res = await api.get("/rejection-reasons");

      setRejectionReasons(
        res.data.data.rejectionReasons.filter(
          (reason) => reason.status === true
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Step 2: Stop auto-filling Shift
    if (name === "operator") {
      setFormData((prev) => ({
        ...prev,
        operator: value,
      }));
      return;
    }

    if (name === "partName") {
      const selected = components.find((c) => c._id === value);

      setFormData((prev) => ({
        ...prev,
        partName: value,
        partNo: selected?.partNumber || "",
      }));

      return;
    }

    const updatedData = {
      ...formData,
      [name]: value,
    };

    const cycleTime = Number(updatedData.cycleTime);
    const machineRunTime = Number(updatedData.machineRunTime);

    // Step 3: Update calculation logic for target production
    if (cycleTime > 0 && machineRunTime > 0) {
      updatedData.targetProd = ((machineRunTime * 60) / cycleTime).toFixed(2);
    } else {
      updatedData.targetProd = "";
    }

    // Step 3: Calculation logic for quantity difference
    const start = Number(updatedData.startQty || 0);
    const exit = Number(updatedData.exitQty || 0);
    if (updatedData.startQty !== "" && updatedData.exitQty !== "") {
      updatedData.difference = (exit - start).toFixed(2);
    } else {
      updatedData.difference = "";
    }

    // If rejected quantity becomes 0, remove all rejection breakdowns.
    if (name === "qtyRejected" && Number(value) === 0) {
      updatedData.rejections = [];
    }

    setFormData(updatedData);
  };

  // Add a new rejection reason
  const addRejection = () => {
    setFormData((prev) => ({
      ...prev,
      rejections: [
        ...prev.rejections,
        {
          reason: "",
          qty: "",
        },
      ],
    }));
  };

  // Update rejection reason or quantity
  const updateRejection = (index, field, value) => {
    setFormData((prev) => {
      const updatedRejections = [...prev.rejections];

      updatedRejections[index] = {
        ...updatedRejections[index],
        [field]: value,
      };

      return {
        ...prev,
        rejections: updatedRejections,
      };
    });
  };

  // Remove rejection reason
  const removeRejection = (index) => {
    setFormData((prev) => ({
      ...prev,
      rejections: prev.rejections.filter((_, i) => i !== index),
    }));
  };

  const totalRejectionBreakdown = formData.rejections.reduce(
    (sum, rejection) => sum + Number(rejection.qty || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    setIsSubmitting(true);

    const rejectedQty = Number(formData.qtyRejected || 0);

    // Validate rejection breakdown
    if (rejectedQty > 0) {
      if (formData.rejections.length === 0) {
        alert("Please add at least one rejection reason.");
        setIsSubmitting(false);
        return;
      }

      const invalidRejection = formData.rejections.some(
        (rejection) =>
          !rejection.reason || Number(rejection.qty || 0) <= 0
      );

      if (invalidRejection) {
        alert(
          "Please select a rejection reason and enter a valid quantity for every rejection."
        );
        setIsSubmitting(false);
        return;
      }

      const duplicateReasons = formData.rejections.map(
        (rejection) => rejection.reason
      );

      if (new Set(duplicateReasons).size !== duplicateReasons.length) {
        alert("The same rejection reason cannot be added more than once.");
        setIsSubmitting(false);
        return;
      }

      if (totalRejectionBreakdown !== rejectedQty) {
        alert(
          `Rejection quantity mismatch. Total rejected quantity is ${rejectedQty}, but the rejection reasons total ${totalRejectionBreakdown}.`
        );
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await api.post("/productions", {
        operator: formData.operator,
        date: formData.date,
        shift: formData.shift,
        machine: formData.machine,
        operationNo: formData.opn,
        component: formData.partName,
        cycleTime: Number(formData.cycleTime),
        machineRunTime: Number(formData.machineRunTime),
        targetProduction: Number(formData.targetProd),
        actualProduction: Number(formData.actualProd),
        // Step 7: Send new values to backend
        startQty: Number(formData.startQty),
        exitQty: Number(formData.exitQty),
        difference: Number(formData.difference),
        rejectedQty,
        rejections:
          rejectedQty > 0
            ? formData.rejections.map((rejection) => ({
                reason: rejection.reason,
                qty: Number(rejection.qty),
              }))
            : [],
        remarks: formData.remarks,
      });

      setSubmitted(true);

      setTimeout(() => {
        navigate("/production");
      }, 1000);
    } catch (err) {
      setIsSubmitting(false);
      alert(err.response?.data?.message || "Unable to save");
    }
  };

  const gradeColors = {
    A: {
      bg: "#dcfce7",
      text: "#166534",
      border: "#bbf7d0",
    },
    B: {
      bg: "#dbeafe",
      text: "#1e40af",
      border: "#bfdbfe",
    },
    C: {
      bg: "#fef3c7",
      text: "#92400e",
      border: "#fde68a",
    },
    D: {
      bg: "#fee2e2",
      text: "#991b1b",
      border: "#fecaca",
    },
  };

  const gc = gradeColors[grade] || {
    bg: "#f3f4f6",
    text: "#374151",
    border: "#e5e7eb",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        New Production Entry
      </h1>

      {submitted && (
        <div
          style={{
            backgroundColor: "#dcfce7",
            color: "#166534",
          }}
          className="p-4 rounded-lg mb-6 text-sm font-medium"
        >
          ✓ Production Entry Saved Successfully!
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6"
      >
        {/* Operator + Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operator Name
            </label>

            <select
              name="operator"
              value={formData.operator}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Select Operator</option>

              {operators.map((op) => (
                <option key={op._id} value={op._id}>
                  {op.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>

            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Shift + Machine + OPN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
          {/* Step 4: Make Shift manual dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shift
            </label>

            <select
              name="shift"
              value={formData.shift}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Select Shift</option>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Machine (CNC)
            </label>

            <select
              name="machine"
              value={formData.machine}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Select Machine</option>

              {machines.map((machine) => (
                <option key={machine._id} value={machine._id}>
                  {machine.machineName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OPN (Operation No)
            </label>

            <input
              type="text"
              name="opn"
              value={formData.opn}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Component */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Part Name
            </label>

            <select
              name="partName"
              value={formData.partName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Select Component</option>

              {components.map((component) => (
                <option key={component._id} value={component._id}>
                  {component.componentName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Part No.
            </label>

            <input
              type="text"
              name="partNo"
              value={formData.partNo}
              readOnly
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
        </div>

        {/* Production Details */}
        {/* Step 5: Changed layout grid to lg:grid-cols-7 */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-6 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cycle Time (s)
            </label>

            {/* Step 6: Step="0.01" added */}
            <input
              type="number"
              step="0.01"
              name="cycleTime"
              value={formData.cycleTime}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Machine Run Time
            </label>

            {/* Step 6: Step="0.01" added */}
            <input
              type="number"
              step="0.01"
              name="machineRunTime"
              value={formData.machineRunTime}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Prod
            </label>

            <input
              type="number"
              name="targetProd"
              value={formData.targetProd}
              readOnly
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actual Prod
            </label>

            <input
              type="number"
              name="actualProd"
              value={formData.actualProd}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
            />
          </div>

          {/* Step 5: Start Qty, Exit Qty & Difference added */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Qty
            </label>

            <input
              type="number"
              step="0.01"
              name="startQty"
              value={formData.startQty}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exit Qty
            </label>

            <input
              type="number"
              step="0.01"
              name="exitQty"
              value={formData.exitQty}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difference
            </label>

            <input
              type="number"
              value={formData.difference}
              readOnly
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100"
            />
          </div>
        </div>

        {/* Grade */}
        <div
          className="pt-4 border-t border-gray-100 flex items-center justify-between p-4 rounded-lg"
          style={{ backgroundColor: "#f9fafb" }}
        >
          <div>
            <p className="text-sm text-gray-600 font-medium">
              Calculated Grade
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Based on Actual Production: &lt;60 = D, 60-69 = C,
              70-84 = B, 85+ = A
            </p>
          </div>

          <div
            style={{
              backgroundColor: gc.bg,
              color: gc.text,
              borderColor: gc.border,
            }}
            className="px-6 py-2 rounded-lg border font-bold text-xl"
          >
            {grade || "-"}
          </div>
        </div>

        {/* Rejection Section */}
        <div className="pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qty Rejected
              </label>

              <input
                type="number"
                min="0"
                name="qtyRejected"
                value={formData.qtyRejected}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {Number(formData.qtyRejected) > 0 && (
              <div className="flex items-end">
                <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Rejection Breakdown
                    </span>

                    <span
                      className={
                        totalRejectionBreakdown ===
                        Number(formData.qtyRejected)
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {totalRejectionBreakdown} /{" "}
                      {Number(formData.qtyRejected)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Multiple Rejection Reasons */}
          {Number(formData.qtyRejected) > 0 && (
            <div className="mt-5 space-y-4">
              {formData.rejections.map((rejection, index) => {
                const selectedReasons = formData.rejections
                  .filter((_, i) => i !== index)
                  .map((item) => item.reason);

                return (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="md:col-span-7">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rejection Reason {index + 1}
                      </label>

                      <select
                        value={rejection.reason}
                        onChange={(e) =>
                          updateRejection(
                            index,
                            "reason",
                            e.target.value
                          )
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      >
                        <option value="">
                          Select Type of Rejection
                        </option>

                        {rejectionReasons.map((reason) => (
                          <option
                            key={reason._id}
                            value={reason.reasonName}
                            disabled={selectedReasons.includes(reason.reasonName)}
                          >
                            {reason.reasonName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rejected Qty
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={rejection.qty}
                        onChange={(e) =>
                          updateRejection(
                            index,
                            "qty",
                            e.target.value
                          )
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={() => removeRejection(index)}
                        className="w-full px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addRejection}
                disabled={
                  formData.rejections.length >= rejectionReasons.length
                }
                className="w-full border-2 border-dashed border-teal-300 text-teal-600 hover:bg-teal-50 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add Another Rejection Reason
              </button>

              {formData.rejections.length === 0 && (
                <p className="text-sm text-red-500">
                  Add at least one rejection reason.
                </p>
              )}

              {totalRejectionBreakdown !==
                Number(formData.qtyRejected) && (
                <p className="text-sm text-red-500">
                  Rejection breakdown must equal the total rejected
                  quantity.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Remarks */}
        <div className="pt-4 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Remarks (Optional)
          </label>

          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-8 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Entry"}
          </button>
        </div>
      </form>
    </div>
  );
}