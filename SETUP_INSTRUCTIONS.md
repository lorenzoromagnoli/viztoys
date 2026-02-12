# GitHub Setup Instructions

Follow these steps to create your repository and host it on GitHub Pages.

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in the details:
   - **Repository name**: `flow-field-experiments`
   - **Description**: "Interactive generative art experiments with p5.js"
   - **Public** (so it can be hosted on GitHub Pages)
   - ✅ **Add a README file** - UNCHECK THIS (we already have one)
   - **Add .gitignore**: None (we already have one)
   - **Choose a license**: MIT (or your preference)
4. Click **"Create repository"**

## Step 2: Upload Your Code

### Option A: Using Git Command Line

1. Open terminal in the `flow-field-experiments` folder
2. Run these commands (replace `yourusername` with your GitHub username):

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit: Flow Field Generator"

# Add GitHub remote (replace yourusername!)
git remote add origin https://github.com/yourusername/flow-field-experiments.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Option B: Using GitHub Desktop

1. Download and install [GitHub Desktop](https://desktop.github.com/)
2. Open GitHub Desktop
3. Click **File** → **Add Local Repository**
4. Select the `flow-field-experiments` folder
5. Click **Publish repository**
6. Uncheck "Keep this code private"
7. Click **Publish Repository**

### Option C: Upload via Web Interface

1. On your new repository page on GitHub
2. Click **"uploading an existing file"**
3. Drag and drop ALL files from `flow-field-experiments` folder
4. Click **"Commit changes"**

## Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Click **Pages** (left sidebar)
4. Under **"Source"**, select:
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Click **Save**
6. Wait 1-2 minutes for deployment
7. Your site will be live at: `https://yourusername.github.io/flow-field-experiments/`

## Step 4: Update Links in Code

After deployment, update these files with your actual GitHub username:

### In `index.html`:
Find this line:
```html
<a href="https://github.com/yourusername/flow-field-experiments" target="_blank">View on GitHub</a>
```
Replace `yourusername` with your actual username.

### In `README.md`:
Replace all instances of `yourusername` with your GitHub username:
- Line 3: Live Demo URL
- Line 18: Flow Field Generator URL
- Line 24: Clone command
- Line 81: Author GitHub link

Then commit and push the changes:
```bash
git add .
git commit -m "Update URLs with actual username"
git push
```

## Step 5: Test Your Site

1. Visit `https://yourusername.github.io/flow-field-experiments/`
2. You should see the landing page with your experiment cards
3. Click on "Flow Field Generator" to test the experiment
4. Share the link with others! 🎉

## Adding Future Experiments

To add new experiments:

1. Create a new folder: `experiments/experiment-name/`
2. Add your `index.html` file inside
3. Update `index.html` (main page) to add a new card:
   ```html
   <a href="./experiments/experiment-name/" class="experiment-card">
       <!-- Card content -->
   </a>
   ```
4. Commit and push:
   ```bash
   git add .
   git commit -m "Add new experiment: experiment-name"
   git push
   ```

## Troubleshooting

**Site not showing up?**
- Wait 2-3 minutes after enabling GitHub Pages
- Check Settings → Pages to see deployment status
- Make sure repository is Public

**404 Error?**
- Check that files are in the root directory (not in a subfolder)
- Verify the URL matches your username and repo name

**Changes not appearing?**
- Wait 1-2 minutes for GitHub Pages to rebuild
- Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache

## Custom Domain (Optional)

If you want to use your own domain:

1. Go to Settings → Pages
2. Under "Custom domain", enter your domain (e.g., `experiments.yourdomain.com`)
3. Add DNS records at your domain provider:
   - Type: `CNAME`
   - Name: `experiments` (or `@` for root)
   - Value: `yourusername.github.io`
4. Check "Enforce HTTPS"

---

Need help? Check the [GitHub Pages documentation](https://docs.github.com/en/pages)
