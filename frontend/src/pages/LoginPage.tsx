import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import TwoFactorFaceScan from '../components/auth/TwoFactorFaceScan';
import { authService } from '../services/authService';

const LoginPage: React.FC = () => {
  const [step, setStep] = useState<'credentials' | 'face'>('credentials');
  const [email, setEmail] = useState('');
  const [faceVerificationToken, setFaceVerificationToken] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleCredentialsSubmit = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      console.log(response.user)
      
      if (!response.user.profileCompleted) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        navigate('/register', { state: { user: response.user } });
      } else if (response.faceVerificationToken) {
        setEmail(email);
        setFaceVerificationToken(response.faceVerificationToken);
        setStep('face');
      } else {
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.data?.faceVerificationToken) {
        setEmail(email);
        setFaceVerificationToken(error.response.data.data.faceVerificationToken);
        setStep('face');
      } else {
        throw error;
      }
    }
  };

  const handleFaceVerified = () => {
    const from = (location.state as any)?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  if (step === 'credentials') {
    return <LoginForm onSubmit={handleCredentialsSubmit} />;
  }

  return (
    <TwoFactorFaceScan
      onFaceVerified={handleFaceVerified}
      email={email}
      faceVerificationToken={faceVerificationToken}
    />
  );
};

export default LoginPage;