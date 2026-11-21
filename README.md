# BeaconApp

Beacon is a Leaflet hazard map with Google sign-in, profile settings, hazard reports, camera photos, and incident triage. Firebase Authentication keeps the signed-in session. Firestore stores account profiles and shared hazard reports; Firebase Storage stores profile and report photos. Reports, profile settings, sample hazard status, and response history are also cached in browser local storage for the signed-in account.

## Firebase setup

The Firebase web app configuration is in `script.js`. In Firebase Console:

1. Enable Google in **Authentication → Sign-in method**.
2. Add `localhost` and your deployed hostname under **Authentication → Settings → Authorized domains**.
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
      allow update: if request.auth != null &&
        request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['status', 'resolvedAt', 'updatedAt']);
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
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /hazardPhotos/{uid}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

These prototype rules let any signed-in member update incident status, matching the current triage UI. Before using this for emergency operations, restrict status changes to a trusted responder/admin claim. The editable profile role is UI data and is not an authorization control.

## Run locally

Serve this folder with VS Code Live Server or run `python server.py`. Do not open `index.html` as a `file://` page. Google sign-in requires the current host to be an authorized Firebase domain.
