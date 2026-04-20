#!/bin/bash
set -euo pipefail

# ============================================================================
# Script: Push Project to GitHub with Safety Checks
# Repository: https://github.com/neostar-ja/ecc800
# Purpose: Upload changes to GitHub with verification
# ============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function: Print header
print_header() {
  echo ""
  echo -e "${BOLD}${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}${BLUE}$1${NC}"
  echo -e "${BOLD}${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
  echo ""
}

# Function: Print success
print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Function: Print error
print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Function: Print warning
print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function: Print info
print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function: Ask for confirmation
confirm() {
  local prompt="$1"
  local response
  read -p "$(echo -e ${YELLOW}$prompt${NC}) (y/n): " response
  [[ "$response" =~ ^[Yy]$ ]]
}

main() {
  print_header "📤 Push ecc800 Project to GitHub"

  REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$REPO_DIR"

  # ============================================================================
  # 1. Pre-flight Checks
  # ============================================================================
  print_header "1️⃣  Pre-flight Checks"

  # Check if git repo
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "This is not a git repository"
    exit 1
  fi
  print_success "Git repository found"

  # Check remote
  REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
  if [[ ! "$REMOTE_URL" =~ github\.com/neostar-ja/ecc800 ]]; then
    print_error "Remote URL is not correct: $REMOTE_URL"
    exit 1
  fi
  print_success "Remote URL: $REMOTE_URL"

  # Check current branch
  CURRENT_BRANCH=$(git branch --show-current)
  if [[ "$CURRENT_BRANCH" != "main" ]]; then
    print_warning "Current branch is: $CURRENT_BRANCH (not main)"
    if ! confirm "Continue pushing from $CURRENT_BRANCH?"; then
      print_info "Aborted"
      exit 0
    fi
  else
    print_success "Current branch: $CURRENT_BRANCH"
  fi

  # ============================================================================
  # 2. Check for uncommitted changes and commits ready to push
  # ============================================================================
  print_header "2️⃣  Checking Changes & Commits"

  STAGED=$(git diff --cached --name-only | wc -l)
  UNSTAGED=$(git diff --name-only | wc -l)
  UNTRACKED=$(git ls-files --others --exclude-standard | wc -l)

  echo "Staged files:       $STAGED"
  echo "Unstaged changes:   $UNSTAGED"
  echo "Untracked files:    $UNTRACKED"

  # Check for commits ready to push
  COMMITS_AHEAD=$(git rev-list origin/main..HEAD 2>/dev/null | wc -l || echo 0)
  echo "Commits ahead:      $COMMITS_AHEAD"
  echo ""

  # If no uncommitted changes but has commits to push, just push them
  if [[ $STAGED -eq 0 && $UNSTAGED -eq 0 && $UNTRACKED -eq 0 ]]; then
    if [[ $COMMITS_AHEAD -gt 0 ]]; then
      print_success "Ready to push $COMMITS_AHEAD commit(s)"
      PUSH_EXISTING_COMMITS=true
    else
      print_warning "No changes to commit and no commits to push"
      print_info "Everything is up to date"
      exit 0
    fi
  else
    PUSH_EXISTING_COMMITS=false
  fi

  # Show summary of changes (only if not pushing existing commits)
  if [[ "$PUSH_EXISTING_COMMITS" == "false" ]]; then
    print_info "Changes to be reviewed:"
    echo ""
    
    if [[ $UNSTAGED -gt 0 ]]; then
      echo "📝 Unstaged changes:"
      git diff --name-only | sed 's/^/   - /'
      echo ""
    fi

    if [[ $UNTRACKED -gt 0 ]]; then
      echo "📄 Untracked files:"
      git ls-files --others --exclude-standard | head -10 | sed 's/^/   - /'
      if [[ $UNTRACKED -gt 10 ]]; then
        echo "   ... and $((UNTRACKED - 10)) more files"
      fi
      echo ""
    fi
  fi

  # ============================================================================
  # 3. Prepare commit (skip if pushing existing commits)
  # ============================================================================
  if [[ "$PUSH_EXISTING_COMMITS" == "true" ]]; then
    print_header "3️⃣  Skip Commit (Pushing Existing Commits)"
    print_info "Pushing existing commits to GitHub..."
    COMMIT_MSG_PROVIDED=true
  else
    print_header "3️⃣  Prepare Commit"

    print_info "Options:"
    echo "  1) Add all changes (git add -A)"
    echo "  2) Add specific files (git add ...)"
    echo "  3) Cancel"
    echo ""
    
    read -p "Choose option (1-3): " choice

    case $choice in
      1)
        print_info "Staging all changes..."
        git add -A
        print_success "All changes staged"
        ;;
      2)
        read -p "Enter files to add (space-separated, or 'all'): " files
        if [[ "$files" == "all" ]]; then
          git add -A
        else
          git add $files
        fi
        print_success "Files staged"
        ;;
      *)
        print_info "Cancelled"
        exit 0
        ;;
    esac

    # Show what will be committed
    echo ""
    print_info "Files staged for commit:"
    git diff --cached --name-only | sed 's/^/   - /'
    echo ""
    COMMIT_MSG_PROVIDED=false
  fi

  # ============================================================================
  # 4. Create commit message (skip if pushing existing commits)
  # ============================================================================
  if [[ "$COMMIT_MSG_PROVIDED" == "false" ]]; then
    print_header "4️⃣  Create Commit Message"

    print_info "Enter commit message (or leave empty to use default):"
    echo "  Default: 'Update: $(date +%Y-%m-%d) - Backend and frontend improvements'"
    echo ""
    
    read -p "Commit message: " commit_msg

    if [[ -z "$commit_msg" ]]; then
      commit_msg="Update: $(date +%Y-%m-%d) - Backend and frontend improvements"
    fi

    print_info "Commit message: $commit_msg"
  else
    print_header "4️⃣  Skip Commit Message"
    print_info "Using existing commits, no new message needed"
  fi

  # ============================================================================
  # 5. Security scan (skip if pushing existing commits)
  # ============================================================================
  if [[ "$PUSH_EXISTING_COMMITS" == "false" ]]; then
    print_header "5️⃣  Security Scan (Pre-commit Check)"

    SUSPICIOUS_PATTERNS='(POSTGRES_PASSWORD=|JWT_SECRET=|BEGIN RSA PRIVATE KEY|BEGIN OPENSSH PRIVATE KEY|aws_secret|api_key|password\s*=|Kanokwan@1987)'
    
    if git diff --cached -U0 | grep -E -i "$SUSPICIOUS_PATTERNS" > /dev/null 2>&1; then
      print_warning "⚠️  Potential secrets detected in staged changes!"
      echo ""
      echo "Matched lines:"
      git diff --cached -U0 | grep -E -i -n "$SUSPICIOUS_PATTERNS" || true
      echo ""
      
      if ! confirm "Continue with commit anyway?"; then
        print_info "Commit cancelled for security reasons"
        git reset
        exit 0
      fi
    else
      print_success "No obvious secrets detected"
    fi
  else
    print_header "5️⃣  Security Scan (Skipped)"
    print_info "Using existing commits, no new security scan needed"
  fi

  # ============================================================================
  # 6. Confirm before commit/push
  # ============================================================================
  print_header "6️⃣  Review Before Pushing"

  echo "📊 Summary:"
  echo "  Repository: $REMOTE_URL"
  echo "  Branch:     $CURRENT_BRANCH"
  
  if [[ "$PUSH_EXISTING_COMMITS" == "true" ]]; then
    echo "  Action:     Push existing commits"
    echo "  Commits:    $COMMITS_AHEAD"
  else
    echo "  Message:    $commit_msg"
    echo "  Files:      $(git diff --cached --name-only | wc -l)"
  fi
  echo ""

  if ! confirm "Proceed with push?"; then
    print_info "Cancelled"
    if [[ "$PUSH_EXISTING_COMMITS" == "false" ]]; then
      git reset
    fi
    exit 0
  fi

  # ============================================================================
  # 7. Commit (skip if pushing existing commits)
  # ============================================================================
  if [[ "$PUSH_EXISTING_COMMITS" == "false" ]]; then
    print_header "7️⃣  Committing Changes"

    if git commit -m "$commit_msg"; then
      print_success "Commit created successfully"
      COMMIT_HASH=$(git rev-parse --short HEAD)
      print_info "Commit: $COMMIT_HASH"
    else
      print_error "Commit failed"
      exit 1
    fi
  else
    print_header "7️⃣  Skip Commit (Already Have Commits)"
    print_info "Using existing commits, no new commit needed"
    COMMIT_HASH=$(git rev-parse --short HEAD)
    print_info "Latest commit: $COMMIT_HASH"
  fi

  # ============================================================================
  # 8. Push to GitHub
  # ============================================================================
  print_header "8️⃣  Push to GitHub"

  print_info "Pushing to $REMOTE_URL (branch: $CURRENT_BRANCH)..."
  
  if git push origin "$CURRENT_BRANCH"; then
    print_success "Push successful"
  else
    print_error "Push failed"
    print_warning "Try checking your SSH keys or GitHub authentication"
    exit 1
  fi

  # ============================================================================
  # 9. Verify push
  # ============================================================================
  print_header "9️⃣  Verify Push"

  print_info "Checking remote status..."
  sleep 2

  # Fetch from remote to verify
  if git fetch origin "$CURRENT_BRANCH" 2>/dev/null; then
    print_success "Remote is accessible"
    
    # Check if local and remote are in sync
    LOCAL=$(git rev-parse "$CURRENT_BRANCH")
    REMOTE=$(git rev-parse "origin/$CURRENT_BRANCH")
    
    if [[ "$LOCAL" == "$REMOTE" ]]; then
      print_success "Local and remote are in sync ✅"
      print_info "Latest commit: $COMMIT_HASH"
    else
      print_warning "Local and remote differ (this is unexpected)"
    fi
  else
    print_warning "Could not verify remote status"
  fi

  # ============================================================================
  # 10. Summary
  # ============================================================================
  print_header "🎉 Push Complete"

  echo "✨ Success! Your changes have been pushed to GitHub"
  echo ""
  echo "📊 Summary:"
  echo "  Repository: $REMOTE_URL"
  echo "  Branch:     $CURRENT_BRANCH"
  echo "  Commit:     $COMMIT_HASH"
  echo "  Message:    $commit_msg"
  echo ""
  echo "🔗 View on GitHub:"
  echo "  https://github.com/neostar-ja/ecc800/commits/$CURRENT_BRANCH"
  echo ""
  echo "✅ Next steps:"
  echo "  1. Monitor CI/CD pipelines on GitHub Actions (if configured)"
  echo "  2. Create a Pull Request if this is a feature branch"
  echo "  3. Tag releases when ready: git tag -a v1.0.0 && git push origin v1.0.0"
  echo ""
}

# Run main function
main "$@"
