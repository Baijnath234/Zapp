# Zapp 📺 — Android TV Remote Control

A modern, high-performance Android TV remote application featuring a **NestJS** backend and a **React Native (TypeScript)** mobile frontend, crafted to faithfully implement the **Zapp** prototype.

---

## 🛠 Tech Stack

### Backend (`/backend`)
- **Runtime:** Node.js 22+
- **Language:** TypeScript
- **Framework:** [NestJS](https://nestjs.com/) (Modular Architecture)
- **Database:** PostgreSQL (Docker) with [TypeORM](https://typeorm.io/) (`@nestjs/typeorm`, `pg`)
- **Real-Time Communication:** `ws` via NestJS WebSocket Gateway (`@nestjs/platform-ws`)
- **TV Protocol:** [`androidtv-remote`](https://www.npmjs.com/package/androidtv-remote) (Pairing, KeyEvents, App Links, SSL Certificates)
- **Local Network Discovery:** [`bonjour-service`](https://www.npmjs.com/package/bonjour-service) (mDNS/Zeroconf for `_androidtvremote2._tcp`, `_androidtvremote._tcp`, and `_googlecast._tcp`)
- **Persistence:** PostgreSQL container store for paired TVs, SSL certificates, and preferences (with offline fallback).

### Frontend (`/mobile`)
- **Framework:** [React Native](https://reactnative.dev/) (Expo / Cross-Platform iOS, Android & Web)
- **Language:** TypeScript
- **Styling:** Custom theme system implementing the Zapp design specifications (Light and Dark mode)
- **Icons & Graphics:** `react-native-svg` (custom animated Zapp TV frame, stand, transmitter dot, and signal wave arcs)
- **Haptics:** `expo-haptics` with fallback to `navigator.vibrate` on web
- **Safe Area Support:** `react-native-safe-area-context`

---

## 🚀 Project Structure

```
Zapp/
├── backend/                        # NestJS Backend Application
│   ├── src/
│   │   ├── tv/
│   │   │   ├── dto/tv.dto.ts                  # DTOs & state interfaces
│   │   │   ├── storage.service.ts             # Paired TVs & settings persistence
│   │   │   ├── discovery.service.ts           # bonjour-service mDNS scanner
│   │   │   ├── android-remote.adapter.ts      # androidtv-remote adapter & key mappings
│   │   │   ├── tv.service.ts                  # TV coordinator & event stream
│   │   │   ├── tv.gateway.ts                  # 'ws' WebSocket Gateway
│   │   │   ├── tv.controller.ts               # REST API endpoints
│   │   │   └── tv.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts                            # Bootstrap with WsAdapter
│   ├── data/                                  # Persistent storage directory
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/                         # React Native Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ZappLogo.tsx                   # Animated SVG TV logo & radiating signal arcs
│   │   │   ├── TvScreenPreview.tsx            # 16:9 simulated TV screen with live apps & OSD
│   │   │   ├── DPad.tsx                       # Circular 216px directional pad with teal OK
│   │   │   ├── BottomNav.tsx                  # Tab bar with "Remote" & "Connection"
│   │   │   ├── PairModal.tsx                  # 6-character PIN code bottom sheet modal
│   │   │   └── Toast.tsx                      # Floating notification toast
│   │   ├── screens/
│   │   │   ├── WelcomeScreen.tsx              # Halo glow, logo, progress track, "Get started"
│   │   │   ├── ConnectionScreen.tsx           # Status, mDNS scan, IP manual connect, saved TVs, toggles, FAQ
│   │   │   └── RemoteScreen.tsx               # Top chip, TV preview bezel, Power, Source, Mute, D-Pad, 123 pad, Rockers
│   │   ├── hooks/
│   │   │   ├── useTvConnection.ts             # TV connection & WebSocket synchronization
│   │   │   └── useHaptics.ts                  # Tactile vibration feedback
│   │   ├── services/
│   │   │   ├── api.ts                         # REST client
│   │   │   └── socket.ts                      # WebSocket client with auto-reconnect
│   │   ├── theme/
│   │   │   └── colors.ts                      # Zapp Light & Dark color palette
│   │   ├── types/
│   │   │   └── tv.ts
│   │   └── App.tsx                            # Root application entry
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
│
├── package.json                    # Monorepo root scripts
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v22+ (verified on Node.js v24)
- **npm**: v10+

### 2. Start the PostgreSQL Database (Docker)
```bash
docker compose up -d
```
This launches a healthy PostgreSQL container (`zapp-postgres`) on port `5433`.

### 3. Start the Backend Server
```bash
cd backend
npm install
npm run start:dev
```
- REST API: `http://localhost:3000/api/tv`
- WebSocket Server: `ws://localhost:3000/ws`
- PostgreSQL: `localhost:5433/zapp_db`

### 4. Start the Mobile App
```bash
cd mobile
npx expo start -c
```
- Press `w` in the terminal to open the web browser preview.
- Scan the QR code using the **Expo Go** app on your iPhone or Android device.
- Or run `npm run android` / `npm run ios` for native emulators.

---

## 📡 API & WebSocket Reference

### WebSocket Events (`ws://localhost:3000/ws`)
| Event | Direction | Payload | Description |
|---|---|---|---|
| `scan` | Client ➔ Server | `{}` | Trigger mDNS discovery of nearby TVs |
| `discovery_list` | Server ➔ Client | `DiscoveredTv[]` | Discovered TVs on local network |
| `connect` | Client ➔ Server | `{ ip, name?, model? }` | Initiate TV connection |
| `pair_requested` | Server ➔ Client | `{ ip, name, message }` | Prompts client for 6-char PIN code |
| `pair` | Client ➔ Server | `{ code: "1A2B3C" }` | Submit 6-character PIN code |
| `connected` | Server ➔ Client | `TvState` | Connection established |
| `key` | Client ➔ Server | `{ key: "up" \| "ok" \| ... }` | Send D-pad, media, or volume key |
| `power` | Client ➔ Server | `{}` | Toggle TV power |
| `app` | Client ➔ Server | `{ appLink: "url" }` | Launch an application |
| `disconnect` | Client ➔ Server | `{}` | Disconnect from TV |

### REST Endpoints (`http://localhost:3000/api/tv`)
- `GET /status` — Fetch current TV connection & mirror state
- `GET /discover` — Trigger and return discovered Android TVs on the LAN
- `GET /saved` — Return all paired/saved TVs
- `DELETE /saved/:ip` — Forget a saved TV
- `POST /connect` — Connect to a TV by IP
- `POST /pair` — Send 6-char pairing PIN code
- `POST /disconnect` — Disconnect from current TV
- `POST /key` — Send remote key (`{ key, direction }`)
- `POST /power` — Toggle TV power
- `POST /app` — Launch app (`{ appLink }`)
- `GET /settings` & `POST /settings` — Get / update user settings

