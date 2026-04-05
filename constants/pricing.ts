import { Sparkles, Rocket, Zap, Crown, Globe, Star } from 'lucide-react';

export const PLAN_UI_METADATA: Record<string, {
  icon: any;
  color: string;
  popular?: boolean;
}> = {
  free: {
    icon: Sparkles,
    color: '#AAAAAA',
  },
  starter: {
    icon: Rocket,
    color: '#3b82f6',
  },
  pro: {
    icon: Zap,
    color: '#FF0000',
    popular: true,
  },
  enterprise: {
    icon: Crown,
    color: '#FFD700',
  },
  custom: {
    icon: Globe,
    color: '#FF0000',
  },
};

export const DEFAULT_PLAN_METADATA = {
  icon: Star,
  color: '#3b82f6',
};
