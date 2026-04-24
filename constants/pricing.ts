import { Zap, Star, Crown, Rocket } from 'lucide-react';

export interface PlanUIMetadata {
  icon: React.ElementType;
  color: string;
  popular?: boolean;
}

export const PLAN_UI_METADATA: Record<string, PlanUIMetadata> = {
  free: { icon: Zap, color: '#6b7280' },
  basic: { icon: Star, color: '#3b82f6' },
  pro: { icon: Rocket, color: '#8b5cf6', popular: true },
  enterprise: { icon: Crown, color: '#f59e0b' },
};

export const DEFAULT_PLAN_METADATA: PlanUIMetadata = {
  icon: Zap,
  color: '#6b7280',
};
