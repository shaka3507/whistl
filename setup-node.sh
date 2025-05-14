#!/bin/bash

# Check if NVM is installed
if [ -z "$(command -v nvm)" ]; then
  echo "NVM is not installed. Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  
  # Source NVM
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
fi

# Install and use the Node.js version specified in .nvmrc
echo "Installing and using Node.js version specified in .nvmrc..."
nvm install
nvm use

# Verify the Node.js version
node -v

echo "Node.js is now set up correctly!" 