import React from 'react';
import { X } from 'lucide-react';

const FilterModal = ({ isOpen, onClose, children, title = "Filters" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black bg-opacity-50">
      {/* Modal Content - for mobile (bottom slide-up) and desktop (centered) */}
      <div className="bg-white w-full lg:w-3/4 max-w-lg lg:rounded-lg shadow-lg flex flex-col h-3/4 lg:h-auto lg:max-h-[90vh] animate-slide-up lg:animate-fade-in-scale">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close filters"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Body - Filters */}
        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar"> {/* Added custom-scrollbar for better mobile overflow */}
          {children}
        </div>

        {/* Footer (Optional: Apply/Clear buttons here if filters are not applied on change) */}
        {/* <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
          <button className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Clear</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Apply</button>
        </div> */}
      </div>
    </div>
  );
};

export default FilterModal;