import React from 'react';
import { Link } from 'react-router-dom';

export default function ChallanList() {
  const challans = [
    { id: 'CH-001', customerName: 'ABC Motors', date: '2023-10-25', items: 3, total: '₹45,000', status: 'Delivered' },
    { id: 'CH-002', customerName: 'XYZ Industries', date: '2023-10-26', items: 5, total: '₹82,000', status: 'Pending' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Challans</h1>
        <Link to="/challans/create" className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          + Create Challan
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challan No.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {challans.map((ch) => (
              <tr key={ch.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-teal-700">{ch.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ch.customerName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ch.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ch.items}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ch.total}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    style={{
                      backgroundColor: ch.status === 'Delivered' ? '#dcfce7' : '#fef3c7',
                      color: ch.status === 'Delivered' ? '#166534' : '#92400e',
                    }}
                    className="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {ch.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link to={`/challans/${ch.id}`} className="text-teal-600 hover:text-teal-900 mr-3">View</Link>
                  <button className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
