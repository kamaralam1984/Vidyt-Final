import { extractYouTubeMetadata } from '../services/youtube';

async function run() {
  console.log('Testing extractYouTubeMetadata...');
  try {
    const res = await extractYouTubeMetadata('https://youtu.be/S08Hn8bLd0Y');
    console.log('Result:', res);
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}
run();
