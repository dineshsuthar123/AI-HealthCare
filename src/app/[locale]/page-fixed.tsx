export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
          🏥 AI Healthcare Platform
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-green-600 mb-4">
            ✅ Platform is Working!
          </h2>
          <p className="text-lg text-gray-600">
            The AI-powered digital health platform is now successfully running with proper routing and styling.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 className="text-xl font-semibold text-blue-600 mb-2">🩺 Symptom Checker</h3>
            <p className="text-gray-600">AI-powered symptom analysis and health recommendations</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 className="text-xl font-semibold text-green-600 mb-2">📹 Telemedicine</h3>
            <p className="text-gray-600">Virtual healthcare consultations with certified doctors</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <h3 className="text-xl font-semibold text-purple-600 mb-2">🌍 Multilingual</h3>
            <p className="text-gray-600">Healthcare guidance in 7+ languages worldwide</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <h3 className="text-xl font-semibold text-orange-600 mb-2">📱 SMS Support</h3>
            <p className="text-gray-600">Health assistance via SMS for limited connectivity areas</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <h3 className="text-xl font-semibold text-red-600 mb-2">🚨 Emergency Alerts</h3>
            <p className="text-gray-600">Real-time notifications for critical health situations</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            <h3 className="text-xl font-semibold text-indigo-600 mb-2">📊 Health Analytics</h3>
            <p className="text-gray-600">Community health tracking and outbreak monitoring</p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors mr-4">
            Get Started
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
            Learn More
          </button>
        </div>
        
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
            🌟 Why Choose Our Platform?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-700">HIPAA-compliant security</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">AI-powered diagnosis</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-gray-700">24/7 availability</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Low-bandwidth optimization</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Emergency response system</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Community health insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
