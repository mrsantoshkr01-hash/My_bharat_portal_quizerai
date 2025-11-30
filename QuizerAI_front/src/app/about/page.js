// about us page for 
'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  ArrowLeft,
  Brain,
  Users,
  Target,
  Heart,
  Lightbulb,
  Globe,
  Award,
  Rocket,
  MapPin,
  Mail,
  Linkedin,
  Twitter,
  Github,
  Calendar,
  TrendingUp,
  Sparkles,
  Star,
  Zap,
  Shield,
  BookOpen,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { GradientText } from '@/components/common/GradientText'
import { AnimatedCounter } from '@/components/common/AnimatedCounter'
import kunalphoto from 'public/images/aboutus/kunal_12.jpg'
import Image from 'next/image'

const AboutPage = () => {
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [storyRef, storyInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [teamRef, teamInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [valuesRef, valuesInView] = useInView({ triggerOnce: true, threshold: 0.1 })

  const stats = [
    { number: 50000, suffix: '+', label: 'Active Students', icon: Users },
    { number: 500, suffix: '+', label: 'Partner Schools', icon: BookOpen },
    { number: 10000000, suffix: '+', label: 'Quizzes Generated', icon: Brain },
    { number: 95, suffix: '%', label: 'Student Success Rate', icon: TrendingUp }
  ]

  const timeline = [
    {
      year: '2024',
      title: 'The Vision',
      description: 'Founded with the mission to democratize AI-powered education and make learning more engaging and accessible.',
      icon: Lightbulb
    },
    {
      year: 'May 2025',
      title: 'Sharpening the Vision',
      description: 'Focused on refining our concept, aligning our goals with user needs, and enhancing the core features to deliver a clearer, more impactful solution.',
      icon: Brain
    },
    {
      year: 'August 16, 2025',
      title: 'Launch of QuizerAi with Advanced AI Features',
      description: 'Officially launched QuizerAi, introducing powerful capabilities including YouTube video processing for learning content, automated question paper digitization, and a 24/7 AI tutor to make education more interactive, accessible, and personalized.',
      icon: Star
    },

    // {
    //   year: '2025 (16 August )',
    //   title: 'Advanced AI Features',
    //   description: 'Launched YouTube video processing, question paper digitization, and 24/7 AI tutor capabilities.',
    //   icon: Star
    // }
  ]

  const team = [
    {
      name: 'Kunal Kumar',
      role: 'Founder & CEO',
      bio: 'Full-Stack AI Engineer with a passion for transforming education through technology. Leading QuizerAI\'s vision to democratize AI-powered learning.',
      image: '/images/team/kunal.jpg',
      linkedin: 'http://www.linkedin.com/in/kunalkrdev',
      twitter: 'https://x.com/KunalKumar4832?t=1WP8BF9boMyZPkDP83YOsw&s=09',
      location: 'Patna, Bihar',
      expertise: ['AI/ML', 'Full-Stack Development', 'Educational Technology', 'Product Strategy'],
      gradient: 'from-blue-500 to-purple-500'
    }
  ]

  const values = [
    {
      icon: Brain,
      title: 'Innovation First',
      description: 'We push the boundaries of what\'s possible in educational technology, constantly exploring new ways AI can enhance learning.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Heart,
      title: 'Student-Centric',
      description: 'Every decision we make is guided by what\'s best for learners. Their success is our success.',
      gradient: 'from-red-500 to-pink-500'
    },
    {
      icon: Globe,
      title: 'Accessibility for All',
      description: 'Quality education should be available to everyone, regardless of location, background, or economic status.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'We protect student data with the highest security standards and maintain complete transparency.',
      gradient: 'from-purple-500 to-indigo-500'
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'Learning is social. We build tools that connect students, teachers, and institutions in meaningful ways.',
      gradient: 'from-orange-500 to-yellow-500'
    },
    {
      icon: Zap,
      title: 'Continuous Improvement',
      description: 'We\'re never satisfied with the status quo. We iterate, learn, and improve every day.',
      gradient: 'from-violet-500 to-purple-500'
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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const FloatingElement = ({ children, delay = 0, duration = 20 }) => (
    <motion.div
      animate={{
        y: [0, -20, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      {/* Hero Section */}
      <section className="pt-24 pb-16 relative overflow-hidden" ref={heroRef}>
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            className="max-w-6xl mx-auto"
          >
            <motion.div variants={itemVariants} className="text-center mb-12">
              <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Home</span>
              </Link>

              <div className="flex items-center justify-center gap-4 mb-8">
                <motion.div
                  className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Brain className="w-10 h-10 text-white" />
                </motion.div>
                <div className="text-left">
                  <h1 className="text-5xl md:text-6xl font-bold text-slate-800">
                    About <GradientText>QuizerAI</GradientText>
                  </h1>
                  <p className="text-xl text-slate-600 mt-2">Revolutionizing education with AI</p>
                </div>
              </div>

              <p className="text-2xl text-slate-700 leading-relaxed max-w-4xl mx-auto mb-12">
                We&lsquo;re building the future of education where AI empowers every student to learn better,
                faster, and more effectively. Our mission is to make quality education accessible to
                everyone, everywhere.
              </p>

              {/* Stats
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    variants={itemVariants}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <stat.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
                      <AnimatedCounter end={stat.number} suffix={stat.suffix} />
                    </div>
                    <div className="text-slate-600">{stat.label}</div>
                  </motion.div>
                ))}
              </div> */}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              <div>
                <h2 className="text-4xl font-bold text-slate-800 mb-6">
                  Our <GradientText>Mission</GradientText>
                </h2>
                <p className="text-lg text-slate-700 leading-relaxed mb-8">
                  To democratize quality education by harnessing the power of artificial intelligence.
                  We believe that every student deserves access to personalized, engaging, and effective
                  learning tools that adapt to their unique needs and learning style.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-xl p-6">
                    <Target className="w-8 h-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold text-slate-800 mb-2">Our Vision</h3>
                    <p className="text-slate-600 text-sm">A world where AI makes learning accessible, personalized, and effective for everyone.</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-6">
                    <Award className="w-8 h-8 text-purple-600 mb-3" />
                    <h3 className="font-semibold text-slate-800 mb-2">Our Goal</h3>
                    <p className="text-slate-600 text-sm">Empower 10 million students worldwide with AI-powered learning tools by 2025.</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <motion.div
                  className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl p-8 text-white"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-2xl font-bold mb-6">What Drives Us</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Heart className="w-3 h-3" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Passion for Education</h4>
                        <p className="text-blue-100 text-sm">We&lsquo;re educators at heart who understand the challenges students face.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Lightbulb className="w-3 h-3" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Innovation Mindset</h4>
                        <p className="text-blue-100 text-sm">We constantly push boundaries to create breakthrough solutions.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Globe className="w-3 h-3" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Global Impact</h4>
                        <p className="text-blue-100 text-sm">We aim to transform education on a global scale.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Story Timeline */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white" ref={storyRef}>
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={storyInView ? "visible" : "hidden"}
            className="max-w-6xl mx-auto"
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
                Our <GradientText>Journey</GradientText>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                From a simple idea to a platform serving thousands of students worldwide.
                Here&lsquo;s how we&lsquo;ve grown and evolved.
              </p>
            </motion.div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>

              <div className="space-y-12">
                {timeline.map((item, index) => (
                  <motion.div
                    key={item.year}
                    variants={itemVariants}
                    className="relative flex items-start gap-8"
                  >
                    {/* Timeline dot */}
                    <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-white rounded-2xl p-8 shadow-soft border border-slate-200">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-2xl font-bold text-slate-800">{item.year}</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-3">{item.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

        {/* Team Section - Enhanced */}
      <section className="py-24 bg-white/50 backdrop-blur-sm" ref={teamRef}>
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={teamInView ? "visible" : "hidden"}
            className="max-w-7xl mx-auto"
          >
            <motion.div variants={itemVariants} className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium mb-6">
                <Users className="w-4 h-4" />
                <span>Our Team</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-8">
                Meet the <GradientText>Visionaries</GradientText>
              </h2>
              <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
                We&apos;re a passionate team of educators, engineers, and innovators
                united by our mission to transform education through AI technology.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-1 gap-12 justify-center">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  variants={itemVariants}
                  className="max-w-4xl mx-auto"
                >
                  <motion.div
                    className="bg-white rounded-3xl p-10 shadow-soft border border-white/20 hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
                    whileHover={{ y: -10 }}
                  >
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${member.gradient} opacity-5 rounded-3xl`}></div>
                    
                    <div className="relative z-10 grid lg:grid-cols-3 gap-8 items-center">
                      {/* Avatar and basic info */}
                      <div className="text-center lg:text-left">
                        <FloatingElement delay={index * 0.5}>
                          <div className={`w-32 h-32 bg-gradient-to-br ${member.gradient} rounded-3xl flex items-center justify-center mx-auto lg:mx-0 mb-6 shadow-2xl`}>
                            <span className="text-white text-4xl font-bold">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </FloatingElement>
                        
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">{member.name}</h3>
                        <p className="text-blue-600 font-semibold mb-4 text-lg">{member.role}</p>
                        
                        <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-500">{member.location}</span>
                        </div>

                        {/* Social links */}
                        <div className="flex justify-center lg:justify-start gap-3">
                          {member.linkedin && (
                            <motion.a 
                              href={member.linkedin}
                              whileHover={{ scale: 1.1 }}
                              className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white hover:shadow-lg transition-all duration-300"
                            >
                              <Linkedin className="w-5 h-5" />
                            </motion.a>
                          )}
                          {member.twitter && (
                            <motion.a 
                              href={member.twitter}
                              whileHover={{ scale: 1.1 }}
                              className="w-10 h-10 bg-gradient-to-r from-sky-500 to-sky-600 rounded-xl flex items-center justify-center text-white hover:shadow-lg transition-all duration-300"
                            >
                              <Twitter className="w-5 h-5" />
                            </motion.a>
                          )}
                        </div>
                      </div>

                      {/* Bio and expertise */}
                      <div className="lg:col-span-2">
                        <p className="text-slate-600 text-lg leading-relaxed mb-8">{member.bio}</p>
                        
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-500" />
                            Areas of Expertise
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {member.expertise.map((skill, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-2">
                                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                <span className="text-blue-800 font-medium">{skill}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white" ref={valuesRef}>
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={valuesInView ? "visible" : "hidden"}
            className="max-w-6xl mx-auto"
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
                Our <GradientText>Values</GradientText>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                These core principles guide everything we do and shape how we build products,
                interact with users, and grow as a company.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white rounded-2xl p-8 shadow-soft border border-slate-200 hover:shadow-medium transition-all duration-300 group"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <value.icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 mb-4">{value.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-48 translate-y-48"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center text-white"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Join Our Mission
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed">
              Be part of the educational revolution. Whether you&lsquo;re a student, teacher, or institution,
              help us shape the future of learning with AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link href="/register">
                <motion.button
                  className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Rocket className="w-6 h-6" />
                  Start Learning Today
                </motion.button>
              </Link>

              <Link href="/contact">
                <motion.button
                  className="border-2 border-white text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Mail className="w-6 h-6" />
                  Get in Touch
                </motion.button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 text-blue-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>Founded in 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>Kolkata , WB ,INDIA</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Remote-First Team</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default AboutPage