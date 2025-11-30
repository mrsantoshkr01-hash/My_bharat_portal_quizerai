'use client'

import { motion } from 'framer-motion'
import { Play, Clock, Eye } from 'lucide-react'
import Button from '@/components/ui/Button'

const VideoPreview = ({ video, onSelect }) => {
  return (
    <motion.div
      className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100 hover:shadow-medium transition-all duration-300"
      whileHover={{ y: -2 }}
    >
      <div className="flex gap-6">
        {/* Thumbnail */}
        <div className="relative flex-shrink-0">
          <div className="w-48 h-28 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Play className="w-8 h-8 text-white" />
          </div>
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono">
            {video.duration}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2">
            {video.title}
          </h3>
          
          <div className="text-sm text-slate-600 mb-3">
            {video.channel}
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{video.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{video.duration}</span>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
            {video.description}
          </p>

          <Button onClick={onSelect} size="sm">
            Select Video
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default VideoPreview