export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center my-8">
      <h2 className="text-3xl text-ink">{children}</h2>
      <div className="mx-auto mt-2 w-16 h-px bg-gold" />
    </div>
  );
}
