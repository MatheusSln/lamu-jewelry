export function PromoBar({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="bg-ink text-cream text-center text-[11px] tracking-[0.2em] uppercase py-2 px-4">
      {text}
    </div>
  );
}
