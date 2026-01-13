#!/usr/bin/env bash

set -e

# Dependency Audit Framework - Installation Script
# This script installs dependency auditing tools for multiple programming languages

VERSION="1.0.0"
REPO_URL="https://github.com/brianwpiper/core"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            DISTRO=$ID
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Node.js tools
install_nodejs_tools() {
    log_info "Checking Node.js dependency audit tools..."

    if ! command_exists node; then
        log_warn "Node.js not found. Skipping Node.js tools."
        log_info "Install Node.js from: https://nodejs.org/"
        return
    fi

    log_info "Node.js $(node --version) detected"

    # npm audit is built-in with npm, but we can install useful global tools
    log_info "Installing npm-check-updates for dependency updates..."
    npm install -g npm-check-updates 2>/dev/null || log_warn "Failed to install npm-check-updates (may need sudo)"

    log_success "Node.js tools ready (npm audit is built-in)"
}

# Install Python tools
install_python_tools() {
    log_info "Checking Python dependency audit tools..."

    if ! command_exists python3 && ! command_exists python; then
        log_warn "Python not found. Skipping Python tools."
        log_info "Install Python from: https://www.python.org/"
        return
    fi

    PYTHON_CMD=$(command_exists python3 && echo "python3" || echo "python")
    PIP_CMD=$(command_exists pip3 && echo "pip3" || echo "pip")

    log_info "Python $($PYTHON_CMD --version 2>&1 | cut -d' ' -f2) detected"

    log_info "Installing pip-audit..."
    $PIP_CMD install --user pip-audit 2>/dev/null || log_warn "Failed to install pip-audit"

    log_info "Installing safety..."
    $PIP_CMD install --user safety 2>/dev/null || log_warn "Failed to install safety"

    log_info "Installing pip-review..."
    $PIP_CMD install --user pip-review 2>/dev/null || log_warn "Failed to install pip-review"

    log_success "Python audit tools installed"
}

# Install Go tools
install_go_tools() {
    log_info "Checking Go dependency audit tools..."

    if ! command_exists go; then
        log_warn "Go not found. Skipping Go tools."
        log_info "Install Go from: https://go.dev/"
        return
    fi

    log_info "Go $(go version | awk '{print $3}') detected"

    log_info "Installing govulncheck..."
    go install golang.org/x/vuln/cmd/govulncheck@latest 2>/dev/null || log_warn "Failed to install govulncheck"

    log_success "Go audit tools installed"
}

# Install Rust tools
install_rust_tools() {
    log_info "Checking Rust dependency audit tools..."

    if ! command_exists cargo; then
        log_warn "Rust/Cargo not found. Skipping Rust tools."
        log_info "Install Rust from: https://rustup.rs/"
        return
    fi

    log_info "Rust $(rustc --version | awk '{print $2}') detected"

    log_info "Installing cargo-audit..."
    cargo install cargo-audit 2>/dev/null || log_warn "Failed to install cargo-audit"

    log_success "Rust audit tools installed"
}

# Install universal tools
install_universal_tools() {
    log_info "Checking universal security tools..."

    # Snyk (optional)
    if command_exists npm; then
        read -p "Install Snyk CLI? (requires Snyk account) [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Installing Snyk..."
            npm install -g snyk 2>/dev/null || log_warn "Failed to install Snyk"
            log_info "Run 'snyk auth' to authenticate"
        fi
    fi
}

# Download audit documentation and workflows
install_documentation() {
    log_info "Would you like to download the Dependency Audit documentation and workflows?"
    read -p "Download to current directory? [y/N]: " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Downloading DEPENDENCY_AUDIT.md..."
        curl -fsSL "${REPO_URL}/raw/main/DEPENDENCY_AUDIT.md" -o DEPENDENCY_AUDIT.md 2>/dev/null && \
            log_success "Downloaded DEPENDENCY_AUDIT.md" || \
            log_warn "Failed to download documentation"

        if [ ! -d ".github/workflows" ]; then
            mkdir -p .github/workflows
        fi

        log_info "Downloading GitHub Actions workflow..."
        curl -fsSL "${REPO_URL}/raw/main/.github/workflows/dependency-audit.yml" -o .github/workflows/dependency-audit.yml 2>/dev/null && \
            log_success "Downloaded .github/workflows/dependency-audit.yml" || \
            log_warn "Failed to download workflow"

        log_info "Downloading Dependabot configuration..."
        curl -fsSL "${REPO_URL}/raw/main/.github/dependabot.yml" -o .github/dependabot.yml 2>/dev/null && \
            log_success "Downloaded .github/dependabot.yml" || \
            log_warn "Failed to download Dependabot config"
    fi
}

# Print usage information
print_usage() {
    echo ""
    log_success "Installation complete!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Dependency Audit Framework v${VERSION}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Quick Start Commands:"
    echo ""
    echo "  Node.js:"
    echo "    npm audit                    # Security audit"
    echo "    npm outdated                 # Check outdated packages"
    echo "    npx depcheck                 # Find unused dependencies"
    echo "    npx npm-check-updates -i     # Interactive update"
    echo ""
    echo "  Python:"
    echo "    pip-audit                    # Security audit"
    echo "    safety check                 # Vulnerability scan"
    echo "    pip-review --local           # Check outdated packages"
    echo ""
    echo "  Go:"
    echo "    govulncheck ./...            # Vulnerability check"
    echo "    go list -u -m all            # Check for updates"
    echo ""
    echo "  Rust:"
    echo "    cargo audit                  # Security audit"
    echo "    cargo outdated               # Check outdated crates"
    echo ""
    if command_exists snyk; then
        echo "  Universal (Snyk):"
        echo "    snyk auth                    # Authenticate (first time)"
        echo "    snyk test                    # Test for vulnerabilities"
        echo ""
    fi
    echo "Documentation:"
    echo "  ${REPO_URL}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Main installation flow
main() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Dependency Audit Framework - Installer v${VERSION}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    detect_os
    log_info "Detected OS: $OS"
    echo ""

    # Install tools for each ecosystem
    install_nodejs_tools
    echo ""
    install_python_tools
    echo ""
    install_go_tools
    echo ""
    install_rust_tools
    echo ""
    install_universal_tools
    echo ""
    install_documentation

    # Print usage
    print_usage
}

# Run main function
main "$@"
