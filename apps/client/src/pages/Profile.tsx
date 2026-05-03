import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { getCurrentUser } from '@/store/slices/authSlice';
import { addNotification } from '@/store/slices/uiSlice';
import { Button, Input, LoadingSpinner } from '@/components/common';
import { authService } from '@/services/api/authService';
import './Profile.css';

export const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    }
  }, [user]);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await authService.updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
      });
      await dispatch(getCurrentUser());
      setEditMode(false);
      dispatch(addNotification({ type: 'success', message: 'Profile updated successfully' }));
    } catch {
      dispatch(addNotification({ type: 'error', message: 'Failed to update profile' }));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword) errors.newPassword = 'New password is required';
    else if (passwordForm.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      dispatch(addNotification({ type: 'success', message: 'Password changed successfully' }));
    } catch {
      dispatch(addNotification({ type: 'error', message: 'Failed to change password. Check your current password.' }));
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = () => {
    if (!user) return '?';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  if (isLoading && !user) {
    return (
      <div className="profile-page">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <h1 className="profile-page__title">Profile</h1>
        <p className="profile-page__subtitle">Manage your personal information and password</p>
      </div>

      <div className="profile-content">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-card__header">
            <div className="profile-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={`${user.firstName} ${user.lastName}`} className="profile-avatar__img" />
              ) : (
                <span className="profile-avatar__initials">{getInitials()}</span>
              )}
            </div>
            <div className="profile-card__info">
              <h2 className="profile-card__name">{user?.firstName} {user?.lastName}</h2>
              <p className="profile-card__email">{user?.email}</p>
              <span className="profile-card__role">{user?.role}</span>
            </div>
          </div>

          <div className="profile-card__body">
            <div className="profile-section">
              <div className="profile-section__header">
                <h3 className="profile-section__title">Personal Information</h3>
                {!editMode && (
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                    Edit
                  </Button>
                )}
              </div>

              {editMode ? (
                <div className="profile-form">
                  <div className="profile-form__row">
                    <Input
                      label="First Name"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                      placeholder="First name"
                    />
                    <Input
                      label="Last Name"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                      placeholder="Last name"
                    />
                  </div>
                  <Input
                    label="Email"
                    value={profileForm.email}
                    disabled
                    hint="Email cannot be changed"
                  />
                  <div className="profile-form__actions">
                    <Button variant="outline" onClick={() => setEditMode(false)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button onClick={handleProfileSave} isLoading={saving}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="profile-info-grid">
                  <div className="profile-info-item">
                    <span className="profile-info-item__label">First Name</span>
                    <span className="profile-info-item__value">{user?.firstName}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-item__label">Last Name</span>
                    <span className="profile-info-item__value">{user?.lastName}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-item__label">Email</span>
                    <span className="profile-info-item__value">{user?.email}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-item__label">Member Since</span>
                    <span className="profile-info-item__value">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="profile-card">
          <div className="profile-card__body">
            <div className="profile-section">
              <div className="profile-section__header">
                <h3 className="profile-section__title">Change Password</h3>
              </div>
              <form onSubmit={handlePasswordChange} className="profile-form">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  error={passwordErrors.currentPassword}
                  placeholder="Enter current password"
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                  error={passwordErrors.newPassword}
                  placeholder="Minimum 8 characters"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  error={passwordErrors.confirmPassword}
                  placeholder="Repeat new password"
                />
                <div className="profile-form__actions">
                  <Button type="submit" isLoading={changingPassword}>
                    Change Password
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
