#!/bin/bash

# ============================================================================
# Script: Test GitHub Push - Verify upload without actual changes
# Purpose: Test the push_to_github.sh script with dry-run checks
# ============================================================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
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
  print_header "🧪 Test GitHub Push Configuration"

  REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$REPO_DIR"

  # ============================================================================
  # 1. Check git configuration
  # ============================================================================
  print_header "1️⃣  Git Configuration"

  # Check repo
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not a git repository"
    return 1
  fi
  print_success "Git repository: OK"

  # Check remote
  REMOTE_URL=$(git remote get-url origin 2>/dev/null)
  echo "Remote URL: $REMOTE_URL"
  
  if [[ "$REMOTE_URL" =~ github\.com/neostar-ja/ecc800 ]]; then
    print_success "Remote URL: OK"
  else
    print_error "Remote URL is incorrect"
    return 1
  fi

  # Check branch
  CURRENT_BRANCH=$(git branch --show-current)
  echo "Current branch: $CURRENT_BRANCH"
  if [[ -n "$CURRENT_BRANCH" ]]; then
    print_success "Branch: OK"
  else
    print_error "Could not determine current branch"
    return 1
  fi

  # ============================================================================
  # 2. Check authentication
  # ============================================================================
  print_header "2️⃣  GitHub Authentication"

  print_info "Testing connection to GitHub..."
  
  if timeout 5 git ls-remote origin > /dev/null 2>&1; then
    print_success "GitHub authentication: OK"
  else
    print_error "Cannot connect to GitHub"
    print_warning "Check your SSH keys or personal access token"
    return 1
  fi

  # ============================================================================
  # 3. Check for changes
  # ============================================================================
  print_header "3️⃣  Local Changes"

  STAGED=$(git diff --cached --name-only | wc -l)
  UNSTAGED=$(git diff --name-only | wc -l)
  UNTRACKED=$(git ls-files --others --exclude-standard | wc -l)

  echo "Staged files:       $STAGED"
  echo "Unstaged changes:   $UNSTAGED"
  echo "Untracked files:    $UNTRACKED"

  if [[ $STAGED -eq 0 && $UNSTAGED -gt 0 ]]; then
    print_warning "Changes exist but not staged - you'll need to stage them first"
  elif [[ $STAGED -gt 0 ]]; then
    print_success "Changes are staged for commit"
  else
    print_info "No changes to commit"
  fi

  # ============================================================================
  # 4. Check current status
  # ============================================================================
  print_header "4️⃣  Repository Status"

  # Check if local is ahead of remote
  UPSTREAM="origin/${CURRENT_BRANCH}"
  
  if git rev-parse "$UPSTREAM" > /dev/null 2>&1; then
    BEHIND=$(git rev-list "$CURRENT_BRANCH".."$UPSTREAM" 2>/dev/null | wc -l)
    AHEAD=$(git rev-list "$UPSTREAM".."$CURRENT_BRANCH" 2>/dev/null | wc -l)
    
    echo "Commits ahead of remote:  $AHEAD"
    echo "Commits behind remote:    $BEHIND"
    
    if [[ $BEHIND -gt 0 ]]; then
      print_warning "Your branch is behind remote. Consider pulling first: git pull origin $CURRENT_BRANCH"
    fi
    
    if [[ $AHEAD -gt 0 ]]; then
      print_success "You have $AHEAD commits ready to push"
    fi
  else
    print_info "Remote branch doesn't exist yet (first push)"
  fi

  # ============================================================================
  # 5. Check push_to_github.sh script
  # ============================================================================
  print_header "5️⃣  Push Script"

  PUSH_SCRIPT="$REPO_DIR/push_to_github.sh"
  
  if [[ ! -f "$PUSH_SCRIPT" ]]; then
    print_error "Script not found: $PUSH_SCRIPT"
    return 1
  fi
  print_success "Script exists: push_to_github.sh"

  if [[ -x "$PUSH_SCRIPT" ]]; then
    print_success "Script is executable"
  else
    print_error "Script is not executable"
    print_info "Run: chmod +x $PUSH_SCRIPT"
    return 1
  fi

  # ============================================================================
  # 6. Dry run - show what would happen
  # ============================================================================
  print_header "6️⃣  Dry Run Preview"

  if [[ $AHEAD -gt 0 ]]; then
    print_info "Latest commits to push:"
    git log --oneline "$UPSTREAM".."$CURRENT_BRANCH" | head -5 | sed 's/^/  /'
  elif [[ $STAGED -gt 0 ]]; then
    print_info "Staged changes ready to commit:"
    git diff --cached --name-only | sed 's/^/  /'
  else
    print_info "No changes to push"
  fi

  # ============================================================================
  # 7. Summary
  # ============================================================================
  print_header "✅ Test Complete"

  echo "All checks passed! You can now run the push script:"
  echo ""
  echo "   $PUSH_SCRIPT"
  echo ""
  echo "Or simply:"
  echo "   ./push_to_github.sh"
  echo ""

  return 0
}

main "$@"
