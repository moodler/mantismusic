#!/bin/bash
#
# Build Mantis Music as a native macOS .app
#
set -e

cd "$(dirname "$0")"

echo "Building Mantis Music.app..."

# Clean previous builds
rm -rf build dist *.spec

# Convert icon if needed (accepts .icns, .png, or .jpg)
ICON_FLAG=""
if [ -f "icon.icns" ]; then
    ICON_FLAG="--icon icon.icns"
elif [ -f "icon.png" ] || [ -f "icon.jpg" ]; then
    SRC=$(ls icon.png icon.jpg 2>/dev/null | head -1)
    echo "Converting $SRC to icon.icns..."
    ICONSET=$(mktemp -d)/icon.iconset
    mkdir -p "$ICONSET"
    for SIZE in 16 32 64 128 256 512; do
        sips -z $SIZE $SIZE "$SRC" --out "$ICONSET/icon_${SIZE}x${SIZE}.png" >/dev/null 2>&1
        DOUBLE=$((SIZE * 2))
        sips -z $DOUBLE $DOUBLE "$SRC" --out "$ICONSET/icon_${SIZE}x${SIZE}@2x.png" >/dev/null 2>&1
    done
    iconutil -c icns "$ICONSET" -o icon.icns
    rm -rf "$(dirname "$ICONSET")"
    ICON_FLAG="--icon icon.icns"
    echo "Created icon.icns"
fi

# Run PyInstaller — bundle all app code
pyinstaller \
    --windowed \
    --name "Mantis Music" \
    --add-data "templates:templates" \
    --add-data "js:js" \
    --add-data "css:css" \
    --add-data "index.html:." \
    --add-data "paths.py:." \
    --add-data "build_music_json.py:." \
    --osx-bundle-identifier "music.mantisaudiogram.admin" \
    --hidden-import yaml \
    --hidden-import requests \
    --hidden-import paths \
    --noconfirm \
    $ICON_FLAG \
    mantis_app.py

echo ""
echo "Build complete: dist/Mantis Music.app"
echo ""

# Ask to copy to Applications
read -p "Copy to /Applications? [y/N] " answer
if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
    rm -rf "/Applications/Mantis Music.app"
    cp -R "dist/Mantis Music.app" /Applications/
    echo "Installed to /Applications/Mantis Music.app"
fi

# Clean up build artifacts
rm -rf build *.spec
echo "Done."
