import React, { useState } from 'react';
import { X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient';
import type { ApiResponse } from '../../types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

interface CreateUserForm {
  email: string;
  role: 'admin' | 'client';
  firstName?: string;
  lastName?: string;
  phone?: string;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
}) => {
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    role: 'client',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (formData.firstName && formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (formData.lastName && formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: formData.email.trim(),
        role: formData.role,
        ...(formData.firstName?.trim() && { firstName: formData.firstName.trim() }),
        ...(formData.lastName?.trim() && { lastName: formData.lastName.trim() }),
        ...(formData.phone?.trim() && { phone: formData.phone.trim() }),
      };

      const response = await apiClient.post<ApiResponse<any>>(
        '/admin/users',
        payload
      );

      if (response.data.success) {
        toast.success(response.data.message || 'User created successfully');
        setFormData({
          email: '',
          role: 'client',
          firstName: '',
          lastName: '',
          phone: '',
        });
        setErrors({});
        onUserCreated();
        onClose();
      } else {
        toast.error(response.data.message || 'Failed to create user');
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create user';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Modal */}
        <div className="inline-block align-bottom bg-[#2e4061] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-100">Create New User</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@example.com"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.role ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-500">{errors.role}</p>
              )}
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                First Name <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Last Name <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Phone <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0987654321"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create User</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;
