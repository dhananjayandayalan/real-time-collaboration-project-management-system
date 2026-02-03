import React from 'react';
import './Avatar.css';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: AvatarSize;
  showStatus?: boolean;
  status?: 'online' | 'away' | 'offline';
  className?: string;
}

const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getColorFromName = (name: string): string => {
  const colors = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f43f5e', // rose
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#3b82f6', // blue
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 'md',
  showStatus = false,
  status = 'offline',
  className = '',
}) => {
  const initials = getInitials(name);
  const backgroundColor = getColorFromName(name);

  return (
    <div
      className={`avatar avatar--${size} ${className}`}
      title={name}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="avatar__image"
          onError={(e) => {
            // Hide image on error and show initials
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : null}
      <div
        className="avatar__initials"
        style={{ backgroundColor }}
      >
        {initials}
      </div>
      {showStatus && (
        <span className={`avatar__status avatar__status--${status}`} />
      )}
    </div>
  );
};

export default Avatar;
