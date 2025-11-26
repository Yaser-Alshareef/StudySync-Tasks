# StudySync Tasks

A cloud-based academic to-do list application for student groups with real-time synchronization.

## Features

- **User Authentication**: Secure registration, login, email verification, and password reset
- **Task Management**: Full CRUD operations with priority levels, due dates, and assignments
- **Drag & Drop**: Reorder tasks by dragging them
- **Task Comments**: Add comments to tasks for collaboration
- **File Attachments**: Attach files to tasks
- **Real-time Sync**: Instant updates across all group members using Firebase Firestore
- **Push Notifications**: Browser notifications for task assignments and deadlines
- **Course Groups**: Create and join course-specific groups for collaborative task management
- **Filtering & Sorting**: Filter by status, assignee, priority and sort by due date
- **Task Statistics**: Visual charts showing task distribution and progress
- **Responsive Design**: Modern, clean UI that works on all devices

## Tech Stack

- **Frontend**: React 18 with Hooks
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Messaging, Hosting)
- **Build Tool**: Vite
- **Styling**: CSS Modules with modern design
- **Drag & Drop**: @dnd-kit
- **Charts**: Recharts
- **Date Handling**: date-fns

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Firebase Storage
5. Enable Cloud Messaging and generate a VAPID key
6. Copy your Firebase config and add it to `src/config/firebase.js`

### 3. Update Firebase Configuration

Edit `src/config/firebase.js` with your Firebase project credentials:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_VAPID_KEY=your-vapid-key
```

### 4. Deploy Firestore Rules and Storage Rules

```bash
firebase deploy --only firestore:rules,storage
```

### 5. Run Development Server

```bash
npm run dev
```

### 6. Build for Production

```bash
npm run build
```

### 7. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

## Project Structure

```
study_sync/
  ├── public/
  │   └── sw/                    # Service workers
  │       └── firebase-messaging-sw.js
  ├── src/
  │   ├── api/                   # Firebase API service functions
  │   │   ├── authService.js
  │   │   ├── commentService.js
  │   │   ├── courseService.js
  │   │   ├── notificationService.js
  │   │   ├── storageService.js
  │   │   └── taskService.js
  │   ├── components/            # React components
  │   │   ├── Auth/              # Authentication components
  │   │   ├── Dashboard/         # Dashboard components
  │   │   ├── Course/            # Course view components
  │   │   └── Common/            # Shared components
  │   ├── contexts/              # React Context providers
  │   ├── config/                # Configuration files
  │   ├── App.jsx                # Main app component
  │   └── main.jsx               # Entry point
  ├── firestore.rules            # Firestore security rules
  ├── storage.rules              # Storage security rules
  └── package.json
```

## Features in Detail

### Authentication
- User registration with email verification
- Secure login/logout
- Password reset functionality
- Protected routes

### Task Management
- Create tasks with title, description, due date, priority, and assignment
- Drag and drop to reorder tasks
- View tasks with filtering and sorting
- Update task status and details
- Delete tasks
- Add comments to tasks
- Attach files to tasks
- Real-time synchronization across all group members

### Course Groups
- Create course groups
- Join existing groups
- View tasks by course
- Manage group members

### Notifications
- Browser push notifications for task assignments
- Deadline reminders
- Task update notifications
- In-app toast notifications



