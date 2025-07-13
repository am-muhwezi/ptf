import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DesignShowcase = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const pages = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      route: '/',
      description: 'Main overview with quick actions and stats',
      features: ['Quick Actions', 'Membership Stats', 'Booking Overview', 'Attendance Logs', 'Notifications']
    },
    {
      id: 'indoor',
      name: 'Indoor Memberships',
      route: '/memberships/indoor',
      description: 'Comprehensive member management with health analysis',
      features: ['Member Profiles', 'Health Analysis', 'BMI Calculator', 'Fitness Testing', 'Goal Tracking']
    },
    {
      id: 'outdoor',
      name: 'Outdoor Memberships',
      route: '/memberships/outdoor',
      description: 'Outdoor activity focused member management',
      features: ['Activity Preferences', 'Weather Considerations', 'Equipment Tracking', 'Group Activities']
    },
    {
      id: 'renewals',
      name: 'Renewals Due',
      route: '/memberships/renewals',
      description: 'Track and manage membership renewals',
      features: ['Urgency Levels', 'Bulk Reminders', 'Renewal History', 'Contact Preferences']
    },
    {
      id: 'payments',
      name: 'Payments Due',
      route: '/memberships/payments',
      description: 'Payment tracking and invoice management',
      features: ['Payment Status', 'Invoice Generation', 'Overdue Tracking', 'Payment Methods']
    },
    {
      id: 'attendance',
      name: 'Attendance Logs',
      route: '/attendance',
      description: 'Real-time attendance tracking and analytics',
      features: ['Check-in/Check-out', 'Activity Tracking', 'Trainer Assignment', 'Session Notes']
    },
    {
      id: 'bookings',
      name: 'Bookings Management',
      route: '/bookings',
      description: 'Session booking and trainer scheduling',
      features: ['One-on-One Sessions', 'Group Classes', 'Trainer Availability', 'Payment Integration']
    },
    {
      id: 'coming-soon',
      name: 'Coming Soon / 404',
      route: '/coming-soon',
      description: 'Fun, gym-themed placeholder page',
      features: ['Animated Emojis', 'Motivational Quotes', 'Progress Tracking', 'Feature Preview']
    }
  ];

  const mockups = {
    dashboard: (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of daily operations and key metrics</p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex space-x-4">
            <div className="bg-blue-500 text-white px-4 py-3 rounded-2xl font-bold">
              Register New Member
            </div>
            <div className="bg-gray-200 text-gray-900 px-4 py-3 rounded-2xl font-bold">
              Check-in Member
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6">
          {[
            { title: 'Indoor Memberships', value: '156', color: 'bg-blue-50 border-blue-200' },
            { title: 'Outdoor Memberships', value: '89', color: 'bg-green-50 border-green-200' },
            { title: 'Renewals Due', value: '12', color: 'bg-orange-50 border-orange-200' },
            { title: 'Payment Overdue', value: '3', color: 'bg-red-50 border-red-200' }
          ].map((stat, i) => (
            <div key={i} className={`${stat.color} border rounded-xl p-6`}>
              <h3 className="text-base font-medium text-gray-900">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Notifications */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Notifications</h2>
          <div className="space-y-4">
            {[
              { title: 'New Member Registration', desc: 'John Doe has registered for indoor membership', time: '2 min ago' },
              { title: 'Payment Received', desc: 'Jane Smith has paid for quarterly membership', time: '15 min ago' },
              { title: 'Equipment Maintenance', desc: 'Treadmill #3 requires maintenance check', time: '1 hour ago' }
            ].map((notif, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 flex items-start space-x-4">
                <div className="bg-blue-100 rounded-lg p-3 flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-500 rounded"></div>
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-medium text-gray-900">{notif.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{notif.desc}</p>
                  <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),

    indoor: (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Indoor Memberships</h1>
            <p className="text-gray-600">Manage indoor gym memberships and member details</p>
          </div>
          <div className="flex space-x-3">
            <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-2xl text-sm font-bold">Export Data</div>
            <div className="bg-blue-500 text-white px-4 py-2 rounded-2xl text-sm font-bold">Add New Member</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          {[
            { title: 'Total Indoor Members', value: '156' },
            { title: 'Active Members', value: '142' },
            { title: 'Expiring Soon', value: '8' },
            { title: 'Monthly Revenue', value: 'UGX 18,500,000' }
          ].map((stat, i) => (
            <div key={i} className="bg-white border rounded-xl p-6 shadow-sm">
              <h3 className="text-base font-medium text-gray-900">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">Subtitle text</p>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search members..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg ml-4">
              <option>All Status</option>
              <option>Active</option>
              <option>Expired</option>
            </select>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { name: 'John Doe', email: 'john@email.com', plan: 'Premium Monthly', status: 'Active', expiry: '2024-07-15' },
                { name: 'Jane Smith', email: 'jane@email.com', plan: 'Standard Monthly', status: 'Active', expiry: '2024-06-20' },
                { name: 'Mike Johnson', email: 'mike@email.com', plan: 'Basic Monthly', status: 'Expired', expiry: '2024-01-15' }
              ].map((member, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{member.plan}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      member.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{member.expiry}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <span className="text-blue-600 cursor-pointer">View</span>
                    <span className="text-green-600 cursor-pointer">Renew</span>
                    <span className="text-red-600 cursor-pointer">Suspend</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Member Profile Modal Preview */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Member Profile Modal (Preview)</h3>
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Edit Profile</div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">Name:</span> John Doe</div>
                <div><span className="text-gray-500">Email:</span> john@email.com</div>
                <div><span className="text-gray-500">Phone:</span> +256 700 123 456</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Health Analysis</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded p-3 text-center">
                  <div className="text-lg font-bold">175 cm</div>
                  <div className="text-xs text-gray-600">Height</div>
                </div>
                <div className="bg-gray-50 rounded p-3 text-center">
                  <div className="text-lg font-bold">70 kg</div>
                  <div className="text-xs text-gray-600">Weight</div>
                </div>
                <div className="bg-gray-50 rounded p-3 text-center">
                  <div className="text-lg font-bold">22.9</div>
                  <div className="text-xs text-gray-600">BMI</div>
                  <div className="text-xs bg-green-100 text-green-800 rounded-full px-2 mt-1">Normal</div>
                </div>
                <div className="bg-gray-50 rounded p-3 text-center">
                  <div className="text-lg font-bold">15%</div>
                  <div className="text-xs text-gray-600">Body Fat</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Fitness Goals</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-900">Short-term Goals</div>
                <div className="text-sm text-blue-700 mt-1">Increase bench press by 10kg, Run 5K without stopping</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-sm font-medium text-green-900">Long-term Goals</div>
                <div className="text-sm text-green-700 mt-1">Complete a marathon, Build lean muscle mass</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),

    attendance: (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Logs</h1>
            <p className="text-gray-600">Track member check-ins and workout sessions</p>
          </div>
          <div className="flex space-x-3">
            <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-2xl text-sm font-bold">Export Logs</div>
            <div className="bg-blue-500 text-white px-4 py-2 rounded-2xl text-sm font-bold">Generate Report</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          {[
            { title: 'Total Visits Today', value: '47', subtitle: 'All check-ins' },
            { title: 'Indoor Visits', value: '32', subtitle: "Today's indoor sessions" },
            { title: 'Outdoor Visits', value: '15', subtitle: "Today's outdoor sessions" },
            { title: 'Currently Active', value: '8', subtitle: 'Members in gym', color: 'border-green-200' }
          ].map((stat, i) => (
            <div key={i} className={`bg-white border rounded-xl p-6 shadow-sm ${stat.color || ''}`}>
              <h3 className="text-base font-medium text-gray-900">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activities</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { 
                  name: 'John Doe', 
                  time: '08:30 AM', 
                  type: 'Indoor', 
                  duration: '1h 45m', 
                  activities: ['Weight Training', 'Cardio'],
                  status: 'Completed'
                },
                { 
                  name: 'Jane Smith', 
                  time: '07:00 AM', 
                  type: 'Outdoor', 
                  duration: 'Active', 
                  activities: ['Running', 'Yoga'],
                  status: 'Active'
                },
                { 
                  name: 'Mike Johnson', 
                  time: '06:00 PM', 
                  type: 'Indoor', 
                  duration: '2h 15m', 
                  activities: ['CrossFit'],
                  status: 'Completed'
                }
              ].map((log, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{log.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{log.time}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      log.type === 'Indoor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{log.duration}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {log.activities.map((activity, j) => (
                        <span key={j} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                          {activity}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      log.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),

    bookings: (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
            <p className="text-gray-600">Manage training sessions and group classes</p>
          </div>
          <div className="flex space-x-3">
            <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-2xl text-sm font-bold">Export Schedule</div>
            <div className="bg-blue-500 text-white px-4 py-2 rounded-2xl text-sm font-bold">New Booking</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          {[
            { title: "Today's Sessions", value: '12', subtitle: 'Scheduled for today' },
            { title: 'Confirmed Bookings', value: '8', subtitle: 'Ready to go', color: 'border-green-200' },
            { title: 'Pending Approval', value: '3', subtitle: 'Awaiting confirmation', color: 'border-yellow-200' },
            { title: 'Total Revenue', value: 'UGX 850,000', subtitle: 'From paid bookings' }
          ].map((stat, i) => (
            <div key={i} className={`bg-white border rounded-xl p-6 shadow-sm ${stat.color || ''}`}>
              <h3 className="text-base font-medium text-gray-900">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trainer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                {
                  id: 'BK001',
                  date: '2024-02-02',
                  duration: '60 min',
                  member: 'John Doe',
                  email: 'john@email.com',
                  session: 'One-on-One',
                  trainer: 'Mike Johnson',
                  specialty: 'Weight Training',
                  status: 'Confirmed',
                  price: 'UGX 50,000',
                  payment: 'Paid'
                },
                {
                  id: 'BK002',
                  date: '2024-02-02',
                  duration: '45 min',
                  member: 'Jane Smith',
                  email: 'jane@email.com',
                  session: 'Group (8/12)',
                  trainer: 'Sarah Wilson',
                  specialty: 'Yoga',
                  status: 'Confirmed',
                  price: 'UGX 25,000',
                  payment: 'Paid'
                },
                {
                  id: 'BK003',
                  date: '2024-02-02',
                  duration: '60 min',
                  member: 'Mike Johnson',
                  email: 'mike@email.com',
                  session: 'Group (5/10)',
                  trainer: 'Alex Thompson',
                  specialty: 'CrossFit',
                  status: 'Pending',
                  price: 'UGX 30,000',
                  payment: 'Pending'
                }
              ].map((booking, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.id}</div>
                      <div className="text-sm text-gray-500">{booking.date}</div>
                      <div className="text-xs text-gray-400">{booking.duration}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.member}</div>
                      <div className="text-sm text-gray-500">{booking.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      booking.session.includes('One-on-One') ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {booking.session}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.trainer}</div>
                      <div className="text-sm text-gray-500">{booking.specialty}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.price}</div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        booking.payment === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.payment}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),

    'coming-soon': (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Animated Emoji */}
          <div className="text-8xl mb-8">💪</div>

          {/* Main Content */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Coming Soon!
            </h1>
            
            <div className="text-xl md:text-2xl text-gray-600 mb-8">
              We're pumping iron on this feature! 🏗️
            </div>

            {/* Motivational Quote */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500 mb-8">
              <p className="text-lg font-medium text-gray-800 italic">
                "Your only limit is you! 💯"
              </p>
            </div>

            {/* Feature Preview */}
            <div className="bg-gray-50 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">What's Coming? 🚀</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {[
                  { icon: '📊', text: 'Advanced Analytics' },
                  { icon: '📱', text: 'Mobile App Integration' },
                  { icon: '🎯', text: 'Goal Tracking' },
                  { icon: '🏆', text: 'Achievement System' },
                  { icon: '💬', text: 'Member Chat' },
                  { icon: '📅', text: 'Smart Scheduling' }
                ].map((feature, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <span className="text-gray-700">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-200 rounded-full h-4 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <p className="text-sm text-gray-600 mb-8">Development Progress: 75% Complete</p>

            {/* Fun Gym Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { icon: '💪', value: '1,247', label: 'Reps Coded' },
                { icon: '☕', value: '42', label: 'Cups of Coffee' },
                { icon: '🔥', value: '∞', label: 'Lines of Passion' }
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">{stat.icon}</div>
                  <div className="text-lg font-semibold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="bg-blue-500 text-white px-8 py-3 rounded-2xl font-bold cursor-pointer">
                🏠 Back to Dashboard
              </div>
              <div className="bg-gray-200 text-gray-900 px-8 py-3 rounded-2xl font-bold cursor-pointer">
                🐛 Report Issue
              </div>
            </div>

            {/* Footer Message */}
            <div className="mt-12 text-sm text-gray-500">
              <p>💡 Tip: While you wait, why not check out our other amazing features?</p>
              <p className="mt-2">Built with ❤️ by the Paul's Tropical Fitness Team</p>
            </div>
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PTF Design Showcase</h1>
            <p className="text-sm text-gray-600 mt-1">Visual overview of all implemented pages</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pages</h2>
            <nav className="space-y-2">
              {pages.map((page) => (
                <div key={page.id}>
                  <button
                    onClick={() => setActiveTab(page.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeTab === page.id
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {page.name}
                  </button>
                  {activeTab === page.id && (
                    <div className="mt-2 ml-3 space-y-1">
                      <p className="text-xs text-gray-500 mb-2">{page.description}</p>
                      <div className="space-y-1">
                        {page.features.map((feature, i) => (
                          <div key={i} className="text-xs text-gray-400 flex items-center">
                            <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => navigate(page.route)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-2 block"
                      >
                        → View Live Page
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {pages.find(p => p.id === activeTab)?.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                {mockups[activeTab]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignShowcase;