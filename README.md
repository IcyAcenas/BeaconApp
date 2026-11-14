# BeaconApp

Beacon is a Leaflet-based hazard map with a Firebase login screen. It supports Google and email/password sign-in with Driver and Responder roles. Firebase Authentication handles accounts; each user's profile is written to Cloud Firestore at `users/{uid}`. The app header and login screen use `beacon-logo.png`.

## Firebase setup

The web app config is in `script.js`. In Firebase Console, enable Google and Email/Password under Authentication and create a Cloud Firestore database. In Firestore **Rules**, publish:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Add `localhost` to Authentication's authorized domains for local testing. For GitHub Pages, add `icyacenas.github.io` after publishing the app.

## Run locally

Serve the repository with VS Code Live Server and open the local URL it provides. Don't open `index.html` directly as a `file://` page.
