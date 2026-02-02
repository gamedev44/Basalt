/**
 * Basalt Collab Editor — Pointer Overlay
 * React + Firebase real-time presence, chat, DMs, video mode
 * Config: __firebase_config, __app_id, __initial_auth_token
 * See docs/collab/COLLAB_EDITOR_REFERENCE.md
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Settings, MessageSquare, Video, VideoOff, Mic, MicOff, EyeOff, Palette, Reply, AtSign, Bell, XCircle, Lock, Check } from 'lucide-react';

// --- CONFIGURATION ---
const CURSOR_SCALE = 1.25; 
const SHOW_SELF_IN_SUGGESTIONS = true; 

// --- Firebase Configuration — inject __firebase_config (JSON string), __app_id before render; adapt if using non-Firebase ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'basalt-collab-v5';

const COLORS = [
  '#FF5F5F', '#5FFF7D', '#5F9FFF', '#FFD45F', '#FF5FE2', 
  '#5FFFE9', '#CE5FFF', '#FFAD5F', '#B1FF5F', '#5F69FF'
];

const FONTS = [
  { name: 'Normal', family: "'Inter', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap' },
  { name: 'Cursive', family: "'Dancing Script', cursive", url: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap' },
  { name: 'Bubble', family: "'Modak', system-ui", url: 'https://fonts.googleapis.com/css2?family=Modak&display=swap' }
];

const HOST_COLOR = 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)';

const CursorArrow = ({ color }) => (
  <svg 
    width="32" 
    height="32" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path 
      d="M5.65376 4.31598C4.85643 3.96161 4.04573 4.77231 4.4001 5.56963L9.5985 17.2661C9.9754 18.1141 11.1508 18.1141 11.5277 17.2661L13.1213 13.6803C13.2239 13.4498 13.4097 13.2639 13.6402 13.1614L17.226 11.5678C18.0739 11.1909 18.0739 10.0155 17.226 9.63858L5.65376 4.31598Z" 
      fill={color?.includes?.('gradient') ? 'url(#hostGradient)' : color}
      stroke="white" 
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="hostGradient" x1="4" y1="4" x2="18" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a855f7" />
        <stop offset="1" stopColor="#6366f1" />
      </linearGradient>
    </defs>
  </svg>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [presence, setPresence] = useState({});
  const [chatBubbles, setChatBubbles] = useState([]);
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, mode: 'context', replyTo: null });
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [activeDM, setActiveDM] = useState(null); 
  
  const [localSettings, setLocalSettings] = useState({
    nickname: `User_${Math.floor(Math.random() * 1000)}`,
    isHidden: false,
    videoMode: false,
    isMuted: false,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    lastX: 0,
    lastY: 0,
    chatBgColor: '#FFFFFF',
    chatTextColor: '#000000',
    nameTextColor: '#FFFFFF',
    plateColor: '', 
    chatFontFamily: FONTS[0].family
  });
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const chatInputRef = useRef(null);

  const playPingSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio play blocked");
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const presenceRef = collection(db, 'artifacts', appId, 'public', 'data', 'presence');
    const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
      const data = {};
      snapshot.forEach(doc => {
        data[doc.id] = { ...doc.data(), id: doc.id };
      });
      setPresence(data);
    }, (err) => console.error(err));

    const cleanup = () => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'presence', user.uid));
    window.addEventListener('beforeunload', cleanup);
    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, [user]);

  useEffect(() => {
    if (localSettings.videoMode) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          audioContextRef.current = audioContext;
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudio = () => {
            if (!localSettings.videoMode) return;
            analyser.getByteFrequencyData(dataArray);
            setAudioLevel(dataArray.reduce((a, b) => a + b) / dataArray.length);
            requestAnimationFrame(updateAudio);
          };
          updateAudio();
        }).catch(console.error);
    } else if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, [localSettings.videoMode]);

  const handleMouseMove = useCallback((e) => {
    if (!user || localSettings.isHidden) return;
    const userDoc = doc(db, 'artifacts', appId, 'public', 'data', 'presence', user.uid);
    setDoc(userDoc, {
      x: e.clientX,
      y: e.clientY,
      nickname: localSettings.nickname,
      color: localSettings.color,
      videoMode: localSettings.videoMode,
      isMuted: localSettings.isMuted,
      audioLevel: localSettings.videoMode ? audioLevel : 0,
      lastActive: serverTimestamp(),
      chatBgColor: localSettings.chatBgColor,
      chatTextColor: localSettings.chatTextColor,
      nameTextColor: localSettings.nameTextColor,
      plateColor: localSettings.plateColor,
      chatFontFamily: localSettings.chatFontFamily
    }, { merge: true });
  }, [user, localSettings, audioLevel]);

  const handleChatSubmit = () => {
    if (!chatInput.trim() || !user) return;
    const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats');
    const docId = String(Date.now() + Math.random());
    
    if (chatInput.trim() === '/close' || chatInput.trim() === '@closePM') {
      setActiveDM(null);
      setChatInput("");
      return;
    }

    const payload = {
      id: docId,
      text: chatInput,
      owner: user.uid,
      timestamp: Date.now(),
      replyTo: menu.replyTo || null,
      mention: activeDM ? activeDM.nickname : (chatInput.match(/@([^\s]+)/)?.[1] || null),
      targetId: activeDM ? activeDM.userId : null,
      isPrivate: !!activeDM
    };
    
    setDoc(doc(chatRef, docId), payload);
    setChatInput("");
    setMenu({ ...menu, visible: false, replyTo: null });
  };

  useEffect(() => {
    if (!user) return;
    const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats');
    
    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === "added") {
          const chat = change.doc.data();
          if (chat.mention === localSettings.nickname && chat.owner !== user.uid) {
             const age = Date.now() - chat.timestamp;
             if (age < 2000) playPingSound();
          }
        }
      });
      
      const activeChats = [];
      snapshot.forEach(doc => {
        const chat = doc.data();
        const isGlobal = !chat.isPrivate;
        const involvesMe = chat.owner === user.uid || chat.targetId === user.uid || chat.mention === localSettings.nickname;
        
        if (isGlobal || involvesMe) {
          activeChats.push(chat);
        }
      });
      setChatBubbles(activeChats.sort((a, b) => a.timestamp - b.timestamp));
    }, (err) => console.error(err));

    return () => unsubscribe();
  }, [user, localSettings.nickname, playPingSound]);

  const handleInputChange = (val) => {
    setChatInput(val);
    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1 && lastAt >= val.lastIndexOf(' ')) {
      setMentionQuery(val.substring(lastAt + 1));
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (p) => {
    const lastAt = chatInput.lastIndexOf('@');
    const newValue = chatInput.substring(0, lastAt) + `@${p.nickname} `;
    setChatInput(newValue);
    setMentionQuery(null);
    setActiveDM({ userId: p.id, nickname: p.nickname });
    
    setTimeout(() => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
        chatInputRef.current.setSelectionRange(newValue.length, newValue.length);
      }
    }, 0);
  };

  const filteredPresence = useMemo(() => {
    return Object.values(presence)
      .filter(p => SHOW_SELF_IN_SUGGESTIONS || p.id !== user?.uid)
      .filter(p => !mentionQuery || p.nickname.toLowerCase().includes(mentionQuery.toLowerCase()));
  }, [presence, mentionQuery, user?.uid]);

  const Cursor = ({ id, data, isLocal = false }) => {
    const isHost = id === 'host';
    const indicatorColor = isHost ? HOST_COLOR : data.color;
    const plateBackground = data.plateColor || indicatorColor;
    const speaking = data.audioLevel > 15;

    return (
      <div 
        className="fixed pointer-events-none transition-all duration-75 z-[99999] flex flex-col items-start"
        style={{ left: data.x, top: data.y }}
      >
        <div 
          className="relative flex flex-col items-start"
          style={{ transform: `scale(${CURSOR_SCALE})`, transformOrigin: 'top left' }}
        >
          <div className="absolute bottom-full left-0 mb-4 flex flex-col gap-2 min-w-max">
            {chatBubbles.map((chat) => {
              const isOwner = chat.owner === id;
              const isPingForMe = isLocal && (chat.targetId === user?.uid || chat.mention === localSettings.nickname) && chat.owner !== id;
              
              if (!isOwner && !isPingForMe) return null;

              const charCount = chat.text.replace(/\s/g, '').length;
              const duration = Math.max(5000, (charCount / 5) * 6000);
              const age = Date.now() - chat.timestamp;
              if (age > duration) return null;

              const isDM = chat.isPrivate || chat.mention;

              return (
                <div 
                  key={chat.id} 
                  className={`group pointer-events-auto px-3 py-1.5 rounded-2xl shadow-xl text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-300 w-fit flex flex-col gap-1 relative ${isDM ? 'border-2 border-cyan-400/40' : 'border-2 border-slate-800'}`}
                  style={{ 
                    animation: `bounce 2s infinite, fadeOut 0.5s forwards ${duration - 500}ms`,
                    backgroundColor: isDM ? 'rgba(34, 211, 238, 0.12)' : (data.chatBgColor || '#FFFFFF'),
                    color: isDM ? '#22d3ee' : (data.chatTextColor || '#000000'),
                    backdropFilter: isDM ? 'blur(12px)' : 'none',
                    fontFamily: data.chatFontFamily || 'sans-serif',
                    borderLeft: isDM ? '4px solid #22d3ee' : `4px solid ${data.color}`,
                    boxShadow: isDM ? '0 8px 32px rgba(34, 211, 238, 0.25), inset 0 0 10px rgba(34, 211, 238, 0.1)' : 'none'
                  }}
                >
                  {isDM && (
                    <div className="flex items-center gap-1 mb-0.5 text-[8px] font-black uppercase tracking-tighter text-cyan-400/80">
                      {chat.isPrivate ? <Lock size={8} /> : <Bell size={8} />} 
                      {chat.isPrivate ? `PRIVATE TO ${chat.mention}` : `PINGED @${chat.mention}`}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span>{chat.text}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenu({ visible: true, x: data.x, y: data.y, mode: 'chat', replyTo: chat.id });
                        const sender = presence[chat.owner];
                        if (sender) setActiveDM({ userId: chat.owner, nickname: sender.nickname });
                        setChatInput(`@${sender?.nickname || 'user'} `);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 rounded transition-all"
                    >
                      <Reply size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-start">
            <div className="shrink-0">
                <CursorArrow color={indicatorColor} />
            </div>

            <div className="ml-4 mt-4 flex items-center">
              {data.videoMode ? (
                <div 
                  className={`w-14 h-14 rounded-full border-4 overflow-hidden transition-all duration-150 ${speaking ? 'scale-110 shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'shadow-lg'}`}
                  style={{ borderColor: speaking ? '#a855f7' : (isHost ? '#6366f1' : data.color) }}
                >
                  {isLocal ? (
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <Video className="text-white w-4 h-4 opacity-50" />
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className="relative px-3 py-1.5 rounded-full border border-white/20 shadow-2xl font-bold flex items-center gap-2 backdrop-blur-md overflow-hidden"
                  style={{ 
                    background: plateBackground,
                    boxShadow: `0 4px 15px -3px ${isHost ? '#a855f766' : (data.plateColor || data.color) + '66'}`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                  <span 
                    className="text-[11px] drop-shadow-sm whitespace-nowrap"
                    style={{ color: data.nameTextColor || '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
                  >
                    {data.nickname} {isHost && '👑'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 overflow-hidden select-none bg-slate-950 text-white font-sans cursor-none"
      onMouseMove={(e) => {
        handleMouseMove(e);
        setLocalSettings(prev => ({ ...prev, lastX: e.clientX, lastY: e.clientY }));
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        if (e.shiftKey) {
          setMenu({ visible: true, x: e.clientX - 24, y: e.clientY - 24, mode: 'context', replyTo: null });
        }
      }}
      onClick={() => {
        setMenu({ ...menu, visible: false });
        setMentionQuery(null);
      }}
    >
      {FONTS.map(f => (
        <link key={f.name} rel="stylesheet" href={f.url} />
      ))}

      <style>{`
        * { cursor: none !important; }
        @keyframes fadeOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        body, html, #root { cursor: none !important; overflow: hidden; }
        button, input, a, select, textarea, [role="button"], svg, path { cursor: none !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>

      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-20">
        <h1 className="text-5xl font-black mb-4 tracking-tighter">Basalt Engine</h1>
        <p className="max-w-md text-slate-400">Left Shift + Right-click for Menu • Type @ to DM<br/>Private messages are cyan-tinted glass</p>
      </div>

      <div className="pointer-events-none fixed inset-0 z-[99999]">
        {!localSettings.isHidden && user && (
          <Cursor 
            id={user.uid} 
            data={{ 
              x: localSettings.lastX, y: localSettings.lastY, nickname: localSettings.nickname, 
              color: localSettings.color, videoMode: localSettings.videoMode, audioLevel: audioLevel,
              chatBgColor: localSettings.chatBgColor, chatTextColor: localSettings.chatTextColor,
              nameTextColor: localSettings.nameTextColor, plateColor: localSettings.plateColor,
              chatFontFamily: localSettings.chatFontFamily
            }} 
            isLocal 
          />
        )}
        {Object.entries(presence).filter(([id]) => id !== user?.uid).map(([id, data]) => (
          <Cursor key={id} id={id} data={data} />
        ))}
      </div>

      {menu.visible && (
        <div 
          className="fixed z-[9000] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-1.5 w-72 animate-in fade-in zoom-in-95 duration-100"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {menu.mode === 'context' ? (
            <>
              <button onClick={() => setMenu({ ...menu, mode: 'chat' })} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-xl text-sm transition-colors group font-bold">
                <MessageSquare size={18} className="text-slate-400 group-hover:text-white transition-colors" /> Send Message
              </button>
              <button 
                onClick={() => { setLocalSettings(p => ({ ...p, isHidden: !p.isHidden })); setMenu({ ...menu, visible: false }); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-xl text-sm transition-colors text-yellow-400 font-bold"
              >
                <EyeOff size={18} /> {localSettings.isHidden ? 'Show Mouse' : 'Hide Mouse'}
              </button>
              <div className="h-px bg-slate-700/50 my-1.5 mx-2" />
              {localSettings.videoMode ? (
                <>
                  <button onClick={() => setLocalSettings(p => ({ ...p, isMuted: !p.isMuted }))} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-xl text-sm transition-colors font-bold">
                    {localSettings.isMuted ? <MicOff size={18} /> : <Mic size={18} />} {localSettings.isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button onClick={() => setLocalSettings(p => ({ ...p, videoMode: false }))} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/20 text-red-400 rounded-xl text-sm transition-colors font-bold">
                    <VideoOff size={18} /> Stop Stream
                  </button>
                </>
              ) : (
                <button onClick={() => setLocalSettings(p => ({ ...p, videoMode: true }))} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-purple-500/20 text-purple-400 rounded-xl text-sm transition-colors font-bold">
                  <Video size={18} /> Start Stream
                </button>
              )}
              <button onClick={() => setOptionsOpen(true)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-xl text-sm transition-colors group font-bold">
                <Settings size={18} className="text-slate-400 group-hover:text-white transition-colors" /> Options
              </button>
            </>
          ) : (
            <div className="p-3 relative">
              {mentionQuery !== null && (
                <div className="absolute bottom-full left-0 w-full bg-slate-900/95 backdrop-blur-2xl border-2 border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] mb-3 overflow-hidden rounded-2xl animate-in slide-in-from-bottom-2 duration-200 z-[9999]">
                  <div className="px-3 py-2 bg-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 flex justify-between items-center">
                    <span>Active Collaborators</span>
                    {mentionQuery && <span className="text-purple-400">Filtering: {mentionQuery}</span>}
                  </div>
                  <div className="max-h-56 overflow-y-auto custom-scrollbar">
                    {filteredPresence.map(p => (
                      <button
                        key={p.id}
                        onClick={(e) => { e.stopPropagation(); insertMention(p); }}
                        className="w-full px-4 py-3 text-left hover:bg-purple-500/20 flex items-center gap-3 transition-colors group"
                      >
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full border-2 border-white/10 flex items-center justify-center text-xs font-black" style={{ background: p.color, color: 'white' }}>
                            {p.nickname.substring(0, 1).toUpperCase()}
                          </div>
                          {p.id === user?.uid && (
                            <div className="absolute -top-1 -right-1 bg-yellow-400 text-[8px] text-black px-1 rounded font-black border border-black/20">ME</div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-sm text-white group-hover:text-purple-300">{p.nickname}</span>
                          <span className="text-[10px] text-slate-500 font-bold">Click or Enter to Select</span>
                        </div>
                        {activeDM?.userId === p.id && <Check className="ml-auto text-cyan-400" size={16} />}
                      </button>
                    ))}
                    {filteredPresence.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-500 font-bold italic">No matching users found</div>
                    )}
                  </div>
                </div>
              )}
              
              {activeDM && (
                <div className="flex items-center justify-between px-3 py-2.5 mb-3 bg-cyan-500/10 border-2 border-cyan-500/30 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                  <span className="text-xs text-cyan-400 font-black uppercase tracking-wider flex items-center gap-2">
                    <Lock size={14} /> DM: {activeDM.nickname}
                  </span>
                  <button onClick={() => setActiveDM(null)} className="text-cyan-400 hover:text-cyan-200 p-2 hover:bg-cyan-500/20 rounded-lg transition-all">
                    <XCircle size={22} strokeWidth={3} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 bg-slate-800 border-2 border-slate-700 rounded-xl px-2 focus-within:border-purple-500 transition-all shadow-inner">
                <input 
                  ref={chatInputRef}
                  autoFocus 
                  value={chatInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={activeDM ? "Private message..." : "Type or @..."} 
                  className="w-full bg-transparent px-2 py-4 text-sm font-bold focus:outline-none placeholder:opacity-30"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (mentionQuery !== null && filteredPresence.length > 0) {
                        e.preventDefault();
                        insertMention(filteredPresence[0]);
                      } else {
                        handleChatSubmit();
                      }
                    }
                    if (e.key === 'Escape') {
                      if (activeDM) setActiveDM(null);
                      else setMenu({ ...menu, visible: false, replyTo: null });
                    }
                  }}
                />
                <AtSign size={16} className={activeDM || mentionQuery !== null ? "text-cyan-400 animate-pulse" : "opacity-20"} />
              </div>
              <div className="mt-2 px-1 text-[10px] text-slate-500 font-bold uppercase tracking-tighter flex justify-between">
                <span>{activeDM ? "Private Mode" : "Global Mode"}</span>
                <span className="text-slate-400 italic">ESC to exit</span>
              </div>
            </div>
          )}
        </div>
      )}

      {optionsOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><Settings /> Pointer Settings</h2>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nickname</label>
                  <input 
                    value={localSettings.nickname}
                    onChange={(e) => setLocalSettings(p => ({ ...p, nickname: e.target.value }))}
                    className="w-full bg-slate-800 border-2 rounded-2xl px-5 py-3 focus:outline-none transition-all font-black text-lg"
                    style={{ borderColor: localSettings.color + '44', color: localSettings.color }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Indicator Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => (
                      <button 
                        key={c}
                        onClick={() => setLocalSettings(p => ({ ...p, color: c }))}
                        className={`w-9 h-9 rounded-full border-2 transition-all ${localSettings.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-800/50 rounded-2xl border border-white/5 space-y-6">
                <h3 className="text-sm font-black text-slate-300 flex items-center gap-2 uppercase tracking-widest"><Palette size={16} /> Visual Styles</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Chat Bg</label>
                    <input type="color" className="w-full h-12 bg-transparent rounded-lg" value={localSettings.chatBgColor} onChange={(e) => setLocalSettings(p => ({ ...p, chatBgColor: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Chat Text</label>
                    <input type="color" className="w-full h-12 bg-transparent rounded-lg" value={localSettings.chatTextColor} onChange={(e) => setLocalSettings(p => ({ ...p, chatTextColor: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Plate Bg</label>
                    <input type="color" className="w-full h-12 bg-transparent rounded-lg" value={localSettings.plateColor || localSettings.color} onChange={(e) => setLocalSettings(p => ({ ...p, plateColor: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Plate Text</label>
                    <input type="color" className="w-full h-12 bg-transparent rounded-lg" value={localSettings.nameTextColor} onChange={(e) => setLocalSettings(p => ({ ...p, nameTextColor: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block">Font Choice</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {FONTS.map(f => (
                      <button
                        key={f.name}
                        onClick={() => setLocalSettings(p => ({ ...p, chatFontFamily: f.family }))}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold ${localSettings.chatFontFamily === f.family ? 'bg-white text-black border-white' : 'bg-slate-800 border-white/10 hover:border-white/30 text-slate-400'}`}
                        style={{ fontFamily: f.family }}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setOptionsOpen(false)} className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all active:scale-95 shadow-xl">Save & Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
