import { Link } from "react-router-dom";
import clubLogo from "@/assets/club-logo.jpg";

const quickLinks = [
  { label: "Home", path: "/" },
  { label: "Teams", path: "/teams" },
  { label: "News", path: "/news" },
  { label: "Events", path: "/events" },
  { label: "Gallery", path: "/gallery" },
];

const clubLinks = [
  { label: "Club Shop", path: "/shop" },
  { label: "Club Info", path: "/club-info" },
  { label: "Club Documents", path: "/club-documents" },
  { label: "Sponsors", path: "/sponsors" },
  { label: "Contact Us", path: "/contact" },
];

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={clubLogo} alt="PAFC Crest" className="h-12 w-12 rounded-full object-cover border border-primary" />
              <div>
                <h3 className="font-display text-sm font-bold text-gold-gradient">Peterborough Athletic</h3>
                <p className="font-display text-xs text-muted-foreground">The Lions · Est. 2020</p>
              </div>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed mb-3">
              Proudly FA Accredited. Grassroots football for all, powered by community.
            </p>
            <p className="text-xs text-primary font-display tracking-wider">
              Join Us. Train with Us. Develop with Us.
            </p>
          </div>

          <div>
            <h4 className="font-display text-xs font-bold text-foreground mb-4 tracking-wider">Quick Links</h4>
            <div className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <Link key={link.path} to={link.path} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-xs font-bold text-foreground mb-4 tracking-wider">Club</h4>
            <div className="flex flex-col gap-2">
              {clubLinks.map((link) => (
                <Link key={link.path} to={link.path} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-xs font-bold text-foreground mb-4 tracking-wider">Contact</h4>
            <p className="text-xs text-muted-foreground mb-2">info@pa-fc.uk</p>
            <p className="text-xs text-muted-foreground mb-4">Peterborough, Cambridgeshire</p>
            <div className="flex items-center gap-2">
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Peterborough Athletic FC. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Proudly FA Accredited · Grassroots Football for All
          </p>
        </div>
      </div>
    </footer>
  );
}
