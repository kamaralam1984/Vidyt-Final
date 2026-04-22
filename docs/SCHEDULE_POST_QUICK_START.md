# Schedule Post Video Upload - Quick Start Guide

## ✅ What's Been Implemented

### 1. **Enhanced Schedule Post Modal** 
- Video file upload with drag-and-drop
- Thumbnail image upload
- Video URL as alternative to file upload
- File size validation (5GB for videos, 10MB for thumbnails)
- Upload progress indicator
- Real-time file previews

### 2. **Backend File Upload Handler**
- Automatic file storage in `/public/uploads/{type}/{userId}/`
- Secure file saving with unique filenames
- File cleanup on error
- Proper MIME type detection
- FormData parsing support

### 3. **File Serving API**
- New endpoint: `GET /api/uploads/[...path]`
- Secure file serving with path validation
- Proper cache headers
- Automatic MIME type detection

### 4. **Enhanced API Route**
- `POST /api/schedule/post` now supports FormData with files
- Backward compatible with JSON requests (non-file uploads)
- File upload progress tracking
- Complete error handling

## 🚀 How to Use

### Step 1: Open Calendar
Go to http://localhost:3000/calendar

### Step 2: Click "Schedule Post"
- Click the red "Schedule Post" button in the top right

### Step 3: Fill in Details
- **Title**: Enter post title
- **Platform**: Select YouTube, Facebook, Instagram, or TikTok
- **Schedule Date & Time**: Pick when to publish
- **Description**: Optional description

### Step 4: Upload Video
Choose one of two options:

**Option A: Upload Video File**
- Drag and drop a video file into the upload area, OR
- Click the upload area and select a file
- Supported formats: MP4, WebM, MOV, AVI, etc.
- Maximum size: 5GB

**Option B: Use Video URL**
- Paste a YouTube, Vimeo, or other video URL
- No file upload needed

### Step 5: Upload Thumbnail (Optional)
- Click the thumbnail area
- Select an image file (JPEG, PNG, GIF, WebP)
- Maximum size: 10MB
- Preview will appear once selected

### Step 6: Add Hashtags (Optional)
- Enter hashtags separated by commas
- Example: "viral, trending, fyp"

### Step 7: Submit
- Click "Schedule Post" button
- Watch the upload progress indicator
- Post will be added to your calendar

## 📁 File Storage

Files are automatically saved to:
```
public/
├── uploads/
│   ├── videos/
│   │   └── {userId}/
│   │       └── uploaded-videos.mp4
│   └── thumbnails/
│       └── {userId}/
│           └── uploaded-thumbnails.jpg
```

Files are accessible via:
- Videos: `/api/uploads/videos/{userId}/{filename}.mp4`
- Thumbnails: `/api/uploads/thumbnails/{userId}/{filename}.jpg`

## 🔧 Configuration

### File Size Limits
Located in: `app/calendar/page.tsx`
```typescript
// Videos: 5GB limit
if (file.size > 5 * 1024 * 1024 * 1024) { }

// Thumbnails: 10MB limit
if (file.size > 10 * 1024 * 1024) { }
```

To change limits, edit the size checks in:
- `handleVideoFileSelect()` function (videos)
- `handleThumbnailFileSelect()` function (thumbnails)

### Next.js Config
Updated `next.config.js` with:
```javascript
api: {
  bodyParser: {
    sizeLimit: '5gb',
  },
},
experimental: {
  serverActions: {
    bodySizeLimit: '5gb',
  },
}
```

## 🧪 Testing

### Test 1: Upload Video File
1. Open calendar
2. Click "Schedule Post"
3. Fill in title and other fields
4. Drag a video file (MP4) into the upload area
5. Watch for green checkmark
6. Click "Schedule Post"
7. Verify post appears in calendar

### Test 2: Upload with Thumbnail
1. Repeat Test 1
2. Also upload a thumbnail image
3. Verify thumbnail preview shows
4. Submit and check database

### Test 3: Use Video URL
1. Open calendar
2. Click "Schedule Post"
3. Fill in title
4. Paste a YouTube URL in the "Video URL" field
5. Skip file upload
6. Submit
7. Verify post is scheduled with URL

### Test 4: Check File Access
1. After uploading, check browser's Network tab
2. Open file URL: `http://localhost:3000/api/uploads/videos/{userId}/{filename}`
3. Verify video/image loads correctly
4. Check File System: `public/uploads/` directory

## 📋 Troubleshooting

### Files Not Uploading?
1. Check / create `/public/uploads/` directory
   ```bash
   mkdir -p public/uploads/{videos,thumbnails}
   ```

2. Check permissions:
   ```bash
   chmod -R 755 public/uploads/
   ```

3. Check browser console for errors
4. Check server logs

### "413 Payload Too Large" Error?
- File is larger than configured limit
- Check `sizeLimit` in `next.config.js`
- Verify server memory is sufficient

### Files Missing After Restart?
- Check if files exist: `ls -la public/uploads/`
- Verify database records have correct paths
- Check MongoDB ScheduledPost collection

### Upload Progress Stuck?
- Check network tab in DevTools
- Verify server is responding
- Try uploading smaller file first

## 📊 Database Structure

The `ScheduledPost` document now includes:
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: "Post Title",
  platform: "youtube",
  scheduledAt: Date,
  status: "scheduled",
  description: "Optional description",
  videoUrl: "/uploads/videos/{userId}/filename.mp4",
  thumbnailUrl: "/uploads/thumbnails/{userId}/filename.jpg",
  hashtags: ["viral", "trending"],
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Security Features

1. **Authentication**: User must be logged in
2. **File Type Validation**: Only video/image files accepted
3. **File Size Validation**: Limits enforced on client and server
4. **Path Validation**: Prevents directory traversal attacks
5. **Unique Filenames**: Random hex + timestamp prevents conflicts
6. **Error Cleanup**: Failed uploads are deleted automatically

## 📝 API Examples

### Upload with Video File
```bash
curl -X POST http://localhost:3000/api/schedule/post \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Amazing Video" \
  -F "platform=youtube" \
  -F "scheduledAt=2026-04-01T10:00:00" \
  -F "videoFile=@/path/to/video.mp4" \
  -F "thumbnailFile=@/path/to/thumb.jpg" \
  -F "hashtags=[\"viral\"]"
```

### Schedule with URL Only
```bash
curl -X POST http://localhost:3000/api/schedule/post \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Video",
    "platform": "youtube",
    "scheduledAt": "2026-04-01T10:00:00",
    "videoUrl": "https://youtube.com/watch?v=xyz",
    "hashtags": ["viral"]
  }'
```

## 🎯 Next Steps

1. ✅ Test the upload feature
2. ✅ Verify files are saved correctly
3. ✅ Check calendar displays scheduled posts
4. ✅ Confirm files are accessible via API
5. Future: Add platform auto-publishing
6. Future: Add video processing/transcoding
7. Future: Migrate to cloud storage (S3/GCS)

## 📞 Support

For issues or questions:
1. Check the SCHEDULE_POST_VIDEO_SYSTEM.md guide
2. Review this quick start guide
3. Check server logs
4. Verify file permissions in `/public/uploads/`

---
**System Ready!** 🎉 Your schedule post video upload system is fully implemented and ready to use.
