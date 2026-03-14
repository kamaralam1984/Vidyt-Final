# Vid YT - AI-Powered Video Analysis Platform

A complete Next.js fullstack SaaS platform that helps creators analyze and optimize social media videos to predict their viral potential.

## Features

- **Video Upload & YouTube Import**: Upload video files or paste YouTube links
- **AI Video Hook Analyzer**: Analyzes the first 3 seconds for faces, motion, scene changes, and brightness
- **Thumbnail Analyzer**: Detects faces, emotions, color contrast, and text readability
- **Title Optimizer**: Uses NLP to analyze titles and generate 5 optimized viral titles
- **Viral Prediction Engine**: Calculates viral probability based on multiple factors
- **Trending Topic Engine**: Detects trending keywords and viral hashtags
- **Hashtag Generator**: Generates 20 optimized hashtags based on content
- **Best Posting Time Predictor**: Recommends optimal posting times with heatmap visualization
- **Modern Dashboard**: Beautiful UI with Framer Motion animations, charts, and interactive elements

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Frontend**: React, TailwindCSS, Framer Motion, Recharts
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **AI Tools**: 
  - Sharp (Image/Video Processing)
  - Natural (NLP)
  - Compromise (Text Analysis)
  - ytdl-core (YouTube Integration)

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kamaralam1984/vidyt.git
cd vidyt
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/vidyt
```

4. Start MongoDB (if running locally):
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or using MongoDB installed locally
mongod
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
/
├── app/
│   ├── api/              # Next.js API routes
│   │   ├── videos/       # Video upload and YouTube import
│   │   ├── trending/     # Trending topics API
│   │   └── posting-time/ # Posting time predictions
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main dashboard page
├── components/           # React components
│   ├── Dashboard.tsx
│   ├── VideoUpload.tsx
│   ├── ViralScoreMeter.tsx
│   ├── Sidebar.tsx
│   └── ...
├── lib/
│   └── mongodb.ts        # MongoDB connection
├── models/               # Mongoose models
│   ├── Video.ts
│   ├── Analysis.ts
│   └── User.ts
├── services/             # Business logic services
│   ├── youtube.ts
│   ├── hookAnalyzer.ts
│   ├── thumbnailAnalyzer.ts
│   ├── titleOptimizer.ts
│   ├── viralPredictor.ts
│   ├── trendingEngine.ts
│   ├── hashtagGenerator.ts
│   └── postingTimePredictor.ts
└── utils/                # Utility functions
```

## API Endpoints

### POST `/api/videos/upload`
Upload a video file for analysis.

**Body**: FormData with `video` file, `title`, `description`, `userId`

### POST `/api/videos/youtube`
Import and analyze a YouTube video.

**Body**: JSON with `youtubeUrl`, `userId`

### GET `/api/videos`
Get all videos for a user.

**Query**: `userId`

### GET `/api/videos/[id]`
Get a specific video with its analysis.

### GET `/api/trending`
Get trending topics.

**Query**: `keywords` (comma-separated)

### GET `/api/posting-time`
Get posting time heatmap data.

**Query**: `category` (optional)

## Usage

1. **Upload a Video**: 
   - Click "Upload Video" tab
   - Drag and drop a video file or click to browse
   - Wait for analysis to complete

2. **Import YouTube Video**:
   - Click "YouTube Link" tab
   - Paste a YouTube URL
   - Click "Analyze"

3. **View Results**:
   - Viral Probability Score
   - Hook, Thumbnail, and Title scores
   - Optimized title suggestions
   - Hashtag recommendations
   - Trending topics
   - Best posting time with heatmap
   - Engagement prediction graph

## Features in Detail

### AI Video Hook Analyzer
Analyzes the first 3 seconds of video to detect:
- Faces detected
- Motion intensity
- Scene changes
- Brightness levels
- Generates a Hook Score (0-100)

### Thumbnail Analyzer
Analyzes thumbnail images for:
- Face detection
- Emotion recognition
- Color contrast
- Text readability
- Provides improvement suggestions

### Title Optimizer
Uses NLP to:
- Extract keywords
- Detect emotional triggers
- Analyze title length
- Calculate click potential
- Generate 5 optimized titles

### Viral Prediction Engine
Calculates viral probability based on:
- Hook Score (25%)
- Thumbnail Score (25%)
- Title Score (20%)
- Trending Score (15%)
- Video Length (15%)

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `YOUTUBE_API_KEY`: (Optional) YouTube Data API key for enhanced metadata
- `NODE_ENV`: Environment (development/production)

## Notes

- Video analysis uses simulated AI models for demonstration. In production, integrate with actual ML services.
- Thumbnail analysis works with YouTube thumbnails. For uploaded videos, extract thumbnails using FFmpeg.
- The platform is designed to scale with background job processing for video analysis.
- All API routes are serverless and run on Next.js API routes.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
