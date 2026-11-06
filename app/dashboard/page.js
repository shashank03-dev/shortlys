"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Link2, MousePointer2, MapPin, Smartphone, ExternalLink, ArrowUpRight, TrendingUp, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [urls, setUrls] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;

    fetch("/api/dashboard-data")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then((data) => {
        console.log("✅ Dashboard data:", data);
        setUrls(data.urls || []);
        setAnalytics(data.analytics || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error loading dashboard:", err);
        setLoading(false);
      });
  }, [isLoaded, user]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  const username = user.firstName || user.username || "User";
  // Modern Palette Colors
  const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#10b981"];

  // Process visits for "Visits Over Time" chart
  const visitsByDate = (analytics?.visits || []).reduce((acc, visit) => {
    const date = new Date(visit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const visitsData = Object.entries(visitsByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date if needed, though keys might not be sorted

  // Ensure we have at least some data points for the chart to look good
  if (visitsData.length === 0) {
    // Add some dummy empty data for visualization if no visits
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      visitsData.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: 0 });
    }
  }

  // Helper: Convert analytics objects into chart data
  const toChartData = (obj) =>
    Object.entries(obj || {}).map(([key, value]) => ({ name: key, value }));

  const deviceData = toChartData(analytics?.deviceStats);
  const locationData = toChartData(analytics?.locationStats);
  const browserData = toChartData(analytics?.browserStats);
  const osData = toChartData(analytics?.osStats);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-xl">
          <p className="font-medium text-foreground">{label || payload[0].name}</p>
          <p className="text-primary text-sm">
            {payload[0].value} visits
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header Section */}
      <section className="relative pt-32 pb-12 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
          >
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, <span className="text-primary">{username}</span>
              </h1>
              <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your links today.</p>
            </div>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/shorten"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-primary/20 flex items-center"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Create New Link
            </motion.a>
          </motion.div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {[
              { title: "Total Links", value: urls.length, icon: <Link2 className="w-6 h-6" />, color: "text-primary", bg: "bg-primary/10", border: "hover:border-primary/30", badge: "+12%" },
              { title: "Total Clicks", value: urls.reduce((acc, curr) => acc + (curr.visits?.length || 0), 0), icon: <MousePointer2 className="w-6 h-6" />, color: "text-yellow-600", bg: "bg-accent/10", border: "hover:border-accent/30", badge: "+5%" },
              { title: "QR Scans", value: analytics?.qrScans || 0, icon: <QrCode className="w-6 h-6" />, color: "text-primary", bg: "bg-primary/10", border: "hover:border-primary/30", badge: null },
              { title: "Countries Reached", value: locationData.length, icon: <MapPin className="w-6 h-6" />, color: "text-green-700", bg: "bg-secondary/20", border: "hover:border-secondary/30", badge: null },
              { title: "Device Types", value: deviceData.length, icon: <Smartphone className="w-6 h-6" />, color: "text-blue-600", bg: "bg-blue-500/10", border: "hover:border-blue-500/30", badge: null }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className={`bg-card/80 backdrop-blur-sm p-6 rounded-2xl border border-border/50 ${stat.border} transition-colors group shadow-sm`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${stat.bg} ${stat.color} rounded-xl group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </div>
                  {stat.badge && (
                    <span className={`text-xs font-medium ${stat.color} ${stat.bg.replace('10', '20')} px-2 py-1 rounded-full`}>{stat.badge}</span>
                  )}
                </div>
                <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </motion.div>
            ))}
          </div>

          {/* Visits Over Time Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-12"
          >
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Visits Over Time
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visitsData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '0.5rem' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--primary)"
                    fillOpacity={1}
                    fill="url(#colorVisits)"
                    strokeWidth={2}
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recent Links List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Recent Links</h3>
            </div>
            {urls.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                No links created yet. Start sharing!
              </div>
            ) : (
              <div className="divide-y divide-border">
                {urls.map((url, index) => (
                  <motion.div
                    key={url.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + (index * 0.1) }}
                    className="p-4 hover:bg-secondary/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-foreground truncate">{url.shorturl}</span>
                        <a href={`${window.location.origin}/${url.shorturl}`} target="_blank" className="text-muted-foreground hover:text-primary transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        {url.qrCode ? <Badge variant="primary">QR</Badge> : null}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{url.url}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{url.visits?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">Visits</p>
                      </div>
                      <Link
                        href={url.qrCode ? `/qr?edit=${url.qrCode.id}` : `/qr?shorturl=${url.shorturl}`}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        aria-label={url.qrCode ? "Edit QR code" : "Create QR code"}
                      >
                        <QrCode className="h-5 w-5" />
                      </Link>
                      <a
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowUpRight className="w-5 h-5" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
