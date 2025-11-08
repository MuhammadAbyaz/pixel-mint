# Edit Profile Feature - Setup Instructions

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_BUCKET_NAME=pixel-mint-bucket
```

## Supabase Storage Setup

1. Create a bucket named `pixel-mint-bucket` in your Supabase project
2. Set the bucket to **public** (or configure appropriate policies)
3. Create a folder named `profile-images` inside the bucket (optional, will be created automatically)

## Features Implemented

### Edit Profile Dialog
- Modern, sleek UI with dark theme matching the app design
- Profile picture upload with preview
- Display name editing
- Real-time validation
- Loading states with spinner
- Success/error toast notifications

### Profile Picture Upload
- Image format validation (JPEG, PNG, WebP, GIF)
- File size validation (max 5MB)
- Automatic image preview
- Old image cleanup from Supabase
- Unique filename generation

### Server Actions
- `uploadProfileImage(formData)` - Handles image upload to Supabase
- `updateDisplayName(name)` - Updates user display name
- `updateProfile(name, imageFormData)` - Combined update function

### UI Components Used
- Dialog (shadcn)
- Input (shadcn)
- Label (shadcn)
- Button (shadcn)
- Toast notifications (sonner)

### Animations & Interactions
- Smooth hover effects on avatar
- Camera overlay on hover
- "New" badge for newly selected images
- Loading spinner during upload
- Form validation feedback
- Disabled states for buttons

## Usage

The edit button (pencil icon) appears only on the user's own profile page. Clicking it opens the edit dialog where they can:

1. Click on the avatar or "Upload Photo" button to select a new image
2. Preview the image before uploading
3. Edit their display name
4. Save changes or cancel

The page automatically reloads after successful update to show the new data.

## File Structure

```
apps/web/
├── actions/
│   └── user.actions.ts          # Server actions for profile updates
├── components/
│   └── profile/
│       ├── ProfileClient.tsx     # Main profile component
│       └── EditProfileDialog.tsx # Edit profile modal
├── lib/
│   └── supabase.ts              # Supabase client configuration
└── env.ts                        # Environment variables config
```
