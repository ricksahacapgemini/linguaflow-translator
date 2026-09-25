# Microsoft Teams app

This folder contains the starter manifest for installing LinguaFlow as a personal Teams tab.

## Before installing

1. Replace the placeholder developer URLs and the sample app ID in `manifest.json`.
2. Create `color.png` (192x192) and `outline.png` (32x32) icons in this folder.
3. Serve the Vite app over HTTPS. Teams cannot embed the current plain HTTP URL. For local testing, use a Microsoft dev tunnel or configure Vite HTTPS.
4. Update `contentUrl`, `websiteUrl`, and `validDomains` to match the HTTPS host.
5. Zip `manifest.json`, `color.png`, and `outline.png` together, then upload the zip in Teams through **Apps > Manage your apps > Upload an app**.

The current manifest is configured as a personal tab. A channel tab can be added later by adding `team` to the tab scope.

## Local development URL

The current Teams development URL is `https://pnnwhxdd-5174.usw3.devtunnels.ms/`. Keep the Vite server and Dev Tunnel host process running while testing. The tunnel expires in 30 days.