import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import clubLogo from "@/assets/club-logo.jpg";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Results", path: "/#results" },
  { label: "Shop", path: "/shop" },
  { label: "About", path: "/#about" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const handleNavClick = (path: string) => {
    setIsOpen(false);
    if (path.startsWith("/#")) {
      const id = path.replace("/#", "");
      if (location.pathname === "/") {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3">
          <img src={clubLogo} alt="PAFC Crest" className="h-10 w-10 rounded-full object-cover" />
          <span className="font-display text-lg font-bold text-gold-gradient hidden sm:inline">
            Athletic FC
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) =>
            item.path.startsWith("/#") ? (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.path)}
                className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.label}
                to={item.path}
                className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            )
          )}
          <CartDrawer />
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <CartDrawer />
          <button onClick={() => setIsOpen(!isOpen)} className="text-foreground">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navItems.map((item) =>
              item.path.startsWith("/#") ? (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.path)}
                  className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors"
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
