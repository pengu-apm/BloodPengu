#!/bin/bash

## Copyright 2026 AdverXarial, byt3n33dl3.
##
## Licensed under the MIT License,
## you may not use this file except in compliance with the License.
## You may obtain a copy of the License at

set -e

echo "Installing BloodPengu (Daemon Mode)..."

INSTALL_DIR="$HOME/.bloodpengu"
BIN_DIR="$HOME/.local/bin"

mkdir -p "$INSTALL_DIR"
mkdir -p "$BIN_DIR"

echo "[+] Copying files..."
cp -r static "$INSTALL_DIR/"
cp server/bloodpengu-daemon.go "$INSTALL_DIR/main.go"
cp static/login.html "$INSTALL_DIR/static/"
cp static/js/auth-check.js "$INSTALL_DIR/static/js/"
mv "$INSTALL_DIR/static/index.html" "$INSTALL_DIR/static/index.html"
cp static/index.html "$INSTALL_DIR/static/index.html"

echo "[+] Building..."
cd "$INSTALL_DIR"
go build -o bloodpengu main.go

echo "[+] Creating launcher..."
cat > "$BIN_DIR/bloodpengu" << 'LAUNCHER'
#!/bin/bash
cd "$HOME/.bloodpengu"
./bloodpengu
LAUNCHER

chmod +x "$BIN_DIR/bloodpengu"

echo "[+] Checking PATH..."
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    echo ""
    echo "Add this to your ~/.bashrc or ~/.zshrc:"
    echo "export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
fi

echo "Installation complete!"
echo ""
echo "Run: bloodpengu"
echo "Credentials: pengu:pengu"
echo ""
