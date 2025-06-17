# Deployment Guide

## Frontend Deployment (Netlify)

Your frontend is already configured for Netlify deployment:

### Steps:
1. Go to [netlify.com](https://netlify.com) and log in
2. Click "New site from Git" or "Add new site" → "Import an existing project"
3. Choose "GitHub" and select the `fytroy/realtimechat` repository
4. Netlify will automatically detect the `netlify.toml` configuration
5. Click "Deploy site"

The frontend will be deployed and you'll get a URL like: `https://amazing-name-123456.netlify.app`

## Backend Deployment (Server)

⚠️ **IMPORTANT**: You need to deploy your backend (server) component separately since Netlify only hosts static files, not Node.js servers.

### Options for Backend Deployment:

#### Option 1: Netlify Functions (Recommended for this project)
Convert your Express server to Netlify Functions:
1. Move your server code to `netlify/functions/` directory
2. Adapt each route to be a serverless function
3. This keeps everything in one repository

#### Option 2: External Hosting Services
Deploy your backend to:
- **Railway**: https://railway.app
- **Heroku**: https://heroku.com  
- **Render**: https://render.com
- **Vercel**: https://vercel.com
- **DigitalOcean App Platform**: https://digitalocean.com

#### Option 3: Keep Current Render Deployment
If you want to keep using your current Render backend:
1. Update `config.js` production URL back to: `https://realtimechat-v2t1.onrender.com`

### Current Configuration

The frontend is configured to connect to:
- **Production**: `https://realtimechat-backend.netlify.app` (placeholder - update this)
- **Development**: `http://localhost:3000`
- **Staging**: `https://realtimechat-staging.netlify.app`

### To Update Backend URL:

1. Deploy your backend to your chosen platform
2. Get the deployment URL (e.g., `https://your-app-name.railway.app`)
3. Update `client/config.js`:
   ```javascript
   production: 'https://your-actual-backend-url.com',
   ```
4. Commit and push the changes

### Environment Detection

The app automatically detects the environment:
- **localhost** → development mode
- **netlify.app/netlify.com** → production mode  
- **staging/dev in URL** → staging mode

## WebSocket Configuration

The WebSocket URL is automatically generated from the backend URL:
- `https://backend.com` → `wss://backend.com`
- `http://localhost:3000` → `ws://localhost:3000`

## Testing Deployment

After deployment:
1. Visit your Netlify frontend URL
2. Try registering a new user
3. Test creating and joining chat rooms
4. Verify real-time messaging works

## Troubleshooting

### Common Issues:
1. **CORS errors**: Ensure your backend allows your Netlify domain
2. **WebSocket connection fails**: Check that your backend supports WebSocket upgrades
3. **API calls fail**: Verify the backend URL in `config.js` is correct
4. **Authentication issues**: Check JWT token handling in both frontend and backend

### Debug Steps:
1. Open browser developer tools
2. Check Console for errors
3. Check Network tab for failed requests
4. Verify environment detection in console logs (development mode only)

