"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export function UserMenu() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setEmail(data.user?.email ?? null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function handleLogout() {
    setIsLoggingOut(true);

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  if (!email) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" aria-hidden="true" />;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-base font-semibold text-slate-950 shadow-sm transition hover:border-slate-300"
      >
        {email.charAt(0).toUpperCase()}
      </button>

      <div
        className={`absolute right-0 z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg transition-all duration-200 ease-in-out ${
          isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-xs font-medium uppercase text-slate-400">Sessão ativa</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-950">{email}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex min-h-11 w-full items-center gap-2 px-4 text-sm font-semibold text-amber-500 transition hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Saindo..." : "Sair da conta"}
        </button>
      </div>
    </div>
  );
}
