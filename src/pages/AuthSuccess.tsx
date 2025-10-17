import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuthSuccess() {
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleContinue = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-600 rounded-full">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Email Verified Successfully!
          </CardTitle>
          <CardDescription className="text-gray-600">
            Your account has been verified and is now active
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">Account Activated</h3>
            <p className="text-sm text-green-700">
              You can now access all features of the Financial Trading Platform. 
              Welcome to our secure market data and analytics platform!
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Redirecting to login page in <span className="font-bold text-blue-600">{countdown}</span> seconds...
            </p>
            
            <Button
              onClick={handleContinue}
              className="w-full bg-blue-600 hover:bg-blue-700">

              Continue to Login
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          
          <div className="text-xs text-gray-500">
            Having trouble? Contact our support team for assistance.
          </div>
        </CardContent>
      </Card>
    </div>);

}