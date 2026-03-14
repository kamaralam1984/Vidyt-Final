# Setup Guide for ViralBoost AI

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up MongoDB**
   
   Option A: Local MongoDB
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```
   
   Option B: MongoDB Atlas (Cloud)
   - Create a free account at https://www.mongodb.com/cloud/atlas
   - Create a cluster and get your connection string
   - Update `.env` with your connection string

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   ```
   MONGODB_URI=mongodb://localhost:27017/viralboost
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Open Browser**
   Navigate to http://localhost:3000

## Testing the Platform

### Test YouTube Import
1. Go to the dashboard
2. Click "YouTube Link" tab
3. Paste a YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
4. Click "Analyze"
5. View the analysis results

### Test Video Upload
1. Click "Upload Video" tab
2. Drag and drop a video file or click to browse
3. Wait for analysis to complete
4. View the results

## Features to Test

- ✅ Viral Probability Score
- ✅ Hook Score Analysis
- ✅ Thumbnail Score Analysis
- ✅ Title Score Analysis
- ✅ Optimized Title Suggestions
- ✅ Hashtag Recommendations
- ✅ Trending Topics
- ✅ Best Posting Time Heatmap
- ✅ Engagement Prediction Graph
- ✅ Chat Assistant

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check your connection string in `.env`
- For MongoDB Atlas, whitelist your IP address

### YouTube Import Not Working
- Check your internet connection
- Some videos may be restricted or unavailable
- Try a different YouTube video URL

### Video Upload Issues
- Ensure video file is not too large (max 50MB by default)
- Check browser console for errors
- Try a different video format (MP4 recommended)

## Next Steps

- Integrate actual ML models for video analysis
- Add user authentication
- Implement cloud storage for videos
- Add more AI analysis features
- Set up background job processing
