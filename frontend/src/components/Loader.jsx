import React from 'react';

export default function Loader({ size = 'md', message = '' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <span
        className={`${sizeClasses[size]} border-teal-500 border-t-transparent rounded-full animate-spin`}
      ></span>
      {message && <p className="mt-3 text-sm text-gray-500">{message}</p>}
    </div>
  );
}
