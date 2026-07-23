import React, { useState } from 'react';

export default function ShiftsPage() {
  const [shifts, setShifts] = useState([
    { id: 1, name: 'Morning', hours: '06:00 - 14:00' },
    { id: 2, name: 'Evening', hours: '14:00 - 22:00' },
    { id: 3, name: 'Night', hours: '22:00 - 06:00' },
  ]);

  const handleAdd = () => {
    const name = window.prompt("Enter Shift Name:");
    if (!name) return;
    const hours = window.prompt("Enter Hours (e.g., 06:00 - 14:00):");
    if (!hours) return;
    setShifts([...shifts, { id: Date.now(), name, hours }]);
  };

  const handleEdit = (shift) => {
    const name = window.prompt("Enter Shift Name:", shift.name);
    if (!name) return;
    const hours = window.prompt("Enter Hours (e.g., 06:00 - 14:00):", shift.hours);
    if (!hours) return;
    setShifts(shifts.map(s => s.id === shift.id ? { ...s, name, hours } : s));
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this shift?")) {
      setShifts(shifts.filter(s => s.id !== id));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Shifts</h1>
        <button onClick={handleAdd} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          Add Shift
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {shifts.map((shift) => (
              <tr key={shift.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{shift.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shift.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shift.hours}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(shift)} className="text-teal-600 hover:text-teal-900 mr-3">Edit</button>
                  <button onClick={() => handleDelete(shift.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
