"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import {
    ChevronRight,
    ChevronDown,
    FileText,
    Youtube,
    Brain,
    Upload,
    Search,
    Settings,
    Play,
    BarChart3,
    MessageCircle,
    CheckCircle,
    AlertCircle,
    Info,
    Users,
    Zap,
    Clock,
    Target,
    Paperclip,
    UserCheck,
    GraduationCap,
    ClipboardList,
    Download,
    Calendar,
    TrendingUp,
    Database,
    UserPlus,
    PieChart,
    FileSpreadsheet,
    BookOpen,
    Award

} from 'lucide-react';
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'


const GuideSection = ({ title, icon: Icon, children, defaultOpen = false, audience = "both" }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const audienceColor = audience === "teacher" ? "from-purple-500 to-indigo-500" : 
                         audience === "student" ? "from-blue-500 to-cyan-500" : 
                         "from-blue-500 to-purple-500";

    return (
        <div className="border border-slate-200 rounded-xl mb-4 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-6 bg-white hover:bg-slate-50 transition-colors duration-200 flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${audienceColor} rounded-xl flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
                        {audience !== "both" && (
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                audience === "teacher" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                            }`}>
                                {audience === "teacher" ? "For Teachers" : "For Students"}
                            </span>
                        )}
                    </div>
                </div>
                {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                ) : (
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                )}
            </button>
            {isOpen && (
                <div className="bg-slate-50 p-6 border-t border-slate-200">
                    {children}
                </div>
            )}
        </div>
    );
};

const StepCard = ({ number, title, description, tips = [], warning = null, preview = null, link = null }) => (
    <div className="bg-white rounded-lg p-6 border border-slate-200 mb-4">
        <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {number}
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-600 leading-relaxed mb-4">{description}</p>

                {tips.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Pro Tips</span>
                        </div>
                        <ul className="space-y-1">
                            {tips.map((tip, index) => (
                                <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                                    <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {warning && (
                    <div className="bg-amber-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-800">{warning}</span>
                        </div>
                    </div>
                )}

                {preview && (
                    <div className="bg-slate-100 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-medium text-slate-700">Expected Result</span>
                        </div>
                        <p className="text-sm text-slate-600">{preview}</p>
                    </div>
                )}

                {link && (
                    <div className="mt-4">
                        <Link href={link}>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                                Try This Feature
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    </div>
);

const FeatureHighlight = ({ icon: Icon, title, description, features }) => (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed mb-4">{description}</p>
        <div className="grid grid-cols-2 gap-2">
            {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-slate-600">{feature}</span>
                </div>
            ))}
        </div>
    </div>
);

const QuizerAIGuide = () => {
    return (
        <div>
            <Header></Header>

            <div className="min-h-screen bg-gradient-to-br pt-20 from-slate-50 to-blue-50">
                {/* Header */}
                <div className="bg-white border-b border-slate-200">
                    <div className="max-w-6xl mx-auto px-4 py-8">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-slate-800 mb-4">
                                Complete QuizerAI User Guide
                            </h1>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-6">
                                Master every feature with our comprehensive guide for both students and teachers.
                                From AI-powered quiz generation to smart classroom management.
                            </p>
                            
                            {/* Audience Indicators */}
                            <div className="flex items-center justify-center gap-6">
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
                                    <GraduationCap className="w-5 h-5 text-blue-600" />
                                    <span className="text-blue-800 font-medium">Student Features</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full">
                                    <UserCheck className="w-5 h-5 text-purple-600" />
                                    <span className="text-purple-800 font-medium">Teacher Features</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-6xl mx-auto px-4 py-12">

                    {/* Quick Start */}
                    <GuideSection title="Getting Started" icon={Zap} defaultOpen={true}>
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <FeatureHighlight 
                                icon={GraduationCap}
                                title="Student Dashboard"
                                description="Upload study materials, generate practice quizzes, track progress, and get 24/7 AI tutoring support."
                                features={["Quiz Generation", "Progress Tracking", "AI Tutor", "Collaborative Learning"]}
                            />
                            <FeatureHighlight 
                                icon={UserCheck}
                                title="Teacher Dashboard"
                                description="Create classrooms, automate attendance, grade assignments, and analyze student performance with comprehensive analytics."
                                features={["Classroom Management", "Auto Attendance", "Bulk Grading", "Performance Analytics"]}
                            />
                        </div>

                        <StepCard
                            number="1"
                            title="Create Your Account"
                            description="Sign up for QuizerAI and choose your role - Student or Teacher. Each role provides specialized dashboards and features tailored to your needs."
                            tips={[
                                "Use your school email for institutional benefits",
                                "Teachers get access to classroom management features",
                                "Students get personalized learning recommendations"
                            ]}
                            preview="You'll land on a role-specific dashboard with quick actions and recent activity"
                            link="/register"
                        />
                    </GuideSection>

                    {/* AI-Powered Quiz Generation */}
                    <GuideSection title="AI-Powered Quiz & Summary Generation" icon={Brain}>
                        <StepCard
                            number="1"
                            title="Choose Content Source"
                            description="Select from multiple input methods - PDFs, images, URLs, audio, video, handwritten notes, YouTube videos, or question papers. QuizerAI's AI processes all formats intelligently."
                            tips={[
                                "PDF files work best for textbooks and comprehensive materials",
                                "Web URLs are great for articles and research content",
                                "YouTube videos automatically extract transcripts for quiz generation",
                                "Handwritten notes use OCR technology for digitization"
                            ]}
                        />

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-lg p-4 border border-blue-200">
                                <FileText className="w-8 h-8 text-blue-600 mb-2" />
                                <h4 className="font-medium text-slate-800 mb-1">Upload Files</h4>
                                <p className="text-xs text-slate-600">PDF, PNG, JPG, Audio, Video (Max 50MB)</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <Paperclip className="w-8 h-8 text-green-600 mb-2" />
                                <h4 className="font-medium text-slate-800 mb-1">Web Content</h4>
                                <p className="text-xs text-slate-600">Any article, blog, or webpage URL</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-red-200">
                                <Youtube className="w-8 h-8 text-red-600 mb-2" />
                                <h4 className="font-medium text-slate-800 mb-1">YouTube Processing</h4>
                                <p className="text-xs text-slate-600">Direct links or search topics</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                                <Upload className="w-8 h-8 text-purple-600 mb-2" />
                                <h4 className="font-medium text-slate-800 mb-1">Question Papers</h4>
                                <p className="text-xs text-slate-600">OCR digitization of past papers</p>
                            </div>
                        </div>

                        <StepCard
                            number="2"
                            title="Configure Quiz Settings"
                            description="Customize quiz parameters including question type (MCQ, Short Answer, Fill-in-blank), difficulty level, language, and number of questions to match your learning goals."
                            tips={[
                                "Start with 10-15 questions for quick practice sessions",
                                "Use 'Medium' difficulty for balanced challenge",
                                "Multiple choice questions are excellent for memorization",
                                "Long answer questions develop critical thinking"
                            ]}
                        />

                        <StepCard
                            number="3"
                            title="AI Processing & Generation"
                            description="Our advanced AI analyzes your content, identifies key concepts, and generates relevant questions with detailed explanations. Processing typically takes 30-90 seconds."
                            warning="Large files (>10MB) or long videos may take up to 2 minutes to process"
                            preview="Real-time progress indicator shows content analysis, question generation, and explanation creation stages"
                        />

                        <StepCard
                            number="4"
                            title="Take Quiz & Review Results"
                            description="Practice with generated questions, get instant feedback, review detailed explanations, and track your performance over time."
                            tips={[
                                "Read explanations for both correct and incorrect answers",
                                "Save high-quality quizzes for future practice",
                                "Use performance analytics to identify weak areas",
                                "Share quizzes with study groups for collaborative learning"
                            ]}
                            link="/dashboard/quizzes/create"
                        />
                    </GuideSection>

                    {/* Teacher Classroom Management */}
                    <GuideSection title="Smart Classroom Management" icon={Users} audience="teacher">
                        <StepCard
                            number="1"
                            title="Create Your Classroom"
                            description="Set up unlimited virtual classrooms for different subjects, grades, or sections. Each classroom gets a unique join code and comprehensive management tools."
                            tips={[
                                "Use descriptive names like 'Math 101 - Section A - Spring 2024'",
                                "Set classroom descriptions and guidelines",
                                "Configure subject-specific settings and templates",
                                "Enable/disable features based on class needs"
                            ]}
                            preview="Classroom dashboard with student roster, attendance tracking, quiz assignments, and performance analytics"
                            link="/teacher_dashboard/create-classroom"
                        />

                        <StepCard
                            number="2"
                            title="Add Students to Classroom"
                            description="Multiple methods to enroll students: join codes, email invitations, bulk uploads, QR codes, or manual addition by username."
                            tips={[
                                "Share join codes securely through official school channels",
                                "Use bulk email upload for large classes (CSV format supported)",
                                "QR codes work great for in-person enrollment",
                                "Set enrollment limits to manage class size effectively"
                            ]}
                        />

                        <StepCard
                            number="3"
                            title="Organize Students & Groups"
                            description="Create study groups within classrooms, organize students by performance levels, and manage collaborative learning sessions."
                            tips={[
                                "Group students by skill level for differentiated learning",
                                "Create project teams for collaborative assignments",
                                "Use tags to organize students by special needs or categories"
                            ]}
                        />
                    </GuideSection>

                    {/* Automated Attendance & Grading */}
                    <GuideSection title="Automated Attendance & Grading" icon={ClipboardList} audience="teacher">
                        <StepCard
                            number="1"
                            title="Daily Quiz Attendance System"
                            description="Create daily quizzes that automatically mark attendance when students complete them. Set time windows, recurring schedules, and attendance policies."
                            tips={[
                                "Schedule daily quizzes to start at class time",
                                "Set reasonable time windows (e.g., 30 minutes after class starts)",
                                "Allow manual attendance overrides for technical issues",
                                "Use short 3-5 question quizzes for quick attendance checks"
                            ]}
                            preview="Automated attendance reports showing present/absent status based on quiz completion"
                        />

                        <StepCard
                            number="2"
                            title="Instant Automated Grading"
                            description="All objective questions (MCQ, true/false, fill-in-blank) are graded instantly with detailed feedback. Review and adjust grades as needed."
                            tips={[
                                "Set partial credit policies for partially correct answers",
                                "Review AI-generated explanations before publishing",
                                "Add personalized feedback for individual students",
                                "Use rubrics for consistent grading standards"
                            ]}
                        />

                        <StepCard
                            number="3"
                            title="Bulk Operations & Management"
                            description="Manage multiple classes efficiently with bulk assignment creation, grade distribution, and student communication tools."
                            tips={[
                                "Create assignment templates for recurring use",
                                "Use bulk messaging for class announcements",
                                "Schedule assignments across multiple classrooms",
                                "Apply consistent grading policies across all classes"
                            ]}
                        />
                    </GuideSection>

                    {/* Data Export & Analytics */}
                    <GuideSection title="Advanced Analytics & Data Export" icon={BarChart3} audience="teacher">
                        <StepCard
                            number="1"
                            title="Performance Analytics Dashboard"
                            description="Access comprehensive dashboards showing individual student progress, class performance trends, topic-wise analytics, and learning gap identification."
                            tips={[
                                "Review weekly performance trends to adjust teaching strategies",
                                "Identify commonly missed topics for focused review",
                                "Track improvement over time with progress charts",
                                "Use heatmaps to visualize class performance patterns"
                            ]}
                            preview="Interactive charts showing class averages, individual progress, topic mastery levels, and engagement metrics"
                        />

                        <StepCard
                            number="2"
                            title="Export to Excel & Reports"
                            description="Generate detailed reports and export all data to Excel format including attendance records, grades, quiz responses, and performance analytics."
                            tips={[
                                "Export attendance data for official record-keeping",
                                "Generate grade books compatible with school systems",
                                "Create parent reports with student progress summaries",
                                "Use data for administrative reporting and documentation"
                            ]}
                            preview="Excel files with formatted attendance sheets, grade books, and performance reports ready for school administration"
                        />

                        <StepCard
                            number="3"
                            title="Parent & Student Communication"
                            description="Share progress reports with parents, send automated notifications about assignments and grades, and maintain communication logs."
                            tips={[
                                "Schedule automated progress reports to parents",
                                "Send congratulatory messages for achievements",
                                "Alert parents about concerning performance trends",
                                "Maintain professional communication records"
                            ]}
                        />
                    </GuideSection>

                    {/* YouTube Processing */}
                    <GuideSection title="YouTube Video Processing" icon={Youtube}>
                        <StepCard
                            number="1"
                            title="Smart Video Selection"
                            description="Enter any educational topic and our AI curates the best YouTube videos from trusted educational channels, or use direct video URLs."
                            tips={[
                                "Use specific topic keywords for better video selection",
                                "Educational channels are prioritized in search results",
                                "Longer videos (10+ minutes) provide more comprehensive content",
                                "AI filters out low-quality or irrelevant content"
                            ]}
                            link="/dashboard/youtube/process"
                        />

                        <StepCard
                            number="2"
                            title="Transcript Extraction & Processing"
                            description="Automatically extract video transcripts, clean and structure the content, then generate organized notes, summaries, and key points."
                            preview="Structured notes with timestamps, key concepts highlighted, and chapter-wise organization"
                        />

                        <StepCard
                            number="3"
                            title="Quiz & Summary Generation"
                            description="Transform video content into comprehensive quizzes and summaries with questions that test understanding of the video material."
                            tips={[
                                "Summaries work well with 400-600 words for most videos",
                                "Quizzes include time-stamped references to video segments",
                                "Multi-language support for international content"
                            ]}
                        />
                    </GuideSection>

                    {/* 24/7 AI Tutor */}
                    <GuideSection title="24/7 AI Tutor" icon={MessageCircle}>
                        <StepCard
                            number="1"
                            title="Access Your AI Tutor"
                            description="Get instant help anytime with personalized explanations, step-by-step guidance, and voice interactions for any subject or topic."
                            tips={[
                                "Ask specific questions for more accurate responses",
                                "Include context about your current study topic",
                                "Request step-by-step explanations for complex problems",
                                "Use voice input for more natural interactions"
                            ]}
                            link="/ai_tutor"
                        />

                        <StepCard
                            number="2"
                            title="Personalized Learning Support"
                            description="The AI tutor adapts to your learning style, tracks your progress, and provides targeted help based on your quiz performance and weak areas."
                            preview="Contextual help that references your recent quiz results and provides focused explanations on challenging topics"
                        />

                        <StepCard
                            number="3"
                            title="Voice & Interactive Features"
                            description="Engage with the AI tutor through voice commands, get audio explanations, and practice pronunciation for language subjects."
                            tips={[
                                "Use voice input for complex mathematical expressions",
                                "Practice language pronunciation with audio feedback",
                                "Get audio explanations while multitasking"
                            ]}
                        />
                    </GuideSection>

                    {/* Question Paper Digitization */}
                    <GuideSection title="Question Paper Digitization" icon={Upload}>
                        <StepCard
                            number="1"
                            title="Upload & OCR Processing"
                            description="Upload scanned question papers, handwritten tests, or photos of exam papers. Our advanced OCR technology digitizes them into editable format."
                            tips={[
                                "Ensure good image quality for better OCR accuracy",
                                "Supported formats: PDF, JPG, PNG, JPEG",
                                "Multiple pages are processed automatically",
                                "High-contrast images work best for handwritten content"
                            ]}
                            warning="Handwritten text may require manual verification and editing"
                        />

                        <StepCard
                            number="2"
                            title="Review & Edit Questions"
                            description="Verify OCR accuracy, edit questions as needed, and organize them into structured quiz format with answer keys."
                            preview="Editable question format with original images for reference and easy correction tools"
                        />

                        <StepCard
                            number="3"
                            title="Create Question Banks"
                            description="Build comprehensive question banks from years of past papers, organize by topics, and reuse for future assessments."
                            tips={[
                                "Tag questions by subject, difficulty, and year",
                                "Create topic-wise question collections",
                                "Share question banks with department colleagues"
                            ]}
                        />
                    </GuideSection>

                    {/* LMS Integration
                    <GuideSection title="LMS & System Integration" icon={Database} audience="teacher">
                        <StepCard
                            number="1"
                            title="Google Classroom Integration"
                            description="Seamlessly sync with Google Classroom to import student rosters, distribute assignments, and automatically update gradebooks."
                            tips={[
                                "One-click student roster synchronization",
                                "Automatic grade passback to Google Classroom",
                                "Share assignments directly to classroom streams"
                            ]}
                        />

                        <StepCard
                            number="2"
                            title="School LMS Connection"
                            description="Connect with popular Learning Management Systems like Moodle, Canvas, and Blackboard through API integrations."
                            preview="Synchronized student data, grades, and assignments across platforms with minimal manual work"
                        />

                        <StepCard
                            number="3"
                            title="Custom API Access"
                            description="Enterprise customers get API access for custom integrations with institutional systems and student information systems."
                        />
                    </GuideSection> */}

                    {/* Advanced Features */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mt-12">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Advanced Features for Power Users</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <TrendingUp className="w-8 h-8 text-blue-600 mb-3" />
                                <h3 className="font-semibold text-slate-800 mb-2">Adaptive Learning</h3>
                                <p className="text-sm text-slate-600">AI adjusts difficulty based on performance</p>
                            </div>
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <Award className="w-8 h-8 text-green-600 mb-3" />
                                <h3 className="font-semibold text-slate-800 mb-2">Gamification</h3>
                                <p className="text-sm text-slate-600">Badges, leaderboards, and achievement systems</p>
                            </div>
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <PieChart className="w-8 h-8 text-purple-600 mb-3" />
                                <h3 className="font-semibold text-slate-800 mb-2">Advanced Analytics</h3>
                                <p className="text-sm text-slate-600">Deep insights into learning patterns</p>
                            </div>
                        </div>
                    </div>

                    {/* Best Practices */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 mt-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Best Practices for Success</h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-blue-600" />
                                    Student Best Practices
                                </h3>
                                <ul className="space-y-2">
                                    <li className="text-slate-700 text-sm">• Use spaced repetition with regular quiz sessions</li>
                                    <li className="text-slate-700 text-sm">• Review AI explanations for deeper understanding</li>
                                    <li className="text-slate-700 text-sm">• Diversify content sources for comprehensive learning</li>
                                    <li className="text-slate-700 text-sm">• Join study groups for collaborative learning</li>
                                    <li className="text-slate-700 text-sm">• Track weekly progress to maintain motivation</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <UserCheck className="w-5 h-5 text-purple-600" />
                                    Teacher Best Practices
                                </h3>
                                <ul className="space-y-2">
                                    <li className="text-slate-700 text-sm">• Set up automated daily attendance with short quizzes</li>
                                    <li className="text-slate-700 text-sm">• Use analytics to identify and address learning gaps</li>
                                    <li className="text-slate-700 text-sm">• Create diverse question types for comprehensive assessment</li>
                                    <li className="text-slate-700 text-sm">• Export data regularly for record-keeping</li>
                                    <li className="text-slate-700 text-sm">• Share progress reports with parents and administrators</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Support Section */}
                    <div className="bg-white rounded-2xl p-8 mt-8 border border-slate-200">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">Need Additional Help?</h2>
                            <p className="text-slate-600 mb-6">
                                Our support team provides specialized assistance for both students and teachers
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                               <Link href='/contactus'>
                                    <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white cursor-pointer px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300">
                                        Contact Support
                                    </button>
                                </Link> 
                                <button className="border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-medium hover:border-slate-400 transition-all duration-300">
                                    Video Tutorials
                                </button>
                                <button className="border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-medium hover:border-slate-400 transition-all duration-300">
                                    Join Community
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer></Footer>
        </div>
    );
};

export default QuizerAIGuide;