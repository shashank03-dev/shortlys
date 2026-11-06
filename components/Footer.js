import Link from 'next/link';
import { Heart } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
    return (
        <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-8">
            <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">

                {/* Logo & Copyright */}
                <div className="flex items-center gap-4">
                    <Logo iconSize="w-5 h-5" textSize="text-lg" />
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} Shortlys. All rights reserved.
                    </p>
                </div>

                <Link href="/qr" className="text-sm font-medium text-muted-foreground hover:text-primary">QR Codes</Link>

                {/* Made with Love */}
                <div className="flex items-center text-sm text-muted-foreground font-medium">
                    <span>Made with</span>
                    <Heart className="w-4 h-4 mx-1.5 text-red-500 fill-red-500 animate-pulse" />
                    <span>by Abhay Kumar</span>
                </div>

            </div>
        </footer>
    );
}