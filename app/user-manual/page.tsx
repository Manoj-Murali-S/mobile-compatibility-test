'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Database, Globe, Search, ShieldCheck, Smartphone, RefreshCw, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function UserManualPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 pl-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 flex items-center justify-center gap-2 w-full border-l border-gray-400/20  ">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="font-semibold text-lg whitespace-nowrap">User Manual</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
            How It Works
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete guide to the Mobile Compatibility Finder. Learn about our hybrid architecture, how to navigate the catalog, and manage data.
          </p>
        </motion.div>

        {/* Core Architecture */}
        <motion.section
          className="mb-16"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <motion.h2 variants={fadeIn} className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Layers className="text-primary w-6 h-6" />
            Ways to Use the App
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div variants={fadeIn} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Database className="w-24 h-24 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 relative z-10">
                <Database className="w-5 h-5 text-primary" />
                Offline Application
              </h3>
              <p className="text-muted-foreground relative z-10">
                When using the offline application, everything works entirely without an internet connection. Information is saved directly to your computer's local storage. You can browse and manage the entire catalog anytime, anywhere.
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Globe className="w-24 h-24 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 relative z-10">
                <Globe className="w-5 h-5 text-blue-500" />
                Website
              </h3>
              <p className="text-muted-foreground relative z-10">
                When accessed via the website, the application connects directly to our online storage. This ensures everyone sees the most up-to-date catalog of compatible devices and accessories instantly.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Step-by-Step User Flow */}
        <motion.section
          className="mb-16"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <motion.h2 variants={fadeIn} className="text-2xl font-bold mb-8 flex items-center gap-2">
            <RefreshCw className="text-primary w-6 h-6" />
            Standard User Flow
          </motion.h2>

          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">

            {/* Step 1 */}
            <motion.div variants={fadeIn} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Search className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border border-border p-5 rounded-xl shadow-sm">
                <h3 className="font-bold text-lg mb-1">1. Browse & Search</h3>
                <p className="text-sm text-muted-foreground">
                  Use the global search bar or hit <kbd className="bg-muted px-1 py-0.5 rounded text-xs">Ctrl+K</kbd> to quickly find any mobile device. You can also filter by Brand using the tabs at the top of the homepage.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div variants={fadeIn} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border border-border p-5 rounded-xl shadow-sm">
                <h3 className="font-bold text-lg mb-1">2. View Compatibilities</h3>
                <p className="text-sm text-muted-foreground">
                  Click on a specific device to open the Details view. Here you can see exactly which accessories (cases, screen protectors, etc.) and other devices are compatible with this model.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div variants={fadeIn} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-green-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border border-border p-5 rounded-xl shadow-sm">
                <h3 className="font-bold text-lg mb-1">3. Admin Management & Roles</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Authorized users can log in via the Admin Dashboard. The system supports multiple users with distinct roles: <strong>Admin</strong>, <strong>Editor</strong>, and <strong>Viewer</strong> to safely control access.
                </p>
                <p className="text-sm text-muted-foreground">
                  From the dashboard, you can create, view, and edit brands, mobile models, and categories. You can also create comprehensive compatibility rules between devices. Any changes made will automatically reflect in the public web app!
                </p>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div variants={fadeIn} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-purple-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border border-border p-5 rounded-xl shadow-sm">
                <h3 className="font-bold text-lg mb-1">4. Cloud Sync</h3>
                <p className="text-sm text-muted-foreground">
                  If you made changes while offline on the desktop app, they are queued up. Once you reconnect to the internet, you can push these changes to Supabase to update the public web catalog.
                </p>
              </div>
            </motion.div>

          </div>
        </motion.section>

        {/* Useful Tips */}
        <motion.section
          className="bg-accent/10 border border-accent/20 rounded-2xl p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-bold mb-4 text-accent">Pro Tips</h2>
          <ul className="space-y-3 text-foreground/80 list-disc list-inside">
            <li><strong>Command Palette:</strong> Press <kbd className="font-mono bg-background/50 border border-border px-1.5 py-0.5 rounded shadow-sm text-xs mx-1">Cmd/Ctrl + K</kbd> anywhere to quickly jump to a device or brand.</li>
            <li><strong>Quick Filters:</strong> Use the "List" and "Grid" toggle on the homepage to switch your viewing preference.</li>
            <li><strong>Authentication:</strong> If using the web version, login via Supabase. If using the desktop app, login securely via local encrypted credentials.</li>
            <li><strong>Offline Mode:</strong> No internet? No problem. The desktop Electron version keeps a local copy of the catalog so you can work anywhere.</li>
          </ul>
        </motion.section>

      </div>
    </main>
  )
}
