'use strict';

var clientId = '489984240855-nesl58uubgvd1m3ck3mm3rj19cbs13nd.apps.googleusercontent.com';
var clientSecret = '8lhmKh6JFsV8R4rwHJRTKJ8P';
var redirectUrl = 'https://8080-dot-3134072-dot-devshell.appspot.com/oauth2callback';

var projectId = 'myvisiontestapp';
var bucketName = 'myvisiontestapp.appspot.com';

var credentialsApiKey = 'your-credentials-api-key';

module.exports = {
  port: process.env.PORT || 8080,

  // Secret is used by sessions to encrypt the cookie.
  secret: process.env.SESSION_SECRET || 'your-secret-here',

  // The client ID and secret can be obtained by generating a new web
  // application client ID on Google Developers Console.
  oauth2: {
    clientId: process.env.OAUTH_CLIENT_ID || clientId,
    clientSecret: process.env.OAUTH_CLIENT_SECRET || clientSecret,
    redirectUrl: process.env.OAUTH2_CALLBACK || redirectUrl,
    scopes: ['email', 'profile']
  },

  // Google Developers Console Project Id.
  gcloud: {
    projectId: process.env.GCLOUD_PROJECT || projectId
  },

  gcloudStorageBucket: process.env.CLOUD_BUCKET || bucketName,
  dataBackend: 'datastore',

  gcloudVision: {
    key: process.env.CLOUD_VISION_KEY || credentialsApiKey
  }
};
