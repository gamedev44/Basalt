# Collab Editor — Pointer Overlay Reference

React + Firebase real-time collaboration overlay for Basalt Editor — pointer presence, chat, DMs, video mode.

---

## Overview

| Feature | Description |
|---------|-------------|
| **Pointer Presence** | Real-time x, y, nickname, color via Firestore |
| **Global Chat** | Public messages, @mentions |
| **DM / Private Chat** | `@nickname` or target; cyan-tinted; `/close` or `@closePM` to exit |
| **Video Mode** | Webcam + audio level (speaking indicator) |
| **Context Menu** | Shift + Right-click |
| **Customizable** | Nickname, colors, chat bg/text, plate, fonts |

---

## Configuration

Inject before render:

```javascript
// Required
window.__firebase_config = JSON.stringify({
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
});

// Optional
window.__app_id = 'basalt-collab-v5';  // Firestore path: artifacts/{appId}/public/data/...
window.__initial_auth_token = '...';   // Custom token instead of anonymous auth
```

---

## Firestore Structure

```
artifacts/{appId}/public/data/
├── presence/{userId}   # { x, y, nickname, color, videoMode, isMuted, audioLevel, ... }
└── chats/{docId}      # { id, text, owner, timestamp, replyTo, mention, targetId, isPrivate }
```

---

## Dependencies

- `firebase` (app, auth, firestore)
- `react`
- `lucide-react` (icons)

---

## Key Patterns

| Pattern | Implementation |
|---------|----------------|
| **Presence** | `onSnapshot(collection(presenceRef))` → `setDoc` on `mousemove` |
| **Chat** | `onSnapshot(collection(chatsRef))` → filter global vs DM |
| **Mention** | `@` triggers `mentionQuery`; `filteredPresence` for suggestions |
| **DM** | `activeDM` state; `targetId` in payload; cyan styling |
| **Ping** | `playPingSound()` when `chat.mention === nickname` and `age < 2000` |
| **Cleanup** | `deleteDoc(presence/{uid})` on `beforeunload` |

---

## UI Shortcuts

| Action | Shortcut |
|--------|----------|
| Context menu | Shift + Right-click |
| Mention | Type `@` in chat |
| Close DM | `/close` or `@closePM` |
| Select mention | Enter when suggestions visible |
| Exit | Escape |

---

## Basalt Usage

1. **Overlay** — Render as fixed overlay above viewport/code panels
2. **Config** — Inject `__firebase_config` from Basalt project settings
3. **App ID** — Per-project or global; `__app_id` from project
4. **Host** — Optional `id === 'host'` for special styling (gradient pointer)
