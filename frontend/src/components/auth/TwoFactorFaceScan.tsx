import React, { useState, useEffect } from 'react';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

interface TwoFactorFaceScanProps {
  onFaceVerified: () => void;
  email: string;
  faceVerificationToken: string;
}

const TwoFactorFaceScan: React.FC<TwoFactorFaceScanProps> = ({ 
  onFaceVerified, 
  email, 
  faceVerificationToken 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const { uploadUser, uploadAccessToken } = useAuth();
  const {
    modelsLoaded,
    isLoading,
    error,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureFaceDescriptor,
  } = useFaceDetection();

  useEffect(() => {
    const initCamera = async () => {
      await startCamera();
    };
    initCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isScanning && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isScanning && countdown === 0) {
      performFaceScan();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isScanning, countdown]);

  const startScan = () => {
    setIsScanning(true);
    setCountdown(3);
    setScanComplete(false);
  };

  const performFaceScan = async () => {
    try {
      setIsVerifying(true);
      const descriptor = await captureFaceDescriptor();
      
      const response = await authService.verifyFace(descriptor, faceVerificationToken);
      
      setScanComplete(true);
      toast.success('Face verified successfully!');
      
      await uploadUser(response.user);
      await uploadAccessToken(response.accessToken);
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setTimeout(() => {
        onFaceVerified();
      }, 1500);
    } catch (error: any) {
      console.log('Face verification failed')
      toast.error(error.response?.data?.message || error.message || 'Face verification failed');
      setTimeout(() => {
        setIsScanning(false);
        setIsVerifying(false);
      }, 1500);
    }
  };

  const retryScan = () => {
    setIsScanning(false);
    setScanComplete(false);
    setIsVerifying(false);
    startScan();
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-100">Two-Factor Authentication</h2>
          <p className="mt-2 text-gray-400">
            Complete your login with facial recognition
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Signed in as: <span className="font-medium">{email}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="relative bg-black rounded-xl shadow-lg overflow-hidden">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto rounded-xl"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                />
                
                {isScanning && countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-white mb-4">{countdown}</div>
                      <p className="text-white text-lg">Get ready for scan...</p>
                    </div>
                  </div>
                )}

                {scanComplete && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-90">
                    <div className="text-center">
                      <CheckCircle className="h-20 w-20 text-white mx-auto mb-4" />
                      <p className="text-white text-xl font-semibold">Verification Complete!</p>
                    </div>
                  </div>
                )}

                {!modelsLoaded && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                      <p className="text-white">Loading face detection models...</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-90">
                    <div className="text-center p-4">
                      <AlertTriangle className="h-12 w-12 text-white mx-auto mb-4" />
                      <p className="text-white font-semibold mb-2">Error</p>
                      <p className="text-white text-sm">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              {!isScanning && !scanComplete && (
                <button
                  onClick={startScan}
                  disabled={!modelsLoaded || isLoading || isVerifying}
                  className="w-full py-3 px-4 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Loading...
                    </div>
                  ) : (
                    'Start Face Verification'
                  )}
                </button>
              )}

              {isScanning && countdown === 0 && !isVerifying && (
                <div className="flex items-center justify-center text-blue-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                  Scanning face...
                </div>
              )}

              {isVerifying && (
                <div className="flex items-center justify-center text-blue-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                  Verifying with server...
                </div>
              )}

              {scanComplete && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center text-green-600 font-semibold">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Face verified successfully!
                  </div>
                  <p className="text-gray-400 text-sm">
                    Redirecting to your dashboard...
                  </p>
                </div>
              )}

              {error && !isScanning && (
                <button
                  onClick={retryScan}
                  className="mt-4 flex items-center justify-center text-primary-600 hover:text-primary-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Face Scan
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">
                Face Verification Steps
              </h3>
              <ol className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 text-sm font-medium">1</span>
                  </div>
                  <p className="ml-3 text-gray-300">
                    Ensure good lighting on your face
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 text-sm font-medium">2</span>
                  </div>
                  <p className="ml-3 text-gray-300">
                    Position your face within the frame
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 text-sm font-medium">3</span>
                  </div>
                  <p className="ml-3 text-gray-300">
                    Keep still during the 3-second countdown
                  </p>
                </li>
              </ol>
            </div>

            <div className="rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">
                Security Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Your facial data is encrypted and never stored as images</span>
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>128-point descriptor used for matching (not your photo)</span>
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Real-time processing on your device</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorFaceScan;