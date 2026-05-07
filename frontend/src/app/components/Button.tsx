import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseStyles = 'px-6 py-2.5 rounded-lg font-medium transition-colors cursor-pointer';

  const variantStyles = {
    primary: 'bg-[#D85A30] text-white hover:bg-[#993C1D]',
    secondary: 'bg-transparent border-[1.5px] border-[#D85A30] text-[#D85A30] hover:bg-[#FAECE7]',
    ghost: 'bg-transparent border border-[#D3D1C7] text-[#5F5E5A] hover:bg-[#F1EFE8]',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
