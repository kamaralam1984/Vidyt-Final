# Schedule Post Video Upload System - Complete Implementation Guide

## Overview
A complete video upload and content scheduling system for ViralBoost AI that allows users to upload videos, set thumbnails, and schedule posts across multiple platforms (YouTube, Facebook, Instagram, TikTok).

## Features Implemented

### 1. **Enhanced Schedule Post Modal**
- **Video File Upload**
  - Drag-and-drop support for easy video upload
  - Click-to-browse file selection
  - Real-time file preview with file size display
  - Support for common video formats (MP4, WebM, MOV, AVI, etc.)
  - 5GB file size limit per video
  - Upload progress indicator with percentage

- **Thumbnail Upload**
  - Image file selection with preview
  - Thumbnail thumbnail display in the form
  - 10MB file size limit
  - Support for common image formats (JPEG, PNG, GIF, WebP)

- **Alternative Video URL**
  - Option to use external video URLs instead of uploading
  - Support for YouTube, Vimeo, and other video hosting services

- **Form Fields**
  - Title (required)
  - Platform selection (YouTube, Facebook, Instagram, TikTok)
  - Scheduled date and time picker
  - Description (optional)
  - Video upload or URL
  - Thumbnail upload
  - Hashtags (comma-separated)

### 2. **Backend API Enhancements**

#### POST `/api/schedule/post`
Handles both JSON and FormData requests:
- **JSON Request**: For URL-only scheduling
- **FormData Request**: For file uploads with video and thumbnail files

**File Upload Handler:**
- Saves videos to: `/public/uploads/videos/{userId}/`
- Saves thumbnails to: `/public/uploads/thumbnails/{userId}/`
- Generates unique filenames with timestamps
- Handles file cleanup on error
- Returns relative URLs for CDN delivery

**Request Body (FormData):**
```
title: string (required)
platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok' (required)
scheduledAt: ISO datetime string (required)
description?: string
videoUrl?: string (URL or uploaded file path)
videoFile?: File (optional, multipart)
thumbnailFile?: File (optional, multipart)
hashtags: JSON string array (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Post scheduled successfully",
  "post": {
    "id": "postId",
    "title": "Post Title",
    "platform": "youtube",
    "scheduledAt": "2026-03-29T10:00:00Z",
    "status": "scheduled",
    "videoUrl": "/uploads/videos/{userId}/filename.mp4",
    "thumbnailUrl": "/uploads/thumbnails/{userId}/thumbnail.jpg"
  }
}
```

### 3. **File Serving Route**

#### GET `/api/uploads/[...path]`
Serves uploaded files securely:
- Security path validation (prevents directory traversal)
- Proper MIME type detection
- Cache control headers (1 hour)
- Handles missing files gracefully

## Project Structure

```
app/
├── calendar/
│   └── page.tsx                    # Enhanced calendar with video upload
├── api/
│   ├── schedule/
│   │   └── post/
│   │       └── route.ts            # Updated with file upload handling
│   └── uploads/
│       └── [...path]/
│           └── route.ts            # New file serving endpoint
│
public/
└── uploads/
    ├── videos/
    │   └── {userId}/               # User video storage
    └── thumbnails/
        └── {userId}/               # User thumbnail storage
```

## Key Implementation Details

### 1. **Video Upload Process**
1. User selects or drags a video file
2. Frontend validates:
   - File is actually a video
   - File size < 5GB
3. Video included in FormData with other post data
4. Backend receives FormData request
5. File saved to `/public/uploads/videos/{userId}/`
6. Database updated with video URL
7. File available via `/api/uploads/videos/{userId}/filename.mp4`

### 2. **Frontend State Management**
```typescript
formData = {
  title: string
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok'
  scheduledAt: string
  description: string
  hashtags: string
  videoUrl: string
  videoFile: File | null      // New
  thumbnailFile: File | null  // New
}
```

### 3. **File Upload Cleanup**
- On successful upload: Files stored in database
- On error: Files automatically deleted from disk
- Cleanup happens in catch block to prevent orphaned files

### 4. **Security Features**
- User authentication required (getUserFromRequest)
- File path validation (prevents directory traversal)
- File type validation (MIME type checks)
- File size limits enforced
- Secure file naming (random hex + timestamp)
- CORS headers not set (internal API only)

## API Usage Examples

### Upload with Video File

```bash
curl -X POST http://localhost:3000/api/schedule/post \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=My Awesome Video" \
  -F "platform=youtube" \
  -F "scheduledAt=2026-04-01T10:00:00" \
  -F "description=Check out this video!" \
  -F "videoFile=@/path/to/video.mp4" \
  -F "thumbnailFile=@/path/to/thumb.jpg" \
  -F "hashtags=[\"viral\",\"trending\"]"
```

### Schedule with URL Only

```bash
curl -X POST http://localhost:3000/api/schedule/post \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Video Title",
    "platform": "youtube",
    "scheduledAt": "2026-04-01T10:00:00",
    "videoUrl": "https://youtube.com/watch?v=...",
    "hashtags": ["viral", "trending"]
  }'
```

## Database Schema

The `ScheduledPost` model now supports:
- `videoUrl`: Path to locally uploaded video or external video URL
- `thumbnailUrl`: Path to uploaded thumbnail image
- All other fields remain unchanged

## Testing the Implementation

### Test Checklist
- [ ] Open calendar page
- [ ] Click "Schedule Post" button
- [ ] Fill in all required fields
- [ ] Drag and drop a video file
- [ ] Upload a thumbnail image
- [ ] Watch upload progress indicator
- [ ] Submit form and verify post is scheduled
- [ ] Check that post appears in calendar and list
- [ ] Verify uploaded files are accessible via API

### Test with cURL
```bash
# Create test video file
dd if=/dev/zero bs=1M count=1 of=test-video.mp4

# Schedule post with file upload
curl -X POST http://localhost:3000/api/schedule/post \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test Post" \
  -F "platform=youtube" \
  -F "scheduledAt=2026-04-01T10:00:00" \
  -F "videoFile=@test-video.mp4" \
  -F "hashtags=[\"test\"]"
```

## Future Enhancements

1. **Cloud Storage Integration**
   - Add AWS S3 support for scalable video storage
   - Add Google Cloud Storage support
   - Add Cloudinary integration for thumbnail generation

2. **Video Processing**
   - Automatic thumbnail extraction from videos
   - Video transcoding for platform optimization
   - Duration extraction and validation

3. **Video Preview**
   - Embed video preview in modal before upload
   - Show video duration and resolution
   - Preview thumbnail in form

4. **Batch Scheduling**
   - Upload multiple videos at once
   - Bulk schedule with templates
   - Calendar import/export

5. **Advanced Analytics**
   - Track upload metrics
   - Monitor scheduled vs posted ratio
   - Performance analytics per platform

6. **Integrations**
   - Direct platform publishing (YouTube, Facebook API)
   - Auto-publish at scheduled time
   - Platform-specific optimizations

## Troubleshooting

### Issue: Files not uploading
**Solution:** 
- Check that `/public/uploads` directory exists
- Ensure server has write permissions to public directory
- Check browser console for specific error messages

### Issue: 413 Payload Too Large Error
**Solution:**
- Increase Next.js body size limit in next.config.js:
  ```js
  module.exports = {
    api: {
      bodyParser: {
        sizeLimit: '5gb',
      },
    },
  }
  ```

### Issue: Files missing after server restart
**Solution:**
- Files are stored in `/public/uploads/` which is persistent
- Check that files were actually saved using `ls -la public/uploads/`
- Verify database records contain correct file paths

## Performance Considerations

1. **File Upload Performance**
   - Large files (>1GB) may timeout
   - Consider implementing resumable uploads for production
   - Use CDN for file distribution

2. **Storage Optimization**
   - Monitor disk usage of uploads directory
   - Implement cleanup for deleted scheduled posts
   - Consider compression for thumbnails

3. **Database**
   - Add indexes on `userId` and `scheduledAt` for faster queries
   - Consider archiving old scheduled posts
   - Monitor database file size over time

## Configuration Files

No additional configuration files required. The system uses:
- Existing `/public` directory for file storage
- Existing MongoDB for data persistence
- Existing authentication system

All settings are hardcoded but can be made configurable:
- Max video size: 5GB (line in calendar/page.tsx)
- Max thumbnail size: 10MB (line in calendar/page.tsx)
- File cleanup: Automatic on error (line in api/schedule/post/route.ts)

## Version History

- **v1.0** (Mar 29, 2026): Initial implementation with:
  - Video file upload support
  - Thumbnail upload support
  - Drag-and-drop functionality
  - Upload progress indicator
  - File serving API
  - Security validations
