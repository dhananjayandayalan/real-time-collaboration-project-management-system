import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common';
import './NotFound.css';

export const NotFound: React.FC = () => {
  return (
    <div className="not-found">
      <div className="not-found__content">
        <h1 className="not-found__code">404</h1>
        <h2 className="not-found__title">Page not found</h2>
        <p className="not-found__text">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="not-found__actions">
          <Link to="/">
            <Button>Go to home</Button>
          </Link>
          <Link to="/projects">
            <Button variant="outline">View projects</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
