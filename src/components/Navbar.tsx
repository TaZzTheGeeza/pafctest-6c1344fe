import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Trophy, ShoppingBag, LogIn, Phone, Mail } from "lucide-react";
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
  { label: "Tournament", path: "/tournament" },
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
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Top utility bar */}
      <div className={`bg-primary transition-all duration-300 ${scrolled ? "h-0 overflow-hidden opacity-0" : "h-8 opacity-100"}`}>
        <div className="container mx-auto px-4 flex items-center justify-between h-8">
          <div className="flex items-center gap-4">
            <a href="mailto:info@pafcjuniors.com" className="flex items-center gap-1.5 text-[10px] font-display tracking-wider text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <Mail className="h-3 w-3" />
              info@pafcjuniors.com
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/shop" className="flex items-center gap-1.5 text-[10px] font-display tracking-[0.15em] uppercase text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <ShoppingBag className="h-3 w-3" /> Shop
            </Link>
            <CartDrawer />
            {user ? (
              <button onClick={() => signOut()} className="text-[10px] font-display tracking-[0.15em] uppercase text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Sign Out
              </button>
            ) : (
              <Link to="/auth" className="flex items-center gap-1.5 text-[10px] font-display tracking-[0.15em] uppercase text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                <LogIn className="h-3 w-3" /> Sign In / Register
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className={`transition-all duration-300 border-b border-border ${
        scrolled
          ? "bg-background/95 backdrop-blur-xl shadow-lg shadow-black/20"
          : "bg-background"
      }`}>
        <div className="container mx-auto px-4 hidden lg:flex items-center h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 mr-8">
            <img src={clubLogo} alt="PAFC Crest" className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/30" />
            <div>
              <span className="font-display text-sm font-bold text-primary leading-tight block">Peterborough Athletic</span>
              <span className="font-display text-[9px] text-muted-foreground tracking-[0.3em] uppercase">Football Club</span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-0.5 flex-1">
            {navItems.map((item) =>
              item.dropdown ? (
                <div key={item.label} className="relative group">
                  <Link
                    to={item.path}
                    className={`font-display text-[11px] tracking-[0.12em] uppercase px-3 py-2 rounded-md transition-colors flex items-center gap-1 ${
                      item.dropdown.some(d => location.pathname === d.path) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                    <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180" />
                  </Link>
                  <div className="absolute top-full left-0 pt-2 hidden group-hover:block">
                    <div className="bg-card border border-border rounded-lg shadow-2xl shadow-black/30 py-1.5 min-w-[190px]">
                      {item.dropdown.map((sub) => (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          className="block px-4 py-2 text-[11px] font-display tracking-wider text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors"
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
                  className="font-display text-[11px] tracking-[0.12em] uppercase px-3 py-2 rounded-md transition-colors text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`font-display text-[11px] tracking-[0.12em] uppercase px-3 py-2 rounded-md transition-colors ${
                    location.pathname === item.path || (item.path === "/tournament" && location.pathname.startsWith("/tournament"))
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          {/* Scrolled-only actions (appear when utility bar hides) */}
          <div className={`flex items-center gap-2 transition-all duration-300 ${scrolled ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <CartDrawer />
            {user ? (
              <button onClick={() => signOut()} className="font-display text-[10px] tracking-wider px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-primary transition-colors">
                Sign Out
              </button>
            ) : (
              <Link to="/auth" className="font-display text-[10px] tracking-wider px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5">
                <LogIn className="h-3 w-3" /> Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile header */}
        <div className="flex items-center justify-between h-14 px-4 lg:hidden">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={clubLogo} alt="PAFC Crest" className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/30" />
            <div>
              <span className="font-display text-sm font-bold text-primary leading-tight block">PAFC</span>
              <span className="font-display text-[9px] text-muted-foreground tracking-[0.2em] uppercase">The Lions</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <CartDrawer />
            <button onClick={() => setIsOpen(!isOpen)} className="text-foreground p-1">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {isOpen && (
        <div className="lg:hidden bg-background border-b border-border max-h-[75vh] overflow-y-auto">
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
