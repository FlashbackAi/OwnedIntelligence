import Nav from "@/components/ui/Nav";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import Thesis from "@/components/sections/Thesis";
import Principles from "@/components/sections/Principles";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <Nav />
      <Hero />
      <Manifesto />
      <Thesis />
      <Principles />
    </main>
  );
}
