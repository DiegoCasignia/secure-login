import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Shield, AlertTriangle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="relative">
          {/* Background pattern */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
          
          {/* Content */}
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-6">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-4">
              404
            </h1>
            
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4">
              Page Not Found
            </h2>
            
            <p className="text-gray-600 mb-8">
              The page you're looking for doesn't exist or has been moved. 
              Please check the URL or navigate back to safety.
            </p>
            
            <div className="space-y-6">
              <Link
                to="/"
                className="inline-flex items-center justify-center w-full md:w-auto px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              >
                <Home className="h-5 w-5 mr-2" />
                Go to Homepage
              </Link>
              
              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-500 mb-3">Quick Links</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center text-gray-400">
                  <Shield className="h-5 w-5 mr-2" />
                  <span className="text-sm">Secure Authentication System</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="mt-12 flex justify-center space-x-8 opacity-30">
          <div className="w-4 h-4 bg-primary-500 rounded-full animate-bounce"></div>
          <div className="w-4 h-4 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;