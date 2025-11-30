
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { QueryProvider } from '@/lib/queryProvider'
import { Toaster } from 'react-hot-toast'
import quizairlogopng from "public/images/hero/qbl.png"

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata = {
  title: {
    default: 'QuizerAI: AI Quiz Generator for Students & Teachers',
    template: '%s | QuizerAI'
  },
  description: "Turn PDFs, videos, and notes into quizzes with AI. Study smarter with QuizerAI's adaptive learning tools.",
  keywords: [
    'AI quiz generator',
    'study quiz maker',
    'PDF to quiz converter',
    'YouTube video quiz',
    'interactive learning platform',
    'exam preparation tool',
    'student quiz creator',
    'educational AI technology',
    'JEE preparation quiz',
    'UPSC quiz maker',
    'SAT practice quiz',
    'NEET exam preparation',
    'online study tools',
    'AI-powered education',
    'quiz from text',
    'handwriting to quiz OCR',
    'collaborative learning',
    'study group platform',
    'exam analytics dashboard'
  ],
  authors: [{ name: 'QuizerAI Team' }],
  creator: 'QuizerAI',
  publisher: 'QuizerAI',
  applicationName: 'QuizerAI',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://quizerai.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
      'en': '/en',
    },
  },
  openGraph: {
    title: 'QuizerAI - AI-Powered Learning Platform | Transform Study Materials into Interactive Quizzes',
    description: 'Transform PDFs, YouTube videos, and study materials into interactive quizzes with AI. Trusted by 5,000+ students worldwide. Free tier available.',
    url: 'https://quizerai.com',
    siteName: 'QuizerAI',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'QuizerAI - AI-Powered Learning Platform Dashboard',
        type: 'image/png',
      },
      {
        url: '/images/og-image-square.png',
        width: 600,
        height: 600,
        alt: 'QuizerAI Logo',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
    countryName: 'United States',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuizerAI - AI-Powered Learning Platform',
    description: 'Transform study materials into interactive quizzes with AI. Trusted by 5,000+ students. Free tier available.',
    images: ['/images/twitter-image.png'],
    creator: '@quizerai',
    site: '@quizerai',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  verification: {
    google: '4jKIMkFtaXioDpKTehR9c-RejLcYWEsOz9dLQ4FbEvo', // Replace with your actual verification code
    yandex: 'yandex-verification-code', // Add if targeting Russian market
    'msvalidate.01': 'bing-verification-code', // Add for Bing
  },
  category: 'education',
  classification: 'Educational Technology',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'QuizerAI',
    'application-name': 'QuizerAI',
    'msapplication-TileColor': '#3b82f6',
    'msapplication-config': '/browserconfig.xml',
  },
}

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'QuizerAI',
  alternateName: 'Quizer AI',
  description: 'AI-powered platform that transforms study materials, PDFs, YouTube videos, and handwritten notes into interactive quizzes and learning experiences.',
  url: 'https://quizerai.com',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web Browser',
  permissions: 'Browser permissions for file upload and camera access',
  softwareVersion: '2.0',
  releaseNotes: 'Enhanced AI quiz generation with support for multiple content types',
  author: {
    '@type': 'Organization',
    name: 'QuizerAI',
    url: 'https://quizerai.com',
    logo: 'https://quizerai.com/favicon-32x32.png',
    sameAs: [
      'https://twitter.com/quizerai',
      'https://linkedin.com/company/quizerai',
      'https://github.com/quizerai'
    ]
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free tier with premium options available',
    category: 'Free with Premium Features'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '5000',
    bestRating: '5',
    worstRating: '1'
  },
  featureList: [
    'AI-Powered Quiz Generation',
    'PDF to Quiz Conversion',
    'YouTube Video Processing',
    'Handwriting Recognition (OCR)',
    'Collaborative Study Rooms',
    'Performance Analytics',
    'Multi-format Question Types',
    'Exam-Specific Preparation',
    'Mobile Responsive Design',
    'Offline Access Capability'
  ],
  screenshot: 'https://quizerai.com/images/app-screenshot.png',
  downloadUrl: 'https://quizerai.com',
  installUrl: 'https://quizerai.com',
  browserRequirements: 'Requires modern web browser with JavaScript enabled',
  countriesSupported: 'Worldwide',
  inLanguage: 'en',
  isAccessibleForFree: true,
  usageInfo: 'https://quizerai.com/how-it-works',
  softwareHelp: 'https://quizerai.com/support',
  releaseDate: '2024-01-01',
  datePublished: '2024-01-01',
  dateModified: new Date().toISOString().split('T')[0],
  keywords: 'AI quiz generator, study tools, exam preparation, educational technology, PDF to quiz, YouTube learning'
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable}`}
      suppressHydrationWarning={true}
    >
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />

        {/* Theme and color settings */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="color-scheme" content="light dark" />
        <meta name="msapplication-TileColor" content="#3b82f6" />

        {/* Mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="QuizerAI" />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="origin-when-cross-origin" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />

        {/* Additional rich snippets for FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'How does QuizerAI generate quizzes from PDFs?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'QuizerAI uses advanced AI technology to analyze PDF content, extract key concepts, and automatically generate relevant quiz questions with multiple choice, true/false, and short answer formats.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Can I create quizzes from YouTube videos?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes! QuizerAI can process YouTube video transcripts to extract educational content and create comprehensive quizzes based on the video material.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Is QuizerAI free to use?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'QuizerAI offers a free tier with essential features. Premium plans provide additional capabilities like unlimited quiz generation, advanced analytics, and collaborative features.'
                  }
                }
              ]
            }),
          }}
        />

        {/* Breadcrumb structured data for homepage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://quizerai.com'
                }
              ]
            }),
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
              {children}
            </div>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#1e293b',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.2)',
                  border: '1px solid #e2e8f0',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}