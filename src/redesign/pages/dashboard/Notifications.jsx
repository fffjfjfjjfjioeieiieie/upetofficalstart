import { useEffect, useState } from 'react';
import { Bell, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store';
import { subscribeOwnerConversations } from '../../lib/chatStore';
import { PageTitle, Panel } from '../../components/Controls';

const dateLabel = (value) => {
  const date = typeof value?.toDate === 'function' ? value.toDate() : null;
  return date ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date) : 'Just now';
};

export default function Notifications() {
  const { user } = useStore();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => subscribeOwnerConversations(user.username, setItems, (reason) => setError(reason?.message || 'Notifications could not load.')), [user.username]);
  const unread = items.filter((item) => item.unreadForOwner).length;
  return <div data-testid="notifications-page" className="space-y-4">
    <PageTitle title="Notifications" sub={unread ? `${unread} unread shop message${unread === 1 ? '' : 's'}.` : 'Messages from visitors to your shop.'} />
    {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
    <Panel title="Shop messages" testid="notifications-messages">
      {!items.length && <div className="grid min-h-48 place-items-center text-center text-sm text-muted-foreground"><div><Bell className="mx-auto mb-3 h-6 w-6 text-primary" /><p>No messages yet.</p><p className="mt-1 text-xs">Visitors can message you from your profile’s shop.</p></div></div>}
      <div className="space-y-3">{items.map((item) => <Link key={item.id} to={`/dashboard/notifications/${item.id}`} data-testid={`notification-${item.id}`} className={`block rounded-2xl border p-4 ${item.unreadForOwner ? 'border-primary/30 bg-primary/5' : 'bg-background/30'}`}><div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary"><MessageCircle className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{item.guestName}</strong><span className="text-xs text-muted-foreground">{dateLabel(item.updatedAt)}</span></div>{item.guestContact && <p className="mt-1 text-xs text-primary">{item.guestContact}</p>}<p className="mt-3 truncate text-sm text-foreground/85">{item.lastMessage}</p></div></div></Link>)}</div>
    </Panel>
  </div>;
}
