import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFaceDetection } from '../hooks/useFaceDetection';
import { User, Camera, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, completeRegistration } = useAuth();
  
  const [step, setStep] = useState<'personal' | 'face' | 'complete'>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [captureCount, setCaptureCount] = useState(0);
  const [captures, setCaptures] = useState<number[][]>([]);
  
  const {
    modelsLoaded,
    isLoading: faceLoading,
    error: faceError,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureFaceDescriptor,
  } = useFaceDetection();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    console.log('step', step)
    if (step === 'face') {
      startCamera();
      return () => {
        stopCamera();
      };
    }
  }, [step, authUser, navigate, startCamera, stopCamera]);

  const validatePersonalInfo = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePersonalInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validatePersonalInfo()) {
      setStep('face');
    }
  };

  const handleFaceCapture = async () => {
    try {
      setIsSubmitting(true);
      const descriptor = await captureFaceDescriptor();
      
      setCaptures(prev => [...prev, descriptor]);
      setCaptureCount(prev => prev + 1);
      
      if (captureCount === 2) { 
        const avgDescriptor = calculateAverageDescriptor(captures.concat([descriptor]));
        setFaceDescriptor(avgDescriptor);
        setStep('complete');
        toast.success('Face captured successfully!');
      } else {
        toast.success(`Face capture ${captureCount + 1}/3 successful`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to capture face');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAverageDescriptor = (descriptors: number[][]): number[] => {
    const length = descriptors[0].length;
    const avg = new Array(length).fill(0);
    
    for (const descriptor of descriptors) {
      for (let i = 0; i < length; i++) {
        avg[i] += descriptor[i];
      }
    }
    
    return avg.map(value => value / descriptors.length);
  };

  const handleCompleteRegistration = async () => {
    if (!faceDescriptor) {
      toast.error('Face descriptor not found');
      return;
    }

    try {
      setIsSubmitting(true);
      await completeRegistration(formData, faceDescriptor);
      toast.success('Registration completed successfully!');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      
      if (error.response?.status === 409) {
        toast.error(errorMessage);
        setCaptures([]);
        setCaptureCount(0);
        setFaceDescriptor(null);
        setStep('face');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const retryFaceCapture = () => {
    setCaptures([]);
    setCaptureCount(0);
    setFaceDescriptor(null);
  };

  const renderPersonalInfoStep = () => (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <User className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-100">
            Complete Your Registration
          </h2>
          <p className="mt-2 text-gray-400">
            Please provide your personal information to continue
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handlePersonalInfoSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
                First Name *
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                placeholder="Enter your first name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
                Last Name *
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                placeholder="Enter your last name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                Phone Number (Optional)
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                placeholder="0987654321"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-300 hover:bg-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer"
            >
              Back to Login
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500  cursor-pointer"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderFaceCaptureStep = () => (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Camera className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-100">
            Set Up Facial Recognition
          </h2>
          <p className="mt-2 text-gray-400">
            We'll capture your facial features 3 times for maximum accuracy
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-800">
            <div className="flex space-x-2">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    num <= captureCount
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600'
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
            <span className="ml-4 font-medium">
              Capture {captureCount + 1} of 3
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="relative bg-black rounded-xl shadow-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto rounded-xl"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
              
              {!modelsLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Loading face detection...</p>
                  </div>
                </div>
              )}

              {faceError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-90">
                  <div className="text-center p-4">
                    <AlertTriangle className="h-12 w-12 text-white mx-auto mb-4" />
                    <p className="text-white font-semibold mb-2">Camera Error</p>
                    <p className="text-white text-sm">{faceError}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center space-y-4">
              <button
                onClick={handleFaceCapture}
                disabled={faceLoading || isSubmitting || !modelsLoaded}
                className="w-full py-3 px-4 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {faceLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Loading Camera...
                  </div>
                ) : isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing Capture...
                  </div>
                ) : (
                  `Capture Face ${captureCount + 1}/3`
                )}
              </button>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('personal')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-300 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back
                </button>
                {captureCount > 0 && (
                  <button
                    onClick={retryFaceCapture}
                    className="flex-1 px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
                  >
                    Retry All Captures
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">
                Face Capture Instructions
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-300">Ensure good, even lighting on your face</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-300">Remove glasses and hats</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-300">Look directly at the camera</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-300">Maintain a neutral expression</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">
                Privacy Information
              </h3>
              <p className="text-gray-400 text-sm">
                Your face is not stored as an image. Instead, we create a unique 128-point 
                mathematical descriptor that cannot be reverse-engineered to recreate your face. 
                This descriptor is encrypted and stored securely.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        
        <h2 className="mt-6 text-3xl font-bold text-gray-100">
          Registration Complete!
        </h2>
        
        <p className="mt-4 text-gray-400">
          Your facial recognition has been set up successfully. 
          You can now use your face as part of the two-factor authentication.
        </p>

        <div className="mt-8 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            What's Next?
          </h3>
          <ul className="space-y-3 text-left">
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <span className="text-blue-600 text-sm">1</span>
              </div>
              <span className="text-gray-300">Use your email and password to login</span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <span className="text-blue-600 text-sm">2</span>
              </div>
              <span className="text-gray-300">Complete facial verification on next screen</span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <span className="text-blue-600 text-sm">3</span>
              </div>
              <span className="text-gray-300">Access your secure dashboard</span>
            </li>
          </ul>
        </div>

        <button
          onClick={handleCompleteRegistration}
          disabled={isSubmitting}
          className="mt-8 w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Finalizing...
            </div>
          ) : (
            'Go to Dashboard'
          )}
        </button>

        <p className="mt-4 text-sm text-gray-500">
          You will be automatically logged in
        </p>
      </div>
    </div>
  );

  switch (step) {
    case 'personal':
      return renderPersonalInfoStep();
    case 'face':
      return renderFaceCaptureStep();
    case 'complete':
      return renderCompleteStep();
    default:
      return null;
  }
};

export default RegisterPage;