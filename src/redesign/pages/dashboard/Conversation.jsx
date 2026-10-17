import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ChatThread from '../../components/ChatThread';
export default function Conversation() { const { threadId } = useParams(); return <div><Link to="/dashboard/notifications" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Notifications</Link><ChatThread threadId={threadId} sender="owner" title="Shop conversation" /></div>; }
