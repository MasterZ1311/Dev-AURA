import React, { useState, useRef, useEffect } from 'react';
import { useMessaging } from '../context/MessagingContext';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare, Search, Send, User, ArrowLeft,
  ChevronRight, Loader2, Clock, CheckCheck
} from 'lucide-react';
import '../styles/Messages.css';

const timeAgo = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

const AvatarCircle = ({ name, photo, size = 40 }) => {
  if (photo) return <img src={photo} alt={name} className="msg-avatar-img" style={{ width: size, height: size }} />;
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return <div className="msg-avatar-circle" style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials}</div>;
};

const Messages = () => {
  const { currentUser } = useAuth();
  const {
    conversations, activeConvoId, setActiveConvoId,
    messages, searchResult, setSearchResult,
    searching, sending, totalUnread,
    searchByAuraUID, getOrCreateConversation, sendMessage,
  } = useMessaging();

  const [searchCode, setSearchCode] = useState('');
  const [messageText, setMessageText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const uid = currentUser?.uid;

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConvo = conversations.find(c => c.id === activeConvoId);
  const otherUID = activeConvo?.participants?.find(p => p !== uid);
  const otherName = activeConvo?.participantNames?.[otherUID] || 'Unknown';
  const otherPhoto = activeConvo?.participantPhotos?.[otherUID] || null;
  const otherAuraUID = activeConvo?.participantAuraUIDs?.[otherUID] || '';

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    await searchByAuraUID(searchCode.trim());
  };

  const handleStartChat = async () => {
    if (!searchResult || searchResult.error) return;
    await getOrCreateConversation(searchResult.uid, searchResult);
    setShowSearch(false);
    setSearchCode('');
    setSearchResult(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConvoId) return;
    await sendMessage(activeConvoId, messageText);
    setMessageText('');
    inputRef.current?.focus();
  };

  return (
    <div className="messages-page">
      {/* ── LEFT: Conversation List ── */}
      <aside className="messages-left">
        <div className="messages-left-header">
          <div className="messages-title-row">
            <MessageSquare size={20} className="accent-icon" />
            <h2>Messages</h2>
            {totalUnread > 0 && <span className="msg-unread-badge">{totalUnread}</span>}
          </div>
          <button
            className="btn-new-chat btn-primary"
            onClick={() => setShowSearch(prev => !prev)}
          >
            <Search size={16} /> New Chat
          </button>
        </div>

        {/* ── AURA-XXXX Search ── */}
        {showSearch && (
          <div className="aura-search-panel glass-panel">
            <p className="aura-search-label">Find someone by their Aura ID</p>
            <form onSubmit={handleSearch} className="aura-search-form">
              <input
                type="text"
                className="aura-search-input"
                placeholder="e.g. AURA-K7XQ"
                value={searchCode}
                onChange={e => setSearchCode(e.target.value.toUpperCase())}
                maxLength={9}
                autoFocus
              />
              <button type="submit" className="btn-primary aura-search-btn" disabled={searching}>
                {searching ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
              </button>
            </form>

            {searchResult && (
              <div className={`search-result ${searchResult.error ? 'error' : 'found'}`}>
                {searchResult.error ? (
                  <span className="search-result-error">{searchResult.error}</span>
                ) : (
                  <div className="search-result-user" onClick={handleStartChat}>
                    <AvatarCircle name={searchResult.displayName} photo={searchResult.photoURL} size={36} />
                    <div className="search-result-info">
                      <span className="search-result-name">{searchResult.displayName}</span>
                      <span className="search-result-uid">{searchResult.auraUID}</span>
                    </div>
                    <ChevronRight size={18} className="search-result-arrow" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Conversation List ── */}
        <div className="conversation-list">
          {conversations.length === 0 ? (
            <div className="conv-empty">
              <MessageSquare size={36} />
              <p>No conversations yet.</p>
              <p className="conv-empty-hint">Search by AURA-XXXX to start chatting.</p>
            </div>
          ) : conversations.map(conv => {
            const otherU = conv.participants?.find(p => p !== uid);
            const oName = conv.participantNames?.[otherU] || 'Unknown';
            const oPhoto = conv.participantPhotos?.[otherU] || null;
            const oAura = conv.participantAuraUIDs?.[otherU] || '';
            const unread = conv.unreadBy?.[uid] || 0;
            const isActive = conv.id === activeConvoId;

            return (
              <div
                key={conv.id}
                className={`conv-item ${isActive ? 'active' : ''} ${unread > 0 ? 'unread' : ''}`}
                onClick={() => setActiveConvoId(conv.id)}
              >
                <AvatarCircle name={oName} photo={oPhoto} size={42} />
                <div className="conv-item-body">
                  <div className="conv-item-top">
                    <span className="conv-name">{oName}</span>
                    <span className="conv-time">{timeAgo(conv.lastAt?.toMillis?.() || conv.lastAt)}</span>
                  </div>
                  <div className="conv-item-bottom">
                    <span className="conv-preview">{conv.lastMessage || 'Say hello!'}</span>
                    {unread > 0 && <span className="conv-unread-pill">{unread}</span>}
                  </div>
                  <span className="conv-aura-uid">{oAura}</span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── RIGHT: Chat Thread ── */}
      <main className="messages-right">
        {activeConvoId ? (
          <>
            {/* Chat Header */}
            <div className="chat-header glass-panel">
              <button className="chat-back-btn" onClick={() => setActiveConvoId(null)}>
                <ArrowLeft size={18} />
              </button>
              <AvatarCircle name={otherName} photo={otherPhoto} size={38} />
              <div className="chat-header-info">
                <span className="chat-header-name">{otherName}</span>
                <span className="chat-header-uid">{otherAuraUID}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <MessageSquare size={40} />
                  <p>Start the conversation! Say something.</p>
                </div>
              ) : messages.map(msg => {
                const isMe = msg.from === uid;
                return (
                  <div key={msg.id} className={`msg-bubble-wrap ${isMe ? 'me' : 'them'}`}>
                    {!isMe && (
                      <AvatarCircle name={otherName} photo={otherPhoto} size={28} />
                    )}
                    <div className={`msg-bubble ${isMe ? 'me' : 'them'}`}>
                      <span className="msg-text">{msg.text}</span>
                      <span className="msg-time">
                        <Clock size={10} /> {timeAgo(msg.time)}
                        {isMe && <CheckCheck size={12} className="msg-read-tick" />}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Send Input */}
            <form className="chat-input-bar" onSubmit={handleSend}>
              <input
                ref={inputRef}
                type="text"
                className="chat-input"
                placeholder={`Message ${otherName}...`}
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                className="btn-primary chat-send-btn"
                disabled={!messageText.trim() || sending}
              >
                {sending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
              </button>
            </form>
          </>
        ) : (
          <div className="chat-select-state">
            <div className="chat-select-icon">
              <MessageSquare size={56} />
            </div>
            <h3>Your Messages</h3>
            <p>Select a conversation or search for someone by their <strong>AURA-XXXX</strong> code to start chatting.</p>
            <div className="chat-your-uid">
              Your Aura ID: <strong>{currentUser?.auraUID || '—'}</strong>
              <button
                className="copy-uid-btn"
                onClick={() => navigator.clipboard.writeText(currentUser?.auraUID || '')}
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;
