type SectionBadgeProps = {
  children: React.ReactNode;
  variant?: "light" | "inverse";
  className?: string;
};

export default function SectionBadge({
  children,
  variant = "light",
  className = "",
}: SectionBadgeProps) {
  const variantClasses =
    variant === "inverse"
      ? "border-white/20 bg-white/95 text-brand-blue-text"
      : "border-brand-border-light bg-brand-soft text-brand-blue-text";

  return (
    <div
      className={`inline-flex h-[38px] items-center gap-2 rounded-full border px-[14px] text-[13px] font-bold ${variantClasses} ${className}`}
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-mint-soft">
        <span className="h-2 w-2 rounded-full bg-brand-mint" />
      </span>
      <span>{children}</span>
    </div>
  );
}
