// /**
//  * Settings Page
//  * 
//  * Purpose: User preference and account management interface
//  * Features:
//  * - Profile information management
//  * - Notification preferences configuration
//  * - Privacy and security settings
//  * - Theme and accessibility options
//  * - Account deletion and data export
//  * - Integration management (calendar, LMS)
//  * 
//  * Integration: User management API and preference storage
//  */

// 'use client'

// import { useState } from 'react'
// import { motion, AnimatePresence } from 'framer-motion'
// import { 
//   User, 
//   Bell, 
//   Shield, 
//   Palette, 
//   Download,
//   Trash2,
//   Save,
//   Eye,
//   EyeOff
// } from 'lucide-react'
// import Button from '@/components/ui/Button'
// import Input from '@/components/ui/Input'
// import Card from '@/components/ui/Card'
// import { useAuth } from '@/components/auth/AuthProvider'
// import useUIStore from '@/store/uiStore'
// import toast from 'react-hot-toast'

// const SettingsPage = () => {
//   const { user, updateProfile } = useAuth()
//   const { theme, setTheme, notifications = {}, updateNotificationPreference } = useUIStore()
//   const [activeTab, setActiveTab] = useState('profile')
//   const [isLoading, setIsLoading] = useState(false)
//   const [showDeleteModal, setShowDeleteModal] = useState(false)

//   const [profileData, setProfileData] = useState({
//     name: user?.name || '',
//     email: user?.email || '',
//     institution: user?.institution || '',
//     role: user?.role || 'student'
//   })

//   const [passwordData, setPasswordData] = useState({
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: ''
//   })

//   const tabs = [
//     { id: 'profile', label: 'Profile', icon: User },
//     { id: 'notifications', label: 'Notifications', icon: Bell },
//     { id: 'privacy', label: 'Privacy & Security', icon: Shield },
//     { id: 'appearance', label: 'Appearance', icon: Palette }
//   ]

//   const handleProfileUpdate = async () => {
//     setIsLoading(true)
//     try {
//       await updateProfile(profileData)
//       toast.success('Profile updated successfully')
//     } catch (error) {
//       toast.error('Failed to update profile')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handlePasswordChange = async () => {
//     if (passwordData.newPassword !== passwordData.confirmPassword) {
//       toast.error('New passwords do not match')
//       return
//     }

//     setIsLoading(true)
//     try {
//       // API call to change password
//       toast.success('Password changed successfully')
//       setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
//     } catch (error) {
//       toast.error('Failed to change password')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const exportData = async () => {
//     try {
//       // API call to export user data
//       toast.success('Data export initiated. You will receive an email shortly.')
//     } catch (error) {
//       toast.error('Failed to initiate data export')
//     }
//   }

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 'profile':
//         return (
//           <div className="space-y-8">
//             {/* Profile Information */}
//             <Card className="p-6">
//               <h3 className="text-lg font-semibold text-slate-800 mb-6">Profile Information</h3>
              
//               <div className="grid md:grid-cols-2 gap-6">
//                 <Input
//                   label="Full Name"
//                   value={profileData.name}
//                   onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
//                 />
                
//                 <Input
//                   label="Email Address"
//                   type="email"
//                   value={profileData.email}
//                   onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
//                 />
                
//                 <Input
//                   label="Institution"
//                   value={profileData.institution}
//                   onChange={(e) => setProfileData(prev => ({ ...prev, institution: e.target.value }))}
//                 />
                
//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
//                   <select
//                     value={profileData.role}
//                     onChange={(e) => setProfileData(prev => ({ ...prev, role: e.target.value }))}
//                     className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="student">Student</option>
//                     <option value="teacher">Teacher</option>
//                     <option value="institution">Institution Admin</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="mt-6">
//                 <Button
//                   onClick={handleProfileUpdate}
//                   loading={isLoading}
//                 >
//                   <Save className="w-4 h-4 mr-2" />
//                   Save Changes
//                 </Button>
//               </div>
//             </Card>

//             {/* Change Password */}
//             <Card className="p-6">
//               <h3 className="text-lg font-semibold text-slate-800 mb-6">Change Password</h3>
              
//               <div className="space-y-4 max-w-md">
//                 <Input
//                   label="Current Password"
//                   type="password"
//                   value={passwordData.currentPassword}
//                   onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
//                 />
                
//                 <Input
//                   label="New Password"
//                   type="password"
//                   value={passwordData.newPassword}
//                   onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
//                 />
                
//                 <Input
//                   label="Confirm New Password"
//                   type="password"
//                   value={passwordData.confirmPassword}
//                   onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
//                 />

//                 <Button
//                   onClick={handlePasswordChange}
//                   loading={isLoading}
//                   disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
//                 >
//                   Change Password
//                 </Button>
//               </div>
//             </Card>
//           </div>
//         )

//       case 'notifications':
//         return (
//           <Card className="p-6">
//             <h3 className="text-lg font-semibold text-slate-800 mb-6">Notification Preferences</h3>
            
//             <div className="space-y-6">
//               {[
//                 { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
//                 { key: 'push', label: 'Push Notifications', description: 'Browser push notifications' },
//                 { key: 'quiz', label: 'Quiz Reminders', description: 'Reminders for quiz deadlines' },
//                 { key: 'classroom', label: 'Classroom Updates', description: 'Updates from your classrooms' }
//               ].map((notification) => (
//                 <div key={notification.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
//                   <div>
//                     <div className="font-medium text-slate-800">{notification.label}</div>
//                     <div className="text-sm text-slate-600">{notification.description}</div>
//                   </div>
//                   <label className="relative inline-flex items-center cursor-pointer">
//                     <input
//                       type="checkbox"
//                       className="sr-only peer"
//                       checked={Boolean(notifications[notification.key])}
//                       onChange={(e) => updateNotificationPreference(notification.key, e.target.checked)}
//                     />
//                     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                   </label>
//                 </div>
//               ))}
//             </div>
//           </Card>
//         )

//       case 'privacy':
//         return (
//           <div className="space-y-8">
//             <Card className="p-6">
//               <h3 className="text-lg font-semibold text-slate-800 mb-6">Privacy Settings</h3>
              
//               <div className="space-y-6">
//                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
//                   <div>
//                     <div className="font-medium text-slate-800">Profile Visibility</div>
//                     <div className="text-sm text-slate-600">Make your profile visible to other users</div>
//                   </div>
//                   <select className="px-3 py-2 border border-slate-200 rounded-lg">
//                     <option value="public">Public</option>
//                     <option value="friends">Friends Only</option>
//                     <option value="private">Private</option>
//                   </select>
//                 </div>

//                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
//                   <div>
//                     <div className="font-medium text-slate-800">Analytics Sharing</div>
//                     <div className="text-sm text-slate-600">Share anonymous analytics to improve the platform</div>
//                   </div>
//                   <label className="relative inline-flex items-center cursor-pointer">
//                     <input 
//                       type="checkbox" 
//                       className="sr-only peer" 
//                       defaultChecked
//                     />
//                     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                   </label>
//                 </div>
//               </div>
//             </Card>

//             <Card className="p-6">
//               <h3 className="text-lg font-semibold text-slate-800 mb-6">Data Management</h3>
              
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
//                   <div>
//                     <div className="font-medium text-blue-800">Export Your Data</div>
//                     <div className="text-sm text-blue-700">Download all your data in a portable format</div>
//                   </div>
//                   <Button variant="outline" onClick={exportData}>
//                     <Download className="w-4 h-4 mr-2" />
//                     Export Data
//                   </Button>
//                 </div>

//                 <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
//                   <div>
//                     <div className="font-medium text-red-800">Delete Account</div>
//                     <div className="text-sm text-red-700">Permanently delete your account and all data</div>
//                   </div>
//                   <Button variant="outline" onClick={() => setShowDeleteModal(true)}>
//                     <Trash2 className="w-4 h-4 mr-2" />
//                     Delete Account
//                   </Button>
//                 </div>
//               </div>
//             </Card>
//           </div>
//         )

//       case 'appearance':
//         return (
//           <Card className="p-6">
//             <h3 className="text-lg font-semibold text-slate-800 mb-6">Appearance Settings</h3>
            
//             <div className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-3">Theme</label>
//                 <div className="grid grid-cols-3 gap-3">
//                   {[
//                     { value: 'light', label: 'Light', preview: 'bg-white border-slate-200' },
//                     { value: 'dark', label: 'Dark', preview: 'bg-slate-800 border-slate-700' },
//                     { value: 'auto', label: 'Auto', preview: 'bg-gradient-to-r from-white to-slate-800' }
//                   ].map((themeOption) => (
//                     <motion.button
//                       key={themeOption.value}
//                       onClick={() => setTheme(themeOption.value)}
//                       className={`p-4 border-2 rounded-xl transition-all duration-200 ${
//                         theme === themeOption.value ? 'border-blue-500' : 'border-slate-200 hover:border-blue-300'
//                       }`}
//                       whileHover={{ scale: 1.02 }}
//                       whileTap={{ scale: 0.98 }}
//                     >
//                       <div className={`w-full h-12 rounded-lg mb-3 ${themeOption.preview}`}></div>
//                       <div className="font-medium text-slate-800">{themeOption.label}</div>
//                     </motion.button>
//                   ))}
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
//                   <div>
//                     <div className="font-medium text-slate-800">Reduce Motion</div>
//                     <div className="text-sm text-slate-600">Minimize animations and transitions</div>
//                   </div>
//                   <label className="relative inline-flex items-center cursor-pointer">
//                     <input 
//                       type="checkbox" 
//                       className="sr-only peer" 
//                     />
//                     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                   </label>
//                 </div>

//                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
//                   <div>
//                     <div className="font-medium text-slate-800">High Contrast</div>
//                     <div className="text-sm text-slate-600">Increase contrast for better readability</div>
//                   </div>
//                   <label className="relative inline-flex items-center cursor-pointer">
//                     <input 
//                       type="checkbox" 
//                       className="sr-only peer" 
//                     />
//                     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                   </label>
//                 </div>
//               </div>
//             </div>
//           </Card>
//         )

//       default:
//         return null
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
//       <div className="container mx-auto px-4 py-8">
//         <div className="max-w-6xl mx-auto">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="mb-8"
//           >
//             <h1 className="text-3xl font-bold text-slate-800 mb-2">Settings</h1>
//             <p className="text-slate-600">Manage your account preferences and privacy settings</p>
//           </motion.div>

//           <div className="grid lg:grid-cols-4 gap-8">
//             {/* Settings Navigation */}
//             <div className="lg:col-span-1">
//               <Card className="p-4">
//                 <nav className="space-y-2">
//                   {tabs.map((tab) => {
//                     const Icon = tab.icon
//                     return (
//                       <motion.button
//                         key={tab.id}
//                         onClick={() => setActiveTab(tab.id)}
//                         className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
//                           activeTab === tab.id
//                             ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
//                             : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
//                         }`}
//                         whileHover={{ x: activeTab === tab.id ? 0 : 4 }}
//                       >
//                         <Icon className="w-5 h-5" />
//                         <span className="font-medium">{tab.label}</span>
//                       </motion.button>
//                     )
//                   })}
//                 </nav>
//               </Card>
//             </div>

//             {/* Settings Content */}
//             <div className="lg:col-span-3">
//               <AnimatePresence mode="wait">
//                 <motion.div
//                   key={activeTab}
//                   initial={{ opacity: 0, x: 20 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   exit={{ opacity: 0, x: -20 }}
//                   transition={{ duration: 0.3 }}
//                 >
//                   {renderTabContent()}
//                 </motion.div>
//               </AnimatePresence>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default SettingsPage