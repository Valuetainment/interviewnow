
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const AuthButtons: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 ml-4">
      <Link to="/login">
        <Button variant="outline">Log in</Button>
      </Link>
      <Link to="/signup">
        <Button>Get Started</Button>
      </Link>
    </div>
  );
};
