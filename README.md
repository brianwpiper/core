# AIreFlow Solutions Website

A modern, responsive website for AIreFlow Solutions - providing responsible AI integration services for marketing and communications teams in higher education and SMB sectors.

## 🚀 Features

- **7 Fully Optimized Pages**
  - Home page with hero and service pathways
  - Higher Education solutions page
  - SMB (Small & Mid-Sized Business) solutions page
  - Solutions & Services page
  - Resources & Knowledge Center
  - About page
  - Contact page with form

- **Modern Tech Stack**
  - HTML5 semantic markup
  - Tailwind CSS for styling
  - Vanilla JavaScript for interactions
  - Fully responsive design
  - SEO & AEO optimized

- **Key Features**
  - Mobile-first responsive design
  - Professional Blue/Tech color scheme
  - Structured data for SEO/AEO
  - Accessible (ADA/WCAG compliant design)
  - Fast loading times
  - Clean, maintainable code

## 📋 Pages Overview

1. **Home (`index.html`)** - Landing page with hero, service pathways, and key benefits
2. **Higher Ed (`higher-ed.html`)** - Solutions for colleges and universities
3. **SMB (`smb.html`)** - Solutions for small and mid-sized businesses
4. **Solutions (`solutions.html`)** - Comprehensive service catalog
5. **Resources (`resources.html`)** - Knowledge center, case studies, and tools
6. **About (`about.html`)** - Company mission, founder story, and philosophy
7. **Contact (`contact.html`)** - Contact form and consultation booking

## 🛠️ Setup & Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd core

# Install dependencies
npm install

# Build CSS (production)
npm run build

# Watch for changes during development
npm run dev
```

### Project Structure

```
core/
├── index.html              # Home page
├── higher-ed.html         # Higher Ed page
├── smb.html               # SMB page
├── solutions.html         # Solutions page
├── resources.html         # Resources page
├── about.html             # About page
├── contact.html           # Contact page
├── src/
│   ├── css/
│   │   └── input.css      # Tailwind source CSS
│   └── js/
│       └── main.js        # JavaScript functionality
├── dist/
│   └── css/
│       └── output.css     # Compiled CSS (generated)
├── package.json
├── tailwind.config.js
└── README.md
```

## 🌐 Deployment

### Option 1: Netlify (Recommended)

1. **Connect Repository**
   - Log in to [Netlify](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.` (root directory)

3. **Deploy**
   - Click "Deploy site"
   - Your site will be live at `your-site-name.netlify.app`

4. **Custom Domain** (Optional)
   - Go to "Domain settings" in Netlify
   - Add your custom domain
   - Configure DNS settings as instructed

### Option 2: Vercel

1. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

   Or connect your repository through the Vercel dashboard.

### Option 3: GitHub Pages

1. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Select branch (e.g., `main`)
   - Set folder to `/ (root)`
   - Save

2. **Build Before Pushing**
   ```bash
   npm run build
   git add .
   git commit -m "Build for deployment"
   git push
   ```

3. **Access Your Site**
   - Your site will be available at `https://username.github.io/repository-name`

### Option 4: Traditional Web Hosting

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload Files**
   - Upload all HTML files
   - Upload the `/dist` folder
   - Upload the `/src` folder
   - Upload the `package.json` (optional, for reference)

3. **Configure Server**
   - Ensure your server can serve HTML files
   - Configure 404 page if needed
   - Set up SSL certificate for HTTPS

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to change the color scheme:

```javascript
colors: {
  'primary': {
    // Blue shades
    500: '#3b82f6',
    600: '#2563eb',
    // ... etc
  },
}
```

### Content

- Edit HTML files directly to update content
- All pages use the same navigation and footer structure
- Structured data (JSON-LD) is included in each page's `<head>`

### Styling

- Custom styles are in `src/css/input.css`
- Tailwind utility classes are used throughout HTML
- After changes, run `npm run build` to regenerate CSS

## 📧 Contact Form Setup

The contact form is frontend-only. To make it functional, integrate with:

### Option 1: Formspree

```html
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

### Option 2: Netlify Forms

Add `netlify` attribute to form:
```html
<form name="contact" method="POST" data-netlify="true">
```

### Option 3: Custom Backend

- Create your own backend API
- Update form action and add AJAX submission
- Handle email sending server-side

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## ♿ Accessibility

- Semantic HTML5 elements
- ARIA labels where appropriate
- Keyboard navigation support
- Color contrast ratios meet WCAG AA standards
- Responsive text sizing

## 🔍 SEO Features

- Meta descriptions on all pages
- Open Graph tags for social sharing
- Structured data (JSON-LD) for rich snippets
- Semantic HTML structure
- Optimized for AEO (AI Engine Optimization)
- Clean, crawlable URLs

## 📝 License

All rights reserved © 2024 AIreFlow Solutions

## 🤝 Support

For questions or issues with the website, please contact:
- Email: hello@aireflowsolutions.com
- Website: https://brianwpiper.com

## 🎯 Next Steps

1. **Add Real Images**
   - Replace placeholder SVGs with actual photos/graphics
   - Optimize images for web (WebP format recommended)
   - Add to an `/assets` or `/images` folder

2. **Connect Contact Form**
   - Set up Formspree, Netlify Forms, or custom backend
   - Test form submissions

3. **Add Analytics**
   - Google Analytics 4
   - Or privacy-focused alternative (Plausible, Fathom)

4. **Calendar Integration**
   - Embed Calendly, Cal.com, or similar scheduler on contact page
   - Replace placeholder div with actual embed code

5. **Content Updates**
   - Add real case study data
   - Include actual metrics and testimonials
   - Update placeholder email addresses

6. **Optional Enhancements**
   - Add blog functionality
   - Create downloadable resources (PDFs)
   - Add video content
   - Implement dark mode toggle
   - Add live chat widget

---

Built with ❤️ for AIreFlow Solutions
