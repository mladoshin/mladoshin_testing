import React from "react";
import { SpinnerIcon } from "../SpinnerIcon";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full text-center cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition ${className}`}
    >
      {loading ? (
        <SpinnerIcon className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {iconLeft && <span className="w-5 h-5">{iconLeft}</span>}
          {children}
          {iconRight && <span className="w-5 h-5">{iconRight}</span>}
        </>
      )}
    </button>
  );
};
