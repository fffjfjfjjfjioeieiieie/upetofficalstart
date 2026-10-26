import { Navigate, Route, Routes } from 'react-router-dom';
import ModviewPage from '../../../help/pages/ModviewPage.jsx';
import { StaffArticlePage, StaffLegalPage, StaffTicketPage, StaffTicketsPage } from '../../../help/pages/StaffPages.jsx';
import '../../../help/help.css';

const basePath = '/dashboard/modview';

export default function DashboardModview() {
  return <Routes>
    <Route index element={<ModviewPage basePath={basePath} />} />
    <Route path="founder" element={<ModviewPage founder basePath={basePath} />} />
    <Route path="founder/:section" element={<ModviewPage founder basePath={basePath} />} />
    <Route path="tickets" element={<StaffTicketsPage />} />
    <Route path="tickets/:ticketId" element={<StaffTicketPage />} />
    <Route path="articles" element={<StaffArticlePage />} />
    <Route path="legal" element={<StaffLegalPage />} />
    <Route path=":section" element={<ModviewPage basePath={basePath} />} />
    <Route path="*" element={<Navigate to={basePath} replace />} />
  </Routes>;
}
