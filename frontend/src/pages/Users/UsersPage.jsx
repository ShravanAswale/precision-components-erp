import React, { useState } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState([
    { id: 1, name: 'Admin User', email: 'admin@precision.com', role: 'Admin' },
    { id: 2, name: 'Operator X', email: 'operatorx@precision.com', role: 'Operator' },
    { id: 3, name: 'Operator Y', email: 'operatory@precision.com', role: 'Operator' },
  ]);

  const handleAdd = () => {
    const name = window.prompt("Enter User Name:");
    if (!name) return;
    const email = window.prompt("Enter Email:");
    if (!email) return;
    const role = window.prompt("Enter Role (e.g., Admin, Operator):") || 'Operator';
    setUsers([...users, { id: Date.now(), name, email, role }]);
  };

  const handleEdit = (user) => {
    const name = window.prompt("Enter User Name:", user.name);
    if (!name) return;
    const email = window.prompt("Enter Email:", user.email);
    if (!email) return;
    const role = window.prompt("Enter Role (e.g., Admin, Operator):", user.role) || 'Operator';
    setUsers(users.map(u => u.id === user.id ? { ...u, name, email, role } : u));
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <button onClick={handleAdd} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(user)} className="text-teal-600 hover:text-teal-900 mr-3">Edit</button>
                  <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
