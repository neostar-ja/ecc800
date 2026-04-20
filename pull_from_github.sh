#!/bin/bash
set -euo pipefail

# ============================================================================
# Script: Pull and Sync with Remote
# Purpose: Update local repo with remote changes before pushing
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

print_header() {
  echo ""
  echo -e "${BOLD}${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}${BLUE}$1${NC}"
  echo -e "${BOLD}${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

main() {
  print_header "🔄 Pull and Sync with Remote"

  REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$REPO_DIR"

  # Check git repo
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not a git repository"
    exit 1
  fi

  CURRENT_BRANCH=$(git branch --show-current)
  print_info "Current branch: $CURRENT_BRANCH"

  # ============================================================================
  # 1. Check status before pulling
  # ============================================================================
  print_header "1️⃣  Check Status Before Pull"

  STAGED=$(git diff --cached --name-only | wc -l)
  UNSTAGED=$(git diff --name-only | wc -l)

  if [[ $STAGED -gt 0 || $UNSTAGED -gt 0 ]]; then
    print_warning "You have uncommitted changes:"
    echo "  Staged:   $STAGED"
    echo "  Unstaged: $UNSTAGED"
    echo ""
    
    read -p "Stash changes before pulling? (y/n): " stash_response
    if [[ "$stash_response" =~ ^[Yy]$ ]]; then
      print_info "Stashing changes..."
      git stash
      print_success "Changes stashed"
      STASHED=true
    else
      print_warning "Pulling with local changes might cause conflicts"
      STASHED=false
    fi
  else
    print_success "No uncommitted changes"
    STASHED=false
  fi

  # ============================================================================
  # 2. Fetch from remote
  # ============================================================================
  print_header "2️⃣  Fetch from Remote"

  print_info "Fetching from origin..."
  if git fetch origin; then
    print_success "Fetch successful"
  else
    print_error "Fetch failed"
    if [[ "$STASHED" == "true" ]]; then
      print_info "Restoring stashed changes..."
      git stash pop
    fi
    exit 1
  fi

  # ============================================================================
  # 3. Check for conflicts
  # ============================================================================
  print_header "3️⃣  Check for Merge Conflicts"

  REMOTE_BRANCH="origin/$CURRENT_BRANCH"
  
  if ! git rev-parse "$REMOTE_BRANCH" > /dev/null 2>&1; then
    print_warning "Remote branch doesn't exist: $REMOTE_BRANCH"
    print_info "This is the first push to this branch"
    if [[ "$STASHED" == "true" ]]; then
      print_info "Restoring stashed changes..."
      git stash pop
    fi
    exit 0
  fi

  # Check merge conflicts
  MERGE_BASE=$(git merge-base "$CURRENT_BRANCH" "$REMOTE_BRANCH")
  CURRENT_TREE=$(git rev-parse "$CURRENT_BRANCH^{tree}")
  REMOTE_TREE=$(git rev-parse "$REMOTE_BRANCH^{tree}")

  if [[ "$CURRENT_TREE" == "$REMOTE_TREE" ]]; then
    print_success "No conflicts detected"
  fi

  # ============================================================================
  # 4. Pull from remote
  # ============================================================================
  print_header "4️⃣  Pull from Remote"

  print_info "Pulling from $REMOTE_BRANCH..."
  
  if git pull origin "$CURRENT_BRANCH" --no-edit; then
    print_success "Pull successful"
  else
    print_error "Pull failed - there might be merge conflicts"
    print_warning "Please resolve conflicts manually and then commit"
    print_info "Commands to resolve:"
    echo "  1. Edit conflicting files"
    echo "  2. git add <resolved-files>"
    echo "  3. git commit -m 'Resolve merge conflicts'"
    echo "  4. ./push_to_github.sh"
    
    if [[ "$STASHED" == "true" ]]; then
      print_info "Note: You have stashed changes still to be restored"
      print_info "After resolving conflicts, run: git stash pop"
    fi
    exit 1
  fi

  # ============================================================================
  # 5. Status after pull
  # ============================================================================
  print_header "5️⃣  Status After Pull"

  AHEAD=$(git rev-list "$REMOTE_BRANCH".."$CURRENT_BRANCH" 2>/dev/null | wc -l)
  BEHIND=$(git rev-list "$CURRENT_BRANCH".."$REMOTE_BRANCH" 2>/dev/null | wc -l)

  echo "Commits ahead of remote: $AHEAD"
  echo "Commits behind remote:   $BEHIND"

  if [[ $BEHIND -gt 0 ]]; then
    print_warning "Still behind remote - something went wrong"
    exit 1
  fi

  if [[ $AHEAD -gt 0 ]]; then
    print_success "Local branch is ahead - ready to push"
  else
    print_info "Local branch is in sync with remote"
  fi

  # ============================================================================
  # 6. Restore stashed changes if needed
  # ============================================================================
  if [[ "$STASHED" == "true" ]]; then
    print_header "6️⃣  Restore Stashed Changes"
    
    print_info "Restoring stashed changes..."
    if git stash pop; then
      print_success "Stashed changes restored"
    else
      print_warning "Conflict while restoring - please resolve manually"
      echo "Stashed changes available with: git stash pop"
    fi
  fi

  # ============================================================================
  # 7. Summary
  # ============================================================================
  print_header "✅ Pull and Sync Complete"

  echo "✨ Your local branch is now in sync with remote"
  echo ""
  echo "📊 Status:"
  echo "  Branch:        $CURRENT_BRANCH"
  echo "  Commits ahead: $AHEAD (ready to push)"
  echo "  Commits behind: $BEHIND (should be 0)"
  echo ""
  
  if [[ $AHEAD -gt 0 ]]; then
    echo "🚀 Next step:"
    echo "  Run: ./push_to_github.sh"
  else
    echo "ℹ️  No local commits to push"
    echo "   If you made changes, stage and commit them first:"
    echo "   git add . && git commit -m 'Your message'"
  fi
  echo ""
}

main "$@"
