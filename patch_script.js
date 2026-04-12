const fs = require('fs');
let code = fs.readFileSync('app/api/channel/videos/route.ts', 'utf8');

code = code.replace(/const videoUrls = await fetchVideosFromRSS\(channelId\);/, 'const result = await fetchVideosFromRSS(channelId);\n    const videoUrls = result.videoUrls;');
code = code.replace(/count: videoUrls\.length,/, 'count: videoUrls.length,\n      totalVideos: result.totalVideos,');

code = code.replace(/async function fetchVideosFromRSS\(channelId: string\): Promise<string\[\]> \{/, 'async function fetchVideosFromRSS(channelId: string): Promise<{videoUrls: string[], totalVideos?: number}> {');
code = code.replace(/const videoUrls: string\[\] = \[\];/g, '');

code = code.replace(/return videos;/gi, 'return { videoUrls: videos };');
code = code.replace(/return scrapedVideos;/g, 'return scrapedVideos;'); // wait, scrapedVideos will be {videoUrls, totalVideos} 
// but wait, if I run a script, it's safer.

fs.writeFileSync('app/api/channel/videos/route.ts', code);
