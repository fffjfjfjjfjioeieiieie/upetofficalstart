import { HelpAuthProvider } from '../../../help/context/HelpAuth.jsx';
import Dashboard from './Dashboard';

export default function DashboardRoute() {
  return <HelpAuthProvider><Dashboard /></HelpAuthProvider>;
}
