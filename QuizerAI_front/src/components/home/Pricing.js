// In this we are going to add the pricing section 
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
  GraduationCap,
  UserCheck,
  BookOpen,
  BarChart3,
  Clock
} from 'lucide-react'
import { GradientText } from '@/components/common/GradientText'
import Link from 'next/link'

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false)
  const [activeAudience, setActiveAudience] = useState('student') // 'student' or 'teacher'
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const studentPlans = [
    {
      name: "Free",
      icon: Sparkles,
      description: "Perfect for trying out QuizerAI",
      price: { monthly: 0, annual: 0 },
      badge: null,
      gradient: "from-slate-500 to-slate-600",
      audience: "student",
      features: [
        { name: "2 Quiz Generations per month", included: true },
        { name: "2 Note Generations per month", included: true },
        { name: "Basic Question Paper Digitization", included: true },
        { name: "1 Study Session", included: true },
        { name: "Basic Analytics", included: true },
        { name: "Community Support", included: true },
        { name: "AI Tutor (Limited)", included: true },
        { name: "Advanced Analytics", included: false },
        { name: "Offline Access", included: false },
        { name: "Priority Support", included: false }
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Student Pro",
      icon: Zap,
      description: "Everything students need to excel",
      price: { monthly: 0, annual: 0 },
      badge: "Most Popular",
      gradient: "from-blue-500 to-purple-500",
      audience: "student",
      features: [
        { name: "Unlimited Quiz Generations", included: true },
        { name: "Unlimited Note Generations", included: true },
        { name: "Advanced Question Paper Digitization", included: true },
        { name: "Unlimited Study Sessions", included: true },
        { name: "Advanced Analytics & Insights", included: true },
        { name: "AI Tutor (Unlimited)", included: true },
        { name: "Offline Access", included: true },
        { name: "YouTube Video Processing", included: true },
        { name: "Priority Support", included: true },
        { name: "Exam-Specific Templates", included: true }
      ],
      cta: "Free For Now",
      popular: true
    },
    {
      name: "Student Ultimate",
      icon: Crown,
      description: "For serious exam preparation",
      price: { monthly: 299, annual: 2390 },
      badge: "Best Value",
      gradient: "from-emerald-500 to-teal-500",
      audience: "student",
      features: [
        { name: "Everything in Student Pro", included: true },
        { name: "Personal AI Study Coach", included: true },
        { name: "Advanced Performance Predictions", included: true },
        { name: "Custom Study Schedules", included: true },
        { name: "1-on-1 Expert Sessions", included: true },
        { name: "Premium Content Library", included: true },
        { name: "Mock Test Analytics", included: true },
        { name: "Peer Study Groups", included: true },
        { name: "24/7 Premium Support", included: true },
        { name: "Early Access to Features", included: true }
      ],
      cta: "Upgrade Now",
      popular: false
    }
  ]

  const teacherPlans = [
    {
      name: "Teacher Free",
      icon: BookOpen,
      description: "Get started with classroom management",
      price: { monthly: 0, annual: 0 },
      badge: null,
      gradient: "from-slate-500 to-slate-600",
      audience: "teacher",
      features: [
        { name: "2 Classrooms", included: true },
        { name: "20 Students per classroom", included: true },
        { name: "5 Quiz Generations per month", included: true },
        { name: "Basic Attendance Tracking", included: true },
        { name: "Simple Analytics", included: true },
        { name: "Community Support", included: true },
        { name: "Basic Data Export", included: true },
        { name: "Automated Grading", included: false },
        { name: "Advanced Analytics", included: false },
        { name: "Priority Support", included: false }
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Teacher Pro",
      icon: UserCheck,
      description: "Complete classroom management solution",
      price: { monthly: 0, annual: 0 },
      badge: "Most Popular",
      gradient: "from-purple-500 to-indigo-500",
      audience: "teacher",
      features: [
        { name: "Unlimited Classrooms", included: true },
        { name: "Unlimited Students", included: true },
        { name: "Unlimited Quiz Generations", included: true },
        { name: "Advanced Attendance Tracking", included: true },
        { name: "Automated Daily Quizzes", included: true },
        { name: "Complete Analytics Dashboard", included: true },
        { name: "Excel/CSV Data Export", included: true },
        { name: "Automated Grading", included: true },
        { name: "Parent Progress Reports", included: true },
        { name: "Priority Support", included: true }
      ],
      cta: "Free For Now",
      popular: true
    },
    {
      name: "Institution",
      icon: Building,
      description: "For schools and educational institutions",
      price: { monthly: "Custom", annual: "Custom" },
      badge: "Enterprise",
      gradient: "from-orange-500 to-red-500",
      audience: "teacher",
      features: [
        { name: "Everything in Teacher Pro", included: true },
        { name: "Bulk User Management", included: true },
        { name: "Advanced Admin Dashboard", included: true },
        { name: "LMS Integrations", included: true },
        { name: "White-label Options", included: true },
        { name: "Custom Branding", included: true },
        { name: "Advanced Security & Compliance", included: true },
        { name: "Dedicated Account Manager", included: true },
        { name: "Custom Training & Onboarding", included: true },
        { name: "API Access & Custom Integrations", included: true }
      ],
      cta: "Contact Sales",
      popular: false
    }
  ]

  const plans = activeAudience === 'student' ? studentPlans : teacherPlans

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
        duration: 0.3,
        ease: "easeOut"
      }
    }
  }

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  }

  return (
    <section className="py-24 bg-white relative overflow-hidden" ref={ref} id="pricing">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-sm font-medium mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <Crown className="w-4 h-4" />
              <span>Flexible Pricing</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-slate-800">Choose the</span>
              <GradientText className="block">Perfect Plan for You</GradientText>
            </h2>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Start free and upgrade as you grow. All plans include our core AI-powered features 
              with no hidden fees or long-term commitments.
            </p>

            {/* Audience Toggle */}
            <div className="flex items-center justify-center gap-1 mb-8 bg-slate-100 rounded-2xl p-2 w-fit mx-auto">
              <button
                onClick={() => setActiveAudience('student')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeAudience === 'student' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                <GraduationCap className="w-5 h-5" />
                Student Plans
              </button>
              <button
                onClick={() => setActiveAudience('teacher')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeAudience === 'teacher' 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'text-slate-600 hover:text-purple-600'
                }`}
              >
                <UserCheck className="w-5 h-5" />
                Teacher Plans
              </button>
            </div>

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
                  className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full"
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
            className="grid lg:grid-cols-3 gap-8 mb-16"
          >
            {plans.map((plan, index) => (
              <motion.div
                key={`${activeAudience}-${plan.name}`}
                variants={cardVariants}
                whileHover={{ 
                  y: plan.popular ? -15 : -10,
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

                <div className={`bg-white rounded-3xl p-8 shadow-lg border-2 transition-all duration-500 h-full relative overflow-hidden ${
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
                          {typeof plan.price.monthly === 'number' ? (
                            `₹${isAnnual ? plan.price.annual : plan.price.monthly}`
                          ) : (
                            plan.price.monthly
                          )}
                        </span>
                        {typeof plan.price.monthly === 'number' && plan.price.monthly > 0 && (
                          <span className="text-slate-600">
                            /month
                          </span>
                        )}
                      </div>
                      {isAnnual && typeof plan.price.annual === 'number' && plan.price.annual > 0 && (
                        <div className="text-sm text-slate-500 mt-1">
                          Billed annually (₹{plan.price.annual * 12}/year)
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
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
                    <Link href={plan.name === 'Institution' ? '/contact' : '/register'}>
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
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Key Benefits for Each Audience */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h3 className="text-2xl font-bold text-slate-800 mb-8">
              Why Choose QuizerAI for {activeAudience === 'student' ? 'Learning' : 'Teaching'}?
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeAudience === 'student' ? (
                <>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-2">Instant Learning</h4>
                    <p className="text-sm text-slate-600">Turn any content into quizzes in seconds</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-2">Track Progress</h4>
                    <p className="text-sm text-slate-600">Monitor your learning journey with detailed analytics</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-2">Study Together</h4>
                    <p className="text-sm text-slate-600">Join collaborative study sessions with peers</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Crown className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-2">Ace Exams</h4>
                    <p className="text-sm text-slate-600">Specialized preparation for JEE, NEET, UPSC & more</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-2">Manage Classes</h4>
                    <p className="text-sm text-slate-600">Unlimited classrooms with easy student management</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-2">Auto Grading</h4>
                    <p className="text-sm text-slate-600">Instant quiz grading and detailed feedback</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-2">Track Performance</h4>
                    <p className="text-sm text-slate-600">Detailed analytics on student progress and gaps</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-2">Save Time</h4>
                    <p className="text-sm text-slate-600">Automated attendance and administrative tasks</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Money Back Guarantee */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="flex items-center justify-center gap-4 text-slate-600 mb-8">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-lg">30-day money-back guarantee</span>
              <span className="text-slate-400">•</span>
              <span className="text-lg">Cancel anytime</span>
              <span className="text-slate-400">•</span>
              <span className="text-lg">No setup fees</span>
            </div>

            <p className="text-slate-500 max-w-2xl mx-auto">
              Join thousands of {activeAudience === 'student' ? 'students' : 'teachers'} who are already using QuizerAI to 
              {activeAudience === 'student' ? ' accelerate their learning' : ' streamline their teaching'} with AI-powered tools.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default Pricing