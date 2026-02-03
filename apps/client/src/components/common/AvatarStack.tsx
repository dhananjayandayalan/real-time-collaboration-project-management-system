import React from 'react';
import { Avatar, AvatarSize } from './Avatar';
import './AvatarStack.css';

export interface AvatarStackUser {
  id: string;
  name: string;
  imageUrl?: string;
  status?: 'online' | 'away' | 'offline';
}

export interface AvatarStackProps {
  users: AvatarStackUser[];
  max?: number;
  size?: AvatarSize;
  showStatus?: boolean;
  className?: string;
}

export const AvatarStack: React.FC<AvatarStackProps> = ({
  users,
  max = 4,
  size = 'sm',
  showStatus = false,
  className = '',
}) => {
  const visibleUsers = users.slice(0, max);
  const overflowCount = users.length - max;

  if (users.length === 0) {
    return null;
  }

  return (
    <div className={`avatar-stack avatar-stack--${size} ${className}`}>
      {visibleUsers.map((user, index) => (
        <div
          key={user.id}
          className="avatar-stack__item"
          style={{ zIndex: visibleUsers.length - index }}
        >
          <Avatar
            name={user.name}
            imageUrl={user.imageUrl}
            size={size}
            showStatus={showStatus}
            status={user.status}
          />
        </div>
      ))}
      {overflowCount > 0 && (
        <div
          className={`avatar-stack__overflow avatar-stack__overflow--${size}`}
          title={users.slice(max).map(u => u.name).join(', ')}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
};

export default AvatarStack;
