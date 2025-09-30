#!/usr/bin/env bash
set -euo pipefail

# base directory
BASE_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
# where to clone (or update) the repo
CLONE_DIR=${1:-"$BASE_DIR/code/kubernetes"}
# upstream URL if cloning
REPO_URL=${2:-"https://github.com/kubernetes/kubernetes.git"}
# output CSV
OUTPUT_CSV=${3:-"$BASE_DIR/static/data/feature_gates_events.csv"}

# ensure target dir exists
mkdir -p "$(dirname "$OUTPUT_CSV")"

# always remove any old clone and clone fresh
rm -rf "$CLONE_DIR"
mkdir -p "$(dirname "$CLONE_DIR")"
git clone "$REPO_URL" "$CLONE_DIR"
cd "$CLONE_DIR"

# extract full patch log for kube_features.go across all refs
LOGFILE=$(mktemp)
git log -p --date=short --branches --tags --remotes \
  -G 'featuregate\.Feature|utilfeature\.Feature' -- pkg/features/kube_features.go \
  > "$LOGFILE"

# parse into CSV
: > "$OUTPUT_CSV"
echo "sha,date,event,feature,line" >> "$OUTPUT_CSV"

sha=""
date=""
while IFS= read -r line; do
  if [[ $line =~ ^commit[[:space:]]([0-9a-f]{40}) ]]; then
    sha="${BASH_REMATCH[1]}"
  elif [[ $line =~ ^[[:space:]]*Date:[[:space:]]+([0-9]{4}-[0-9]{2}-[0-9]{2}) ]]; then
    date="${BASH_REMATCH[1]}"
  elif [[ $line =~ ^\+.*(featuregate\.Feature|utilfeature\.Feature)[[:space:]]*=[[:space:]]*\"([^\"]+)\" ]]; then
    feat="${BASH_REMATCH[2]}"
    echo "${sha},${date},added,${feat},\"${line}\"" >> "$OUTPUT_CSV"
  elif [[ $line =~ ^\-.*(featuregate\.Feature|utilfeature\.Feature)[[:space:]]*=[[:space:]]*\"([^\"]+)\" ]]; then
    feat="${BASH_REMATCH[2]}"
    echo "${sha},${date},removed,${feat},\"${line}\"" >> "$OUTPUT_CSV"
  fi
done < "$LOGFILE"

rm "$LOGFILE"
cd "$BASE_DIR"

echo "Extracted feature gates to $OUTPUT_CSV"