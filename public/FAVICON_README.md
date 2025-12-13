# Favicon Assets

This directory contains favicon assets for the #GangGreen platform to prevent 404 errors in production.

## Files

- `favicon.ico` - Multi-size ICO file (16x16, 32x32, 48x48) for broad browser compatibility
- `favicon-16x16.png` - PNG fallback for modern browsers (16x16)
- `favicon-32x32.png` - PNG fallback for modern browsers (32x32)
- `apple-touch-icon.png` - Apple touch icon for iOS/macOS (180x180)
- `favicon.svg` - Original SVG favicon for modern browsers

## Production Deployment

**IMPORTANT**: The current favicon files are placeholders. Before deploying to production:

1. Use an online favicon generator like:
   - https://favicon.io/favicon-converter/
   - https://realfavicongenerator.net/

2. Upload `favicon.svg` to generate proper binary files

3. Replace the placeholder files with actual generated files:
   - `favicon.ico` (multi-size ICO with 16x16, 32x32, 48x48)
   - `favicon-16x16.png` (16x16 PNG)
   - `favicon-32x32.png` (32x32 PNG)
   - `apple-touch-icon.png` (180x180 PNG)

## Requirements Addressed

- **Requirement 2.1**: Serve valid favicon.ico file with 200 status code
- **Requirement 2.2**: Return 200 status instead of 404 for favicon requests
- **Requirement 2.3**: Display #GangGreen logo in browser tab

## HTML References

The favicon is properly referenced in `index.html` with:
- ICO format for broad compatibility
- PNG fallbacks for modern browsers
- Apple touch icon for iOS devices
- SVG fallback for modern browsers

## Cache Configuration

Favicon files should be cached with long-term headers in `vercel.json`:
```json
{
  "source": "/favicon.ico",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "public, max-age=31536000, immutable"
    }
  ]
}
```