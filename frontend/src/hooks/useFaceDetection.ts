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

  const detectBlinkForLiveness = useCallback(async (timeoutMs = 10000): Promise<boolean> => {
    if (!modelsLoaded || !videoRef.current) {
      throw new Error('Models not loaded or camera not ready');
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const startTime = Date.now();
    let previousLeftEyeOpen: boolean | null = null;
    let eyeOpenToClosedDetected = false;
    let eyeClosedToOpenDetected = false;

    return new Promise((resolve, reject) => {
      const detectionInterval = setInterval(async () => {
        try {
          if (Date.now() - startTime > timeoutMs) {
            clearInterval(detectionInterval);
            reject(new Error('Blink detection timeout. Please try again.'));
            return;
          }

          const detection = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks(true)
            .withFaceExpressions();

          if (!detection) {
            return; // Face not detected, continue waiting
          }

          // Draw detection on canvas
          if (canvas) {
            const context = canvas.getContext('2d');
            if (context && video.videoWidth && video.videoHeight) {
              context.clearRect(0, 0, canvas.width, canvas.height);
              const dims = faceapi.matchDimensions(canvas, video, true);
              const resizedDetection = faceapi.resizeResults(detection, dims);
              faceapi.draw.drawDetections(canvas, [resizedDetection]);
              faceapi.draw.drawFaceLandmarks(canvas, [resizedDetection]);
            }
          }

          // Get landmarks
          const landmarks = detection.landmarks.positions;

          // Calculate eye aspect ratio for each eye
          // Left eye landmarks: 36-41
          // Right eye landmarks: 42-47
          const leftEyeLandmarks = landmarks.slice(36, 42);
          const rightEyeLandmarks = landmarks.slice(42, 48);

          const calculateEyeAspectRatio = (eyeLandmarks: any[]) => {
            const A = Math.hypot(eyeLandmarks[1].x - eyeLandmarks[5].x, eyeLandmarks[1].y - eyeLandmarks[5].y);
            const B = Math.hypot(eyeLandmarks[2].x - eyeLandmarks[4].x, eyeLandmarks[2].y - eyeLandmarks[4].y);
            const C = Math.hypot(eyeLandmarks[0].x - eyeLandmarks[3].x, eyeLandmarks[0].y - eyeLandmarks[3].y);
            return (A + B) / (2 * C);
          };

          const leftEyeAspectRatio = calculateEyeAspectRatio(leftEyeLandmarks);
          const rightEyeAspectRatio = calculateEyeAspectRatio(rightEyeLandmarks);

          // EAR threshold (below this means eyes closed)
          const EAR_THRESHOLD = 0.2;

          const leftEyeOpen = leftEyeAspectRatio > EAR_THRESHOLD;
          const rightEyeOpen = rightEyeAspectRatio > EAR_THRESHOLD;
          const eyesOpen = leftEyeOpen && rightEyeOpen;

          // Detect open to closed transition
          if (previousLeftEyeOpen === true && !eyesOpen) {
            eyeOpenToClosedDetected = true;
          }

          // Detect closed to open transition (complete blink)
          if (eyeOpenToClosedDetected && eyesOpen) {
            eyeClosedToOpenDetected = true;
          }

          previousLeftEyeOpen = leftEyeOpen;

          // If we detected a complete blink, resolve
          if (eyeOpenToClosedDetected && eyeClosedToOpenDetected) {
            clearInterval(detectionInterval);
            resolve(true);
          }
        } catch (error) {
          console.error('Blink detection error:', error);
        }
      }, 50); // Check every 50ms
    });
  }, [modelsLoaded]);

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
    detectBlinkForLiveness,
  };
};