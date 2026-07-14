type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Container({
  children,
  className = "",
}: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-[1440px] px-6 min-[1440px]:px-0 ${className}`}
    >
      {children}
    </div>
  );
}
