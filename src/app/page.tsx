"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle, Leaf, Rocket, Mail } from "lucide-react";
import Link from "next/link";
import React from "react";

function Navbar() {
  return (
    <nav className="w-full bg-gradient-to-r from-orange-500 to-green-500 py-4 px-6 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-white">🍊 GreenOrange</span>
      </div>
      <div className="hidden md:flex gap-6">
        <Link href="#features" className="text-white font-medium hover:underline">Features</Link>
        <Link href="#pricing" className="text-white font-medium hover:underline">Pricing</Link>
        <Link href="#contact" className="text-white font-medium hover:underline">Contact</Link>
      </div>
      <Button className="bg-white text-orange-600 hover:bg-orange-100 font-semibold">Sign Up</Button>
    </nav>
  );
}

function Hero() {
  return (
    <section className="w-full bg-gradient-to-br from-orange-50 to-green-50 py-20 px-4 flex flex-col items-center text-center">
      <h1 className="text-4xl md:text-6xl font-extrabold text-orange-600 mb-4">Grow Your Success with GreenOrange</h1>
      <p className="text-lg md:text-2xl text-green-700 mb-8 max-w-2xl">Empowering your business with eco-friendly, innovative solutions. Join us to make your workflow more vibrant and sustainable.</p>
      <Button size="lg" className="bg-gradient-to-r from-orange-500 to-green-500 text-white font-bold text-lg px-8 py-6 shadow-lg hover:from-orange-600 hover:to-green-600">Get Started</Button>
    </section>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  return (
    <Card className="flex flex-col items-center p-6 bg-white shadow-md border-0">
      <div className={cn("rounded-full p-4 mb-4", color)}>{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-orange-700">{title}</h3>
      <p className="text-gray-600 text-center">{description}</p>
    </Card>
  );
}

function Features() {
  return (
    <section id="features" className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-green-600 mb-10 text-center">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Rocket className="w-8 h-8 text-orange-500" />}
            title="Fast & Efficient"
            description="Experience blazing fast performance and seamless workflows."
            color="bg-orange-100"
          />
          <FeatureCard
            icon={<Leaf className="w-8 h-8 text-green-600" />}
            title="Eco-Friendly"
            description="Built with sustainability in mind for a greener future."
            color="bg-green-100"
          />
          <FeatureCard
            icon={<CheckCircle className="w-8 h-8 text-green-500" />}
            title="Reliable Support"
            description="Our team is here to help you every step of the way."
            color="bg-orange-100"
          />
        </div>
      </div>
    </section>
  );
}

function PricingCard({ plan, price, features, highlight }: { plan: string; price: string; features: string[]; highlight?: boolean }) {
  return (
    <Card className={cn("flex flex-col items-center p-8 border-2", highlight ? "border-green-500 shadow-lg" : "border-orange-200") }>
      <h3 className={cn("text-2xl font-bold mb-2", highlight ? "text-green-600" : "text-orange-600")}>{plan}</h3>
      <div className="text-4xl font-extrabold mb-4">{price}</div>
      <ul className="mb-6 space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-gray-700">
            <CheckCircle className="w-4 h-4 text-green-500" /> {f}
          </li>
        ))}
      </ul>
      <Button className={cn("w-full font-semibold", highlight ? "bg-green-500 hover:bg-green-600 text-white" : "bg-orange-500 hover:bg-orange-600 text-white")}>Choose Plan</Button>
    </Card>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-orange-50 to-green-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-orange-600 mb-10 text-center">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PricingCard
            plan="Starter"
            price="$9/mo"
            features={["Basic analytics", "Email support", "Eco dashboard"]}
          />
          <PricingCard
            plan="Pro"
            price="$29/mo"
            features={["All Starter features", "Priority support", "Advanced insights"]}
            highlight
          />
          <PricingCard
            plan="Enterprise"
            price="Contact us"
            features={["Custom solutions", "Dedicated manager", "Full analytics"]}
          />
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="py-20 px-4 bg-white">
      <div className="max-w-xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-green-600 mb-6 text-center">Contact Us</h2>
        <form className="bg-gradient-to-r from-orange-50 to-green-50 rounded-xl shadow-md p-8 flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-orange-700 font-semibold mb-1">Name</label>
            <Input id="name" name="name" placeholder="Your Name" required className="bg-white" />
          </div>
          <div>
            <label htmlFor="email" className="block text-orange-700 font-semibold mb-1">Email</label>
            <Input id="email" name="email" type="email" placeholder="you@email.com" required className="bg-white" />
          </div>
          <div>
            <label htmlFor="message" className="block text-orange-700 font-semibold mb-1">Message</label>
            <textarea id="message" name="message" required rows={4} className="w-full rounded-md border border-orange-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="How can we help?" />
          </div>
          <Button type="submit" className="bg-gradient-to-r from-orange-500 to-green-500 text-white font-bold">Send Message</Button>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-gradient-to-r from-green-500 to-orange-500 py-6 px-4 mt-12">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between text-white">
        <div className="flex items-center gap-2 mb-2 md:mb-0">
          <span className="text-xl font-bold">🍊 GreenOrange</span>
        </div>
        <div className="text-sm">&copy; {new Date().getFullYear()} GreenOrange. All rights reserved.</div>
        <div className="flex gap-4">
          <Link href="#" className="hover:underline">Privacy</Link>
          <Link href="#" className="hover:underline">Terms</Link>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Pricing />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
