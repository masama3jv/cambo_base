interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white border-[0.5px] border-[#D3D1C7] rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

export function MetricCard({ label, value, subtitle }: MetricCardProps) {
  return (
    <Card>
      <div className="flex flex-col gap-2">
        <p className="text-[13px] text-[#5F5E5A] uppercase tracking-wider font-medium">{label}</p>
        <p className="text-[22px] font-medium text-[#2C2C2A]">{value}</p>
        {subtitle && <p className="text-[12px] text-[#5F5E5A]">{subtitle}</p>}
      </div>
    </Card>
  );
}
