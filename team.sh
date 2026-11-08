#!/usr/bin/env bash
# Launch one standing fun-house team session with Remote Control.
# Usage: ./team.sh max|dana|bob|quinn|ari
set -euo pipefail
role="${1:?usage: ./team.sh max|dana|bob|quinn|ari}"
case "$role" in max|dana|bob|quinn|ari) ;; *) echo "unknown role: $role" >&2; exit 1;; esac
name=$(echo "$role" | tr '[:lower:]' '[:upper:]')
exec claude --remote-control "$name" --append-system-prompt-file ".claude/team/$role.md"
