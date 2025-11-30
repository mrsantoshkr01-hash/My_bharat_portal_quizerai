import Header from '@/components/layout/Header'
import Hero from '@/components/home/Hero'
import Features from '@/components/home/Features'
import Testimonials from '@/components/home/Testimonials'
import Pricing from '@/components/home/Pricing'
// import FAQ from '../../components/home/FAQ.js'

import CTA from '@/components/home/CTA'
import Footer from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <Testimonials />
      <Pricing />
      {/* <FAQ /> */}
      <CTA />
      <Footer />
    </main>
  )
}