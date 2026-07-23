import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateChallan() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [items, setItems] = useState([{ partName: '', partNo: '', qty: '', rate: '' }]);
  const [formData, setFormData] = useState({
    customerName: '',
    customerAddress: '',
    challanDate: new Date().toISOString().split('T')[0],
    vehicleNo: '',
    remarks: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-fill part number
      if (field === 'partName') {
        const partMap = { 'Gear Box Casing': 'GB-102', 'Bearing Housing': 'BH-504' };
        updated[index].partNo = partMap[value] || '';
      }
      return updated;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, { partName: '', partNo: '', qty: '', rate: '' }]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const getTotal = () => {
    return items.reduce((sum, item) => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      return sum + qty * rate;
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      navigate('/challans');
    }, 1500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create New Challan</h1>
        <button
          onClick={() => navigate('/challans')}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to Challans
        </button>
      </div>

      {submitted && (
        <div style={{ backgroundColor: '#dcfce7', color: '#166534' }} className="p-4 rounded-lg mb-6 text-sm font-medium">
          ✓ Challan Created Successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">

        {/* Customer Details */}
        <div>
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. ABC Motors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
              <input type="text" name="customerAddress" value={formData.customerAddress} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Address" />
            </div>
          </div>
        </div>

        {/* Challan Details */}
        <div className="pt-4 border-t border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">Challan Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Challan Date</label>
              <input type="date" name="challanDate" value={formData.challanDate} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No.</label>
              <input type="text" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="MH-12-XX-1234" />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Items</h2>
            <button type="button" onClick={addItem} className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors">
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <div className="col-span-12 md:col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Part Name</label>
                  <select value={item.partName} onChange={(e) => handleItemChange(index, 'partName', e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                    <option value="">Select</option>
                    <option>Gear Box Casing</option>
                    <option>Bearing Housing</option>
                  </select>
                </div>
                <div className="col-span-6 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Part No.</label>
                  <input type="text" value={item.partNo} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                  <input type="number" min="1" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Rate (₹)</label>
                  <input type="number" min="0" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
                  <div className="px-3 py-2 text-sm font-medium text-gray-700">
                    ₹{((Number(item.qty) || 0) * (Number(item.rate) || 0)).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1 flex justify-end">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 text-sm p-2 transition-colors" title="Remove item">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <div className="text-right">
            <p className="text-sm text-gray-500">Grand Total</p>
            <p className="text-2xl font-bold text-gray-900">₹{getTotal().toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Remarks */}
        <div className="pt-4 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
          <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="2" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Any additional notes..."></textarea>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end space-x-3">
          <button type="button" onClick={() => navigate('/challans')} className="px-6 py-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium">
            Cancel
          </button>
          <button type="submit" disabled={submitted} className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-8 rounded-lg shadow-sm transition-colors disabled:opacity-50">
            Create Challan
          </button>
        </div>
      </form>
    </div>
  );
}
