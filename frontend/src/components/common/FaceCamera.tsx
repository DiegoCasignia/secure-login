import React, { useEffect } from 'react';
import { useFaceDetection } from '../../hooks/useFaceDetection';

interface FaceCameraProps {
  onFaceDetected?: (descriptor: number[]) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
  showCanvas?: boolean;
}

const FaceCamera: React.FC<FaceCameraProps> = ({
  // onFaceDetected,
  onError,
  autoStart = true,
  showCanvas = true,
}) => {
  const {
    modelsLoaded,
    isLoading,
    error,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    // detectFace,
  } = useFaceDetection();

  useEffect(() => {
    if (autoStart) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  return (
    <div className="relative">
      <div className="relative w-full max-w-lg mx-auto">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto rounded-lg shadow-lg"
        />
        {showCanvas && (
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
        )}
      </div>

      {!modelsLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-white text-sm">Loading face detection...</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-white text-sm">Processing...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default FaceCamera;