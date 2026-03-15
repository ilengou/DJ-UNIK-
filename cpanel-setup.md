# cPanel Deployment Guide for DJ UNIK QuotePro

This application is ready for production deployment on cPanel using the **Node.js Selector**.

## Prerequisites
- cPanel account with Node.js support.
- Access to the File Manager or SSH.

## Steps to Deploy

### 1. Prepare the Files
1. Run the build command locally (or in this environment):
   ```bash
   npm run build
   ```
2. This generates a `dist` folder containing:
   - `server.cjs` (The production server)
   - `assets/`, `index.html`, etc. (The frontend)

### 2. Upload to cPanel
1. Create a new folder for your app in your cPanel home directory (e.g., `~/dj-unik-app`).
2. Upload the following files/folders to that directory:
   - `dist/`
   - `package.json`
   - `.env` (Create this on the server with your production keys)
   - `quotes.db` (The database will be created automatically if it doesn't exist)

### 3. Setup Node.js App in cPanel
1. Go to **Setup Node.js App** in cPanel.
2. Click **Create Application**.
3. Set the following:
   - **Node.js version**: 20.x or higher.
   - **Application mode**: Production.
   - **Application root**: `dj-unik-app` (the folder you created).
   - **Application URL**: Your desired domain/subdomain.
   - **Application startup file**: `dist/server.cjs`.
4. Click **Create**.

### 4. Install Dependencies
1. Once the app is created, click **Run npm install**.
2. Alternatively, if you have SSH access, navigate to the app root and run `npm install --production`.

### 5. Environment Variables
In the Node.js Selector interface, add the following environment variables:
- `NODE_ENV`: `production`
- `PORT`: (Usually handled by cPanel, but you can set it if needed)
- `SPOTIFY_CLIENT_ID`: Your Spotify Client ID
- `SPOTIFY_CLIENT_SECRET`: Your Spotify Client Secret
- `APP_URL`: Your production URL (e.g., `https://djunik.co.za`)

### 6. Restart the App
Click **Restart** in the Node.js Selector.

## Troubleshooting
- **Database Permissions**: Ensure the Node.js process has write access to the application root to create/update `quotes.db`.
- **Static Files**: The server is configured to serve static files from the `dist` folder relative to the current working directory.
