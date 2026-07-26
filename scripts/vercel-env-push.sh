#!/usr/bin/env bash
set -euo pipefail

# .env.prod の各変数を Vercel の指定環境 (既定: production) に push する。
#
# 使い方:
#   npm run env:push                 # .env.prod → production
#   bash scripts/vercel-env-push.sh [ENV_FILE] [TARGET] [-y]
#     ENV_FILE : 既定 .env.prod
#     TARGET   : production | preview | development (既定 production)
#     -y       : 確認プロンプトをスキップ
#
# 前提:
#   - リポジトリが vercel link 済み (.vercel/project.json が存在)
#   - vercel にログイン済み (`npx vercel login`)
#
# 挙動:
#   - コメント行(#) / 空行 / 値が空の行はスキップ (Vercel 側の既存値を保持)
#   - 既存の同名変数を削除してから追加 (add は上書き不可のため)
#   - 反映には再デプロイが必要 (`npx vercel --prod` か Git push)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

ENV_FILE="$ROOT/.env.prod"
TARGET="production"
ASSUME_YES=0
for arg in "$@"; do
  case "$arg" in
    -y|--yes) ASSUME_YES=1 ;;
    production|preview|development) TARGET="$arg" ;;
    *) [[ -f "$arg" ]] && ENV_FILE="$arg" ;;
  esac
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ENV ファイルが見つかりません: $ENV_FILE" >&2
  exit 1
fi
if [[ ! -f "$ROOT/.vercel/project.json" ]]; then
  echo "vercel link されていません。先に \`npx vercel link\` を実行してください。" >&2
  exit 1
fi

VERCEL=(npx --yes vercel)

# push 対象キーを収集
keys=()
declare -a vals=()
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"                      # CRLF 対策
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line//[[:space:]]/}" ]] && continue
  [[ "$line" != *"="* ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  key="${key//[[:space:]]/}"
  [[ -z "$key" ]] && continue
  [[ -z "$val" ]] && { echo "skip (empty): $key"; continue; }
  # 前後のダブルクオートを剥がす
  if [[ "$val" == \"*\" ]]; then val="${val:1:${#val}-2}"; fi
  keys+=("$key")
  vals+=("$val")
done < "$ENV_FILE"

if [[ ${#keys[@]} -eq 0 ]]; then
  echo "push 対象の変数がありません。"
  exit 0
fi

echo "== Vercel [$TARGET] に push する変数 (${#keys[@]}) =="
for k in "${keys[@]}"; do echo "  - $k"; done

if [[ "$ASSUME_YES" -ne 1 ]]; then
  read -r -p "実行しますか? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || { echo "中止しました。"; exit 0; }
fi

for i in "${!keys[@]}"; do
  k="${keys[$i]}"; v="${vals[$i]}"
  "${VERCEL[@]}" env rm "$k" "$TARGET" -y >/dev/null 2>&1 || true
  printf '%s' "$v" | "${VERCEL[@]}" env add "$k" "$TARGET" >/dev/null
  echo "pushed: $k"
done

echo ""
echo "✓ 完了。反映には再デプロイが必要です:"
echo "    npx vercel --prod        # もしくは Git push で本番デプロイ"
