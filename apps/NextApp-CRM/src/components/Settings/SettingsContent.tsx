import React from 'react';
import { ProfileSettings } from './ProfileSettings';
import { SecuritySettings } from './SecuritySettings';
import { NotificationSettings } from './NotificationSettings';
import { SystemSettings } from './SystemSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { RegionalSettings } from './RegionalSettings';

interface SettingsContentProps {
  activeTab: string;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({ activeTab }) => {
  switch (activeTab) {
    case 'profile':
      return <ProfileSettings />;
    case 'security':
      return <SecuritySettings />;
    case 'notifications':
      return <NotificationSettings />;
    case 'system':
      return <SystemSettings />;
    case 'appearance':
      return <AppearanceSettings />;
    case 'regional':
      return <RegionalSettings />;
    default:
      return <ProfileSettings />;
  }
};