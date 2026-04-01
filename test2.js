const { google } = require('googleapis');
async function run() {
  const oauth2Client = new google.auth.OAuth2('dummy', 'dummy', 'http://localhost');
  oauth2Client.setCredentials({ access_token: 'invalid_token', refresh_token: 'invalid_token' });
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  try {
    await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: { snippet: { title: 'Test' }, status: { privacyStatus: 'private' } },
    });
  } catch (error) {
    console.log("error shape:", error);
    console.log("error message:", error.message);
    const isAuthError = error.code === 401 || 
        error.message?.includes('invalid authentication') || 
        error.message?.includes('invalid_grant') || 
        error.message?.toLowerCase().includes('credentials');
    console.log("isAuthError:", isAuthError);
  }
}
run();
