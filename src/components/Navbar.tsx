import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import clubLogo from "@/assets/club-logo.jpg";

const teams = [
  "U7s", "U8s Black", "U8s Gold", "U9s", "U10s",
  "U11s Black", "U11s Gold", "U13s Black", "U13s Gold", "U14s",
];

const communityItems = [
  { label: "News", path: "/news" },
  { label: "Events", path: "/events" },
  { label: "Gallery", path: "/gallery" },
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
  { label: "Teams", path: "/teams", dropdown: teams.map(t => ({ label: t, path: `/teams/${t.toLowerCase().replace(/\s+/g, "-")}` })) },
  { label: "PAFC TV", path: "https://www.youtube.com/@PeterboroughAthleticFC", external: true },
  { label: "Community", path: "/news", dropdown: communityItems },
  { label: "About", path: "/club-info", dropdown: aboutItems },
  { label: "Register", path: "/register" },
  { label: "Contact", path: "/contact" },
  { label: "Shop", path: "/shop" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img src={clubLogo} alt="PAFC Crest" className="h-10 w-10 rounded-full object-cover" />
          <div className="hidden sm:block">
            <span className="font-display text-sm font-bold text-gold-gradient leading-tight block">Peterborough Athletic</span>
            <span className="font-display text-xs text-muted-foreground tracking-widest">The Lions</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) =>
            item.dropdown ? (
              <div key={item.label} className="relative group">
                <Link
                  to={item.path}
                  className={`font-display text-xs tracking-wider px-3 py-2 rounded-md transition-colors flex items-center gap-1 ${
                    item.dropdown.some(d => location.pathname === d.path) ? "text-primary" : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {item.label}
                  <ChevronDown className="h-3 w-3" />
                </Link>
                <div className="absolute top-full left-0 pt-1 hidden group-hover:block">
                  <div className="bg-card border border-border rounded-lg shadow-xl py-2 min-w-[180px]">
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        className="block px-4 py-2 text-xs font-display tracking-wider text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
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
                className="font-display text-xs tracking-wider px-3 py-2 rounded-md transition-colors text-muted-foreground hover:text-primary"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.path}
                className={`font-display text-xs tracking-wider px-3 py-2 rounded-md transition-colors ${
                  location.pathname === item.path ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            )
          )}
          <CartDrawer />
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-4 lg:hidden">
          <CartDrawer />
          <button onClick={() => setIsOpen(!isOpen)} className="text-foreground">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {isOpen && (
        <div className="lg:hidden bg-background border-b border-border max-h-[80vh] overflow-y-auto">
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
                        <Link
                          key={sub.path}
                          to={sub.path}
                          onClick={() => setIsOpen(false)}
                          className="font-display text-xs tracking-wider text-muted-foreground hover:text-primary transition-colors py-1"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : item.external ? (
                <a
                  key={item.label}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  {item.label}
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
