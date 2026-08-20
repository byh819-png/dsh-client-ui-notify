#!/usr/bin/env bash
# install.sh - install dsh-client-ui-notify into the local dsh web profile (macOS / Linux).
# Idempotent: safe to re-run. Touches only two locations:
#   1) $DSH_HOME/profiles/node_modules/@deepseek-ai/dsh-client-ui-notify/
#   2) $DSH_HOME/profiles/web/cordis.patch.yml (appends the loader row if missing)
# Usage:  bash install.sh

set -euo pipefail

# Locate DSH_HOME
if [[ -n "${DSH_HOME:-}" && -d "${DSH_HOME}" ]]; then
  dsh_home="$DSH_HOME"
else
  dsh_home="$HOME/.dsh"
fi
if [[ ! -d "$dsh_home" ]]; then
  echo "DSH_HOME not found: $dsh_home. Run dsh once (e.g. 'dsh web') or set DSH_HOME." >&2
  exit 1
fi

# 1) Copy the plugin package into the installation closure fallback directory
pkg_dir="$dsh_home/profiles/node_modules/@deepseek-ai/dsh-client-ui-notify"
src_dir="$(cd "$(dirname "$0")" && pwd)/package"
if [[ ! -d "$src_dir" ]]; then
  echo "package directory not found: $src_dir (extract the whole archive first)" >&2
  exit 1
fi

mkdir -p "$(dirname "$pkg_dir")"
if [[ -e "$pkg_dir" ]]; then
  echo "[1/3] Plugin directory already exists; overwriting: $pkg_dir"
  rm -rf "$pkg_dir"
fi
cp -R "$src_dir" "$pkg_dir"
echo "[1/3] Plugin copied to $pkg_dir"

# 2) Append the loader row to the web profile user layer
profile_dir="$dsh_home/profiles/web"
if [[ ! -d "$profile_dir" ]]; then
  echo "web profile not found: $profile_dir" >&2
  exit 1
fi
patch_file="$profile_dir/cordis.patch.yml"
[[ -f "$patch_file" ]] || printf '[]\n' > "$patch_file"
# A flow-style empty list ([]) cannot have block items appended after it,
# so drop the "no patches" placeholder line before appending the block.
if grep -q '^[[:space:]]*\[\]$' "$patch_file"; then
  sed -i.bak '/^[[:space:]]*\[\]$/d' "$patch_file" && rm -f "$patch_file.bak"
fi
if grep -q 'dsh-client-ui-notify' "$patch_file"; then
  echo '[2/3] cordis.patch.yml already contains the plugin row; skipping'
else
  cat >> "$patch_file" <<'EOF'

# Sound-alert plugin: rings on answer-complete and authorization-needed edges.
- insert:
    - id: ui-notify
      name: '@deepseek-ai/dsh-client-ui-notify'
EOF
  echo "[2/3] Appended the plugin row to $patch_file"
fi

# 3) Done
echo '[3/3] Installation complete. Restart the dsh web server, refresh the browser,'
echo '      then open Settings > General to find the Sound alerts row.'
