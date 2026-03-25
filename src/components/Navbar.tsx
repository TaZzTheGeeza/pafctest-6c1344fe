import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Trophy, ShoppingBag, LogIn } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import { useAuth } from "@/contexts/AuthContext";
import clubLogo from "@/assets/club-logo.jpg";

const communityItems = [
  { label: "News", path: "/news" },
  { label: "Events", path: "/events" },
  { label: "Gallery", path: "/gallery" },
  { label: "Match Day Hub", path: "/match-day" },
  { label: "Player of the Match", path: "/player-of-the-match" },
  { label: "Calendar", path: "/calendar" },
];

const playerItems = [
  { label: "Registration", path: "/register" },
  { label: "Club Documents", path: "/club-documents" },
  { label: "Safeguarding", path: "/safeguarding" },
];

const aboutItems = [
  { label: "Club Info", path: "/club-info" },
  { label: "Club Documents", path: "/club-documents" },
  { label: "Safeguarding", path: "/safeguarding" },
  { label: "Sponsors", path: "/sponsors" },
];

type NavItem = {
  label: string;
  path: string;
  external?: boolean;
  dropdown?: { label: string; path: string }[];
};

const navItems: NavItem[] = [
  { label: "Home", path: "/" },
  { label: "Player Hub", path: "/player-hub", dropdown: playerItems },
  { label: "Our Teams", path: "/teams" },
  { label: "PAFC TV", path: "https://www.youtube.com/@PeterboroughAthleticFC", external: true },
  { label: "Community", path: "/news", dropdown: communityItems },
  { label: "About", path: "/club-info", dropdown: aboutItems },
  { label: "Raffle", path: "/raffle" },
  { label: "Contact", path: "/contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        scrolled
          ? "h-12 bg-background/70 backdrop-blur-2xl shadow-xl shadow-black/25 border-b border-primary/10"
          : "h-16 bg-background/90 backdrop-blur-md border-b border-border"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between h-full">
        {/* Logo — shrinks on scroll */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 transition-all duration-500">
          <img
            src={clubLogo}
            alt="PAFC Crest"
            className={`rounded-full object-cover transition-all duration-500 ring-2 ring-primary/20 ${
              scrolled ? "h-7 w-7" : "h-10 w-10"
            }`}
          />
          <div className={`transition-all duration-500 overflow-hidden ${scrolled ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
            <span className="font-display text-sm font-bold text-primary leading-tight block whitespace-nowrap">Peterborough Athletic</span>
            <span className="font-display text-[10px] text-muted-foreground tracking-[0.25em] uppercase">The Lions</span>
          </div>
          {/* Compact name on scroll */}
          <span className={`font-display text-xs font-bold text-primary tracking-wider transition-all duration-500 ${scrolled ? "opacity-100" : "opacity-0 w-0"}`}>
            PAFC
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0.5">
          {navItems.map((item) =>
            item.dropdown ? (
              <div key={item.label} className="relative group">
                <Link
                  to={item.path}
                  className={`font-display tracking-wider px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                    scrolled ? "text-[10px]" : "text-xs"
                  } ${
                    item.dropdown.some(d => location.pathname === d.path)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                  <ChevronDown className={`transition-all group-hover:rotate-180 ${scrolled ? "h-2.5 w-2.5" : "h-3 w-3"}`} />
                </Link>
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:block">
                  <div className="bg-card/90 backdrop-blur-2xl border border-border/80 rounded-xl shadow-2xl shadow-black/40 py-2 min-w-[180px]">
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        className="block px-4 py-2 text-[11px] font-display tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : item.external ? (
              <a
                key={item.label}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-display tracking-wider px-2.5 py-1.5 rounded-md transition-all text-muted-foreground hover:text-foreground ${scrolled ? "text-[10px]" : "text-xs"}`}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.path}
                className={`font-display tracking-wider px-2.5 py-1.5 rounded-md transition-all ${scrolled ? "text-[10px]" : "text-xs"} ${
                  location.pathname === item.path ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            )
          )}

          {/* Divider */}
          <div className={`mx-1 bg-border transition-all ${scrolled ? "w-px h-4" : "w-px h-5"}`} />

          {/* CTA buttons */}
          <Link
            to="/tournament"
            className={`font-display tracking-wider rounded-md transition-all flex items-center gap-1 border ${
              scrolled ? "text-[10px] px-2 py-1" : "text-xs px-2.5 py-1.5"
            } ${
              location.pathname.startsWith("/tournament")
                ? "bg-primary text-primary-foreground border-primary"
                : "border-primary/30 text-primary hover:bg-primary/10"
            }`}
          >
            <Trophy className={scrolled ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {!scrolled && "Tournament"}
          </Link>
          <Link
            to="/shop"
            className={`font-display tracking-wider rounded-md transition-all flex items-center gap-1 border ${
              scrolled ? "text-[10px] px-2 py-1" : "text-xs px-2.5 py-1.5"
            } ${
              location.pathname === "/shop"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-primary/30 text-primary hover:bg-primary/10"
            }`}
          >
            <ShoppingBag className={scrolled ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {!scrolled && "Shop"}
          </Link>
          <CartDrawer />
          {user ? (
            <button
              onClick={() => signOut()}
              className={`font-display tracking-wider px-2 py-1 rounded-md transition-all text-muted-foreground hover:text-primary ${scrolled ? "text-[10px]" : "text-xs"}`}
            >
              Sign Out
            </button>
          ) : (
            <Link
              to="/auth"
              className={`font-display tracking-wider rounded-md transition-all flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 ${
                scrolled ? "text-[10px] px-2 py-1" : "text-xs px-2.5 py-1.5"
              }`}
            >
              <LogIn className={scrolled ? "h-3 w-3" : "h-3.5 w-3.5"} />
              {!scrolled && "Sign In"}
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-3 lg:hidden">
          <CartDrawer />
          <button onClick={() => setIsOpen(!isOpen)} className="text-foreground p-1">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {isOpen && (
        <div className="lg:hidden bg-background/95 backdrop-blur-2xl border-b border-border max-h-[80vh] overflow-y-auto">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navItems.map((item) =>
              item.dropdown ? (
                <div key={item.label}>
                  <button
                    onClick={() => toggleDropdown(item.label)}
                    className="w-full flex items-center justify-between font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    {item.label}
                    <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
                  </button>
                  {openDropdown === item.label && (
                    <div className="pl-4 flex flex-col gap-1 pb-2">
                      {item.dropdown.map((sub) => (
                        <Link key={sub.path} to={sub.path} onClick={() => setIsOpen(false)} className="font-display text-xs tracking-wider text-muted-foreground hover:text-primary transition-colors py-1">
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : item.external ? (
                <a key={item.label} href={item.path} target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)} className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors py-2">
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} to={item.path} onClick={() => setIsOpen(false)} className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors py-2">
                  {item.label}
                </Link>
              )
            )}
            <div className="flex gap-2 mt-3 pt-3 border-t border-border">
              <Link to="/tournament" onClick={() => setIsOpen(false)} className="flex-1 flex items-center justify-center gap-2 font-display text-sm tracking-wider py-2.5 rounded-md border border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-all">
                <Trophy className="h-4 w-4" /> Tournament
              </Link>
              <Link to="/shop" onClick={() => setIsOpen(false)} className="flex-1 flex items-center justify-center gap-2 font-display text-sm tracking-wider py-2.5 rounded-md border border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-all">
                <ShoppingBag className="h-4 w-4" /> Shop
              </Link>
            </div>
            {user ? (
              <button onClick={() => { signOut(); setIsOpen(false); }} className="w-full font-display text-sm tracking-wider py-2.5 rounded-md border border-border text-muted-foreground hover:text-primary transition-colors mt-2">
                Sign Out
              </button>
            ) : (
              <Link to="/auth" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 w-full font-display text-sm tracking-wider py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-2">
                <LogIn className="h-4 w-4" /> Sign In / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
