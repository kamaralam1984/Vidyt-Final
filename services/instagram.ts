import axios from 'axios';
import { getHardcoreMetadata } from './multiplatform/metadata';

export interface InstagramMetadata {
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
  hashtags: string[];
  platform: 'instagram';
}

/**
 * Extract metadata from Instagram video
 */
export async function extractInstagramMetadata(url: string): Promise<InstagramMetadata> {
  try {
    const data = await getHardcoreMetadata(url);
    
    return {
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl,
      duration: data.duration,
      views: data.views,
      hashtags: data.hashtags,
      platform: 'instagram',
    };
  } catch (error: any) {
    console.error('Instagram hardcore metadata extraction failed, falling back to basic:', error.message);
    
    return {
      title: 'Instagram Video',
      description: '',
      thumbnailUrl: '',
      duration: 0,
      views: 0,
      hashtags: [],
      platform: 'instagram',
    };
  }
}

export async function downloadThumbnail(url: string, shortcode: string): Promise<string> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    // In production, upload to cloud storage (S3, Cloudinary, etc.)
    // For now, return the URL
    return url;
  } catch (error) {
    console.error('Error downloading thumbnail:', error);
    return url;
  }
}
