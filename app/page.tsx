import Nav from "@/components/ui/Nav";
import Hero from "@/components/sections/HeroCinematic";
import Manifesto from "@/components/sections/Manifesto";
import Thesis from "@/components/sections/Thesis";
import Principles from "@/components/sections/Principles";
import Products from "@/components/sections/Products";
import Infrastructure from "@/components/sections/Infrastructure";
import EnterpriseProof from "@/components/sections/EnterpriseProof";
import ClosingManifesto from "@/components/sections/ClosingManifesto";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <Nav />
      <Hero />
      <Manifesto />
      <Thesis />
      <Principles />
      <Products />
      <Infrastructure />
      <EnterpriseProof />
      <ClosingManifesto />
      <Footer />
    </main>
  );
}
