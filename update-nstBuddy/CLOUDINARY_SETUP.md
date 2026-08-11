# AI Upload Feature - Cloudinary Setup Guide

## 🚀 Quick Setup

To enable the PDF upload feature for AI model training, you need to configure Cloudinary:

### Step 1: Get Your Cloudinary Cloud Name

1. Log in to your [Cloudinary Dashboard](https://cloudinary.com/console)
2. Find your **Cloud Name** in the dashboard (top-left corner)
3. Copy it

### Step 2: Create an Unsigned Upload Preset

For security, we use **unsigned uploads** which don't expose your API secret:

1. Go to **Settings** → **Upload** in your Cloudinary dashboard
2. Scroll to **Upload presets**
3. Click **Add upload preset**
4. Configure:
   - **Preset name**: `nst_ai_training` (or any name you prefer)
   - **Signing mode**: Select **Unsigned**
   - **Folder**: `nst-ai-training` (optional, for organization)
   - **Allowed formats**: `pdf,docx,pptx,doc,ppt`
5. Click **Save**

### Step 3: Update Configuration

Edit the file: `src/services/cloudinary.ts`

Replace these values:
```typescript
export const CLOUDINARY_CONFIG = {
    cloudName: 'YOUR_CLOUD_NAME',        // ← Replace with your cloud name
    uploadPreset: 'nst_ai_training',     // ← Replace with your preset name
    apiKey: 'LhsOUIb-gOXoruoX8lphlaaaZXo',
    folder: 'nst-ai-training'
};
```

### Step 4: Test the Feature

1. Run your development server: `npm run dev`
2. Navigate to the Contribute page
3. Click the **"🧠 Help Train Our AI Model"** button
4. Upload a test PDF file
5. Check your Cloudinary Media Library to verify the upload

## 📁 File Structure

```
src/
├── components/
│   └── AIUploadPopup.tsx          # Upload popup component
├── pages/
│   └── ContributePage.tsx         # Integrated with trigger button
└── services/
    └── cloudinary.ts              # Cloudinary configuration & upload logic
```

## 🔒 Security Notes

- ✅ Using **unsigned upload preset** (secure for frontend)
- ✅ API key is NOT exposed in requests
- ✅ File type validation on frontend
- ✅ 50MB file size limit
- ⚠️ Consider adding backend validation for production

## 🎯 Features

- Drag & drop file upload
- File type validation (PDF, DOCX, PPTX)
- User email tracking (from Firebase auth)
- Upload progress indicator
- Success/error messages
- Responsive design

## 📝 Accepted File Types

- PDF (`.pdf`)
- Word Documents (`.docx`, `.doc`)
- PowerPoint Presentations (`.pptx`, `.ppt`)

## 🐛 Troubleshooting

**Upload fails with CORS error:**
- Ensure your upload preset is set to "Unsigned"
- Check that your cloud name is correct

**File not appearing in Cloudinary:**
- Verify the folder name matches your preset configuration
- Check the Media Library in your Cloudinary dashboard

**"Please log in" error:**
- User must be authenticated via Firebase
- Email is required for tracking contributions
