import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <Image
        src="/brand/logo.jpeg"
        alt="Lámu — Semijoias e Prata 925"
        width={280}
        height={280}
        priority
        className="rounded-full"
      />
      <h1 className="text-4xl text-gold">Em breve</h1>
      <p className="text-ink-soft">Semijoias e Prata 925</p>
    </main>
  );
}
