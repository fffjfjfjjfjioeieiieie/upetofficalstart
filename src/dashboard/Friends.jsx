import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, MessageCircle, Plus, Search, Send, UserRound, UsersRound, X } from 'lucide-react';
import { DashboardHeader } from './Dashboard.jsx';
import dashboardStyles from './Dashboard.module.css';
import styles from './Friends.module.css';
import {
  ensureFriendChat,
  findUserByUsername,
  listenToFriends,
  listenToIncomingRequests,
  listenToMessages,
  listenToOutgoingRequests,
  listenToTyping,
  respondToFriendRequest,
  setChatTyping,
  sendChatMessage,
  sendFriendRequest,
} from '../data/friendsStore.js';
import { firebaseConfigured } from '../app/firebase.js';

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,19}$/;

function explainError(error) {
  if (error?.code === 'permission-denied') {
    return 'Firestore access was denied. Deploy the latest firestore.rules to enable friends and private chats.';
  }
  if (error?.code === 'failed-precondition') {
    return 'Firestore needs an index for this request. Use the index link in the browser console, then reload.';
  }
  if (error?.code === 'unavailable' || error?.code === 'network-request-failed') {
    return 'Could not reach Firebase. Check your connection and try again.';
  }
  return error?.message || 'Something went wrong. Please try again.';
}

function formatMessageTime(timestamp) {
  const date = timestamp?.toDate?.();
  if (!date) return 'sending';
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

function handleFor(user) {
  return user?.username ? `@${user.username}` : '@unknown';
}

export default function Friends({ user, username, onLogout, onNavigate, theme, onToggleTheme }) {
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [busyKey, setBusyKey] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [friendIsTyping, setFriendIsTyping] = useState(false);
  const [chatError, setChatError] = useState('');
  const [draft, setDraft] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const typingRoomRef = useRef(null);
  const typingActiveRef = useRef(false);
  const typingStopTimerRef = useRef(null);
  const typingHeartbeatRef = useRef(null);
  const stopTypingRef = useRef(null);
  const activeRoomId = activeChat?.room?.roomId;

  const publishTyping = (room, isTyping) => {
    if (!user?.uid || !room) return;
    setChatTyping(room, user.uid, isTyping).catch(() => {});
  };

  const stopTyping = () => {
    clearTimeout(typingStopTimerRef.current);
    clearInterval(typingHeartbeatRef.current);
    typingStopTimerRef.current = null;
    typingHeartbeatRef.current = null;

    const room = typingRoomRef.current;
    const wasTyping = typingActiveRef.current;
    typingRoomRef.current = null;
    typingActiveRef.current = false;
    if (wasTyping && room) publishTyping(room, false);
  };
  stopTypingRef.current = stopTyping;

  useEffect(() => {
    if (!user?.uid) return undefined;
    if (!firebaseConfigured) {
      setLoading(false);
      setPageError('Firebase is not configured for this site.');
      return undefined;
    }

    setLoading(true);
    const onDataError = (error) => {
      setPageError(explainError(error));
      setLoading(false);
    };
    const unsubscribers = [
      listenToFriends(user.uid, (items) => { setFriends(items); setLoading(false); }, onDataError),
      listenToIncomingRequests(user.uid, (items) => { setIncoming(items); setLoading(false); }, onDataError),
      listenToOutgoingRequests(user.uid, (items) => { setOutgoing(items); setLoading(false); }, onDataError),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [user?.uid]);

  useEffect(() => {
    if (!activeRoomId) {
      setMessages([]);
      setMessagesLoading(false);
      return undefined;
    }

    setMessages([]);
    setChatError('');
    setMessagesLoading(true);
    return listenToMessages(activeChat.room, (items) => {
      setMessages(items);
      setMessagesLoading(false);
    }, (error) => {
      setChatError(explainError(error));
      setMessagesLoading(false);
    });
  }, [activeRoomId]);

  useEffect(() => {
    if (!activeRoomId || !activeChat?.friend?.friendUid) {
      setFriendIsTyping(false);
      return undefined;
    }

    setFriendIsTyping(false);
    const unsubscribe = listenToTyping(activeChat.room, activeChat.friend.friendUid, setFriendIsTyping, (error) => {
      setChatError(explainError(error));
    });
    return () => {
      unsubscribe();
      stopTypingRef.current?.();
    };
  }, [activeRoomId, activeChat?.friend?.friendUid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const pendingIncoming = useMemo(() => incoming
    .filter((request) => request.status === 'pending')
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)), [incoming]);
  const pendingOutgoing = useMemo(() => outgoing
    .filter((request) => request.status === 'pending')
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)), [outgoing]);
  const sortedFriends = useMemo(() => [...friends].sort((a, b) => (
    (a.friendUsername || '').localeCompare(b.friendUsername || '')
  )), [friends]);

  const searchFriend = async (event) => {
    event.preventDefault();
    const normalized = searchValue.trim().replace(/^@/, '').toLowerCase();
    setSearchResult(null);
    setNotice('');
    setPageError('');
    if (!USERNAME_PATTERN.test(normalized)) {
      setPageError('Enter a username with 3 to 20 lowercase letters, numbers, dots, underscores, or hyphens.');
      return;
    }

    setSearching(true);
    try {
      const result = await findUserByUsername(normalized);
      if (!result) {
        setPageError(`No account found for @${normalized}.`);
      } else if (result.uid === user?.uid) {
        setPageError('That is your username. Try someone else.');
      } else {
        setSearchResult(result);
      }
    } catch (error) {
      setPageError(explainError(error));
    } finally {
      setSearching(false);
    }
  };

  const addFriend = async (friend) => {
    setBusyKey(`add:${friend.uid}`);
    setPageError('');
    setNotice('');
    try {
      await sendFriendRequest(user.uid, friend.uid);
      setNotice(`friend request sent to ${handleFor(friend)}.`);
    } catch (error) {
      setPageError(explainError(error));
    } finally {
      setBusyKey('');
    }
  };

  const handleRequest = async (request, accept) => {
    setBusyKey(`request:${request.fromUid}`);
    setPageError('');
    setNotice('');
    try {
      await respondToFriendRequest(user.uid, request.fromUid, accept);
      setNotice(accept ? `you and @${request.fromUsername} are friends now.` : `request from @${request.fromUsername} declined.`);
    } catch (error) {
      setPageError(explainError(error));
    } finally {
      setBusyKey('');
    }
  };

  const openChat = async (friend) => {
    setBusyKey(`chat:${friend.friendUid}`);
    setPageError('');
    setChatError('');
    try {
      const room = await ensureFriendChat(user.uid, friend.friendUid);
      stopTypingRef.current?.();
      setDraft('');
      setActiveChat({ room, friend });
    } catch (error) {
      setPageError(explainError(error));
    } finally {
      setBusyKey('');
    }
  };

  const submitMessage = async (event) => {
    event.preventDefault();
    if (!activeChat || !draft.trim()) return;
    const messageText = draft;
    stopTypingRef.current?.();
    setSendingMessage(true);
    setChatError('');
    try {
      await sendChatMessage(activeChat.room, user.uid, messageText);
      setDraft('');
    } catch (error) {
      setChatError(explainError(error));
    } finally {
      setSendingMessage(false);
    }
  };

  const resultFriend = searchResult && friends.find((friend) => friend.friendUid === searchResult.uid);
  const resultIncoming = searchResult && pendingIncoming.find((request) => request.fromUid === searchResult.uid);
  const resultOutgoing = searchResult && outgoing.find((request) => request.toUid === searchResult.uid);

  return (
    <div className={`${dashboardStyles.dashboardPage} ${styles.friendsPage}`} data-theme={theme}>
      <DashboardHeader
        activePage="friends"
        username={username}
        onLogout={onLogout}
        onNavigate={onNavigate}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main className={styles.friendsMain}>
        <section className={styles.pageIntro} aria-labelledby="friends-title">
          <p className={styles.eyebrow}><span /> your people</p>
          <h1 id="friends-title">friends</h1>
          <p>find your people, then keep the conversation here.</p>
        </section>

        {pageError && <p className={styles.pageAlert} role="alert">{pageError}</p>}
        {notice && <p className={styles.notice} role="status">{notice}</p>}

        <div className={styles.friendsLayout}>
          <div className={styles.leftColumn}>
            <section className={styles.findPanel} aria-labelledby="find-title">
              <div className={styles.sectionHead}>
                <div><span>01 / grow your circle</span><h2 id="find-title">find a friend</h2></div>
                <Search size={17} aria-hidden="true" />
              </div>
              <form className={styles.searchForm} onSubmit={searchFriend}>
                <label htmlFor="friend-username">search by username</label>
                <div className={styles.searchInputRow}>
                  <span aria-hidden="true">@</span>
                  <input
                    id="friend-username"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    maxLength={21}
                    placeholder="username"
                    value={searchValue}
                    onChange={(event) => {
                      setSearchValue(event.target.value.toLowerCase());
                      setSearchResult(null);
                      setPageError('');
                      setNotice('');
                    }}
                  />
                  <button type="submit" disabled={searching || !searchValue.trim()} aria-label="Search username">
                    <Search size={15} aria-hidden="true" />
                    <span>{searching ? 'searching' : 'search'}</span>
                  </button>
                </div>
                <p>use their user.pet username. emails stay private.</p>
              </form>

              {searchResult && (
                <div className={styles.searchResult}>
                  <div className={styles.miniAvatar}><UserRound size={18} aria-hidden="true" /></div>
                  <div className={styles.personCopy}><strong>@{searchResult.username}</strong><span>user.pet member</span></div>
                  {resultFriend ? (
                    <span className={styles.statePill}><Check size={13} /> friends</span>
                  ) : resultIncoming ? (
                    <button
                      className={styles.smallPrimary}
                      type="button"
                      disabled={busyKey === `request:${resultIncoming.fromUid}`}
                      onClick={() => handleRequest(resultIncoming, true)}
                    >accept request</button>
                  ) : resultOutgoing?.status === 'pending' ? (
                    <span className={styles.statePill}>request sent</span>
                  ) : (
                    <button
                      className={styles.smallPrimary}
                      type="button"
                      disabled={busyKey === `add:${searchResult.uid}`}
                      onClick={() => addFriend(searchResult)}
                    >
                      <Plus size={14} aria-hidden="true" /> {busyKey === `add:${searchResult.uid}` ? 'sending' : 'add friend'}
                    </button>
                  )}
                </div>
              )}
            </section>

            <section className={styles.requestsPanel} aria-labelledby="requests-title">
              <div className={styles.sectionHead}>
                <div><span>02 / requests</span><h2 id="requests-title">friend requests</h2></div>
                {pendingIncoming.length > 0 && <span className={styles.countPill}>{pendingIncoming.length}</span>}
              </div>
              {loading ? (
                <p className={styles.quietEmpty}>loading your requests...</p>
              ) : pendingIncoming.length ? (
                <div className={styles.requestList}>
                  {pendingIncoming.map((request) => (
                    <div className={styles.requestRow} key={request.fromUid}>
                      <div className={styles.miniAvatar}><ArrowDownLeft size={17} aria-hidden="true" /></div>
                      <div className={styles.personCopy}><strong>@{request.fromUsername}</strong><span>wants to connect</span></div>
                      <div className={styles.requestActions}>
                        <button
                          className={styles.iconAccept}
                          type="button"
                          aria-label={`Accept friend request from ${request.fromUsername}`}
                          disabled={busyKey === `request:${request.fromUid}`}
                          onClick={() => handleRequest(request, true)}
                        ><Check size={15} /></button>
                        <button
                          className={styles.iconDecline}
                          type="button"
                          aria-label={`Decline friend request from ${request.fromUsername}`}
                          disabled={busyKey === `request:${request.fromUid}`}
                          onClick={() => handleRequest(request, false)}
                        ><X size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.quietEmpty}>no new requests.</p>
              )}
              {pendingOutgoing.length > 0 && (
                <div className={styles.sentRequests}>
                  <span>waiting on</span>
                  {pendingOutgoing.map((request) => <span key={request.toUid}>@{request.toUsername}</span>)}
                </div>
              )}
            </section>

            <section className={styles.friendsPanel} aria-labelledby="your-friends-title">
              <div className={styles.sectionHead}>
                <div><span>03 / your circle</span><h2 id="your-friends-title">your friends</h2></div>
                <UsersRound size={17} aria-hidden="true" />
              </div>
              {loading ? (
                <p className={styles.quietEmpty}>loading your friends...</p>
              ) : sortedFriends.length ? (
                <div className={styles.friendList}>
                  {sortedFriends.map((friend) => (
                    <div className={`${styles.friendRow}${activeChat?.friend.friendUid === friend.friendUid ? ` ${styles.friendRowActive}` : ''}`} key={friend.friendUid}>
                      <div className={styles.friendAvatar}><UserRound size={18} aria-hidden="true" /></div>
                      <div className={styles.personCopy}><strong>@{friend.friendUsername}</strong><span>your friend</span></div>
                      <button
                        className={styles.messageButton}
                        type="button"
                        disabled={busyKey === `chat:${friend.friendUid}`}
                        onClick={() => openChat(friend)}
                      ><MessageCircle size={14} aria-hidden="true" /><span>{busyKey === `chat:${friend.friendUid}` ? 'opening' : 'message'}</span></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.friendsEmpty}>
                  <span><UsersRound size={19} aria-hidden="true" /></span>
                  <p>your circle starts here.</p>
                  <small>search for someone by their username to add your first friend.</small>
                </div>
              )}
            </section>
          </div>

          <section className={styles.chatPanel} aria-labelledby="conversation-title">
            <div className={styles.chatHeader}>
              <div>
                <span>04 / private conversation</span>
                <h2 id="conversation-title">{activeChat ? `@${activeChat.friend.friendUsername}` : 'messages'}</h2>
              </div>
              {activeChat && <span className={styles.privateMark}><span /> friends only</span>}
            </div>

            {!activeChat ? (
              <div className={styles.chatEmpty}>
                <span className={styles.chatEmptyIcon}><MessageCircle size={22} strokeWidth={1.4} /></span>
                <h3>good conversations start somewhere.</h3>
                <p>choose a friend to open a private chat. only accepted friends can message each other.</p>
              </div>
            ) : (
              <>
                <div className={styles.messageList} aria-live="polite" aria-label={`Messages with ${activeChat.friend.friendUsername}`}>
                  {messagesLoading ? (
                    <p className={styles.messageEmpty}>opening your conversation...</p>
                  ) : messages.length ? (
                    messages.map((message) => {
                      const ownMessage = message.senderId === user.uid;
                      return (
                        <div className={`${styles.messageRow}${ownMessage ? ` ${styles.messageOwn}` : ''}`} key={message.id}>
                          <div className={styles.messageMeta}>
                            <span>{ownMessage ? `@${username || 'you'}` : `@${activeChat.friend.friendUsername}`}</span>
                            <time>{formatMessageTime(message.createdAt)}</time>
                          </div>
                          <p>{message.text}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className={styles.firstMessage}>
                      <span><MessageCircle size={17} /></span>
                      <p>nothing here yet.</p>
                      <small>say hey to @{activeChat.friend.friendUsername}.</small>
                    </div>
                  )}
                  {friendIsTyping && (
                    <div className={styles.typingIndicator} role="status" aria-label={`@${activeChat.friend.friendUsername} is typing`}>
                      <span className={styles.typingDots} aria-hidden="true"><i /><i /><i /></span>
                      <span>@{activeChat.friend.friendUsername} is typing</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                {chatError && <p className={styles.chatAlert} role="alert">{chatError}</p>}
                <form className={styles.composer} onSubmit={submitMessage}>
                  <label className={styles.srOnly} htmlFor="chat-message">Write a message</label>
                  <textarea
                    id="chat-message"
                    rows={2}
                    maxLength={2000}
                    placeholder={`message @${activeChat.friend.friendUsername}...`}
                    value={draft}
                    onChange={(event) => {
                      const nextDraft = event.target.value;
                      setDraft(nextDraft);
                      if (!nextDraft.trim() || !activeChat) {
                        stopTypingRef.current?.();
                        return;
                      }

                      const room = activeChat.room;
                      if (typingRoomRef.current?.roomId !== room.roomId) {
                        stopTypingRef.current?.();
                        typingRoomRef.current = room;
                      }
                      if (!typingActiveRef.current) {
                        typingActiveRef.current = true;
                        publishTyping(room, true);
                        typingHeartbeatRef.current = setInterval(() => publishTyping(room, true), 4000);
                      }
                      clearTimeout(typingStopTimerRef.current);
                      typingStopTimerRef.current = setTimeout(() => stopTypingRef.current?.(), 1300);
                    }}
                    onBlur={() => stopTypingRef.current?.()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                  <button type="submit" disabled={sendingMessage || !draft.trim()} aria-label="Send message">
                    <Send size={16} aria-hidden="true" />
                  </button>
                </form>
                <p className={styles.chatFootnote}>private between you and @{activeChat.friend.friendUsername}</p>
              </>
            )}
          </section>
        </div>

        <footer className={styles.friendsFooter}>
          <span>user.pet <i /> good things are better shared</span>
          <button type="button" onClick={() => onNavigate('/dashboard')}><ArrowUpRight size={13} /> back to dashboard</button>
        </footer>
      </main>
    </div>
  );
}
