'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Mail,
    Phone,
    MapPin,
    Clock,
    Send,
    MessageCircle,
    HeadphonesIcon,
    Globe,
    Twitter,
    Facebook,
    Instagram,
    Linkedin,
    Youtube,
    Github,
    Zap,
    Users,
    BookOpen,
    HelpCircle,
    Building,
    User,
    CheckCircle
} from 'lucide-react'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'

const ContactUs = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        category: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 2000))

        setIsSubmitting(false)
        setIsSubmitted(true)

        // Reset form after 3 seconds
        setTimeout(() => {
            setIsSubmitted(false)
            setFormData({ name: '', email: '', subject: '', category: '', message: '' })
        }, 3000)
    }

    const contactMethods = [
        {
            icon: Mail,
            title: "Email Support",
            description: "Get help via email within 24 hours",
            contact: "support@quizerai.com",
            action: "mailto:support@quizerai.com?subject=Support Request&body=Hello QuizerAI Team,",
            available: "24/7",
            responseTime: "Within 24 hours",
            color: "from-blue-500 to-blue-600"
        },
        {
            icon: Phone,
            title: "Phone Support",
            description: "Speak directly with our support team",
            contact: "+91 7870304944",
            action: "tel:+917870304944",
            available: "Mon-Fri, 9 AM - 6 PM IST",
            responseTime: "Immediate",
            color: "from-green-500 to-green-600"
        },
        {
            icon: MessageCircle,
            title: "Live Chat",
            description: "Chat with our AI assistant or support team",
            contact: "Available on website",
            action: "/chatbot", // Would open chat widget
            available: "24/7",
            responseTime: "Within 5 minutes",
            color: "from-purple-500 to-purple-600"
        },
        {
            icon: HeadphonesIcon,
            title: "Video Call Support",
            description: "Schedule a video call for complex issues",
            contact: "Book via calendar",
            action: "https://calendly.com/quizerai-support",
            available: "Mon-Fri, 10 AM - 5 PM IST",
            responseTime: "Scheduled",
            color: "from-orange-500 to-orange-600"
        }
    ]

    const socialLinks = [
        {
            icon: Twitter,
            name: "Twitter",
            handle: "@QuizerAI",
            url: "https://x.com/QuizerAI_?t=en6wP18MwlgFaAYcfdG2uw&s=09",
            color: "hover:text-blue-400"
        },
        {
            icon: Instagram,
            name: "Instagram",
            handle: "@quizerai",
            url: "https://www.instagram.com/quizerai?igsh=MWNoM2F1ZnNkZ2FmYw==",
            color: "hover:text-pink-500"
        },
        {
            icon: Linkedin,
            name: "LinkedIn",
            handle: "QuizerAI",
            url: "https://www.linkedin.com/company/quizerai/",
            color: "hover:text-blue-700"
        },
        {
            icon: Youtube,
            name: "YouTube",
            handle: "QuizerAI",
            url: "http://www.youtube.com/@QuizerAI-q8l",
            color: "hover:text-red-500"
        }
    ]

    const supportCategories = [
        { value: "general", label: "General Inquiry", icon: HelpCircle },
        { value: "technical", label: "Technical Support", icon: Zap },
        { value: "billing", label: "Billing & Subscription", icon: Building },
        { value: "feature", label: "Feature Request", icon: BookOpen },
        { value: "partnership", label: "Partnership", icon: Users },
        { value: "feedback", label: "Feedback", icon: User }
    ]

    const officeInfo = {
        address: "Kolkata , WB , INDIA",
        hours: "Monday - Friday: 9:00 AM - 6:00 PM IST",
        timezone: "Indian Standard Time (IST)"
    }

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
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    }

    return (
        <div>
            <Header></Header>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
                {/* Header Section */}
                <motion.section
                    className="relative py-20 px-4 text-center"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <div className="container mx-auto max-w-4xl">
                        <motion.div variants={itemVariants}>
                            <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6">
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Get in Touch
                                </span>
                            </h1>
                            <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
                                We&apos;re here to help you succeed in your learning journey. Choose the best way to reach us,
                                and we&apos;ll get back to you as quickly as possible.
                            </p>
                        </motion.div>
                    </div>
                </motion.section>

                {/* Contact Methods Grid */}
                <motion.section
                    className="py-16 px-4"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <div className="container mx-auto max-w-7xl">
                        <motion.div variants={itemVariants} className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-slate-800 mb-4">Choose Your Preferred Contact Method</h2>
                            <p className="text-slate-600">We offer multiple ways to get in touch based on your needs and urgency</p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {contactMethods.map((method, index) => (
                                <motion.div
                                    key={method.title}
                                    variants={itemVariants}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300"
                                >
                                    <div className={`w-16 h-16 bg-gradient-to-r ${method.color} rounded-2xl flex items-center justify-center mb-4 mx-auto`}>
                                        <method.icon className="w-8 h-8 text-white" />
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">{method.title}</h3>
                                    <p className="text-slate-600 text-center mb-4">{method.description}</p>

                                    <div className="space-y-3">
                                        <a
                                            href={method.action}
                                            className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl font-semibold text-center hover:shadow-lg transition-all duration-200"
                                        >
                                            {method.contact}
                                        </a>

                                        <div className="text-sm text-slate-500 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                <span>{method.available}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MessageCircle className="w-4 h-4" />
                                                <span>{method.responseTime}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* Contact Form & Office Info */}
                <motion.section
                    className="py-16 px-4"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <div className="container mx-auto max-w-7xl">
                        <div className="grid lg:grid-cols-2 gap-12">
                            {/* Contact Form */}
                            <motion.div variants={itemVariants}>
                                <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
                                    <h3 className="text-2xl font-bold text-slate-800 mb-6">Send us a Message</h3>

                                    {isSubmitted ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center py-8"
                                        >
                                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                            <h4 className="text-xl font-semibold text-slate-800 mb-2">Message Sent Successfully!</h4>
                                            <p className="text-slate-600">We&apos;ll get back to you within 24 hours.</p>
                                        </motion.div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        required
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                                        placeholder="Your full name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        required
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                                        placeholder="your.email@example.com"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                                                <select
                                                    name="category"
                                                    value={formData.category}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                                >
                                                    <option value="">Select a category</option>
                                                    {supportCategories.map((category) => (
                                                        <option key={category.value} value={category.value}>
                                                            {category.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                                                <input
                                                    type="text"
                                                    name="subject"
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                                    placeholder="Brief description of your inquiry"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                                                <textarea
                                                    name="message"
                                                    value={formData.message}
                                                    onChange={handleChange}
                                                    required
                                                    rows={6}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                                                    placeholder="Please provide details about your inquiry..."
                                                />
                                            </div>

                                            <motion.button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-200 disabled:opacity-70"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                {isSubmitting ? (
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Send className="w-5 h-5" />
                                                )}
                                                {isSubmitting ? 'Sending...' : 'Send Message'}
                                            </motion.button>
                                        </form>
                                    )}
                                </div>
                            </motion.div>

                            {/* Office Info & Social Links */}
                            <motion.div variants={itemVariants} className="space-y-8">
                                {/* Office Information */}
                                <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
                                    <h3 className="text-2xl font-bold text-slate-800 mb-6">Our Office</h3>

                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                                                <MapPin className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800 mb-1">Address</h4>
                                                <p className="text-slate-600">{officeInfo.address}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                                                <Clock className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800 mb-1">Business Hours</h4>
                                                <p className="text-slate-600">{officeInfo.hours}</p>
                                                <p className="text-sm text-slate-500">{officeInfo.timezone}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                                <Globe className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800 mb-1">Global Support</h4>
                                                <p className="text-slate-600">Serving learners worldwide with 24/7 online support</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Social Media Links */}
                                <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
                                    <h3 className="text-2xl font-bold text-slate-800 mb-6">Follow Us</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        {socialLinks.map((social) => (
                                            <a
                                                key={social.name}
                                                href={social.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-200 group ${social.color}`}
                                            >
                                                <social.icon className="w-6 h-6 text-slate-600 group-hover:scale-110 transition-transform duration-200" />
                                                <div>
                                                    <div className="font-medium text-slate-800">{social.name}</div>
                                                    <div className="text-sm text-slate-500">{social.handle}</div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>

                                    <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                                        <p className="text-sm text-blue-700">
                                            💡 <strong>Pro Tip:</strong> Follow us on social media for learning tips, product updates,
                                            and exclusive content from our education experts!
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.section>

                {/* FAQ Quick Links */}
                <motion.section
                    className="py-16 px-4 bg-white/50"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <div className="container mx-auto max-w-4xl text-center">
                        <motion.div variants={itemVariants}>
                            <h3 className="text-2xl font-bold text-slate-800 mb-4">Need Quick Answers?</h3>
                            <p className="text-slate-600 mb-8">
                                Check out our comprehensive help resources before reaching out
                            </p>

                            <div className="grid md:grid-cols-3 gap-6">
                                <a
                                    href="/help/faq"
                                    className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 group"
                                >
                                    <HelpCircle className="w-12 h-12 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-200" />
                                    <h4 className="font-semibold text-slate-800 mb-2">FAQ</h4>
                                    <p className="text-sm text-slate-600">Common questions and answers</p>
                                </a>

                                <a
                                    href="/help/tutorials"
                                    className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 group"
                                >
                                    <BookOpen className="w-12 h-12 text-purple-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-200" />
                                    <h4 className="font-semibold text-slate-800 mb-2">Tutorials</h4>
                                    <p className="text-sm text-slate-600">Step-by-step guides</p>
                                </a>

                                <a
                                    href="/help/community"
                                    className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 group"
                                >
                                    <Users className="w-12 h-12 text-green-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-200" />
                                    <h4 className="font-semibold text-slate-800 mb-2">Community</h4>
                                    <p className="text-sm text-slate-600">Connect with other learners</p>
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </motion.section>
            </div>
            <Footer></Footer>
        </div>
    )
}

export default ContactUs