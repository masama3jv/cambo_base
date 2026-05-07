interface BadgeProps {
  variant: 'approved' | 'pending' | 'rejected' | 'info';
  children: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  const variantStyles = {
    approved: 'bg-[#EAF3DE] text-[#3B6D11]',
    pending: 'bg-[#FAEEDA] text-[#854F0B]',
    rejected: 'bg-[#FCEBEB] text-[#A32D2D]',
    info: 'bg-[#E6F1FB] text-[#185FA5]',
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-[13px] font-normal ${variantStyles[variant]}`}>
      {children}
    </span>
  );
}
