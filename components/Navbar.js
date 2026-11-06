'use client';

import Link from 'next/link';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

import { useTheme } from "next-themes";
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

import Logo from './Logo';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDarkMode = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handlePricingClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    toast.success("It's completely free! No hidden charges.", {
      icon: '🎉',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
  };

  const NavLink = ({ href, children, onClick }) => (
    <Link
      href={href}
      onClick={onClick}
      className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
    </Link>
  );

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-background/80 backdrop-blur-md border-b border-border/50 py-3 shadow-sm'
        : 'bg-transparent py-5'
        }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Logo />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <SignedIn>
            <NavLink href="/">Home</NavLink>
            <NavLink href="/shorten">Shorten</NavLink>
            <NavLink href="/qr">QR Codes</NavLink>
            <NavLink href="/dashboard">Dashboard</NavLink>
          </SignedIn>
          <SignedOut>
            <NavLink href="/">Home</NavLink>
            <NavLink href="/#powerful-features">Features</NavLink>
            <NavLink href="/qr">QR Codes</NavLink>
            <NavLink href="#" onClick={handlePricingClick}>Pricing</NavLink>
          </SignedOut>
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {mounted && (theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />)}
          </button>

          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 border-2 border-primary/20 hover:border-primary transition-colors"
                }
              }}
            />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 transform hover:-translate-y-0.5">
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground"
            aria-label="Toggle dark mode"
          >
            {mounted && (theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />)}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-foreground"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 glass border-t border-border p-4 flex flex-col space-y-4 animate-in slide-in-from-top-5 duration-200">
          <SignedIn>
            <Link href="/" className="text-foreground font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/shorten" className="text-foreground font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Shorten</Link>
            <Link href="/qr" className="text-foreground font-medium py-2" onClick={() => setMobileMenuOpen(false)}>QR Codes</Link>
            <Link href="/dashboard" className="text-foreground font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            <div className="pt-2 border-t border-border flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Account</span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
          <SignedOut>
            <Link href="/" className="text-foreground font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/#powerful-features" className="text-foreground font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link href="/qr" className="text-foreground font-medium py-2" onClick={() => setMobileMenuOpen(false)}>QR Codes</Link>
            <button className="text-foreground font-medium py-2 text-left" onClick={handlePricingClick}>Pricing</button>
            <div className="flex flex-col space-y-3 pt-2 border-t border-border">
              <SignInButton mode="modal">
                <button className="w-full text-center py-2 text-muted-foreground hover:text-foreground">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium">Get Started</button>
              </SignUpButton>
            </div>
          </SignedOut>
        </div>
      )}
    </nav>
  );
}
