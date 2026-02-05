import { useState, useRef, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import type { FaceDetectionResult } from '../types';

const MODEL_URL = '/models';

export const useFaceDetection = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadModels = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      setModelsLoaded(true);
    } catch (err) {
      setError('Error loading face detection models');
      console.error('Model loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (!modelsLoaded) {
        await loadModels();
      }

      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      setError('Camera access denied or unavailable');
      console.error('Camera error:', err);
    }
  }, [modelsLoaded, loadModels]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const detectFace = useCallback(async (): Promise<FaceDetectionResult> => {
    if (!modelsLoaded || !videoRef.current) {
      return { success: false, error: 'Models not loaded or camera not ready' };
    }

    try {
      setIsLoading(true);

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video.videoWidth || !video.videoHeight) {
        return { success: false, error: 'Video not ready' };
      }

      // Set canvas dimensions to match video
      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Detect face
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true)
        .withFaceDescriptor()
        .withFaceExpressions();

      if (!detection) {
        return { success: false, error: 'No face detected' };
      }

      // Convert descriptor to array
      const descriptor = Array.from(detection.descriptor);

      // Draw detection on canvas
      if (canvas) {
        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          const dims = faceapi.matchDimensions(canvas, video, true);
          const resizedDetection = faceapi.resizeResults(detection, dims);
          faceapi.draw.drawDetections(canvas, [resizedDetection]);
          faceapi.draw.drawFaceLandmarks(canvas, [resizedDetection]);
          faceapi.draw.drawFaceExpressions(canvas, [resizedDetection]);
        }
      }

      return {
        success: true,
        descriptor,
        detection: {
          box: {
            x: detection.detection.box.x,
            y: detection.detection.box.y,
            width: detection.detection.box.width,
            height: detection.detection.box.height,
          },
          landmarks: detection.landmarks.positions.map(pos => [pos.x, pos.y]),
        },
      };
    } catch (err) {
      console.error('Face detection error:', err);
      return { success: false, error: 'Face detection failed' };
    } finally {
      setIsLoading(false);
    }
  }, [modelsLoaded]);

  const captureFaceDescriptor = useCallback(async (): Promise<number[]> => {
    const result = await detectFace();
    if (!result.success || !result.descriptor) {
      throw new Error(result.error || 'Failed to capture face descriptor');
    }
    return result.descriptor;
  }, [detectFace]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    modelsLoaded,
    isLoading,
    error,
    videoRef,
    canvasRef,
    loadModels,
    startCamera,
    stopCamera,
    detectFace,
    captureFaceDescriptor,
  };
};