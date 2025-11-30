'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Play, 
  Search,
  Filter,
  Grid,
  List,
  Clock,
  FileText,
  Target,
  Eye,
  Download,
  Share2,
  MoreVertical,
  Youtube
} from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/layout/Header'

const YouTubePage = () => {
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState('all')
  const [processedVideos, setProcessedVideos] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - replace with API call
  useEffect(() => {
    const mockVideos = [
      {
        id: 1,
        title: "Introduction to Calculus - Derivatives and Limits",
        channel: "Khan Academy",
        video_url: "https://youtube.com/watch?v=example1",
        thumbnail: "https://img.youtube.com/vi/example1/maxresdefault.jpg",
        duration: "15:32",
        subject: "Mathematics",
        processed_date: "2023-12-01",
        notes_count: 45,
        quiz_questions: 12,
        summary_length: 850,
        status: "completed",
        views: 1250000
      },
      {
        id: 2,
        title: "Photosynthesis Process Explained",
        channel: "Crash Course Biology",
        video_url: "https://youtube.com/watch?v=example2",
        thumbnail: "https://img.youtube.com/vi/example2/maxresdefault.jpg",
        duration: "12:15",
        subject: "Biology",
        processed_date: "2023-11-28",
        notes_count: 38,
        quiz_questions: 15,
        summary_length: 720,
        status: "completed",
        views: 890000
      },
      {
        id: 3,
        title: "World War I Causes and Effects",
        channel: "History Hub",
        video_url: "https://youtube.com/watch?v=example3",
        thumbnail: "https://img.youtube.com/vi/example3/maxresdefault.jpg",
        duration: "18:45",
        subject: "History",
        processed_date: "2023-11-25",
        notes_count: 52,
        quiz_questions: 18,
        summary_length: 1200,
        status: "processing",
        views: 560000
      },
      {
        id: 4,
        title: "Atomic Structure and Bonding",
        channel: "Chemistry Explained",
        video_url: "https://youtube.com/watch?v=example4",
        thumbnail: "https://img.youtube.com/vi/example4/maxresdefault.jpg",
        duration: "22:10",
        subject: "Chemistry",
        processed_date: "2023-11-20",
        notes_count: 48,
        quiz_questions: 20,
        summary_length: 980,
        status: "completed",
        views: 445000
      }
    ]
    
    setTimeout(() => {
      setProcessedVideos(mockVideos)
      setIsLoading(false)
    }, 1000)
  }, [])

  const filteredVideos = processedVideos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.subject.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'completed' && video.status === 'completed') ||
                         (filterBy === 'processing' && video.status === 'processing') ||
                         (filterBy === 'recent' && new Date(video.processed_date) > new Date(Date.now() - 7*24*60*60*1000))
    
    return matchesSearch && matchesFilter
  })

  const VideoCard = ({ video }) => (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-2xl shadow-soft border border-slate-200 hover:shadow-medium transition-all duration-300 group overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-slate-200 to-slate-300">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
          {video.duration}
        </div>
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
          video.status === 'completed' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-orange-100 text-orange-700'
        }`}>
          {video.status}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
              {video.title}
            </h3>
            <p className="text-slate-600 text-sm mb-2">{video.channel}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{video.subject}</span>
              <span>•</span>
              <span>{video.views.toLocaleString()} views</span>
            </div>
          </div>
          <div className="relative">
            <button className="p-2 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {video.status === 'completed' && (
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-slate-800">{video.notes_count}</div>
              <div className="text-slate-600">Notes</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-slate-800">{video.quiz_questions}</div>
              <div className="text-slate-600">Questions</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-slate-800">{Math.round(video.summary_length/100)}</div>
              <div className="text-slate-600">Summary</div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {video.status === 'completed' ? (
            <>
              <Link href={`/dashboard/youtube/${video.id}`} className="flex-1">
                <motion.button
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Content
                </motion.button>
              </Link>
              <motion.button
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Download className="w-4 h-4 text-slate-600" />
              </motion.button>
            </>
          ) : (
            <div className="flex-1 bg-orange-100 text-orange-700 py-2 px-4 rounded-lg font-medium text-center">
              Processing...
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )

  const VideoListItem = ({ video }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 shadow-soft border border-slate-200 hover:shadow-medium transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        <div className="w-24 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center relative">
          <Play className="w-6 h-6 text-slate-600" />
          <div className="absolute bottom-1 right-1 bg-black/80 text-white px-1 rounded text-xs">
            {video.duration}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800 mb-1">{video.title}</h3>
          <p className="text-sm text-slate-600 mb-1">{video.channel}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>{video.subject}</span>
            <span>{video.views.toLocaleString()} views</span>
            {video.status === 'completed' && (
              <>
                <span>{video.notes_count} notes</span>
                <span>{video.quiz_questions} questions</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            video.status === 'completed' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-orange-100 text-orange-700'
          }`}>
            {video.status}
          </span>
          {video.status === 'completed' && (
            <Link href={`/dashboard/youtube/${video.id}`}>
              <motion.button
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">YouTube Processing</h1>
              <p className="text-lg text-slate-600">Convert educational videos into study materials</p>
            </div>
            <Link href="/dashboard/youtube/process">
              <motion.button
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Youtube className="w-5 h-5" />
                Process Video
              </motion.button>
            </Link>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-soft border border-slate-200 mb-8"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search processed videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                >
                  <option value="all">All Videos</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="recent">Recent</option>
                </select>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                  <motion.button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 transition-colors duration-200 ${
                      viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Grid className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    onClick={() => setViewMode('list')}
                    className={`p-3 transition-colors duration-200 ${
                      viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <List className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-soft border border-slate-200">
                  <div className="aspect-video bg-slate-200 rounded-t-2xl"></div>
                  <div className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                      <div className="h-10 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Youtube className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">No Processed Videos Found</h3>
              <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                {searchQuery || filterBy !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Start by processing your first YouTube video to generate study materials'
                }
              </p>
              <Link href="/dashboard/youtube/process">
                <motion.button
                  className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Process YouTube Video
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVideos.map((video, index) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <VideoCard video={video} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredVideos.map((video, index) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <VideoListItem video={video} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default YouTubePage