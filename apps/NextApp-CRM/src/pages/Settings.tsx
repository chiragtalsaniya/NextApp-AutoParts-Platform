import React from 'react';
import { SettingsLayout } from '../components/Settings/SettingsLayout';
import { SettingsContent } from '../components/Settings/SettingsContent';

export const Settings: React.FC = () => {
  return (
    <SettingsLayout>
      <SettingsContent activeTab="profile" />
    </SettingsLayout>
  );
};