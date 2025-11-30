/*
 * YouTubeProcessor Component
 * 
 * Purpose: Interface for processing YouTube videos into educational content
 * Features:
 * - Topic-based video search and recommendation
 * - Manual URL input for specific videos
 * - Real-time processing status with progress indicators
 * - Generated content preview (notes, summaries, quizzes)
 * - Batch processing for multiple videos
 * - Content customization options
 * 
 * Integration: Connects to YouTube API and backend content processing services
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Play, 
  Link as LinkIcon, 
  FileText,
  HelpCircle,
  Download,
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  ThumbsUp
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { processYouTubeVideo, searchYouTubeVideos } from '@/lib/api'
import toast from 'react-hot-toast'
import Image from 'next/image'

const YouTubeProcessor = ({ onContentGenerated }) => {
  const [processingMode, setProcessingMode] = useState('search') // search, url
  const [searchQuery, setSearchQuery] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [processingVideos, setProcessingVideos] = useState(new Map())
  const [generatedContent, setGeneratedContent] = useState(new Map())

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search topic')
      return
    }

    setIsSearching(true)
    try {
      const results = await searchYouTubeVideos(searchQuery)
      setSearchResults(results)
      toast.success(`Found ${results.length} relevant videos`)
    } catch (error) {
      toast.error('Failed to search videos. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const processVideo = async (videoData) => {
    const videoId = videoData.id || extractVideoId(videoData.url)
    
    setProcessingVideos(prev => new Map(prev.set(videoId, {
      status: 'processing',
      progress: 0,
      stage: 'Extracting transcript...'
    })))

    try {
      const result = await processYouTubeVideo(videoData, (progress, stage) => {
        setProcessingVideos(prev => new Map(prev.set(videoId, {
          status: 'processing',
          progress,
          stage
        })))
      })

      setProcessingVideos(prev => new Map(prev.set(videoId, {
        status: 'completed',
        progress: 100,
        stage: 'Processing complete!'
      })))

      setGeneratedContent(prev => new Map(prev.set(videoId, result)))
      onContentGenerated(result)
      toast.success('Video processed successfully!')

    } catch (error) {
      setProcessingVideos(prev => new Map(prev.set(videoId, {
        status: 'error',
        progress: 0,
        stage: error.message
      })))
      toast.error('Failed to process video: ' + error.message)
    }
  }

  const extractVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  const isValidYouTubeUrl = (url) => {
    return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/).+$/.test(url)
  }

  const handleUrlProcess = () => {
    if (!isValidYouTubeUrl(videoUrl)) {
      toast.error('Please enter a valid YouTube URL')
      return
    }

    const videoId = extractVideoId(videoUrl)
    processVideo({ url: videoUrl, id: videoId })
  }

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatViews = (views) => {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M'
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K'
    }
    return views.toString()
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          YouTube Video Processor
        </h1>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto">
          Transform YouTube videos into comprehensive study materials. Search for educational content 
          by topic or process specific videos to generate notes, summaries, and quizzes.
        </p>
      </div>

      {/* Processing Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-100 p-1 rounded-xl">
          <motion.button
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              processingMode === 'search'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            onClick={() => setProcessingMode('search')}
            whileHover={{ scale: 1.02 }}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Search by Topic
          </motion.button>
          <motion.button
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              processingMode === 'url'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            onClick={() => setProcessingMode('url')}
            whileHover={{ scale: 1.02 }}
          >
            <LinkIcon className="w-4 h-4 inline mr-2" />
            Process URL
          </motion.button>
        </div>
      </div>

      {/* Content Based on Mode */}
      <AnimatePresence mode="wait">
        {processingMode === 'search' ? (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Search Input */}
            <Card className="p-6">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter a topic (e.g., 'calculus derivatives', 'photosynthesis', 'machine learning')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearch}
                  loading={isSearching}
                  icon={Search}
                >
                  Search Videos
                </Button>
              </div>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((video) => {
                  const processing = processingVideos.get(video.id)
                  const content = generatedContent.get(video.id)
                  
                  return (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-2xl overflow-hidden shadow-soft border border-slate-100 hover:shadow-medium transition-all duration-300"
                    >
                      {/* Video Thumbnail */}
                      <div className="relative">
                        <Image
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm">
                          {formatDuration(video.duration)}
                        </div>
                        
                        {processing?.status === 'processing' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-white text-center">
                              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                              <div className="text-sm">{processing.stage}</div>
                              <div className="text-xs">{processing.progress}%</div>
                            </div>
                          </div>
                        )}
                        
                        {processing?.status === 'completed' && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white p-2 rounded-full">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        )}
                        
                        {processing?.status === 'error' && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Video Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2">
                          {video.title}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                          <User className="w-4 h-4" />
                          <span className="truncate">{video.channel}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{formatViews(video.views)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{formatViews(video.likes)}</span>
                            </div>
                          </div>
                          <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          {!processing && !content && (
                            <Button
                              onClick={() => processVideo(video)}
                              className="w-full"
                              icon={Play}
                            >
                              Process Video
                            </Button>
                          )}
                          
                          {processing?.status === 'processing' && (
                            <div className="w-full bg-slate-100 rounded-lg p-3 text-center">
                              <div className="flex items-center justify-center gap-2 text-slate-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Processing...</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${processing.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {content && (
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                icon={Eye}
                                onClick={() => window.open(video.url, '_blank')}
                              >
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                icon={Download}
                                onClick={() => {/* Download content */}}
                              >
                                Download
                              </Button>
                            </div>
                          )}
                          
                          {processing?.status === 'error' && (
                            <Button
                              onClick={() => processVideo(video)}
                              variant="outline"
                              className="w-full"
                              icon={AlertCircle}
                            >
                              Retry Processing
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="url"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">
                Process Specific YouTube Video
              </h3>
              
              <div className="space-y-4">
                <Input
                  label="YouTube URL"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  helperText="Paste the URL of the YouTube video you want to process"
                />
                
                <Button
                  onClick={handleUrlProcess}
                  disabled={!isValidYouTubeUrl(videoUrl)}
                  className="w-full"
                  icon={Play}
                >
                  Process Video
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Status for URL Mode */}
      {processingMode === 'url' && videoUrl && processingVideos.size > 0 && (
        <Card className="mt-6 p-6 max-w-2xl mx-auto">
          <h4 className="font-semibold text-slate-800 mb-4">Processing Status</h4>
          {Array.from(processingVideos.entries()).map(([videoId, status]) => (
            <div key={videoId} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{status.stage}</span>
                <span className="text-sm font-medium">{status.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

export default YouTubeProcessor