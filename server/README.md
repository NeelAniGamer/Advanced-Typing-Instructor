# 🌐 ATI 2.5 Standalone Multiplayer Server Guide

This standalone server allows your **Advanced Typing Instructor (ATI v2.5)** desktop and web players to race each other in real-time across the internet!

---

## ⚡ Option 1: Free Cloud Hosting (Render / Railway / Fly.io)

### Deploying to Render.com (Free)
1. Push this `server/` folder or the repository to GitHub.
2. Go to [https://render.com](https://render.com) and click **New → Web Service**.
3. Connect your repository.
4. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click **Create Web Service**.
6. Render will give you a public URL, e.g.:
   `https://my-typing-game.onrender.com`
7. In ATI 2.5 Multiplayer screen, enter:
   `wss://my-typing-game.onrender.com`

---

## 🚀 Option 2: Hosting on your VPS / Custom Domain

If you have your own website or Linux VPS (Ubuntu/Debian):

1. Copy the `server/` folder to your server:
   ```bash
   cd server
   npm install
   ```

2. Run it with PM2 (process manager):
   ```bash
   npm install -g pm2
   pm2 start multiplayer_server.js --name "ati-multiplayer"
   pm2 save
   ```

3. NGINX Reverse Proxy configuration (for `wss://yourdomain.com/ws`):
   ```nginx
   location /ws {
       proxy_pass http://127.0.0.1:8765;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "Upgrade";
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```

---

## 🎮 Option 3: Connecting in the App

In the ATI 2.5 **Multiplayer Circuit** screen:
1. Click the **Server Settings (⚙️)** button in the top right.
2. Enter your server URL (e.g. `wss://yourdomain.com` or `https://my-typing-game.onrender.com`).
3. Click **Connect to My Server**.
4. The status badge will turn neon green (`CONNECTED TO SERVER`).
5. All players using your server URL will now be able to join the same lobbies and race together in real-time!
