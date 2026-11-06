'use client';

import { useState } from 'react';
import { Link2, Copy, Check, ArrowRight, Zap, Shield, BarChart3, QrCode } from 'lucide-react';
import { nanoid } from 'nanoid';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { useUser, useClerk } from '@clerk/nextjs';

export default function ShortenPage() {
    const { isSignedIn } = useUser();
    const { openSignIn } = useClerk();
    const [url, setUrl] = useState('');
    const [alias, setAlias] = useState('');
    const [shortUrl, setShortUrl] = useState('');
    const [shortAlias, setShortAlias] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleInputFocus = (e) => {
        if (!isSignedIn) {
            e.target.blur();
            toast.error("Please log in to shorten URLs", {
                icon: '🔒',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
            openSignIn();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isSignedIn) {
            toast.error("Please log in to shorten URLs");
            openSignIn();
            return;
        }

        // Simple domain validation (must contain at least one dot)
        if (!url.includes('.') || url.length < 4) {
            toast.error("Please enter a valid URL (e.g., youtube.com)");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: url,
                    shorturl: alias.trim() || nanoid(6), // Use custom alias or generate random
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setShortUrl(`${window.location.origin}/${data.shorturl}`);
                setShortAlias(data.shorturl);
                toast.success('Link shortened successfully!');
                setAlias(''); // Reset alias after success
            } else {
                // Show specific error message from API (e.g., "URL already exists")
                toast.error(data.message || 'Something went wrong');
            }
        } catch (error) {
            toast.error('Failed to shorten link');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col pt-24">

            {/* Hero Section */}
            {/* Hero Section */}
            <section className="container mx-auto px-6 py-12 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Shorten Your Links, <br />
                        <span className="text-primary">
                            Expand Your Reach
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
                        The simplest way to track, manage, and share your URLs.
                        Fast, secure, and completely free.
                    </p>
                </motion.div>

                {/* Shortener Form */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-3xl mx-auto relative z-10"
                >
                    <div className="w-full max-w-3xl mx-auto">
                        <form onSubmit={handleSubmit} className="relative group flex flex-col gap-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none z-10">
                                    <Link2 className="w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                </div>
                                <motion.input
                                    whileFocus={{ scale: 1.01 }}
                                    type="text"
                                    placeholder="Paste your long URL here..."
                                    className="w-full pl-16 pr-6 py-6 bg-white dark:bg-white/5 border-2 border-primary/20 hover:border-primary/40 focus:border-primary rounded-full focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-lg placeholder:text-muted-foreground/60 shadow-xl shadow-primary/5"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onFocus={handleInputFocus}
                                    required
                                />
                            </div>

                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none z-10">
                                        <span className="text-muted-foreground font-medium">/</span>
                                    </div>
                                    <motion.input
                                        whileFocus={{ scale: 1.01 }}
                                        type="text"
                                        placeholder="Custom alias (optional)"
                                        className="w-full pl-10 pr-6 py-6 bg-white dark:bg-white/5 border-2 border-primary/20 hover:border-primary/40 focus:border-primary rounded-full focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-lg placeholder:text-muted-foreground/60 shadow-xl shadow-primary/5"
                                        value={alias}
                                        onChange={(e) => setAlias(e.target.value)}
                                        maxLength={20}
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    disabled={loading}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 rounded-full font-semibold text-lg transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Shorten
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </form>

                        <AnimatePresence>
                            {shortUrl && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 bg-secondary/50 rounded-xl border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 overflow-hidden w-full">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0"
                                            >
                                                <Check className="w-5 h-5 text-green-500" />
                                            </motion.div>
                                            <a
                                                href={shortUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-lg font-medium text-primary hover:underline truncate"
                                            >
                                                {shortUrl}
                                            </a>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={copyToClipboard}
                                            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${copied
                                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                                                : 'bg-background border border-border hover:border-primary hover:text-primary'
                                                }`}
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="w-4 h-4 mr-2" />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4 mr-2" />
                                                    Copy
                                                </>
                                            )}
                                        </motion.button>
                                        {shortAlias ? (
                                            <Link href={`/qr?shorturl=${shortAlias}`} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground">
                                                <QrCode className="h-4 w-4" /> QR
                                            </Link>
                                        ) : null}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </section>

            {/* Features / How it Works */}
            <section className="container mx-auto px-6 py-20">
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {[
                        {
                            icon: <Zap className="w-6 h-6" />,
                            title: "Lightning Fast",
                            desc: "Instant shortening with zero latency. Get your links ready in milliseconds."
                        },
                        {
                            icon: <Shield className="w-6 h-6" />,
                            title: "Secure & Reliable",
                            desc: "Your data is protected with enterprise-grade encryption and 99.9% uptime."
                        },
                        {
                            icon: <BarChart3 className="w-6 h-6" />,
                            title: "Detailed Analytics",
                            desc: "Track every click, device, and location in real-time on your dashboard."
                        }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors text-center group"
                        >
                            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                {item.icon}
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                            <p className="text-muted-foreground text-sm">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Background Elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity, delay: 2 }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
                />
            </div>
        </div>
    );
}
