import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { calculateGrade } from "../../utils/calculateGrade";

export default function EditProduction() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    operator: "",
    partName: "",
    partNo: "",
    date: new Date().toISOString().split("T")[0],
    shift: "Morning",
    machine: "",
    opn: "",
    cycleTime: "",
    machineRunTime: "",
    targetProd: "",
    actualProd: "",
    qtyRejected: "0",
    rejections: [],
    remarks: "",
  });

  const [grade, setGrade] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [operators, setOperators] = useState([]);
  const [machines, setMachines] = useState([]);
  const [components, setComponents] = useState([]);

  const rejectionTypes = [
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [
          operatorsRes,
          machinesRes,
          componentsRes,
          productionRes,
        ] = await Promise.all([
          api.get("/operators"),
          api.get("/machines"),
          api.get("/components"),
          api.get(`/productions/${id}`),
        ]);

        setOperators(
          operatorsRes.data.data.operators || []
        );

        setMachines(
          machinesRes.data.data.machines || []
        );

        setComponents(
          componentsRes.data.data.components || []
        );

        const p = productionRes.data.data;

        // Support new multiple rejection structure
        let existingRejections = [];

        if (
          Array.isArray(p.rejections) &&
          p.rejections.length > 0
        ) {
          existingRejections = p.rejections.map((rejection) => ({
            reason: rejection.reason || "",
            qty: rejection.qty ?? "",
          }));
        } else if (
          Number(p.rejectedQty || 0) > 0 &&
          p.rejectionReason
        ) {
          // Backward compatibility for old records
          existingRejections = [
            {
              reason: p.rejectionReason,
              qty: p.rejectedQty,
            },
          ];
        }

        setFormData({
          operator: p.operator?._id || "",
          date: p.date
            ? new Date(p.date).toISOString().split("T")[0]
            : "",
          shift: p.shift || "",
          machine: p.machine?._id || "",
          opn: p.operationNo || "",
          partName: p.component?._id || "",
          partNo: p.component?.partNumber || "",
          cycleTime: p.cycleTime ?? "",
          machineRunTime: p.machineRunTime ?? "",
          targetProd: p.targetProduction ?? "",
          actualProd: p.actualProduction ?? "",
          qtyRejected: p.rejectedQty ?? 0,
          rejections: existingRejections,
          remarks: p.remarks || "",
        });
      } catch (err) {
        console.error(
          "Error loading production:",
          err
        );

        alert(
          err.response?.data?.message ||
            "Unable to load production entry"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  useEffect(() => {
    setGrade(
      calculateGrade(
        Number(formData.actualProd || 0)
      )
    );
  }, [formData.actualProd]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Operator selection
    if (name === "operator") {
      const selectedOperator = operators.find(
        (operator) => operator._id === value
      );

      setFormData((prev) => ({
        ...prev,
        operator: value,
        shift: selectedOperator?.shift || "",
      }));

      return;
    }

    // Component selection
    if (name === "partName") {
      const selectedComponent = components.find(
        (component) => component._id === value
      );

      setFormData((prev) => ({
        ...prev,
        partName: value,
        partNo: selectedComponent?.partNumber || "",
      }));

      return;
    }

    // Rejected quantity
    if (name === "qtyRejected") {
      setFormData((prev) => ({
        ...prev,
        qtyRejected: value,
        rejections:
          Number(value) > 0
            ? prev.rejections
            : [],
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  const updateRejection = (
    index,
    field,
    value
  ) => {
    setFormData((prev) => {
      const updatedRejections = [
        ...prev.rejections,
      ];

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

  const removeRejection = (index) => {
    setFormData((prev) => ({
      ...prev,
      rejections: prev.rejections.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const totalRejectionBreakdown =
    formData.rejections.reduce(
      (sum, rejection) =>
        sum + Number(rejection.qty || 0),
      0
    );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rejectedQty = Number(
      formData.qtyRejected || 0
    );

    // Validate rejection breakdown
    if (rejectedQty > 0) {
      if (formData.rejections.length === 0) {
        alert(
          "Please add at least one rejection reason."
        );
        return;
      }

      const invalidRejection =
        formData.rejections.some(
          (rejection) =>
            !rejection.reason ||
            Number(rejection.qty || 0) <= 0
        );

      if (invalidRejection) {
        alert(
          "Please select a rejection reason and enter a valid quantity for every rejection."
        );
        return;
      }

      // Prevent duplicate reasons
      const reasons = formData.rejections.map(
        (rejection) => rejection.reason
      );

      if (
        new Set(reasons).size !==
        reasons.length
      ) {
        alert(
          "The same rejection reason cannot be added more than once."
        );
        return;
      }

      // Make sure reason quantities equal total rejected
      if (
        totalRejectionBreakdown !== rejectedQty
      ) {
        alert(
          `Rejection quantity mismatch. Total rejected quantity is ${rejectedQty}, but the rejection reasons total ${totalRejectionBreakdown}.`
        );
        return;
      }
    }

    try {
      await api.put(`/productions/${id}`, {
        operator: formData.operator,
        date: formData.date,
        shift: formData.shift,
        machine: formData.machine,
        operationNo: formData.opn,
        component: formData.partName,

        cycleTime: Number(
          formData.cycleTime || 0
        ),

        machineRunTime: Number(
          formData.machineRunTime || 0
        ),

        targetProduction: Number(
          formData.targetProd || 0
        ),

        actualProduction: Number(
          formData.actualProd || 0
        ),

        rejectedQty,

        rejections:
          rejectedQty > 0
            ? formData.rejections.map(
                (rejection) => ({
                  reason: rejection.reason,
                  qty: Number(
                    rejection.qty
                  ),
                })
              )
            : [],

        remarks: formData.remarks,
      });

      setSubmitted(true);

      setTimeout(() => {
        navigate("/production");
      }, 1000);
    } catch (err) {
      console.error(
        "Error updating production:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to update production"
      );
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

  const gc =
    gradeColors[grade] || {
      bg: "#f3f4f6",
      text: "#374151",
      border: "#e5e7eb",
    };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading production entry...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Edit Production Entry
      </h1>

      {submitted && (
        <div className="p-4 rounded-lg mb-6 text-sm font-medium bg-green-100 text-green-800">
          ✓ Production Entry Updated Successfully!
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6"
      >
        {/* Operator & Date */}
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
              <option value="">
                Select Operator
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

        {/* Shift / Machine / Operation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shift
            </label>

            <input
              type="text"
              value={formData.shift}
              readOnly
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
            />
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
              <option value="">
                Select Machine
              </option>

              {machines.map((machine) => (
                <option
                  key={machine._id}
                  value={machine._id}
                >
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Part No.
            </label>

            <input
              type="text"
              value={formData.partNo}
              readOnly
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
        </div>

        {/* Production Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cycle Time (s)
            </label>

            <input
              type="number"
              name="cycleTime"
              value={formData.cycleTime}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Machine Run Time
            </label>

            <input
              type="number"
              name="machineRunTime"
              value={formData.machineRunTime}
              onChange={handleChange}
              required
              min="0"
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
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              min="0"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
            />
          </div>
        </div>

        {/* Grade */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between p-4 rounded-lg bg-gray-50">
          <div>
            <p className="text-sm text-gray-600 font-medium">
              Calculated Grade
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Based on Actual Production: &lt;60 = D,
              60-69 = C, 70-84 = B, 85+ = A
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
              {formData.rejections.map(
                (rejection, index) => {
                  const selectedReasons =
                    formData.rejections
                      .filter(
                        (_, i) => i !== index
                      )
                      .map(
                        (item) => item.reason
                      );

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50 border border-gray-200 rounded-lg p-4"
                    >
                      <div className="md:col-span-7">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rejection Reason{" "}
                          {index + 1}
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

                          {rejectionTypes.map(
                            (type) => (
                              <option
                                key={type}
                                value={type}
                                disabled={selectedReasons.includes(
                                  type
                                )}
                              >
                                {type}
                              </option>
                            )
                          )}
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
                          onClick={() =>
                            removeRejection(
                              index
                            )
                          }
                          className="w-full px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                }
              )}

              <button
                type="button"
                onClick={addRejection}
                disabled={
                  formData.rejections.length >=
                  rejectionTypes.length
                }
                className="w-full border-2 border-dashed border-teal-300 text-teal-600 hover:bg-teal-50 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add Another Rejection Reason
              </button>

              {formData.rejections.length ===
                0 && (
                <p className="text-sm text-red-500">
                  Add at least one rejection reason.
                </p>
              )}

              {totalRejectionBreakdown !==
                Number(
                  formData.qtyRejected
                ) && (
                <p className="text-sm text-red-500">
                  Rejection breakdown must equal
                  the total rejected quantity.
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

        {/* Buttons */}
        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              navigate("/production")
            }
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-8 rounded-lg shadow-sm transition-colors"
          >
            Update Production Entry
          </button>
        </div>
      </form>
    </div>
  );
}