import React from 'react';
import { calculateGrade } from '../utils/calculateGrade';

function GradeBadge({ grade }) {
  // Using inline styles as a fallback to guarantee color rendering
  const colors = {
    A: { bg: '#dcfce7', text: '#166534' },
    B: { bg: '#dbeafe', text: '#1e40af' },
    C: { bg: '#fef3c7', text: '#92400e' },
    D: { bg: '#fee2e2', text: '#991b1b' },
  };

  const color = colors[grade] || { bg: '#f3f4f6', text: '#374151' };

  return (
    <span
      style={{ backgroundColor: color.bg, color: color.text }}
      className="px-2.5 py-1 text-xs font-semibold rounded-full inline-block"
    >
      Grade {grade || '-'}
    </span>
  );
}

export default function Table({ data }) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part No.</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OPN</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cycle Time</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Run Time</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data && data.length > 0 ? (
            data.map((row, i) => {
              const grade = row.grade || calculateGrade(row.actualProd);
              return (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.operator}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{row.partName}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{row.partNo}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{row.date}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{row.shift}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{row.machine}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{row.opn}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{row.cycleTime}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{row.machineRunTime}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{row.targetProd}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.actualProd}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <GradeBadge grade={grade} />
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="12" className="px-6 py-8 whitespace-nowrap text-sm text-gray-400 text-center">
                No production data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
