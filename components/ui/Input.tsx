
import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  id,
  type = 'text',
  error,
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  icon,
  ...props
}, ref) => {
  const baseInputClass = "mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-colors duration-150";
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
        <input
          type={type}
          id={id}
          className={`${baseInputClass} ${iconPadding} ${inputClassName} ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
          ref={ref} // Forward the ref to the actual input element
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
});

export default Input;
