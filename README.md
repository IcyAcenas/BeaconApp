# BeaconApp

Beacon is a road safety map with Google sign-in, profile settings, hazard reports, camera photos, and incident triage. Firebase Authentication keeps the signed-in session. Firestore stores account profiles and shared hazard reports; Firebase Storage stores profile and report photos. Reports, profile settings, sample hazard status, and response history are also cached in browser local storage for the signed-in account.

## Firebase setup

The Firebase web app configuration is in `script.js`. In Firebase Console:

1. Enable Google, Phone, and Email/Password in **Authentication → Sign-in method**. For phone sign-in, allow the Philippines in the SMS region policy and set an SMS region policy that permits sending to your users.
2. Add `localhost` and `icyacenas.github.io` (the GitHub Pages hostname) under **Authentication → Settings → Authorized domains**.
3. Create a Cloud Firestore database and publish these rules:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /hazardReports/{reportId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && (
        request.resource.data.reporterUid == request.auth.uid ||
        request.resource.data.isDefaultHazard == true
      );
      allow update: if request.auth != null && (
        request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['status', 'resolvedAt', 'updatedAt']) ||
        (request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['status', 'resolvedAt', 'updatedAt', 'isHidden']) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'responder')
      );
      allow delete: if false;
    }
  }
}
```

4. Create the Firebase Storage bucket and publish these rules:

```text
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profilePhotos/{uid}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /hazardPhotos/{uid}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

These rules let signed-in members read shared reports and update incident status; hiding an incident requires the profile role to be `responder`. The role choice is stored in the profile document, so production deployments should enforce responder roles through trusted admin tooling/custom claims instead of allowing open self-selection. **Publish these rules in Firebase Console → Firestore Database → Rules and Storage → Rules**; updating this README alone does not change the live Firebase project.

The app listens to the shared `hazardReports` collection in real time. Reports created by any signed-in account should appear in other signed-in accounts once the Firestore read rule above is published.

The sign-in screen offers Google, phone number, and email/password. Email users can log in or create a Firebase account. Phone numbers must include the country code (E.164 format, such as `+639123456789`); Firebase verifies the number by SMS and reCAPTCHA. Firebase Phone Auth does not support localhost as the app domain, so test it on the deployed authorized domain or configure Firebase test phone numbers for development. Enable Google, Phone, and Email/Password in Firebase Authentication before using these options.

## Run locally

Serve this folder with VS Code Live Server or run `python server.py`. Do not open `index.html` as a `file://` page. Google sign-in requires the current host to be an authorized Firebase domain.
