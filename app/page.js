'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, BarChart3, ArrowRight, CheckCircle, Star, Globe, Lock, Rocket, Users, TrendingUp, Cpu, Link as LinkIcon, MousePointerClick, Share2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { QrFeatureSection } from '@/components/landing/QrFeatureSection';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePricingClick = () => {
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

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center bg-background">
          <div className="animate-pulse text-lg text-muted-foreground">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium"
            >
              ✨ The Ultimate URL Shortener
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight">
              Short Links, <br />
              <span className="text-primary drop-shadow-md">
                Big Impact
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Transform long, ugly URLs into short, memorable links. Track clicks, analyze data, and manage your brand with Shortlys.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <motion.a
                href="/shorten"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </motion.a>
              <motion.button
                onClick={handlePricingClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-secondary/80 text-secondary-foreground rounded-full font-semibold text-lg hover:bg-secondary transition-all backdrop-blur-sm"
              >
                View Pricing
              </motion.button>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="relative mx-auto max-w-5xl"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card/50 backdrop-blur-xl group hover:shadow-primary/10 transition-shadow duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5 pointer-events-none"></div>
              <div className="p-4 border-b border-border/50 flex items-center gap-2 bg-muted/30">
                <div className="flex gap-1.5">
                  <motion.div whileHover={{ scale: 1.2 }} className="w-3 h-3 rounded-full bg-red-500/80"></motion.div>
                  <motion.div whileHover={{ scale: 1.2 }} className="w-3 h-3 rounded-full bg-yellow-500/80"></motion.div>
                  <motion.div whileHover={{ scale: 1.2 }} className="w-3 h-3 rounded-full bg-green-500/80"></motion.div>
                </div>
                <div className="flex-1 text-center text-xs text-muted-foreground font-mono">shortlys.com/dashboard</div>
              </div>
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                <Image
                  src="/dashboard-premium.png"
                  alt="Shortlys Dashboard Preview"
                  width={1200}
                  height={675}
                  className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-700"
                  unoptimized
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl"
          />
        </div>
      </section>

      {/* Features / How it Works */}
      <section id="features" className="container mx-auto px-6 py-24 relative">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            How it Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Three simple steps to get started with Shortlys.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: <LinkIcon className="w-6 h-6" />,
              title: "Paste Your Link",
              desc: "Copy your long, messy URL and paste it into our secure shortener."
            },
            {
              icon: <MousePointerClick className="w-6 h-6" />,
              title: "Click Shorten",
              desc: "Watch as your link is instantly transformed into a clean, trackable URL."
            },
            {
              icon: <Share2 className="w-6 h-6" />,
              title: "Share & Track",
              desc: "Share your new link anywhere and track clicks in real-time."
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 group"
            >
              <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">{item.title}</h3>
              <p className="text-muted-foreground text-center leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <QrFeatureSection />

      {/* Free Forever Section */}
      <section id="powerful-features" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none"></div>
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/10 text-green-500 text-sm font-medium mb-8 border border-green-500/20">
              <CheckCircle className="w-4 h-4 mr-2" />
              100% Free to Use
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful Features, <span className="text-primary">Zero Cost</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              We believe in making powerful link management accessible to everyone.
              No credit card required, no hidden fees. Just sign up and start shortening.
            </p>

            <div className="grid md:grid-cols-3 gap-6 text-left">
              {[
                {
                  icon: <Zap className="w-5 h-5" />,
                  title: "Unlimited Links",
                  desc: "Create as many short links as you need without hitting any paywalls."
                },
                {
                  icon: <BarChart3 className="w-5 h-5" />,
                  title: "Full Analytics",
                  desc: "Access detailed insights and tracking data for all your links."
                },
                {
                  icon: <Shield className="w-5 h-5" />,
                  title: "Secure & Reliable",
                  desc: "Enterprise-grade security and uptime for your peace of mind."
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-12">
              <Link href="/shorten">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40"
                >
                  Start Shortlying Now
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
