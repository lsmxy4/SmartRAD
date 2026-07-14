import Benefits from "@/components/sections/Benefits";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Features from "@/components/sections/Features";
import Hero from "@/components/sections/Hero";
import Pricing from "@/components/sections/Pricing";
import QuickMenu from "@/components/layout/QuickMenu";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <Benefits />
        <Pricing />
        <Contact />
      </main>
      <Footer />
      <QuickMenu />
    </>
  );
}
