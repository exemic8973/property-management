'use client';

import React, { useState } from 'react';
import { AppShell, PageLayout } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@property-os/ui';
import { Button } from '@property-os/ui';
import { Input } from '@property-os/ui';
import { Label } from '@property-os/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@property-os/ui';
import { useAuth } from '@/contexts/auth-context';
import { useUpdateProfile, useChangePassword } from '@/lib/hooks/tenant-hooks';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@property-os/ui';

export default function TenantProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  // Role check
  React.useEffect(() => {
    if (user && user.role !== 'TENANT') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    setProfileSuccess(false);

    const errors: Record<string, string> = {};

    if (!profileForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!profileForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        phone: profileForm.phone.trim() || undefined,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setProfileErrors({ submit: 'Failed to update profile. Please try again.' });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordSuccess(false);

    const errors: Record<string, string> = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordDialog(false);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to change password:', error);
      setPasswordErrors({ submit: 'Current password is incorrect.' });
    }
  };

  if (!user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageLayout
        title="Profile Settings"
        subtitle="Manage your account information and security"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
                    </div>
                  </div>

                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileForm.firstName}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, firstName: e.target.value })
                      }
                      disabled={updateProfileMutation.isPending}
                      className={cn(profileErrors.firstName && 'border-red-500')}
                    />
                    {profileErrors.firstName && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {profileErrors.firstName}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileForm.lastName}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, lastName: e.target.value })
                      }
                      disabled={updateProfileMutation.isPending}
                      className={cn(profileErrors.lastName && 'border-red-500')}
                    />
                    {profileErrors.lastName && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {profileErrors.lastName}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, phone: e.target.value })
                      }
                      placeholder="+1 (555) 123-4567"
                      disabled={updateProfileMutation.isPending}
                    />
                  </div>

                  {/* Success Message */}
                  {profileSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Profile updated successfully!
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {profileErrors.submit && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {profileErrors.submit}
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Change your password to keep your account secure. We recommend using a strong
                    password with a mix of letters, numbers, and special characters.
                  </p>
                </div>

                {/* Password Requirements */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password Requirements:
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                    <li>At least 8 characters long</li>
                    <li>Contains uppercase and lowercase letters</li>
                    <li>Contains at least one number</li>
                    <li>Contains at least one special character</li>
                  </ul>
                </div>

                <Button
                  onClick={() => setShowPasswordDialog(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>

                {/* Password Change Success Message */}
                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Password changed successfully!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Change Password Dialog */}
          <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    disabled={changePasswordMutation.isPending}
                    className={cn(passwordErrors.currentPassword && 'border-red-500')}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    disabled={changePasswordMutation.isPending}
                    className={cn(passwordErrors.newPassword && 'border-red-500')}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {passwordErrors.newPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    disabled={changePasswordMutation.isPending}
                    className={cn(passwordErrors.confirmPassword && 'border-red-500')}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {passwordErrors.submit && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {passwordErrors.submit}
                    </p>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordDialog(false)}
                    disabled={changePasswordMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageLayout>
    </AppShell>
  );
}