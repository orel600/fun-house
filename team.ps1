# Launch one standing fun-house team session with Remote Control.
# Usage: .\team.ps1 max|dana|bob|quinn|ari
param([Parameter(Mandatory=$true)][ValidateSet('max','dana','bob','quinn','ari')][string]$Role)
claude --remote-control ($Role.ToUpper()) --append-system-prompt-file ".claude/team/$Role.md"
