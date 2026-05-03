import React from 'react';
import { useAppSelector } from '@/store';
import './OnlineUsers.css';

interface OnlineUsersProps {
  maxDisplay?: number;
}

export const OnlineUsers: React.FC<OnlineUsersProps> = ({ maxDisplay = 5 }) => {
  const { onlineUsers } = useAppSelector((state) => state.ui);
  const { user: currentUser } = useAppSelector((state) => state.auth);

  // Filter out current user and get unique users
  const otherOnlineUsers = onlineUsers.filter(u => u.userId !== currentUser?.id);

  if (otherOnlineUsers.length === 0) {
    return null;
  }

  const displayUsers = otherOnlineUsers.slice(0, maxDisplay);
  const remainingCount = otherOnlineUsers.length - maxDisplay;

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'var(--color-success)';
      case 'away':
        return 'var(--color-warning)';
      default:
        return 'var(--color-text-tertiary)';
    }
  };

  return (
    <div className="online-users">
      <div className="online-users__label">
        <span className="online-users__dot" />
        <span className="online-users__count">{otherOnlineUsers.length} online</span>
      </div>
      <div className="online-users__avatars">
        {displayUsers.map((user) => (
          <div
            key={user.userId}
            className="online-users__avatar"
            title={`${user.userId} - Online`}
          >
            <span className="online-users__avatar-text">
              {getInitials(undefined, user.userId)}
            </span>
            <span
              className="online-users__avatar-status"
              style={{ backgroundColor: getStatusColor(user.status) }}
            />
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="online-users__avatar online-users__avatar--more">
            <span className="online-users__avatar-text">+{remainingCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineUsers;
