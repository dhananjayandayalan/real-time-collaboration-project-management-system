import React from 'react';
import { AvatarStack, AvatarStackUser } from './AvatarStack';
import './OnlineUsersIndicator.css';

export interface OnlineUsersIndicatorProps {
  users: AvatarStackUser[];
  maxAvatars?: number;
  showCount?: boolean;
  label?: string;
  className?: string;
}

export const OnlineUsersIndicator: React.FC<OnlineUsersIndicatorProps> = ({
  users,
  maxAvatars = 3,
  showCount = true,
  label = 'viewing',
  className = '',
}) => {
  if (users.length === 0) {
    return null;
  }

  return (
    <div className={`online-users-indicator ${className}`}>
      <AvatarStack
        users={users}
        max={maxAvatars}
        size="xs"
        showStatus
      />
      {showCount && (
        <span className="online-users-indicator__text">
          {users.length === 1 ? `1 ${label}` : `${users.length} ${label}`}
        </span>
      )}
    </div>
  );
};

export default OnlineUsersIndicator;
