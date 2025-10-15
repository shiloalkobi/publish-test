"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MailIcon, RocketIcon, StarIcon, ShieldIcon, PhoneIcon } from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-700 via-blue-500 to-red-400">
      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-700 to-red-500 shadow-md">
        <div className="flex items-center gap-2">
          <RocketIcon className="text-white w-7 h-7" />
          <span className="text-2xl font-bold text-white tracking-tight">RedBlue</span>
        </div>
        <div className="flex gap-4">
          <a href="#features" className="text-white hover:text-blue-100 font-medium transition">Features</a>
          <a href="#pricing" className="text-white hover:text-blue-100 font-medium transition">Pricing</a>
          <a href="#contact" className="text-white hover:text-blue-100 font-medium transition">Contact</a>
        </div>
        <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-700">Sign Up</Button>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-6 md:px-20 py-16 gap-10">
        <div className="flex-1">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-lg">
            Ignite Your Business <span className="text-red-300">with Red & Blue</span>
          </h1>
          <p className="text-lg md:text-2xl text-blue-100 mb-8 max-w-xl">
            Experience the power of innovation and reliability. Our platform blends bold creativity with trusted performance to help you reach new heights.
          </p>
          <Button size="lg" className="bg-red-500 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-lg shadow-lg transition">Get Started</Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-blue-500 via-white to-red-400 flex items-center justify-center shadow-2xl">
            <RocketIcon className="w-32 h-32 text-blue-700" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-6 md:px-20 bg-gradient-to-r from-blue-800 via-blue-600 to-red-400">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-10 text-center">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white/90 shadow-lg">
            <CardHeader>
              <StarIcon className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-blue-700">Outstanding Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-900">Lightning-fast speeds and seamless experience, powered by cutting-edge technology.</p>
            </CardContent>
          </Card>
          <Card className="bg-white/90 shadow-lg">
            <CardHeader>
              <ShieldIcon className="w-8 h-8 text-red-500 mb-2" />
              <CardTitle className="text-red-600">Secure & Reliable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-900">Your data is protected with industry-leading security and 99.99% uptime.</p>
            </CardContent>
          </Card>
          <Card className="bg-white/90 shadow-lg">
            <CardHeader>
              <RocketIcon className="w-8 h-8 text-blue-700 mb-2" />
              <CardTitle className="text-blue-700">Easy to Launch</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-900">Get started in minutes with our intuitive onboarding and helpful support.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-6 md:px-20 bg-gradient-to-r from-red-500 via-blue-500 to-blue-700">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-10 text-center">Pricing</h2>
        <div className="flex flex-col md:flex-row gap-8 justify-center">
          <Card className="bg-white/90 shadow-xl w-full md:w-80">
            <CardHeader>
              <CardTitle className="text-blue-700">Starter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-700 mb-2">$9<span className="text-lg font-normal">/mo</span></div>
              <ul className="text-blue-900 mb-6 space-y-2">
                <li>✔️ Basic features</li>
                <li>✔️ Email support</li>
                <li>✔️ Secure access</li>
              </ul>
              <Button className="w-full bg-blue-700 hover:bg-red-500 text-white">Choose Starter</Button>
            </CardContent>
          </Card>
          <Card className="bg-white/90 shadow-xl w-full md:w-80 border-2 border-red-500">
            <CardHeader>
              <CardTitle className="text-red-600">Pro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600 mb-2">$29<span className="text-lg font-normal">/mo</span></div>
              <ul className="text-blue-900 mb-6 space-y-2">
                <li>✔️ All Starter features</li>
                <li>✔️ Priority support</li>
                <li>✔️ Advanced analytics</li>
              </ul>
              <Button className="w-full bg-red-500 hover:bg-blue-700 text-white">Choose Pro</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 px-6 md:px-20 bg-gradient-to-r from-blue-700 via-blue-500 to-red-400">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-10 text-center">Contact Us</h2>
        <div className="max-w-2xl mx-auto bg-white/90 rounded-lg shadow-lg p-8">
          {submitted ? (
            <div className="text-center text-blue-700 font-semibold text-xl py-8">
              Thank you for reaching out! We'll get back to you soon.
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-blue-900 font-medium mb-1">Name</label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="bg-white border-blue-300 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-blue-900 font-medium mb-1">Email</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="bg-white border-blue-300 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-blue-900 font-medium mb-1">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full rounded-md border border-blue-300 focus:border-blue-500 px-3 py-2 bg-white text-blue-900"
                />
              </div>
              <Button type="submit" className="bg-blue-700 hover:bg-red-500 text-white w-full">Send Message</Button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 px-6 md:px-20 bg-gradient-to-r from-blue-800 to-red-500 text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <RocketIcon className="w-5 h-5" />
          <span className="font-semibold">RedBlue</span>
        </div>
        <div className="flex gap-4">
          <a href="mailto:info@redblue.com" className="flex items-center gap-1 hover:underline"><MailIcon className="w-4 h-4" /> info@redblue.com</a>
          <a href="tel:+1234567890" className="flex items-center gap-1 hover:underline"><PhoneIcon className="w-4 h-4" /> +1 234 567 890</a>
        </div>
        <span className="text-sm">© {new Date().getFullYear()} RedBlue. All rights reserved.</span>
      </footer>
    </div>
  );
}
