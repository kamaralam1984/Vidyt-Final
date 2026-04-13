'use client';

import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { Moon, Sun, Eye } from 'lucide-react';

const THEME_CONFIG: Record<ThemeMode, { icon: typeof Moon; label: string; next: string }> = {
  dark:       { icon: Moon, label: 'Dark',       next: 'Light' },
  light:      { icon: Sun,  label: 'Light',      next: 'Color Blind' },
  colorblind: { icon: Eye,  label: 'Color Blind', next: 'Dark' },
};

export default function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  const config = THEME_CONFIG[theme];
  const Icon = config.icon;

  return (
    <button
      onClick={cycleTheme}
      title={`Current: ${config.label} — Click for ${config.next}`}
      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors
        bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)]
        hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)]"
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{config.label}</span>
    </button>
  );
}
