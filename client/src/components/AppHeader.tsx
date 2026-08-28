import { Link, useLocation } from "wouter";

const navigation = [
  { href: "/", label: "Em disputa" },
  { href: "/fora-da-disputa", label: "Fora da disputa" },
];

export default function AppHeader() {
  const [location] = useLocation();

  return (
    <header className="border-b border-[#eee7e1] bg-white">
      <div className="container flex min-h-14 flex-wrap items-center justify-between gap-4 py-3">
        <Link href="/" className="font-editorial text-sm font-bold tracking-[-0.03em] text-[#1f1d1b]">
          eleições <span className="text-[#ff5a00]">no Terra</span>
        </Link>
        <nav aria-label="Navegação principal" className="ml-auto flex items-center gap-5 text-xs font-extrabold">
          {navigation.map(item => {
            const active = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b-2 py-2 transition-colors ${
                  active
                    ? "border-[#ff5a00] text-[#1f1d1b]"
                    : "border-transparent text-[#746e68] hover:text-[#1f1d1b]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <span className="border-l border-[#eee7e1] pl-4 text-xs font-extrabold text-[#ff5a00]">terra</span>
      </div>
    </header>
  );
}
