const error = { message: "Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential. See https://developers.google.com/identity/sign-in/web/devconsole-project." };
const isAuthError = error.code === 401 || 
    error.message?.includes('invalid authentication') || 
    error.message?.includes('invalid_grant') || 
    error.message?.toLowerCase().includes('credentials');
console.log({isAuthError, msg: error.message});
