import { waLink } from "@/lib/whatsapp";

export function SiteFooter({ settings }: { settings: Record<string, string> }) {
  const whatsappUrl = waLink(settings.whatsapp_number ?? "");
  const instagram = settings.instagram_handle?.replace(/^@/, "");
  return (
    <footer className="bg-cream-dark border-t border-gold-light/40 mt-16">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-3 text-sm">
        <div>
          <h3 className="text-lg text-gold mb-3">Atendimento</h3>
          <ul className="space-y-2 text-ink-soft">
            {whatsappUrl && (
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold"
                >
                  WhatsApp
                </a>
              </li>
            )}
            {instagram && (
              <li>
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold"
                >
                  Instagram
                </a>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-lg text-gold mb-3">Políticas</h3>
          <p className="text-ink-soft whitespace-pre-line">{settings.exchange_policy}</p>
        </div>
        <div>
          <h3 className="text-lg text-gold mb-3">Pagamento</h3>
          <p className="text-ink-soft">Pix, cartão de crédito e boleto.</p>
        </div>
      </div>
      <div className="text-center text-xs text-ink-soft pb-6 tracking-[0.2em] uppercase">
        Lámu — Semijoias e Prata 925
      </div>
    </footer>
  );
}
