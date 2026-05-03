import React, { useState } from 'react';
import { useAppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { addNotification } from '@/store/slices/uiSlice';
import { Button } from '@/components/common';
import './UserSettings.css';

type NotificationSetting = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

const defaultNotifications: NotificationSetting[] = [
  { id: 'task_assigned', label: 'Task Assigned', description: 'When a task is assigned to you', enabled: true },
  { id: 'task_updated', label: 'Task Updated', description: 'When a task you watch is updated', enabled: true },
  { id: 'comment_added', label: 'New Comment', description: 'When someone comments on your task', enabled: true },
  { id: 'mention', label: 'Mentions', description: 'When someone mentions you in a comment', enabled: true },
  { id: 'status_change', label: 'Status Changes', description: 'When task status changes', enabled: false },
];

export const UserSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const [notifications, setNotifications] = useState<NotificationSetting[]>(defaultNotifications);
  const [theme, setTheme] = useState<'light' | 'system'>('light');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  };

  const handleSaveNotifications = () => {
    dispatch(addNotification({ type: 'success', message: 'Notification preferences saved' }));
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <h1 className="settings-page__title">Settings</h1>
        <p className="settings-page__subtitle">Manage your app preferences</p>
      </div>

      <div className="settings-content">
        {/* Appearance */}
        <div className="settings-card">
          <div className="settings-card__header">
            <h2 className="settings-card__title">Appearance</h2>
            <p className="settings-card__description">Customize how the app looks</p>
          </div>
          <div className="settings-card__body">
            <div className="settings-field">
              <label className="settings-field__label">Theme</label>
              <div className="theme-options">
                <button
                  type="button"
                  className={`theme-option ${theme === 'light' ? 'theme-option--active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <span className="theme-option__preview theme-option__preview--light" />
                  <span className="theme-option__label">Light</span>
                </button>
                <button
                  type="button"
                  className={`theme-option ${theme === 'system' ? 'theme-option--active' : ''}`}
                  onClick={() => setTheme('system')}
                >
                  <span className="theme-option__preview theme-option__preview--system" />
                  <span className="theme-option__label">System</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-card">
          <div className="settings-card__header">
            <h2 className="settings-card__title">Notifications</h2>
            <p className="settings-card__description">Choose what notifications you receive</p>
          </div>
          <div className="settings-card__body">
            <div className="notification-list">
              {notifications.map((notification) => (
                <div key={notification.id} className="notification-item">
                  <div className="notification-item__info">
                    <span className="notification-item__label">{notification.label}</span>
                    <span className="notification-item__description">{notification.description}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notification.enabled}
                    className={`toggle ${notification.enabled ? 'toggle--on' : ''}`}
                    onClick={() => toggleNotification(notification.id)}
                    aria-label={`Toggle ${notification.label}`}
                  >
                    <span className="toggle__thumb" />
                  </button>
                </div>
              ))}
            </div>
            <div className="settings-card__footer">
              <Button size="sm" onClick={handleSaveNotifications}>
                Save Preferences
              </Button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-card settings-card--danger">
          <div className="settings-card__header">
            <h2 className="settings-card__title settings-card__title--danger">Danger Zone</h2>
            <p className="settings-card__description">Irreversible account actions</p>
          </div>
          <div className="settings-card__body">
            <div className="danger-action">
              <div className="danger-action__info">
                <span className="danger-action__label">Sign Out</span>
                <span className="danger-action__description">Sign out of your account on this device</span>
              </div>
              {showLogoutConfirm ? (
                <div className="danger-action__confirm">
                  <span className="danger-action__confirm-text">Are you sure?</span>
                  <Button variant="danger" size="sm" onClick={handleLogout}>Confirm</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowLogoutConfirm(true)}>
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
