import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-[12px] font-medium uppercase tracking-wider text-[#2C2C2A]">{label}</label>}
      <input
        className={`h-9 px-3 py-2 bg-white border-[0.5px] border-[#D3D1C7] rounded-lg text-[15px] focus:outline-none focus:border-[#D85A30] transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}
