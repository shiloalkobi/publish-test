"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MailIcon, PhoneIcon, CheckCircleIcon } from "lucide-react";
import { useState } from "react";

function Navbar() {
  return (
    <nav className="w-full bg-blue-700 text-white py-4 px-6 flex justify-between items-center shadow">
      <div className="font-bold text-xl tracking-tight">BlueSite</div>
      <div className="space-x-6 hidden md:flex">
        <a href="#features" className="hover:underline">Features</a>
        <a href="#pricing" className="hover:underline">Pricing</a>
        <a href="#contact" className="hover:underline">Contact</a>
      </div>
      <Button variant="outline" className="border-white text-white hover:bg-blue-600 hover:text-white hidden md:inline-block">Sign Up</Button>
      <button className="md:hidden ml-4" aria-label="Open menu">
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
      </button>
    </nav>
  );
}

function Hero() {
  return (
    <section className="w-full bg-blue-600 text-white py-20 px-6 flex flex-col items-center text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Welcome to BlueSite</h1>
      <p className="text-lg md:text-xl mb-8 max-w-xl">A modern, beautiful landing page template built with Next.js, Shadcn UI, and Tailwind CSS. Launch your next project with style!</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button className="bg-white text-blue-700 font-bold hover:bg-blue-100">Get Started</Button>
        <Button variant="outline" className="border-white text-white hover:bg-blue-700 hover:text-white">Learn More</Button>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: <CheckCircleIcon className="w-8 h-8 text-blue-600" />, 
      title: "Easy to Use",
      desc: "Intuitive and simple interface for everyone.",
    },
    {
      icon: <CheckCircleIcon className="w-8 h-8 text-blue-600" />, 
      title: "Responsive Design",
      desc: "Looks great on all devices, big or small.",
    },
    {
      icon: <CheckCircleIcon className="w-8 h-8 text-blue-600" />, 
      title: "Customizable",
      desc: "Easily adapt to your brand and needs.",
    },
  ];
  return (
    <section id="features" className="py-20 px-6 bg-white w-full">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10 text-blue-700">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <Card key={i} className="flex flex-col items-center p-8 shadow hover:shadow-lg transition-shadow">
              {f.icon}
              <h3 className="mt-4 text-xl font-semibold text-blue-700">{f.title}</h3>
              <p className="mt-2 text-gray-600 text-center">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      features: ["1 Project", "Community Support", "Basic Analytics"],
      highlight: false,
    },
    {
      name: "Pro",
      price: "$19/mo",
      features: ["Unlimited Projects", "Priority Support", "Advanced Analytics"],
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Contact Us",
      features: ["Custom Solutions", "Dedicated Manager", "24/7 Support"],
      highlight: false,
    },
  ];
  return (
    <section id="pricing" className="py-20 px-6 bg-blue-50 w-full">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10 text-blue-700">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <Card key={i} className={`flex flex-col items-center p-8 shadow-lg border-2 ${plan.highlight ? "border-blue-700" : "border-transparent"} bg-white`}>
              <h3 className="text-xl font-semibold text-blue-700 mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold mb-4">{plan.price}</div>
              <ul className="mb-6 space-y-2">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-gray-700"><CheckCircleIcon className="w-4 h-4 text-blue-600" /> {f}</li>
                ))}
              </ul>
              <Button className={plan.highlight ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}>{plan.highlight ? "Get Pro" : "Choose"}</Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <section id="contact" className="py-20 px-6 bg-white w-full">
      <div className="max-w-xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10 text-blue-700">Contact Us</h2>
        <Card className="p-8 shadow-lg">
          {submitted ? (
            <div className="flex flex-col items-center text-blue-700">
              <CheckCircleIcon className="w-12 h-12 mb-2" />
              <div className="text-lg font-semibold">Thank you for reaching out!</div>
              <div>We'll get back to you soon.</div>
            </div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <Input
                name="name"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                required
                className="bg-blue-50"
              />
              <Input
                name="email"
                type="email"
                placeholder="Your Email"
                value={form.email}
                onChange={handleChange}
                required
                className="bg-blue-50"
              />
              <textarea
                name="message"
                placeholder="Your Message"
                value={form.message}
                onChange={handleChange}
                required
                className="bg-blue-50 rounded px-3 py-2 min-h-[100px]"
              />
              <Button type="submit" className="bg-blue-700 text-white hover:bg-blue-800">Send Message</Button>
            </form>
          )}
        </Card>
        <div className="flex flex-col sm:flex-row gap-6 mt-8 justify-center text-blue-700">
          <div className="flex items-center gap-2"><MailIcon className="w-5 h-5" /> contact@bluesite.com</div>
          <div className="flex items-center gap-2"><PhoneIcon className="w-5 h-5" /> +1 234 567 8901</div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-blue-700 text-white py-6 px-6 text-center mt-12">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div>&copy; {new Date().getFullYear()} BlueSite. All rights reserved.</div>
        <div className="space-x-4">
          <a href="#features" className="hover:underline">Features</a>
          <a href="#pricing" className="hover:underline">Pricing</a>
          <a href="#contact" className="hover:underline">Contact</a>
        </div>
      </div>
    </footer>
  );
}

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Contact />
      <Footer />
    </div>
  );
}
