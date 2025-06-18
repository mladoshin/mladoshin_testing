import React from "react";
import classNames from "classnames";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  hint,
  error,
  iconLeft,
  iconRight,
  className,
  ...props
}) => {
  const iconLeftClass = iconLeft ? "pl-10" : "";
  const iconRightClass = iconRight ? "pr-10" : "";

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

      <div className="relative">
        {iconLeft && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-start pt-2 text-gray-400 pointer-events-none">
            {iconLeft}
          </div>
        )}

        <textarea
          {...props}
          className={classNames(
            "w-full px-3 py-2 border rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition resize-y",
            iconLeftClass,
            iconRightClass,
            error
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-200 focus:ring-blue-500 focus:border-blue-500",
            className
          )}
        />

        {iconRight && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-start pt-2 text-gray-400 pointer-events-none">
            {iconRight}
          </div>
        )}
      </div>

      {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};
