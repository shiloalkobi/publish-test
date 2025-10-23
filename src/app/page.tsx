"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MailIcon, CheckCircleIcon, StarIcon } from "lucide-react";
import { useState } from "react";

function Navbar() {
  return (
    <nav className="w-full bg-orange-500 text-white py-4 px-6 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2 text-2xl font-bold">
        <span className="text-white">🍊</span>
        <span>OrangeSite</span>
      </div>
      <div className="hidden md:flex gap-8 text-lg">
        <a href="#features" className="hover:underline">Features</a>
        <a href="#pricing" className="hover:underline">Pricing</a>
        <a href="#contact" className="hover:underline">Contact</a>
      </div>
      <Button variant="outline" className="border-white text-white hover:bg-white hover:text-orange-500 transition">Sign Up</Button>
    </nav>
  );
}

function Hero() {
  return (
    <section className="bg-gradient-to-b from-orange-500 to-orange-400 text-white py-20 px-4 text-center flex flex-col items-center justify-center">
      <h1 className="text-4xl md:text-6xl font-extrabold mb-4">Welcome to OrangeSite 🍊</h1>
      <p className="text-lg md:text-2xl mb-8 max-w-xl mx-auto">The freshest way to launch your next project. Fast, beautiful, and bursting with features.</p>
      <Button className="bg-white text-orange-500 font-bold px-8 py-4 text-lg hover:bg-orange-100 transition">Get Started</Button>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: <CheckCircleIcon className="w-8 h-8 text-orange-500" />,
      title: "Easy to Use",
      desc: "Intuitive design and simple setup so you can focus on what matters.",
    },
    {
      icon: <StarIcon className="w-8 h-8 text-orange-500" />,
      title: "Modern UI",
      desc: "Sleek, responsive, and accessible. Looks great everywhere.",
    },
    {
      icon: <MailIcon className="w-8 h-8 text-orange-500" />,
      title: "Support Included",
      desc: "We’re here to help you every step of the way.",
    },
  ];
  return (
    <section id="features" className="bg-white py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-orange-500 text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <Card key={i} className="flex flex-col items-center p-8 shadow hover:shadow-lg transition border-2 border-orange-100">
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-orange-500">{f.title}</h3>
              <p className="text-gray-700 text-center">{f.desc}</p>
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
      features: ["Basic Features", "Email Support", "Community Access"],
      highlight: false,
    },
    {
      name: "Pro",
      price: "$19/mo",
      features: ["All Starter Features", "Priority Support", "Advanced Analytics"],
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Contact Us",
      features: ["All Pro Features", "Custom Solutions", "Dedicated Manager"],
      highlight: false,
    },
  ];
  return (
    <section id="pricing" className="bg-orange-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-orange-500 text-center mb-12">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <Card
              key={i}
              className={`flex flex-col items-center p-8 border-2 ${plan.highlight ? "border-orange-500 shadow-lg" : "border-orange-100"} bg-white`}
            >
              <h3 className="text-2xl font-bold mb-2 text-orange-500">{plan.name}</h3>
              <div className="text-3xl font-extrabold mb-4">{plan.price}</div>
              <ul className="mb-6 space-y-2">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-gray-700">
                    <CheckCircleIcon className="w-5 h-5 text-orange-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className={`w-full ${plan.highlight ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-orange-100 text-orange-500 hover:bg-orange-200"}`}>{plan.highlight ? "Get Pro" : "Choose"}</Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="contact" className="bg-white py-16 px-4">
      <div className="max-w-xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-orange-500 text-center mb-8">Contact Us</h2>
        <form onSubmit={handleSubmit} className="bg-orange-50 rounded-lg shadow p-8 flex flex-col gap-4">
          <label className="text-orange-500 font-semibold">Email</label>
          <Input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="bg-white border-orange-200 focus:border-orange-400"
          />
          <label className="text-orange-500 font-semibold">Message</label>
          <textarea
            required
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="How can we help you?"
            className="bg-white border border-orange-200 rounded px-3 py-2 min-h-[100px] focus:border-orange-400 outline-none"
          />
          <Button type="submit" className="bg-orange-500 text-white hover:bg-orange-600 mt-4">Send Message</Button>
          {submitted && (
            <div className="text-green-600 font-semibold flex items-center gap-2 mt-2">
              <CheckCircleIcon className="w-5 h-5" />
              Thank you! We'll be in touch.
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-orange-500 text-white py-6 px-4 text-center mt-12">
      <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto gap-2">
        <span className="font-bold">OrangeSite © {new Date().getFullYear()}</span>
        <span className="text-sm">Made with 🍊 and Next.js</span>
      </div>
    </footer>
  );
}

export default function Page() {
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
