"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Mail,
  MapPin,
  Menu,
  Phone,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";

const services = [
  {
    title: "Solar Installation",
    description:
      "Complete rooftop solar installation for homes, shops, offices and businesses.",
    video: "/videos/solar-installation.mp4",
    icon: Sun,
  },
  {
    title: "Solar Cleaning",
    description:
      "Professional panel cleaning to maintain better generation and performance.",
    video: "/videos/solar-cleaning.mp4",
    icon: Sparkles,
  },
  {
    title: "Solar Repair",
    description:
      "Inverter, panel, wiring and complete solar system troubleshooting and repair.",
    video: "/videos/solar-repair.mp4",
    icon: Wrench,
  },
  {
    title: "Solar AMC",
    description:
      "Regular maintenance, inspection and preventive support for your solar system.",
    video: "/videos/solar-amc.mp4",
    icon: ShieldCheck,
  },
];

const steps = [
  {
    number: "01",
    title: "Site Inspection",
    description:
      "We understand your roof, electricity usage and solar requirement.",
    video: "/videos/solar-hero.mp4",
  },
  {
    number: "02",
    title: "Design & Planning",
    description:
      "We design a suitable solar solution according to your requirement.",
    video: "/videos/solar-installation.mp4",
  },
  {
    number: "03",
    title: "Professional Installation",
    description:
      "Our team installs the system with safety and quality in mind.",
    video: "/videos/solar-installation.mp4",
  },
  {
    number: "04",
    title: "Start Saving",
    description:
      "Generate clean energy and reduce your electricity expenses.",
    video: "/videos/solar-amc.mp4",
  },
];

const benefits = [
  {
    icon: Users,
    title: "Experienced Team",
    text: "Professional solar service team",
  },
  {
    icon: ShieldCheck,
    title: "Quality Service",
    text: "Reliable products and workmanship",
  },
  {
    icon: Zap,
    title: "Affordable Pricing",
    text: "Solutions designed around your budget",
  },
  {
    icon: Phone,
    title: "Quick Support",
    text: "Fast response for service requirements",
  },
  {
    icon: MapPin,
    title: "Local & Trusted",
    text: "Serving Chomu, Jaipur and nearby areas",
  },
];

export default function Home() {
  const [mobileMenu, setMobileMenu] = useState(false);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    city: "",
    service: "INSTALLATION",
    propertyType: "",
    monthlyBill: "",
    solarCapacity: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitted(false);
    setErrorMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/public/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message || "Unable to submit inquiry. Please try again."
        );
        return;
      }

      setSubmitted(true);

      setForm({
        name: "",
        mobile: "",
        city: "",
        service: "INSTALLATION",
        propertyType: "",
        monthlyBill: "",
        solarCapacity: "",
        message: "",
      });
    } catch (error) {
      console.error("Lead submission error:", error);

      setErrorMessage(
        "Something went wrong. Please try again or contact us directly."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* TOP BAR */}
      <div className="bg-slate-950 px-4 py-2 text-xs text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-5">
            <a
              href="tel:+918740881142"
              className="flex items-center gap-2 transition hover:text-yellow-400"
            >
              <Phone size={14} />
              +91 8740881142
            </a>

            <a
              href="mailto:shriram1157@gmail.com"
              className="flex items-center gap-2 transition hover:text-yellow-400"
            >
              <Mail size={14} />
              shriram1157@gmail.com
            </a>

            <span className="hidden items-center gap-2 md:flex">
              <MapPin size={14} />
              Chomu, Jaipur, Rajasthan
            </span>
          </div>

          <a
            href="https://wa.me/918740881142"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-green-500 px-4 py-1.5 font-semibold transition hover:bg-green-400"
          >
            💬 Chat on WhatsApp
          </a>
        </div>
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 shadow-lg">
              <Sun size={30} className="text-orange-600" />
            </div>

            <div>
              <div className="text-2xl font-black tracking-tight">
                ShriRam <span className="text-yellow-500">Solar</span>
              </div>

              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
                Clean Energy • Brighter Tomorrow
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            <a href="#" className="font-medium hover:text-green-600">
              Home
            </a>

            <a href="#about" className="font-medium hover:text-green-600">
              About
            </a>

            <a href="#services" className="font-medium hover:text-green-600">
              Services
            </a>

            <a href="#process" className="font-medium hover:text-green-600">
              How It Works
            </a>

            <a href="#why-us" className="font-medium hover:text-green-600">
              Why Us
            </a>

            <a href="#contact" className="font-medium hover:text-green-600">
              Contact
            </a>
          </nav>

          <div className="hidden lg:block">
            <a
              href="#quote"
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-bold shadow-lg transition hover:-translate-y-0.5 hover:bg-yellow-300"
            >
              Get Free Quote
              <ArrowRight size={18} />
            </a>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 lg:hidden"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenu && (
          <div className="border-t bg-white px-5 py-5 lg:hidden">
            <div className="flex flex-col gap-4">
              <a href="#" onClick={() => setMobileMenu(false)}>
                Home
              </a>

              <a href="#about" onClick={() => setMobileMenu(false)}>
                About
              </a>

              <a href="#services" onClick={() => setMobileMenu(false)}>
                Services
              </a>

              <a href="#process" onClick={() => setMobileMenu(false)}>
                How It Works
              </a>

              <a href="#why-us" onClick={() => setMobileMenu(false)}>
                Why Us
              </a>

              <a href="#quote" onClick={() => setMobileMenu(false)}>
                Get Free Quote
              </a>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative min-h-[680px] overflow-hidden bg-slate-950">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        >
          <source src="/videos/solar-hero.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/20" />

        <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-center px-4 py-20">
          <div className="max-w-3xl text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-400/40 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 backdrop-blur">
              <Sparkles size={16} />
              Clean Energy for a Better Tomorrow
            </div>

            <h1 className="text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              बिजली बिल कम करें.
              <br />
              <span className="text-yellow-400">Solar लगाएं.</span>
              <br />
              <span className="text-white">आज ही Free Quote लें.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
              घर, दुकान, ऑफिस या फैक्ट्री के लिए सही Solar System चुनें। Free
              consultation, quotation और installation support — Chomu, Jaipur
              और आसपास के क्षेत्रों में।
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#quote"
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-7 py-4 font-bold text-slate-950 shadow-xl transition hover:-translate-y-1 hover:bg-yellow-300"
              >
                Get Free Quote
                <ArrowRight size={19} />
              </a>

              <a
                href="tel:+918740881142"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/60 bg-white/10 px-7 py-4 font-bold text-white backdrop-blur transition hover:bg-white hover:text-slate-950"
              >
                <Phone size={19} />
                Call Solar Expert
              </a>

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("solar-video")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="inline-flex items-center gap-3 rounded-xl border border-white/40 bg-white/10 px-7 py-4 font-semibold backdrop-blur transition hover:bg-white/20"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-900">
                  <Play size={14} fill="currentColor" />
                </span>
                Watch Our Video
              </button>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                ["⚡", "Lower", "Electricity Bills"],
                ["🌱", "Clean", "& Green Energy"],
                ["🛡️", "Trusted", "Service Support"],
                ["👥", "Happy", "Customers"],
              ].map(([icon, line1, line2]) => (
                <div key={line1} className="flex flex-col gap-1">
                  <div className="text-2xl">{icon}</div>
                  <div className="text-sm font-bold">{line1}</div>
                  <div className="text-xs text-slate-300">{line2}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            id="solar-video"
            className="absolute right-[-80px] top-1/2 hidden w-[440px] -translate-y-1/2 overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl backdrop-blur md:block xl:right-8"
          >
            <div className="relative aspect-[4/5]">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              >
                <source src="/videos/solar-hero.mp4" type="video/mp4" />
              </video>

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="mb-2 inline-flex rounded-full bg-green-500 px-3 py-1 text-xs font-bold">
                  LIVE SOLAR EXPERIENCE
                </div>

                <h3 className="text-2xl font-bold">
                  See Solar in Action
                </h3>

                <p className="mt-1 text-sm text-slate-300">
                  Installation • Cleaning • Repair • Maintenance
                </p>
              </div>

              <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-2xl">
                <Play size={30} fill="currentColor" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <div className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-green-600">
              Our Services
            </div>

            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
              Complete Solar Care
              <span className="text-green-600"> Under One Roof</span>
            </h2>

            <p className="mt-4 text-slate-600">
              From installation to long-term maintenance, we take care of your
              complete solar journey.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <article
                  key={service.title}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
                >
                  <div className="relative h-56 overflow-hidden">
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    >
                      <source src={service.video} type="video/mp4" />
                    </video>

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />

                    <div className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-slate-950 shadow-lg">
                      <Icon size={23} />
                    </div>

                    <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg">
                      <Play size={16} fill="currentColor" />
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold">{service.title}</h3>

                    <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-600">
                      {service.description}
                    </p>

                    <a
                      href="#quote"
                      className="mt-5 inline-flex items-center gap-2 font-bold text-green-700 transition group-hover:gap-3"
                    >
                      Know More
                      <ArrowRight size={17} />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="process"
        className="relative overflow-hidden bg-slate-950 py-20 text-white"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-10 top-20 h-64 w-64 rounded-full bg-green-500 blur-[120px]" />
          <div className="absolute right-10 bottom-10 h-64 w-64 rounded-full bg-yellow-400 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <div className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-yellow-400">
              Simple Process
            </div>

            <h2 className="text-4xl font-black sm:text-5xl">
              How It Works
            </h2>

            <p className="mt-4 text-slate-300">
              From inspection to installation — we make solar simple for you.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
                  <div className="relative h-48">
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="h-full w-full object-cover"
                    >
                      <source src={step.video} type="video/mp4" />
                    </video>

                    <div className="absolute inset-0 bg-slate-950/30" />

                    <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-green-500 font-black">
                      {index + 1}
                    </div>

                    <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900">
                      <Play size={15} fill="currentColor" />
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-2 text-xs font-bold tracking-widest text-yellow-400">
                      STEP {step.number}
                    </div>

                    <h3 className="text-xl font-bold">{step.title}</h3>

                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {step.description}
                    </p>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className="absolute -right-5 top-1/2 z-10 hidden text-yellow-400 xl:block">
                    <ChevronRight />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-green-600">
              Why ShriRam Solar?
            </div>

            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
              Smart Solar.
              <br />
              <span className="text-green-600">Better Future.</span>
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              We provide practical solar solutions focused on quality,
              reliable service and long-term customer support.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Complete solar installation solutions",
                "Professional cleaning and maintenance",
                "Fast repair and troubleshooting support",
                "Transparent service and pricing",
                "Local support for Chomu, Jaipur and nearby areas",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2
                    size={22}
                    className="mt-0.5 shrink-0 text-green-600"
                  />

                  <span className="font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>

            <a
              href="#quote"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-7 py-4 font-bold text-white transition hover:bg-green-700"
            >
              Talk to Our Team
              <ArrowRight size={18} />
            </a>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] shadow-2xl">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="aspect-[4/3] w-full object-cover"
              >
                <source
                  src="/videos/solar-installation.mp4"
                  type="video/mp4"
                />
              </video>
            </div>

            <div className="absolute -bottom-6 -left-5 rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Sun className="text-green-600" />
                </div>

                <div>
                  <div className="font-black">Clean Energy</div>
                  <div className="text-xs text-slate-500">
                    Powering a brighter tomorrow
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="why-us" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-green-600">
              Our Strength
            </div>

            <h2 className="mt-3 text-4xl font-black">
              Why Choose ShriRam Solar?
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {benefits.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 text-center transition hover:-translate-y-2 hover:border-green-200 hover:shadow-xl"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition group-hover:bg-green-600 group-hover:text-white">
                    <Icon size={27} />
                  </div>

                  <h3 className="mt-5 font-bold">{item.title}</h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-green-700 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["500+", "Happy Customers"],
            ["1 MW+", "Solar Installed"],
            ["5+", "Years Experience"],
            ["100%", "Customer Support"],
          ].map(([value, label]) => (
            <div key={label} className="text-center">
              <div className="text-5xl font-black">{value}</div>
              <div className="mt-2 text-green-100">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-green-600">
              Customer Stories
            </div>

            <h2 className="mt-3 text-4xl font-black">
              What Our Customers Say
            </h2>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm md:p-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-green-100 text-4xl">
                👨
              </div>

              <div>
                <div className="text-2xl tracking-widest text-yellow-400">
                  ★★★★★
                </div>

                <p className="mt-4 text-xl leading-8 text-slate-700">
                  “Excellent service! The team explained everything clearly
                  and completed the solar work professionally.”
                </p>

                <div className="mt-5">
                  <div className="font-bold">Happy Customer</div>

                  <div className="text-sm text-slate-500">
                    Chomu, Jaipur
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section
        id="quote"
        className="relative overflow-hidden bg-slate-950 py-20"
      >
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-green-500/20 blur-[120px]" />

        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-yellow-400/10 blur-[100px]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:items-center">
          <div className="text-white">
            <div className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-yellow-400">
              Free Consultation
            </div>

            <h2 className="text-4xl font-black sm:text-5xl">
              Get Your
              <br />
              <span className="text-yellow-400">Free Solar Quote</span>
            </h2>

            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
              Tell us about your requirement and our team will contact you
              with the right solar solution.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-400" />
                Free consultation
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-400" />
                Customized solar solution
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-400" />
                Professional support
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
            <h3 className="text-2xl font-black">Send an Inquiry</h3>

            <p className="mt-2 text-sm text-slate-500">
              Our team will get back to you shortly.
            </p>

            {/* SUCCESS MESSAGE */}
            {submitted && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} />
                  <span>
                    Thank you! Your inquiry has been submitted successfully.
                  </span>
                </div>

                <p className="mt-1 pl-7 text-xs font-normal text-green-600">
                  Our team will contact you shortly.
                </p>
              </div>
            )}

            {/* ERROR MESSAGE */}
            {errorMessage && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="Your Name *"
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />

                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.mobile}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  placeholder="Mobile Number *"
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  value={form.city}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      city: e.target.value,
                    })
                  }
                  placeholder="City / Area *"
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />

                <select
                  required
                  value={form.service}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      service: e.target.value,
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                >
                  <option value="">Select Service *</option>
                  <option value="INSTALLATION">
                    Solar Installation
                  </option>
                  <option value="PANEL_CLEANING">
                    Solar Cleaning
                  </option>
                  <option value="REPAIR">Solar Repair</option>
                  <option value="AMC">Solar AMC</option>
                  <option value="INSPECTION">
                    Solar Inspection
                  </option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <select
                  required
                  value={form.propertyType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      propertyType: e.target.value,
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                >
                  <option value="">Property Type *</option>
                  <option value="HOME">Home</option>
                  <option value="SHOP">Shop</option>
                  <option value="OFFICE">Office</option>
                  <option value="FACTORY">Factory</option>
                  <option value="FARM">Farm</option>
                </select>

                <input
                  required
                  type="number"
                  min="0"
                  value={form.monthlyBill}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      monthlyBill: e.target.value,
                    })
                  }
                  placeholder="Monthly Electricity Bill ₹ *"
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <select
                  value={form.solarCapacity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      solarCapacity: e.target.value,
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                >
                  <option value="">Required Solar Size</option>
                  <option value="2KW">2 KW</option>
                  <option value="3KW">3 KW</option>
                  <option value="5KW">5 KW</option>
                  <option value="10KW">10 KW</option>
                  <option value="UNKNOWN">Not Sure</option>
                </select>

                <a
                  href="tel:+918740881142"
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-green-600 px-4 py-3 font-bold text-green-700 transition hover:bg-green-50"
                >
                  <Phone size={19} />
                  Talk to Solar Expert
                </a>
              </div>

              <textarea
                rows={4}
                value={form.message}
                onChange={(e) =>
                  setForm({
                    ...form,
                    message: e.target.value,
                  })
                }
                placeholder="Your Message (Optional)"
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-4 font-black text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Inquiry
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-5 md:grid-cols-3">
            <a
              href="tel:+918740881142"
              className="rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <Phone className="text-green-600" />

              <h3 className="mt-4 font-bold">Call Us</h3>

              <p className="mt-1 text-sm text-slate-500">
                +91 87408 81142
              </p>
            </a>

            <a
              href="mailto:shriram1157@gmail.com"
              className="rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <Mail className="text-green-600" />

              <h3 className="mt-4 font-bold">Email Us</h3>

              <p className="mt-1 text-sm text-slate-500">
                shriram1157@gmail.com
              </p>
            </a>

            <div className="rounded-2xl border border-slate-200 p-6">
              <MapPin className="text-green-600" />

              <h3 className="mt-4 font-bold">Our Location</h3>

              <p className="mt-1 text-sm text-slate-500">
                Chomu, Jaipur, Rajasthan
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400">
                  <Sun className="text-orange-600" />
                </div>

                <div>
                  <div className="text-2xl font-black">
                    ShriRam <span className="text-yellow-400">Solar</span>
                  </div>

                  <div className="text-xs text-slate-400">
                    Clean Energy • Brighter Tomorrow
                  </div>
                </div>
              </div>

              <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
                Complete solar solutions for installation, cleaning, repair
                and maintenance.
              </p>
            </div>

            <div>
              <h3 className="font-bold">Quick Links</h3>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-400">
                <a href="#">Home</a>
                <a href="#about">About</a>
                <a href="#services">Services</a>
                <a href="#process">How It Works</a>
                <a href="#why-us">Why Us</a>
                <a href="#contact">Contact</a>
              </div>
            </div>

            <div>
              <h3 className="font-bold">Get In Touch</h3>

              <div className="mt-4 space-y-3 text-sm text-slate-400">
                <a
                  href="tel:+918740881142"
                  className="flex items-center gap-2"
                >
                  <Phone size={16} />
                  +91 8740881142
                </a>

                <a
                  href="mailto:shriram1157@gmail.com"
                  className="flex items-center gap-2"
                >
                  <Mail size={16} />
                  shriram1157@gmail.com
                </a>

                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  Chomu, Jaipur, Rajasthan
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
            © 2026 ShriRam Solar. All rights reserved.
            <span className="mx-2">|</span>
            Clean Energy
            <span className="mx-2">|</span>
            Brighter Future
            <span className="mx-2">|</span>
            Greener Tomorrow
          </div>
        </div>
      </footer>

      {/* MOBILE CALL + WHATSAPP CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] flex border-t border-slate-200 bg-white p-2 shadow-2xl sm:hidden">
        <a
          href="tel:+918740881142"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-black text-white"
        >
          <Phone size={19} />
          Call Now
        </a>

        <a
          href="https://wa.me/918740881142?text=Hello%20ShriRam%20Solar,%20mujhe%20solar%20lagwana%20hai.%20Please%20guide%20me."
          target="_blank"
          rel="noreferrer"
          className="ml-2 flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-black text-white"
        >
          💬 WhatsApp
        </a>
      </div>

      {/* DESKTOP FLOATING WHATSAPP */}
      <a
        href="https://wa.me/918740881142?text=Hello%20ShriRam%20Solar,%20mujhe%20solar%20lagwana%20hai.%20Please%20guide%20me."
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 hidden items-center gap-2 rounded-full bg-green-500 px-5 py-3 font-bold text-white shadow-2xl transition hover:scale-105 hover:bg-green-600 sm:flex"
      >
        💬
        Chat on WhatsApp
      </a>
    </main>
  );
}