'use client';

import type React from 'react';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface BaseToggleProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function BaseToggle({
  label,
  checked,
  onCheckedChange,
  icon,
  disabled = false,
  className = '',
  id,
}: BaseToggleProps) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 ${className}`}
    >
      <div className="flex items-center space-x-2">
        {icon}
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-blue-600"
      />
    </div>
  );
}
