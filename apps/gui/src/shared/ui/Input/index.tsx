import React from "react";
import classNames from "classnames";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  hint,
  error,
  iconLeft,
  iconRight,
  className,
  ...props
}) => {
  const hasIcon = iconLeft || iconRight;

  return (
    <div className="space-y-1 w-full">
      {label && (
        <label
          htmlFor={props.id || props.name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      <div className={classNames("relative", { "has-icons": hasIcon })}>
        {iconLeft && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {iconLeft}
          </div>
        )}

        <input
          {...props}
          className={classNames(
            "w-full px-3 py-2 border rounded-md text-sm transition text-gray-900 placeholder-gray-400 focus:outline-none",
            !!iconLeft && "pl-10",
            !!iconRight && "pr-10",
            !!error
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-200 focus:ring-blue-500 focus:border-blue-500",
            className
          )}
        />

        {iconRight && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
            {iconRight}
          </div>
        )}
      </div>

      {hint && !error && (
        <p className="text-xs text-gray-500 mt-1">{hint}</p>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};
