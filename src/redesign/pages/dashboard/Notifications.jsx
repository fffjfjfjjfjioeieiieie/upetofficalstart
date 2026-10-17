import { useEffect, useState } from 'react';
import { Bell, Mail, MessageCircle, Check } from 'lucide-react';
import { useStore } from '../../lib/store';
import { markShopMessageRead, subscribeShopMessages } from '../../lib/messageStore';
import { PageTitle, Panel } from '../../components/Controls';

const dateLabel = (value) => {
  const date = typeof value?.toDate === 'function' ? value.toDate() : null;
  return date ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date) : 'Just now';
};

export default function Notifications() {
  const { user } = useStore();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => subscribeShopMessages(user.username, setItems, (reason) => setError(reason?.message || 'Notifications could not load.')), [user.username]);
  const unread = items.filter((item) => !item.read).length;
  return <div data-testid="notifications-page" className="space-y-4">
    <PageTitle title="Notifications" sub={unread ? `${unread} unread shop message${unread === 1 ? '' : 's'}.` : 'Messages from visitors to your shop.'} />
    {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
    <Panel title="Shop messages" testid="notifications-messages">
      {!items.length && <div className="grid min-h-48 place-items-center text-center text-sm text-muted-foreground"><div><Bell className="mx-auto mb-3 h-6 w-6 text-primary" /><p>No messages yet.</p><p className="mt-1 text-xs">Visitors can message you from your profile’s shop.</p></div></div>}
      <div className="space-y-3">{items.map((item) => <article key={item.id} data-testid={`notification-${item.id}`} className={`rounded-2xl border p-4 ${item.read ? 'bg-background/30' : 'border-primary/30 bg-primary/5'}`}>
        <div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary"><MessageCircle className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{item.senderName}</strong><span className="text-xs text-muted-foreground">{dateLabel(item.createdAt)}</span></div>{item.senderContact && <a href={item.senderContact.includes('@') && !item.senderContact.startsWith('http') ? `mailto:${item.senderContact}` : item.senderContact} target={item.senderContact.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"><Mail className="h-3 w-3" />{item.senderContact}</a>}<p className="mt-3 whitespace-pre-wrap text-sm text-foreground/85">{item.body}</p></div>{!item.read && <button type="button" data-testid={`notification-read-${item.id}`} onClick={() => markShopMessageRead(item.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-primary hover:bg-primary/15" title="Mark as read"><Check className="h-4 w-4" /></button>}</div>
      </article>)}</div>
    </Panel>
  </div>;
}
