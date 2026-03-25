import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Trophy, ShoppingBag, LogIn, Newspaper, CalendarDays, Image, Radio, Award, Clock, UserPlus, FileText, Shield, Info, Heart, ClipboardList } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import { useAuth } from "@/contexts/AuthContext";
import clubLogo from "@/assets/club-logo.jpg";

const communityItems = [
  { label: "News", path: "/news", icon: Newspaper, desc: "Latest club updates" },
  { label: "Events", path: "/events", icon: CalendarDays, desc: "Upcoming events" },
  { label: "Gallery", path: "/gallery", icon: Image, desc: "Photos & media" },
  { label: "Match Day Hub", path: "/match-day", icon: Radio, desc: "Live match info" },
  { label: "Player of the Match", path: "/player-of-the-match", icon: Award, desc: "Weekly awards" },
  { label: "Calendar", path: "/calendar", icon: Clock, desc: "Full schedule" },
];

const playerItems = [
  { label: "Registration", path: "/register", icon: UserPlus, desc: "Join the club" },
  { label: "Club Documents", path: "/club-documents", icon: FileText, desc: "Forms & policies" },
  { label: "Safeguarding", path: "/safeguarding", icon: Shield, desc: "Child safety" },
];

const aboutItems = [
  { label: "Club Info", path: "/club-info", icon: Info, desc: "About PAFC" },
  { label: "Club Documents", path: "/club-documents", icon: FileText, desc: "Forms & policies" },
  { label: "Safeguarding", path: "/safeguarding", icon: Shield, desc: "Child safety" },
  { label: "Sponsors", path: "/sponsors", icon: Heart, desc: "Our partners" },
];

type DropdownItem = { label: string; path: string; icon: any; desc: string };
type NavItem = {
  label: string;
  path: string;
  external?: boolean;
  dropdown?: DropdownItem[];
};

const leftNav: NavItem[] = [
  { label: "Home", path: "/" },
  { label: "Player Hub", path: "/player-hub", dropdown: playerItems },
  { label: "Our Teams", path: "/teams" },
  { label: "Community", path: "/news", dropdown: communityItems },
];

const rightNav: NavItem[] = [
  { label: "About", path: "/club-info", dropdown: aboutItems },
  { label: "PAFC TV", path: "https://www.youtube.com/@PeterboroughAthleticFC", external: true },
  { label: "Raffle", path: "/raffle" },
  { label: "Contact", path: "/contact" },
];

const allNav: NavItem[] = [...leftNav, ...rightNav];

function MegaDropdown({ item, location }: { item: NavItem; location: ReturnType<typeof useLocation> }) {
  if (!item.dropdown) return null;
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:block">
      <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl shadow-black/30 p-4 min-w-[300px]">
        <p className="text-[10px] font-display tracking-[0.2em] text-muted-foreground uppercase mb-3 px-1">{item.label}</p>
        <div className="grid gap-0.5">
          {item.dropdown.map((sub) => {
            const Icon = sub.icon;
            return (
              <Link
                key={sub.path}
                to={sub.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all group/item"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-secondary group-hover/item:bg-primary/20 transition-colors">
                  <Icon className="h-4 w-4 group-hover/item:text-primary transition-colors" />
                </div>
                <div>
                  <span className="text-xs font-display tracking-wider block">{sub.label}</span>
                  <span className="text-[10px] text-muted-foreground">{sub.desc}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NavItemRenderer({ item, location }: { item: NavItem; location: ReturnType<typeof useLocation> }) {
  if (item.dropdown) {
    return (
      <div className="relative group">
        <Link
          to={item.path}
          className={`font-display text-[11px] tracking-[0.15em] uppercase px-3 py-2 transition-colors flex items-center gap-1 ${
            item.dropdown.some(d => location.pathname === d.path) ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {item.label}
          <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180" />
        </Link>
        <MegaDropdown item={item} location={location} />
      </div>
    );
  }

  if (item.external) {
    return (
      <a
        href={item.path}
        target="_blank"
        rel="noopener noreferrer"
        className="font-display text-[11px] tracking-[0.15em] uppercase px-3 py-2 transition-colors text-muted-foreground hover:text-foreground"
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link
      to={item.path}
      className={`font-display text-[11px] tracking-[0.15em] uppercase px-3 py-2 transition-colors ${
        location.pathname === item.path ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {item.label}
    </Link>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, signOut, isCoach, isAdmin } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "shadow-lg shadow-black/20" : ""}`}>
      {/* Top utility bar */}
      <div className="bg-secondary border-b border-border/50">
        <div className="container mx-auto px-4 flex items-center justify-between h-8">
          <div className="flex items-center gap-3">
            <Link to="/tournament" className="font-display text-[10px] tracking-[0.15em] uppercase text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5">
              <Trophy className="h-3 w-3" /> Tournament
            </Link>
            <Link to="/shop" className="font-display text-[10px] tracking-[0.15em] uppercase text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5">
              <ShoppingBag className="h-3 w-3" /> Shop
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <CartDrawer />
            {user ? (
              <button onClick={() => signOut()} className="font-display text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors">
                Sign Out
              </button>
            ) : (
              <Link to="/auth" className="font-display text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <LogIn className="h-3 w-3" /> Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main nav — split layout with centered logo + mega menu dropdowns */}
      <div className={`transition-all duration-300 border-b border-border ${scrolled ? "bg-background/95 backdrop-blur-xl" : "bg-background"}`}>
        <div className="container mx-auto px-4 hidden lg:flex items-center justify-center h-14">
          {/* Left nav */}
          <div className="flex items-center gap-0.5 flex-1 justify-end pr-6">
            {leftNav.map((item) => (
              <NavItemRenderer key={item.label} item={item} location={location} />
            ))}
          </div>

          {/* Centered logo */}
          <Link to="/" className="flex flex-col items-center shrink-0 px-5 group">
            <img
              src={clubLogo}
              alt="PAFC Crest"
              className={`rounded-full object-cover ring-2 ring-primary/30 group-hover:ring-primary/60 transition-all duration-300 ${scrolled ? "h-9 w-9" : "h-11 w-11"}`}
            />
            <span className="font-display text-[9px] tracking-[0.3em] text-muted-foreground uppercase mt-0.5">PAFC</span>
          </Link>

          {/* Right nav */}
          <div className="flex items-center gap-0.5 flex-1 justify-start pl-6">
            {rightNav.map((item) => (
              <NavItemRenderer key={item.label} item={item} location={location} />
            ))}
          </div>
        </div>

        {/* Mobile header */}
        <div className="flex items-center justify-between h-12 px-4 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <img src={clubLogo} alt="PAFC Crest" className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/30" />
            <span className="font-display text-sm font-bold text-primary">PAFC</span>
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
        <div className="lg:hidden bg-background border-b border-border max-h-[80vh] overflow-y-auto">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {allNav.map((item) =>
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
                    <div className="pl-2 flex flex-col gap-0.5 pb-2">
                      {item.dropdown.map((sub) => {
                        const Icon = sub.icon;
                        return (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 py-2 px-2 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Icon className="h-4 w-4" />
                            <div>
                              <span className="font-display text-xs tracking-wider block">{sub.label}</span>
                              <span className="text-[10px] text-muted-foreground">{sub.desc}</span>
                            </div>
                          </Link>
                        );
                      })}
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
