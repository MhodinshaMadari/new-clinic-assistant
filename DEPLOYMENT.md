# ApexDental Scheduling System - Deployment Guide

This guide contains the step-by-step instructions for local setup, firestore rules configuration, and deploying ApexDental to production.

---

## 1. Local Setup Steps

To run the application locally on your computer:

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Steps
1. **Clone the repository / Extract ZIP**:
   Ensure you have extracted the ZIP archive or cloned the repository into a local directory.

2. **Install Dependencies**:
   Run the following command in the root folder of the project:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Note: In the development sandbox, the keys are automatically injected via the Secrets panel. For local execution, make sure your `.env` contains valid Firebase configuration fields.*

4. **Run Development Server**:
   Launch the dev server on your local machine:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000` to interact with the application.

---

## 2. Firebase Rules Configuration

### Firestore Security Rules
Ensure the contents of the `firestore.rules` file located in the root directory are uploaded to your Firebase Console:
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: `gpslocationfortravellers`.
3. Click on **Firestore Database** in the left menu.
4. Navigate to the **Rules** tab.
5. Replace the editor content with the code inside the local `firestore.rules` file:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       function isAuthenticated() { return request.auth != null; }
       function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }
       function getUserData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
       function getUserRole() {
         return isAuthenticated() && exists(/databases/$(database)/documents/users/$(request.auth.uid)) 
           ? getUserData().role : null;
       }
       function isStaff() {
         let role = getUserRole();
         return role == 'dentist' || role == 'receptionist' || role == 'admin';
       }
       function isAdmin() { return getUserRole() == 'admin'; }

       match /users/{userId} {
         allow read: if isOwner(userId) || isStaff();
         allow create: if isAuthenticated();
         allow update, delete: if isOwner(userId) || isAdmin();
       }

       match /appointments/{appointmentId} {
         allow create: if isAuthenticated();
         allow read, update: if isAuthenticated() && (resource.data.patientId == request.auth.uid || resource.data.dentistId == request.auth.uid || isStaff());
         allow delete: if isAdmin() || isStaff();
       }

       match /reviews/{reviewId} {
         allow read: if true;
         allow create: if isAuthenticated();
         allow update, delete: if isAdmin();
       }

       match /reminders/{reminderId} {
         allow read: if isAuthenticated() && (resource.data.patientEmail == request.auth.token.email || isStaff());
         allow create: if isStaff();
         allow update, delete: if isAdmin();
       }
     }
   }
   ```
6. Click **Publish**.

### Firebase Storage Rules
If you configure Firebase Storage (for uploading patient dental files or x-rays), apply these rules in the **Storage** section of your Firebase Console:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /dental_records/{userId}/{allPaths=**} {
      // Patients can read/write their own files; staff can read all files.
      allow read: if request.auth != null && (request.auth.uid == userId || 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['dentist', 'receptionist', 'admin']);
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 3. Production Deployment Guide

Deploying the React application to static hosting (like Firebase Hosting, Netlify, or Vercel):

### Deploying to Firebase Hosting
1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase Project**:
   ```bash
   firebase init
   ```
   - Select **Hosting** and **Firestore** (to configure rules automatically).
   - Choose `gpslocationfortravellers` as the default project.
   - Set the public directory to `dist` (since Vite compiles code to `dist`).
   - Configure as a single-page app (reply **Yes** to rewrite all URLs to `/index.html`).

4. **Compile the Production Build**:
   ```bash
   npm run build
   ```

5. **Deploy the App**:
   ```bash
   firebase deploy
   ```

Upon completion, Firebase CLI will output your live URL (e.g. `https://gpslocationfortravellers.web.app`).

---

## 4. Complete Architecture & Tech Stack

- **Framework**: React 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS v4.
- **Database / Auth / Real-Time**: Firebase Auth (Google + Email) and real-time Firestore database using custom hooks with `onSnapshot` listeners.
- **Dynamic Seeding**: On the initial load, the app automatically checks and pre-populates Firestore with sample dentists, reviews, and test appointments if they are missing, ensuring you have a rich, interactive workspace immediately.
