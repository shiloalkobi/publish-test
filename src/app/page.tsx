"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SunIcon, ArrowRightIcon } from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-8 py-4 border-b bg-white/80 backdrop-blur z-10">
        <div className="flex items-center gap-2 text-xl font-bold">
          <span className="inline-flex items-center gap-1">
            <SunIcon className="w-6 h-6 text-yellow-400" />
            SunLanding
          </span>
        </div>
        <div className="flex gap-4">
          <a href="#features" className="text-gray-700 hover:text-black font-medium transition-colors">Features</a>
          <a href="#pricing" className="text-gray-700 hover:text-black font-medium transition-colors">Pricing</a>
          <a href="#contact" className="text-gray-700 hover:text-black font-medium transition-colors">Contact</a>
        </div>
        <Button variant="outline">Sign In</Button>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col md:flex-row items-center justify-center px-8 py-16 bg-gradient-to-b from-yellow-50 to-white">
        <div className="max-w-xl w-full flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
            Welcome to <span className="text-yellow-500">SunLanding</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700">
            The modern landing page template for your next big idea. Fast, responsive, and beautiful by default.
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="max-w-xs"
              required
              aria-label="Email address"
              disabled={submitted}
            />
            <Button type="submit" disabled={submitted || !email.trim()}>
              {submitted ? "Subscribed!" : <><span>Get Started</span> <ArrowRightIcon className="ml-2 w-4 h-4" /></>}
            </Button>
          </form>
          {submitted && (
            <div className="text-green-600 font-medium mt-2">Thank you for subscribing!</div>
          )}
        </div>
        <div className="hidden md:flex flex-1 justify-center items-center">
          <div className="aspect-video w-96 rounded-xl bg-yellow-100 flex items-center justify-center text-7xl">
            🌞
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 flex flex-col items-center text-center gap-4">
              <div className="text-4xl">⚡️</div>
              <h3 className="font-semibold text-lg">Lightning Fast</h3>
              <p className="text-gray-600">Optimized for speed and performance, your users will love the snappy experience.</p>
            </Card>
            <Card className="p-6 flex flex-col items-center text-center gap-4">
              <div className="text-4xl">📱</div>
              <h3 className="font-semibold text-lg">Fully Responsive</h3>
              <p className="text-gray-600">Looks great on any device, from mobile to desktop, out of the box.</p>
            </Card>
            <Card className="p-6 flex flex-col items-center text-center gap-4">
              <div className="text-4xl">🎨</div>
              <h3 className="font-semibold text-lg">Beautifully Designed</h3>
              <p className="text-gray-600">Modern, clean, and customizable to fit your brand and style.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-8 bg-yellow-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 flex flex-col items-center gap-4 border-2 border-yellow-400">
              <div className="text-2xl font-bold">Free</div>
              <div className="text-4xl font-extrabold">$0</div>
              <ul className="text-gray-600 text-center mb-4">
                <li>✔️ Basic features</li>
                <li>✔️ Unlimited users</li>
                <li>✔️ Email support</li>
              </ul>
              <Button variant="outline">Get Started</Button>
            </Card>
            <Card className="p-8 flex flex-col items-center gap-4 border-2 border-yellow-500 bg-yellow-100 scale-105 shadow-lg">
              <div className="text-2xl font-bold">Pro</div>
              <div className="text-4xl font-extrabold">$19</div>
              <ul className="text-gray-600 text-center mb-4">
                <li>✔️ All Free features</li>
                <li>✔️ Advanced analytics</li>
                <li>✔️ Priority support</li>
              </ul>
              <Button>Upgrade</Button>
            </Card>
            <Card className="p-8 flex flex-col items-center gap-4 border-2 border-yellow-400">
              <div className="text-2xl font-bold">Enterprise</div>
              <div className="text-4xl font-extrabold">Custom</div>
              <ul className="text-gray-600 text-center mb-4">
                <li>✔️ All Pro features</li>
                <li>✔️ Dedicated manager</li>
                <li>✔️ Custom integrations</li>
              </ul>
              <Button variant="outline">Contact Sales</Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-8 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Contact Us</h2>
        <form className="flex flex-col gap-4 bg-yellow-50 p-8 rounded-xl shadow-md">
            <Input type="text" placeholder="Your Name" required aria-label="Your Name" />
            <Input type="email" placeholder="Your Email" required aria-label="Your Email" />
            <textarea
              className="resize-none rounded-md border border-gray-300 p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Your Message"
              required
              aria-label="Your Message"
            />
            <Button type="submit" className="self-end">Send Message</Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 px-8 border-t bg-yellow-50 text-center text-gray-600 text-sm">
        &copy; {new Date().getFullYear()} SunLanding. All rights reserved.
      </footer>
    </div>
  );
}