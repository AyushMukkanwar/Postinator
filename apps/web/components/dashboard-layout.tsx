'use client';

import type React from 'react';

import { useState } from 'react';
import { NavBar } from './navbar';
import { SidePanel } from './side-panel';
import { OnboardingModal } from './onboarding-modal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <NavBar onMenuClick={() => setIsSidePanelOpen(true)} />

      <main className="flex-1">{children}</main>

      <SidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
      />

      <OnboardingModal />
    </div>
  );
}
