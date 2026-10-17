import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ChatThread from '../components/ChatThread';
export default function ShopChatPage() { const { username, threadId } = useParams(); return <main className="mx-auto min-h-screen max-w-3xl px-5 py-10"><Link to={`/${username}/shop`} className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to shop</Link><ChatThread threadId={threadId} sender="guest" title={`Chat with @${username}`} /></main>; }
