# Audio Converter Service

Microservice to convert OGG/Opus audio to WAV format for OpenAI Whisper API compatibility.

## Purpose

Twilio WhatsApp sends voice messages as OGG files with Opus codec, which OpenAI Whisper doesn't support. This service converts them to WAV format.

## Requirements

- Node.js 18+
- FFmpeg installed on the system

## Installation on Hostinger VPS

### 1. Connect to Your VPS

```bash
ssh your-username@your-vps-ip
```

### 2. Install Node.js (if not installed)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Install FFmpeg

```bash
sudo apt update
sudo apt install -y ffmpeg
```

Verify installation:
```bash
ffmpeg -version
```

### 4. Clone and Setup

```bash
# Create directory for the service
mkdir -p ~/audio-converter-service
cd ~/audio-converter-service

# Upload these files to your VPS:
# - package.json
# - server.js
# - .env

# Install dependencies
npm install
```

### 5. Configure Environment

```bash
cp .env.example .env
nano .env
```

Set your production origins:
```
PORT=3001
ALLOWED_ORIGINS=https://janet-ego.vercel.app
```

### 6. Test Locally

```bash
npm start
```

Test the health endpoint:
```bash
curl http://localhost:3001/health
```

### 7. Setup as System Service (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the service
pm2 start server.js --name audio-converter

# Set to start on boot
pm2 startup
pm2 save
```

### 8. Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/audio-converter
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name audio.yourdomain.com;  # Replace with your subdomain

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Increase timeouts for audio processing
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Increase body size for audio files (16MB)
        client_max_body_size 16M;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/audio-converter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d audio.yourdomain.com
```

## API Usage

### Convert Audio

**Endpoint:** `POST /convert`

**Request:**
- Content-Type: `multipart/form-data`
- Field: `audio` (file)

**Response:**
- Content-Type: `audio/wav`
- Body: WAV audio data

**Example with curl:**
```bash
curl -X POST \
  -F "audio=@voice-message.ogg" \
  http://audio.yourdomain.com/convert \
  --output converted.wav
```

**Example with Node.js:**
```javascript
const FormData = require('form-data');
const form = new FormData();
form.append('audio', audioBuffer, {
  filename: 'audio.ogg',
  contentType: 'audio/ogg',
});

const response = await fetch('http://audio.yourdomain.com/convert', {
  method: 'POST',
  body: form,
});

const wavBuffer = Buffer.from(await response.arrayBuffer());
```

## Monitoring

```bash
# View logs
pm2 logs audio-converter

# Check status
pm2 status

# Restart service
pm2 restart audio-converter
```

## Troubleshooting

**FFmpeg not found:**
```bash
which ffmpeg
# If not found, install: sudo apt install ffmpeg
```

**Permission denied:**
```bash
sudo chown -R $USER:$USER ~/audio-converter-service
```

**Port already in use:**
```bash
# Check what's using the port
sudo lsof -i :3001
# Change PORT in .env file
```
