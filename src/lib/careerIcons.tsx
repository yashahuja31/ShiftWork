import {
  Ambulance,
  Briefcase,
  Camera,
  ChefHat,
  Fingerprint,
  Flame,
  GraduationCap,
  Plane,
  Radar,
  Rocket,
  Stethoscope,
  Terminal,
} from 'lucide-react';

interface CareerIconProps {
  careerId: string;
  size?: number;
  strokeWidth?: number;
}

/**
 * Renders the right icon for a career id via a literal switch (each branch
 * uses a directly-imported icon component, not a variable holding a picked
 * component reference). This is more verbose than a lookup-table-plus-render
 * would be, but it's what satisfies React's static-components rule: JSX
 * tags need to resolve to a statically-known component at each callsite,
 * not a dynamically selected one, even inside a small dedicated component.
 */
export function CareerIcon({ careerId, size = 20, strokeWidth = 2.25 }: CareerIconProps) {
  switch (careerId) {
    case 'trauma_surgeon':
      return <Stethoscope size={size} strokeWidth={strokeWidth} />;
    case 'astronaut':
      return <Rocket size={size} strokeWidth={strokeWidth} />;
    case 'detective':
      return <Fingerprint size={size} strokeWidth={strokeWidth} />;
    case 'chef':
      return <ChefHat size={size} strokeWidth={strokeWidth} />;
    case 'pilot':
      return <Plane size={size} strokeWidth={strokeWidth} />;
    case 'wildlife_photographer':
      return <Camera size={size} strokeWidth={strokeWidth} />;
    case 'investment_banker':
      return <Briefcase size={size} strokeWidth={strokeWidth} />;
    case 'air_traffic_controller':
      return <Radar size={size} strokeWidth={strokeWidth} />;
    case 'firefighter':
      return <Flame size={size} strokeWidth={strokeWidth} />;
    case 'teacher':
      return <GraduationCap size={size} strokeWidth={strokeWidth} />;
    case 'paramedic':
      return <Ambulance size={size} strokeWidth={strokeWidth} />;
    case 'software_engineer':
      return <Terminal size={size} strokeWidth={strokeWidth} />;
    default:
      return <Briefcase size={size} strokeWidth={strokeWidth} />;
  }
}
