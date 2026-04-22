# YouTube Data API v3 Setup Guide

## Free API Key कैसे प्राप्त करें

### Step 1: Google Cloud Console में जाएं
1. https://console.cloud.google.com/ पर जाएं
2. Google account से login करें

### Step 2: नया Project बनाएं
1. Top bar पर project dropdown click करें
2. "New Project" click करें
3. Project name दें (जैसे: "ViralBoost AI")
4. "Create" click करें

### Step 3: YouTube Data API v3 Enable करें
1. Left sidebar से "APIs & Services" > "Library" पर जाएं
2. Search box में "YouTube Data API v3" search करें
3. "YouTube Data API v3" select करें
4. "Enable" button click करें

### Step 4: API Key बनाएं
1. Left sidebar से "APIs & Services" > "Credentials" पर जाएं
2. Top पर "+ CREATE CREDENTIALS" click करें
3. "API key" select करें
4. API key create हो जाएगी
5. (Optional) API key को restrict करें:
   - "Restrict key" click करें
   - "API restrictions" में "Restrict key" select करें
   - "YouTube Data API v3" select करें
   - "Save" click करें

### Step 5: API Key को Project में Add करें
1. Project की root directory में `.env.local` file बनाएं (अगर नहीं है)
2. निम्नलिखित line add करें:

```
YOUTUBE_API_KEY=your_api_key_here
```

3. `your_api_key_here` को अपनी actual API key से replace करें

### Step 6: Server Restart करें
```bash
# Stop the server (Ctrl+C)
npm run dev
```

## API Quota (Free Tier)

- **Daily Quota**: 10,000 units per day
- **Search**: 100 units per request
- **Channel videos**: ~100 units per request
- **मतलब**: आप daily में ~100 channel audits कर सकते हैं (free tier में)

## Important Notes

1. **API Key को कभी भी public repository में commit न करें**
2. `.env.local` file को `.gitignore` में add करें (already added)
3. Production में API key को environment variables में store करें

## Testing

API key setup के बाद:
1. Channel Audit page पर जाएं
2. Channel URL paste करें
3. "Channel Audit करें" click करें
4. Videos automatically fetch होने चाहिए

## Troubleshooting

**अगर API key काम नहीं कर रही:**
1. Check करें कि YouTube Data API v3 enable है
2. API key restrictions check करें
3. Quota exceeded तो नहीं है
4. `.env.local` file में correct API key है या नहीं

**RSS Feed Method (Free Alternative):**
- अगर API key नहीं है, तो RSS feed method automatically use होगा
- यह free है लेकिन कुछ channels के लिए काम नहीं कर सकता
