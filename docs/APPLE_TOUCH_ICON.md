# Apple Touch Icon Generation

The `apple-touch-icon.png` file needs to be generated from the SVG icon.

## Manual Generation

If you have ImageMagick installed:

```bash
convert -background none -resize 180x180 public/icon.svg public/apple-touch-icon.png
```

## Alternative Methods

1. **Using an online converter**:
   - Visit https://cloudconvert.com/svg-to-png
   - Upload `public/icon.svg`
   - Set size to 180x180
   - Download as `apple-touch-icon.png`

2. **Using Inkscape** (if installed):
   ```bash
   inkscape public/icon.svg --export-png=public/apple-touch-icon.png --export-width=180 --export-height=180
   ```

3. **Using Node.js** (with sharp package):
   ```bash
   npm install sharp
   node -e "require('sharp')('public/icon.svg').resize(180, 180).png().toFile('public/apple-touch-icon.png')"
   ```

## Verification

After generation, verify the file:
- Size: 180x180 pixels
- Format: PNG
- Location: `public/apple-touch-icon.png`
