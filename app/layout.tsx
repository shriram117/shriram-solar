import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://shriramsolar.in";

export const metadata: Metadata = {
  title: {
    default: "ShriRam Solar | Solar Solutions in Chomu, Jaipur",
    template: "%s | ShriRam Solar",
  },

  description:
    "ShriRam Solar provides solar installation, solar panel cleaning, solar repair, inspection and AMC services in Chomu, Jaipur, Rajasthan.",

  keywords: [
    "ShriRam Solar",
    "solar company in Chomu",
    "solar installation Chomu",
    "solar panel cleaning Chomu",
    "solar repair Chomu",
    "solar AMC Chomu",
    "solar services Jaipur",
    "solar panel service Jaipur",
    "solar installation Jaipur",
    "solar energy Rajasthan",
  ],

  authors: [
    {
      name: "ShriRam Solar",
    },
  ],

  creator: "ShriRam Solar",

  metadataBase: new URL(siteUrl),

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "ShriRam Solar | Solar Solutions in Chomu, Jaipur",
    description:
      "Solar installation, cleaning, repair, inspection and AMC services by ShriRam Solar.",
    url: siteUrl,
    type: "website",
    locale: "en_IN",
    siteName: "ShriRam Solar",
  },

  twitter: {
    card: "summary_large_image",
    title: "ShriRam Solar | Solar Solutions in Chomu, Jaipur",
    description:
      "Professional solar installation, repair, cleaning and AMC services.",
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
    },
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",

  name: "ShriRam Solar",

  description:
    "Solar installation, solar panel cleaning, solar repair, inspection and AMC services in Chomu, Jaipur, Rajasthan.",

  telephone: "+918740881142",

  email: "Shriram1157@gmail.com",

  url: siteUrl,

  address: {
    "@type": "PostalAddress",
    addressLocality: "Chomu",
    addressRegion: "Rajasthan",
    addressCountry: "IN",
  },

  areaServed: [
    {
      "@type": "City",
      name: "Chomu",
    },
    {
      "@type": "City",
      name: "Jaipur",
    },
  ],

  serviceType: [
    "Solar Installation",
    "Solar Panel Cleaning",
    "Solar Repair",
    "Solar Inspection",
    "Solar AMC",
  ],

  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+918740881142",
    contactType: "customer service",
    email: "Shriram1157@gmail.com",
    availableLanguage: ["English", "Hindi"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </body>
    </html>
  );
}