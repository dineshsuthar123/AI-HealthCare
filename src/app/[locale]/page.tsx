export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
           AI Healthcare Platform
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-green-600 mb-4">
             Platform is Working!
          </h2>
          <p className="text-lg text-gray-600">
            The AI-powered digital health platform is now successfully running with proper routing and styling.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 className="text-xl font-semibold text-blue-600 mb-2"> Symptom Checker</h3>
            <p className="text-gray-600">AI-powered symptom analysis and health recommendations</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 className="text-xl font-semibold text-green-600 mb-2"> Telemedicine</h3>
            <p className="text-gray-600">Virtual healthcare consultations with certified doctors</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <h3 className="text-xl font-semibold text-purple-600 mb-2"> Multilingual</h3>
            <p className="text-gray-600">Healthcare guidance in 7+ languages worldwide</p>
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
      </div>
    </div>
  );
}