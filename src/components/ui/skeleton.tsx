interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export function Skeleton({
  width,
  height,
  borderRadius = "4px",
  className = "",
}: SkeletonProps) {
  const style: React.CSSProperties = {
    borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius,
  };
  if (width != null) style.width = typeof width === "number" ? `${width}px` : width;
  if (height != null) style.height = typeof height === "number" ? `${height}px` : height;
  return (
    <div
      className={`bg-[#1A2433] animate-pulse ${className}`}
      style={style}
    />
  );
}
