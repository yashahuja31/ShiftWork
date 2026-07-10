import { Car, FileText, MessageCircle, Moon, TreePine, TriangleAlert, Users, Wrench } from 'lucide-react';

interface EnvironmentIconProps {
  environment?: string;
  size?: number;
  strokeWidth?: number;
}

/**
 * Renders the icon for a scene's environment tag via a literal switch (see
 * the identical pattern and reasoning in careerIcons.tsx — each branch uses
 * a directly-imported component so the JSX tag is statically known, which
 * is what React's static-components lint rule checks for).
 */
export function EnvironmentIcon({ environment, size = 22, strokeWidth = 2 }: EnvironmentIconProps) {
  switch (environment) {
    case 'commute':
      return <Car size={size} strokeWidth={strokeWidth} />;
    case 'briefing':
      return <Users size={size} strokeWidth={strokeWidth} />;
    case 'rest':
      return <Moon size={size} strokeWidth={strokeWidth} />;
    case 'alert':
      return <TriangleAlert size={size} strokeWidth={strokeWidth} />;
    case 'social':
      return <MessageCircle size={size} strokeWidth={strokeWidth} />;
    case 'outdoors':
      return <TreePine size={size} strokeWidth={strokeWidth} />;
    case 'paperwork':
      return <FileText size={size} strokeWidth={strokeWidth} />;
    case 'work':
    default:
      return <Wrench size={size} strokeWidth={strokeWidth} />;
  }
}

const ENVIRONMENT_LABELS: Record<string, string> = {
  commute: 'On the move',
  briefing: 'Briefing',
  rest: 'Downtime',
  alert: 'High stakes',
  social: 'Conversation',
  outdoors: 'Outdoors',
  paperwork: 'Paperwork',
  work: 'On task',
};

export function labelForEnvironment(environment?: string): string {
  return ENVIRONMENT_LABELS[environment ?? 'work'] ?? ENVIRONMENT_LABELS.work!;
}
