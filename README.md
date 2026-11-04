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
- **Camera with Wi-Fi:** `expo-camera` (QR TV scanner, barcode pairing & live Wi-Fi camera streaming/casting)
- **Network Discovery:** `expo-network` (real-time Wi-Fi IP detection and device subnet scanner)
- **Persistence:** `@react-native-async-storage/async-storage` (offline-first storage for paired TVs & settings)
- **Input & Navigation:** Dual-mode D-Pad and Touchpad swipe gestures, plus on-screen mobile keyboard for TV searching
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
│   │   │   ├── wol.service.ts                 # Wake-on-LAN UDP magic packet sender
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
│   │   │   ├── RemoteScreen.tsx               # Top chip, TV preview bezel, Power, Source, Mute, D-Pad, 123 pad, Rockers
│   │   │   ├── WifiDevicesScreen.tsx          # Real-time Wi-Fi devices, IP hub & diagnostics
│   │   │   └── CameraWifiScreen.tsx           # Camera scanner for TV QR/Wi-Fi & live video casting to TV
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
- `GET /health` — Cloud orchestrator health check (returns `{ status: 'ok', uptime }`)
- `GET /status` — Fetch current TV connection & mirror state
- `GET /discover` — Trigger and return discovered Android TVs on the LAN
- `GET /network-devices` — Return active devices on Wi-Fi subnet
- `GET /saved` — Return all paired/saved TVs
- `DELETE /saved/:ip` — Forget a saved TV
- `POST /connect` — Connect to a TV by IP
- `POST /pair` — Send 6-char pairing PIN code
- `POST /disconnect` — Disconnect from current TV
- `POST /key` — Send remote key (`{ key, direction }`)
- `POST /power` — Toggle TV power
- `POST /app` — Launch app (`{ appLink }`)
- `GET /settings` & `POST /settings` — Get / update user settings

---

## ☁️ Cloud & Production Deployment

Zapp is built for hybrid production operation:
1. **Cloud Server Hub**: Handles multi-device synchronization, user saved TVs, SSL pairing certs, preferences, camera video relay, and real-time state broadcasts over secure `wss://` and `https://`.
2. **Local Control & LAN Bridge**: Because Android TVs reside on private home subnets (`192.168.x.x`), the mobile phone on the same Wi-Fi executes remote commands and synchronizes state back to the cloud.

### Deploy with Docker & Caddy (VPS / AWS / DigitalOcean)
```bash
# 1. Set your public domain
export DOMAIN=api.zapp.app

# 2. Start backend, postgres, and Caddy with automatic SSL
npm run docker:prod:up
```
Caddy will automatically provision a free Let's Encrypt TLS certificate for `https://api.zapp.app` and `wss://api.zapp.app/ws`.

### 1-Click Cloud Hosting (Railway / Render / Supabase)
- **Railway / Render**: Connect your Git repo; Zapp includes a [`render.yaml`](file:///Users/scatix-dev03/Zapp/render.yaml) blueprint. Set `DATABASE_URL` (with SSL automatically detected) and the server binds to `0.0.0.0` with proxy trust enabled.
- **Health Checks**: Built-in `/health` endpoint responds with 200 OK and uptime for load balancers.
- **Proxy Keepalive**: 25s client-side and 30s server-side heartbeats keep WebSocket connections open 24/7 through AWS ALB, Cloudflare, and Nginx.

