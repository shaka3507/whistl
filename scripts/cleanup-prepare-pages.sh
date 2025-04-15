#!/bin/bash

# Cleanup script for removing old individual prepare topic directories
# now that we've switched to a dynamic route structure

echo "Cleaning up old individual prepare topic directories..."

# List of topic directories to remove
TOPICS=(
  "earthquake"
  "hurricane"
  "tornado"
  "flood"
  "wildfire"
  "winter-storm"
  "heatwave"
  "thunderstorm"
  "tsunami"
  "emergency-kit"
  "family-plan"
  "pet-safety"
)

# Directories to preserve (not to be removed)
PRESERVE=(
  "[slug]"      # Our new dynamic route directory
  "components"  # Shared components
  "test"        # Testing utilities
  "weather"     # Weather-related functionality
  "create-plan" # Plan creation functionality
)

# Directory to remove from
BASE_DIR="app/prepare"

# Track counts
REMOVED=0
SKIPPED=0
PRESERVED=0

# Function to check if an element is in an array
contains() {
  local e match="$1"
  shift
  for e; do [[ "$e" == "$match" ]] && return 0; done
  return 1
}

# Ask for confirmation
echo "This script will remove old individual prepare topic directories."
echo "The following directories will be PRESERVED:"
for preserve in "${PRESERVE[@]}"; do
  echo "  - $preserve"
done
echo ""
echo "The following directories will be REMOVED if they exist:"
for topic in "${TOPICS[@]}"; do
  echo "  - $topic"
done
echo ""
read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Operation cancelled."
  exit 1
fi

# Function to safely remove a directory if it's not in the preserve list
remove_dir() {
  local dir_name="$1"
  local full_path="$BASE_DIR/$dir_name"
  
  # Check if it's in our preserve list
  if contains "$dir_name" "${PRESERVE[@]}"; then
    echo "Preserved: $full_path (important directory)"
    PRESERVED=$((PRESERVED+1))
    return
  fi
  
  # Remove if it exists
  if [ -d "$full_path" ]; then
    echo "Removing: $full_path"
    rm -rf "$full_path"
    REMOVED=$((REMOVED+1))
  else
    echo "Skipped: $full_path (not found)"
    SKIPPED=$((SKIPPED+1))
  fi
}

# Remove each topic directory
for topic in "${TOPICS[@]}"; do
  remove_dir "$topic"
done

echo ""
echo "Cleanup complete!"
echo "Removed: $REMOVED directories"
echo "Skipped: $SKIPPED directories"
echo "Preserved: $PRESERVED directories"
echo ""
echo "The prepare library now uses a dynamic route system with:"
echo "- app/prepare/page.tsx - Main prepare library page"
echo "- app/prepare/[slug]/page.tsx - Dynamic route handler for all topics"
echo "- public/data/prepare/*.json - JSON data files for each topic" 