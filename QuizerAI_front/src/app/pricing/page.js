'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { 
  Check, 
  X, 
  Zap, 
  Crown, 
  Building, 
  Sparkles,
  Users,
  Star,
  ArrowRight,
  Shield,
  Clock,
  Headphones,
  Globe
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { GradientText } from '@/components/common/GradientText'

const PricingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const plans = [
    {
      name: "Free",
      icon: Sparkles,
      description: "Perfect for getting started",
      price: { monthly: 0, annual: 0 },
      badge: "Get Started",
      gradient: "from-slate-500 to-slate-600",
      features: [
        { name: "2 Quiz Generations per month", included: true },
        { name: "2 Note Generations per month", included: true },
        { name: "Basic Question Paper Digitization", included: true },
        { name: "1 Collaborative Classroom", included: true },
        { name: "Basic Analytics", included: true },
        { name: "Community Support", included: true },
        { name: "YouTube Video Processing (2/month)", included: true },
        { name: "Mobile App Access", included: true },
        { name: "Advanced Analytics", included: false },
        { name: "Offline Access", included: false },
        { name: "Priority Support", included: false },
        { name: "AI Tutor (Unlimited)", included: false },
        { name: "Custom Integrations", included: false },
        { name: "White-label Options", included: false }
      ],
      cta: "Start Free",
      popular: false,
      limits: "Perfect for individual students trying QuizerAI"
    },
    {
      name: "Student Pro",
      icon: Zap,
      description: "Everything students need to excel",
      price: { monthly: 0, annual: 0 },
      badge: "Most Popular",
      gradient: "from-blue-500 to-purple-500",
      features: [
        { name: "Unlimited Quiz Generations", included: true },
        { name: "Unlimited Note Generations", included: true },
        { name: "Advanced Question Paper Digitization", included: true },
        { name: "Unlimited Collaborative Classrooms", included: true },
        { name: "Advanced Analytics & Insights", included: true },
        { name: "AI Tutor (Unlimited)", included: true },
        { name: "Offline Access", included: true },
        { name: "YouTube Video Processing (Unlimited)", included: true },
        { name: "Priority Support", included: true },
        { name: "Exam-Specific Templates", included: true },
        { name: "Export to PDF/Word", included: true },
        { name: "Mobile App (Premium Features)", included: true },
        { name: "Custom Integrations", included: false },
        { name: "White-label Options", included: false }
      ],
      cta: "Start Pro Plan",
      popular: true,
      limits: "Perfect for serious students and exam preparation"
    },
    {
      name: "Institution",
      icon: Building,
      description: "For schools and organizations",
      price: { monthly: "??", annual: "??" },
      badge: "Best Value",
      gradient: "from-emerald-500 to-teal-500",
      features: [
        { name: "Everything in Student Pro", included: true },
        { name: "Bulk User Management (up to 500 users)", included: true },
        { name: "Advanced Admin Dashboard", included: true },
        { name: "LMS Integrations", included: true },
        { name: "White-label Options", included: true },
        { name: "Custom Branding", included: true },
        { name: "Advanced Security & Compliance", included: true },
        { name: "Dedicated Account Manager", included: true },
        { name: "Custom Training & Onboarding", included: true },
        { name: "API Access", included: true },
        { name: "Custom Reporting", included: true },
        { name: "24/7 Premium Support", included: true },
        { name: "Single Sign-On (SSO)", included: true },
        { name: "Advanced User Permissions", included: true }
      ],
      cta: "Contact Sales",
      popular: false,
      limits: "Ideal for schools, coaching centers, and organizations"
    }
  ]

  const faqs = [
    {
      question: "Can I switch plans anytime?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and billing adjusts accordingly."
    },
    {
      question: "Is there a free trial for paid plans?",
      answer: "We offer a generous free plan to try our features. All paid plans come with a 14-day money-back guarantee."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers for institutional plans."
    },
    {
      question: "Do you offer educational discounts?",
      answer: "Yes! We offer special pricing for educational institutions. Contact our sales team for custom pricing."
    },
    {
      question: "What happens if I exceed my limits?",
      answer: "Free plan users will be prompted to upgrade. Pro users have unlimited access to most features."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Absolutely! You can cancel your subscription at any time. No long-term commitments required."
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto" ref={ref}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="text-center mb-16">
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-sm font-medium mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <Crown className="w-4 h-4" />
                <span>Simple, Transparent Pricing</span>
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-slate-800">Choose the</span>
                <GradientText className="block">Perfect Plan for You</GradientText>
              </h1>
              
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
                Start free and upgrade as you grow. All plans include our core AI-powered features 
                with no hidden fees or long-term commitments.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4">
                <span className={`text-lg font-medium ${!isAnnual ? 'text-blue-600' : 'text-slate-600'}`}>
                  Monthly
                </span>
                <motion.button
                  className={`relative w-16 h-8 rounded-full p-1 transition-all duration-300 ${
                    isAnnual ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                  onClick={() => setIsAnnual(!isAnnual)}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-6 h-6 bg-white rounded-full shadow-lg"
                    animate={{ x: isAnnual ? 32 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  />
                </motion.button>
                <span className={`text-lg font-medium ${isAnnual ? 'text-blue-600' : 'text-slate-600'}`}>
                  Annual
                </span>
                {isAnnual && (
                  <motion.span 
                    className="ml-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    Save 20%
                  </motion.span>
                )}
              </div>
            </motion.div>

            {/* Pricing Cards */}
            <motion.div 
              variants={containerVariants}
              className="grid lg:grid-cols-3 gap-8 mb-20"
            >
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  variants={itemVariants}
                  whileHover={{ 
                    y: plan.popular ? -20 : -15,
                    transition: { duration: 0.3 }
                  }}
                  className={`relative group ${plan.popular ? 'lg:scale-105 z-10' : ''}`}
                >
                  {/* Popular Badge */}
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                      <div className={`bg-gradient-to-r ${plan.gradient} text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2`}>
                        <Star className="w-4 h-4" />
                        {plan.badge}
                      </div>
                    </div>
                  )}

                  <div className={`bg-white rounded-3xl p-8 shadow-xl border-2 transition-all duration-500 h-full relative overflow-hidden ${
                    plan.popular ? 'border-blue-500 shadow-2xl' : 'border-slate-200 hover:shadow-2xl hover:border-blue-300'
                  }`}>
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`}></div>

                    <div className="relative z-10">
                      {/* Header */}
                      <div className="text-center mb-8">
                        <div className={`w-16 h-16 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          <plan.icon className="w-8 h-8 text-white" />
                        </div>
                        
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">{plan.name}</h3>
                        <p className="text-slate-600">{plan.description}</p>
                      </div>

                      {/* Price */}
                      <div className="text-center mb-8">
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-5xl font-bold text-slate-800">
                            {'\u20B9'}{isAnnual ? plan.price.annual : plan.price.monthly}
                          </span>
                          {plan.price.monthly > 0 && (
                            <span className="text-slate-600">
                              /month
                            </span>
                          )}
                        </div>
                        {isAnnual && plan.price.monthly > 0 && (
                          <div className="text-sm text-slate-500 mt-1">
                            Billed annually ({'\u20B9'}{plan.price.annual * 12}/year)
                          </div>
                        )}
                        <div className="text-sm text-slate-500 mt-2">{plan.limits}</div>
                      </div>

                      {/* Features */}
                      <div className="space-y-3 mb-8 max-h-80 overflow-y-auto">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                              feature.included 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              {feature.included ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                            </div>
                            <span className={`text-sm ${
                              feature.included ? 'text-slate-700' : 'text-slate-400'
                            }`}>
                              {feature.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <motion.button
                        className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                          plan.popular
                            ? `bg-gradient-to-r ${plan.gradient} text-white shadow-lg hover:shadow-xl`
                            : 'border-2 border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600'
                        }`}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {plan.cta}
                        <ArrowRight className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              variants={itemVariants}
              className="text-center mb-20"
            >
              <div className="bg-white rounded-2xl p-8 shadow-soft border border-slate-200 max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">
                  Why Choose QuizerAI?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { icon: Shield, title: "Secure & Private", description: "Enterprise-grade security" },
                    { icon: Clock, title: "24/7 Availability", description: "Always accessible" },
                    { icon: Headphones, title: "Expert Support", description: "Dedicated customer success" },
                    { icon: Globe, title: "Global Reach", description: "Available worldwide" }
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      className="text-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-slate-800 mb-1">{feature.title}</h4>
                      <p className="text-sm text-slate-600">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* FAQ Section */}
            <motion.div variants={itemVariants} className="mb-20">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-slate-800 mb-4">
                  Frequently Asked <GradientText>Questions</GradientText>
                </h3>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Get answers to common questions about our pricing and features
                </p>
              </div>

              <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200"
                  >
                    <h4 className="font-semibold text-slate-800 mb-3">{faq.question}</h4>
                    <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Final CTA */}
            <motion.div 
              variants={itemVariants}
              className="text-center"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
                <h3 className="text-3xl md:text-4xl font-bold mb-6">
                  Ready to Transform Your Learning?
                </h3>
                <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
                  Join thousands of students and educators using QuizerAI to achieve better learning outcomes
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Free Trial
                  </motion.button>
                  <motion.button
                    className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Contact Sales
                  </motion.button>
                </div>
                <div className="mt-8 flex items-center justify-center gap-6 text-blue-200 text-sm">
                  <span>✓ 30-day money-back guarantee</span>
                  <span>✓ No setup fees</span>
                  <span>✓ Cancel anytime</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default PricingPage