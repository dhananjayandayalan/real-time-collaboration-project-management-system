import React from 'react';
import './LoadingSpinner.css';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: string;
  fullScreen?: boolean;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color,
  fullScreen = false,
  text,
}) => {
  const spinner = (
    <div className={`loading-spinner loading-spinner--${size}`}>
      <svg
        className="loading-spinner__svg"
        viewBox="0 0 50 50"
        style={color ? { color } : undefined}
      >
        <circle
          className="loading-spinner__circle"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
      </svg>
      {text && <span className="loading-spinner__text">{text}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-spinner__overlay">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
