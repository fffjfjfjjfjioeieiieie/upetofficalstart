import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import HelpShell from './components/HelpShell';
import { HelpAuthProvider, useHelpAuth } from './context/HelpAuth';
import { ArticlePage, CategoryPage, ContactPage, HelpHomePage, LegalPolicyPage, SearchPage } from './pages/PublicPages';
import { HelpLoginPage, MyTicketsPage, NewTicketPage, TicketDetailPage } from './pages/TicketPages';
import { StaffArticlePage, StaffDashboardPage, StaffLegalPage, StaffPlaceholderPage, StaffTicketPage, StaffTicketsPage } from './pages/StaffPages';
import './help.css';

function UserGuard({ children }) { const { user, ready } = useHelpAuth(); const location = useLocation(); if (!ready) return <div className="help-loading">Loading...</div>; return user ? children : <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />; }
function StaffGuard({ children }) { const { user, staff, ready } = useHelpAuth(); if (!ready) return <div className="help-loading">Loading...</div>; if (!user) return <Navigate to="/login?next=/staff" replace />; return staff?.active ? children : <Navigate to="/tickets" replace />; }

export default function HelpApp({ basename }) {
  return <HelpAuthProvider><BrowserRouter basename={basename}><Routes><Route element={<HelpShell />}><Route index element={<HelpHomePage />} /><Route path="search" element={<SearchPage />} /><Route path="category/:slug" element={<CategoryPage />} /><Route path="articles/:slug" element={<ArticlePage />} /><Route path="contact" element={<ContactPage />} /><Route path="login" element={<HelpLoginPage />} /><Route path="tickets/new" element={<UserGuard><NewTicketPage /></UserGuard>} /><Route path="tickets" element={<UserGuard><MyTicketsPage /></UserGuard>} /><Route path="tickets/:ticketId" element={<UserGuard><TicketDetailPage /></UserGuard>} />
      <Route path="legal/:slug" element={<LegalPolicyPage />} />
      <Route path="staff" element={<StaffGuard><StaffDashboardPage /></StaffGuard>} /><Route path="staff/tickets" element={<StaffGuard><StaffTicketsPage /></StaffGuard>} /><Route path="staff/tickets/:ticketId" element={<StaffGuard><StaffTicketPage /></StaffGuard>} /><Route path="staff/articles" element={<StaffGuard><StaffArticlePage /></StaffGuard>} /><Route path="staff/legal" element={<StaffGuard><StaffLegalPage /></StaffGuard>} />{['categories', 'reports', 'team', 'settings'].map((path) => <Route key={path} path={`staff/${path}`} element={<StaffGuard><StaffPlaceholderPage name={path} /></StaffGuard>} />)}<Route path="*" element={<Navigate to="/" replace />} /></Route></Routes></BrowserRouter><Toaster theme="dark" position="bottom-right" richColors /></HelpAuthProvider>;
}
