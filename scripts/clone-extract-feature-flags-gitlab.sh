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

# Clone or update the repo.
# We use --single-branch (only master) and --no-checkout (skip working tree)
# because we only need the git object DB for git-log, not the 94K checked-out
# files.  A blobless clone (--filter=blob:none) does NOT work reliably here
# because git-log --name-status triggers lazy tree fetches that overload
# GitLab's server with 503 errors.
MAX_RETRIES=5
RETRY_DELAY=60

clone_or_update() {
  if [ -d "$CLONE_DIR/.git" ]; then
    cd "$CLONE_DIR"
    git fetch origin
    git reset --hard origin/HEAD
  else
    rm -rf "$CLONE_DIR"
    mkdir -p "$(dirname "$CLONE_DIR")"
    git clone --single-branch --no-checkout "$REPO_URL" "$CLONE_DIR"
    cd "$CLONE_DIR"
  fi
}

for attempt in $(seq 1 "$MAX_RETRIES"); do
  if clone_or_update; then
    break
  fi
  if [ "$attempt" -eq "$MAX_RETRIES" ]; then
    echo "ERROR: Failed to clone/update after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "Attempt $attempt failed, retrying in ${RETRY_DELAY}s..."
  rm -rf "$CLONE_DIR"
  sleep "$RETRY_DELAY"
done

# extract log of added/deleted feature flag .yml files on main branch only
# All objects are local so this never contacts the remote.
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
