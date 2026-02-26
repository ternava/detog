#!/usr/bin/env bash
set -euxo pipefail

# base directory
BASE_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
# where to clone (or update) the repo
CLONE_DIR=${1:-"$BASE_DIR/code/gitlab"}
# upstream URL if cloning
REPO_URL=${2:-"https://gitlab.com/gitlab-org/gitlab.git"}
# output CSV
OUTPUT_CSV=${3:-"$BASE_DIR/static/data/gitlab_feature_flags_events.csv"}

# ensure target dir exists
mkdir -p "$(dirname "$OUTPUT_CSV")"

# clone or update the repo
# Use --filter=blob:none for a blobless clone (much faster for large repos
# like GitLab ~13 GB); git log --name-status only needs the commit graph.
if [ -d "$CLONE_DIR/.git" ]; then
  cd "$CLONE_DIR"
  git pull
else
  rm -rf "$CLONE_DIR"
  mkdir -p "$(dirname "$CLONE_DIR")"
  git clone --filter=blob:none --single-branch "$REPO_URL" "$CLONE_DIR"
  cd "$CLONE_DIR"
fi

# extract log of added/deleted feature flag .yml files on main branch only
LOGFILE=$(mktemp)
git log --diff-filter=AD --name-status --date=short \
  --pretty=format:"commit %H %P%nDate: %ad" \
  -- 'config/feature_flags/' \
  > "$LOGFILE"

# parse into CSV (disable -e during the loop to avoid early exit on pattern mismatches)
: > "$OUTPUT_CSV"
echo "sha,date,event,feature,line" >> "$OUTPUT_CSV"

set +e
sha=""
date=""
skip=""   # set to 1 for root (parentless) commits
while IFS= read -r line; do
  if [[ $line =~ ^commit[[:space:]]([0-9a-f]{40})(.*) ]]; then
    sha="${BASH_REMATCH[1]}"
    parents="${BASH_REMATCH[2]}"
    # skip root (orphan) commits, they have no parent hashes
    if [[ -z "${parents// /}" ]]; then
      skip=1
    else
      skip=""
    fi
  elif [[ $line =~ ^Date:[[:space:]]+([0-9]{4}-[0-9]{2}-[0-9]{2}) ]]; then
    date="${BASH_REMATCH[1]}"
  elif [[ -z "$skip" && $line == A$'\t'*.yml ]]; then
    path="${line#A$'\t'}"
    feat=$(basename "$path" .yml)
    echo "${sha},${date},added,${feat},\"${path}\"" >> "$OUTPUT_CSV"
  elif [[ -z "$skip" && $line == D$'\t'*.yml ]]; then
    path="${line#D$'\t'}"
    feat=$(basename "$path" .yml)
    echo "${sha},${date},removed,${feat},\"${path}\"" >> "$OUTPUT_CSV"
  fi
done < "$LOGFILE"
set -e

rm "$LOGFILE"
cd "$BASE_DIR"

echo "Extracted feature flags to $OUTPUT_CSV"
