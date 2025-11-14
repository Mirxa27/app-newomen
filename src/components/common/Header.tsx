import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Menu, X } from "lucide-react";
import routes from "../../routes";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const navigation = routes.filter((route) => route.visible !== false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu on route change
    setIsMenuOpen(false);
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    
    // Smooth scroll to top if already on the same route
    if (location.pathname === to) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Navigate with smooth transition
      navigate(to);
    }
  };

  const NavLink = ({
    to,
    label,
    className = "",
  }: {
    to: string;
    label: string;
    className?: string;
  }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        onClick={(e) => handleNavClick(e, to)}
        className={
          `px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-out flex items-center ` +
          (active
            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50") +
          ` ${className}`
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ease-in-out ${
        scrolled 
          ? 'bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/5' 
          : 'bg-background/80 backdrop-blur-md border-b border-border/30'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Logo - Clean and minimal */}
          <Link
            to="/"
            onClick={(e) => handleNavClick(e, '/')}
            className="flex items-center gap-2.5 group transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="relative">
              <img
                className="h-8 w-auto transition-transform duration-300 group-hover:scale-110"
                src="/images/newomen-logo.png"
                alt="Newomen"
              />
            </div>
            <span className="hidden lg:inline text-sm font-semibold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              NewMe
            </span>
          </Link>

          {/* Desktop navigation - Modern pill-style */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1.5 bg-muted/30 backdrop-blur-sm rounded-full border border-border/50">
            {navigation.map((item) => (
              <NavLink key={item.path} to={item.path} label={item.name} />
            ))}
            {profile?.role === "admin" && (
              <Link
                to="/admin"
                onClick={(e) => handleNavClick(e, '/admin')}
                className={
                  `ml-1 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ` +
                  (location.pathname.startsWith("/admin")
                    ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
                    : "text-muted-foreground hover:text-primary hover:bg-muted/50")
                }
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile navigation - Slide down animation */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen 
              ? 'max-h-[600px] opacity-100 pb-3' 
              : 'max-h-0 opacity-0'
          }`}
        >
          <div className="pt-2 space-y-1.5 border-t border-border/30 mt-2">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                label={item.name}
                className="w-full text-left justify-start"
              />
            ))}
            {profile?.role === "admin" && (
              <Link
                to="/admin"
                onClick={(e) => handleNavClick(e, '/admin')}
                className={
                  `inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-300 w-full ` +
                  (location.pathname.startsWith("/admin")
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-primary hover:bg-muted/50")
                }
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
