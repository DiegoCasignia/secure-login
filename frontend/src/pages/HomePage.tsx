import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from '../components/common/ChangePasswordModal';

const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-100">
                SecureAuth
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 border border-gray-600 white rounded-lg hover:bg-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                >
                  Dashboard Admin
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-100 mb-4">
            Welcome to Secure Authentication System
          </h1>
          <p className="text-lg text-gray-400">
            Your account is protected with advanced facial recognition technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Security Status Card */}
          <div className="rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-100">
                Security Status
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Facial Recognition</span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Last Login</span>
                <span className="text-gray-100">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* User Info Card */}
          <div className="rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-1ray-900">
                Account Information
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-100">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium text-gray-100 capitalize">
                  {user?.role}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium text-gray-100">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-100">
                Quick Actions
              </h3>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => setIsChangePasswordOpen(true)}
                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-300 border border-gray-600 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Security Tips */}
        <div className="mt-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Security Tips</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full text-green-400 bg-opacity-20 flex items-center justify-center mr-3 mt-1">
                ✓
              </div>
              <span>Ensure good lighting when using facial recognition</span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full text-green-400 bg-opacity-20 flex items-center justify-center mr-3 mt-1">
                ✓
              </div>
              <span>Keep your temporary password secure</span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full text-green-400 bg-opacity-20 flex items-center justify-center mr-3 mt-1">
                ✓
              </div>
              <span>Log out from shared devices</span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full text-green-400 bg-opacity-20 flex items-center justify-center mr-3 mt-1">
                ✓
              </div>
              <span>Report any suspicious activity immediately</span>
            </li>
          </ul>
        </div>
      </main>

      <ChangePasswordModal 
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};

export default HomePage;