import { redirect } from 'next/navigation';

// /simulation with no career specified defaults to the original MVP career,
// so any old links/bookmarks from before multi-career support keep working.
export default function SimulationIndexPage() {
  redirect('/simulation/trauma_surgeon');
}
