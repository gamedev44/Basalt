# Multiplayer Foundation — Design Reference

> Row-level security, run contexts, RPCs, and reliable multicast for Basalt Engine.

---

## Overview

This document outlines a multiplayer foundation for Basalt: authoritative server/client architecture, run contexts (server, owning client, all clients), Remote Procedure Calls (RPCs), and reliable multicast. The goal is to add these concepts early so multiplayer games can build on them later.

---

## 1. Architecture Model

### Client-Server (Authoritative)

- **Server**: Owns authoritative game state, runs simulation, validates all actions.
- **Clients**: Send inputs, receive state updates, render approximate world.
- **Principle**: Never trust the client for critical data (health, position, damage).

### Why Server Authority

- **Anti-cheat**: Clients cannot forge health, position, or bypass rules.
- **Consistency**: Server is the single source of truth.
- **Security**: Critical logic runs only on server.

---

## 2. Row-Level Security (RLS) — Concept

In databases, RLS restricts which rows a user can access. For games, we adapt this:

### Game-Oriented RLS

- **Ownership**: Each networked entity has an owner (server, or a specific client).
- **Visibility**: Clients see only entities they are allowed to see (e.g. in range, same team).
- **Mutability**: Only the owner (or server) can modify an entity’s authoritative state.

### Implementation Sketch

```javascript
// Conceptual — not literal code
const RLS = {
  canRead(clientId, entity) {
    return entity.visibleTo.includes(clientId) || entity.owner === clientId;
  },
  canWrite(clientId, entity) {
    return entity.owner === clientId || entity.owner === 'server';
  },
};
```

### Host vs Dedicated Server

- **Host = client + server**: One machine runs both. Ownership checks must distinguish “I am the host” vs “I am a player.”
- **Dedicated server**: Server has no player; all entities owned by server or clients.

---

## 3. Run Contexts

### Run on Server

- Logic that must be authoritative: damage, spawn, respawn, match state.
- Only the server executes this code.
- Clients never run it.

```javascript
if (isServer) {
  applyDamage(target, amount);
  broadcastStateUpdate(target);
}
```

### Run Only on Owning Client

- Logic that only the owner should run: local effects, UI feedback, input handling.
- Example: weapon recoil animation, HUD updates for own player.

```javascript
if (isOwningClient) {
  playRecoilAnimation();
  updateCrosshair();
}
```

### Run on All Clients

- Logic that every client runs: rendering, local prediction, non-authoritative effects.
- Example: interpolate other players’ positions, play footstep sounds.

```javascript
// All clients
interpolateRemotePlayerPositions();
renderScene();
```

### Run on Server + Owning Client

- Server: authoritative state change.
- Owning client: immediate feedback (prediction).

```javascript
if (isServer) {
  movePlayer(playerId, newPos);
  broadcastPosition(playerId, newPos);
}
if (isOwningClient) {
  // Optimistic update for responsiveness
  localPlayer.position.copyFrom(newPos);
}
```

### Context Flags (Conceptual)

```javascript
const RunContext = {
  SERVER: 1,
  OWNING_CLIENT: 2,
  ALL_CLIENTS: 4,
  SERVER_AND_OWNER: 3,  // SERVER | OWNING_CLIENT
};
```

---

## 4. Remote Procedure Calls (RPCs)

### Purpose

- Trigger logic on another machine (server → client, client → server).
- Send discrete events (e.g. “fire weapon”, “open door”).

### RPC Types

| Type | Use Case | Reliability |
|------|----------|-------------|
| **Server RPC** | Client → Server | Reliable, ordered |
| **Client RPC** | Server → Client(s) | Reliable or unreliable |
| **Multicast RPC** | Server → All clients | Unreliable for state, reliable for events |

### Example Flow

```
Client A: "I pressed fire"
  → Server RPC: FireWeapon()

Server: validates, applies damage, updates state
  → Client RPC to A: PlayMuzzleFlash()
  → Client RPC to B (hit target): PlayHitEffect()
  → Multicast: BroadcastBulletTrail(start, end)
```

### Implementation Sketch

```javascript
// Conceptual API
rpc.register('FireWeapon', (clientId, targetId) => {
  if (!isServer) return;
  // Validate, apply damage, broadcast
});

rpc.callServer('FireWeapon', targetId);
rpc.callClient(clientId, 'PlayHitEffect', { position, damage });
rpc.multicast('BulletTrail', { start, end });
```

---

## 5. Reliable Multicast

### Problem

- **UDP**: Low latency, no guarantee of delivery or order.
- **TCP**: Reliable, ordered, but head-of-line blocking hurts real-time games.

### Game-Networking Approach

- **State updates**: Unreliable, high frequency (10–60 Hz). Clients use latest; old packets discarded.
- **Events / RPCs**: Reliable when needed. Resend until acked; use sequence numbers for ordering.

### Reliability Levels (RakNet-style)

| Level | Use | Behavior |
|-------|-----|----------|
| **Unreliable** | Position, rotation | No resend, no ack |
| **Unreliable sequenced** | Latest state only | Accept only newest by sequence |
| **Reliable** | Spawn, damage, chat | Resend until acked |
| **Reliable ordered** | Match start, UI events | Resend + deliver in order |

### Multicast Patterns

- **Broadcast**: Server sends to all clients. Use for global events (match start, round end).
- **Multicast (subset)**: Send to specific clients (e.g. same team, same region).
- **Unicast**: One client. Use for owner-specific RPCs.

### Implementation Notes

- Use **sequence numbers** and **ack bits** for efficient acks (see Gaffer on Games).
- Pack multiple messages per packet; resend unacked reliable messages in subsequent packets.
- Prefer UDP with custom reliability; avoid TCP for real-time state.

---

## 6. Integration with Basalt

### Early Hooks

1. **Run context checks**: Add `isServer`, `isClient`, `isOwningClient` (or similar) early. Initially all `true` for single-player; later wired to network layer.
2. **RPC stub**: Define `rpc.callServer`, `rpc.callClient`, `rpc.multicast` as no-ops or local-only; replace with real networking later.
3. **Ownership**: Add `ownerId` (or `owner`) to entities that will be networked. Default to `'local'` or `null` for single-player.

### Module Structure (Proposed)

```
Engine/Modules/Net/
  run-context.js    # isServer, isClient, isOwningClient
  rpc.js            # RPC registry and call stubs
  ownership.js      # Entity ownership, RLS checks
  (future) transport.js  # WebSocket/WebRTC, packet handling
```

### Single-Player Fallback

- `isServer = true`, `isClient = true` (or both when host).
- RPCs execute locally.
- No network traffic.

---

## 7. Movement Replication (Shooter-Style)

Movement is designed for client-side prediction and server reconciliation. Both client and server run identical movement code driven by input; the server is authoritative.

### What to Replicate

| Data | Replicate? | Reliability | Notes |
|------|------------|-------------|-------|
| **Position** | Yes (simulated proxies) | Unreliable | Latest only; interpolate on clients |
| **Velocity** (x, y, z) | Yes | Unreliable | Needed for smooth interpolation and prediction |
| **Movement mode** (walking/falling) | Yes | Unreliable | Affects animation and physics behavior |
| **Jump state** | Yes (event) | Reliable | Discrete event; sync jump initiation |
| **Input commands** | Client → Server | Reliable | Server simulates from input, not position |

### Client-Side Prediction (Owning Client)

- Client predicts movement locally from input.
- Server receives input, runs same movement logic, validates.
- If server disagrees, it sends correction; client reconciles (replay from corrected state).
- Send **input** (WASD, jump, look) to server, not predicted position.

### Simulated Proxies (Other Players)

- Receive position, velocity, movement mode from server.
- Interpolate between updates for smooth display.
- Use velocity for extrapolation when updates are delayed.

### Basalt Movement State API

```javascript
// movement.getState() — for replication
{
  position: Vector3,
  velocity: Vector3,   // full 3D (horizontal + vertical)
  isGrounded: boolean,
  movementMode: 0 | 1, // MovementMode.WALKING | FALLING
  jumpCount: number
}
```

### References (Shooters / UE)

- UE Character Movement: replicates velocity, movement mode, jump state.
- Gabriel Gambetta: client sends input; server simulates; corrections when divergent.
- Gaffer on Games: fixed timestep for deterministic simulation.

---

## 8. Implementation Phases

| Phase | Task | Notes |
|-------|------|-------|
| 1 | Run context module | `isServer`, `isClient`, `isOwningClient` flags |
| 2 | RPC stub | Register/call API, local execution only |
| 3 | Ownership on entities | `ownerId` field, RLS helpers |
| 4 | Transport (future) | WebSocket or WebRTC, packet format |
| 5 | Reliable messaging | Sequence numbers, acks, resend |
| 6 | Full integration | Wire RPCs to transport, run contexts to host/client |

---

## 9. References

- [Client-Server Game Architecture](https://www.gabrielgambetta.com/client-server-game-architecture.html) — Gabriel Gambetta
- [Reliability and Ordering over UDP](https://gafferongames.com/post/reliability_ordering_and_congestion_avoidance_over_udp/) — Gaffer on Games
- [Unity Netcode Ownership](https://docs.unity3d.com/Packages/com.unity.netcode.gameobjects@2.6/manual/terms-concepts/ownership.html)
- [Unreal Networking Overview](https://docs.unrealengine.com/4.27/en-US/InteractiveExperiences/Networking/Overview/)
- [RakNet Reliability Types](https://www.jenkinssoftware.com/raknet/manual/reliabilitytypes.html)

---

*Basalt Engine — Multiplayer Foundation Design*
