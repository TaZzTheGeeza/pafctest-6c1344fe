import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-lg font-bold text-gold-gradient mb-4">Peterborough Athletic FC</h3>
            <p className="text-muted-foreground text-sm">
              Black & Gold. Passion. Pride.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-bold text-foreground mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">Home</Link>
              <Link to="/shop" className="text-sm text-muted-foreground hover:text-primary transition-colors">Club Shop</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display text-sm font-bold text-foreground mb-4">Contact</h4>
            <p className="text-sm text-muted-foreground">
              Follow us on social media for the latest news, results, and updates.
            </p>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Peterborough Athletic FC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
