'use client';

import type React from 'react';

import { useState } from 'react';
import { NavBar } from './navbar';
import { SidePanel } from './side-panel';
import { OnboardingModal } from './onboarding-modal';

interface DashboardLayoutProps {
  children: React.ReactNode;
  avatar?: string;
  username?: string;
  email?: string;
}

export function DashboardLayout({
  children,
  avatar,
  username,
  email,
}: DashboardLayoutProps) {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        onMenuClick={() => setIsSidePanelOpen(true)}
        avatar={avatar}
        username={username}
        email={email}
      />

      <main className="flex-1">{children}</main>

      <SidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
      />

      <OnboardingModal />
    </div>
  );
}
