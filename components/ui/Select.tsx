
import React, { SelectHTMLAttributes, ChangeEventHandler, TransitionEventHandler } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  options: { value: string | number; label: string }[];
  icon?: React.ReactNode;
  placeholder?: string; // Custom prop for the first default option text
}

const Select: React.FC<SelectProps> = ({
  label,
  id,
  error,
  containerClassName = '',
  labelClassName = '',
  selectClassName = '',
  options,
  icon,
  placeholder, // Destructure placeholder
  ...restProps // Gather remaining standard HTMLSelectAttributes
}) => {
  const baseSelectClass = "mt-1 block w-full pl-3 pr-10 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-colors duration-150";
  const iconPadding = icon ? "pl-10" : "";

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${labelClassName}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && React.isValidElement(icon) && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
             {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-5 w-5' })}
          </div>
        )}
        <select
          id={id}
          className={`${baseSelectClass} ${iconPadding} ${selectClassName} ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
          {...restProps} // Spread valid HTML attributes
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Select;
