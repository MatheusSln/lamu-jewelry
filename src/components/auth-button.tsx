import { auth, signIn, signOut } from "@/lib/next-auth";
import Link from "next/link";
import Image from "next/image";

export async function AuthButton() {
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.error("Erro ao verificar sessão de autenticação:", error);
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Link 
          href="/perfil" 
          className="text-sm font-medium hover:text-amber-700 flex items-center gap-2" 
          title="Meu Perfil"
        >
          {session.user.image ? (
            <Image 
              src={session.user.image} 
              alt={session.user.name || "Perfil"} 
              width={28}
              height={28}
              className="w-7 h-7 rounded-full border border-gray-200 object-cover" 
            />
          ) : (
            <span className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-xs font-semibold text-stone-700">
              {session.user.name ? session.user.name.charAt(0).toUpperCase() : "U"}
            </span>
          )}
          <span className="hidden sm:inline text-xs text-stone-600">
            {session.user.name?.split(" ")[0]}
          </span>
        </Link>
        <form action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}>
          <button 
            type="submit" 
            className="text-xs text-stone-400 hover:text-red-500 transition-colors"
          >
            Sair
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={async () => {
      "use server";
      await signIn("google", { redirectTo: "/perfil" });
    }}>
      <button 
        type="submit" 
        className="text-sm font-medium text-stone-800 hover:text-amber-700 transition-colors"
      >
        Entrar
      </button>
    </form>
  );
}
