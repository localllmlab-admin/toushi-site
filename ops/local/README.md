# ローカルLLM記事生成パイプライン（GMKtec EVO-X1）

## 構成
```
EVO-X1 (WSL2/Ubuntu + Ollama)          コスト
├─ ドラフト生成      Qwen3 14B          ¥0（電気代のみ）
├─ ルーブリック審査   Qwen3 14B ×最大3   ¥0
├─ 自己改稿ループ     Qwen3 14B ×最大2   ¥0
├─ 日本語スタイルlint 決定論スクリプト    ¥0
└─ 磨き（任意）      DeepSeek API ×1    数円以下/記事
     ↓ git push → PR（reviewed:false）
VPS/人間: validate → レビュー承認 → merge → deploy
```
生成の試行錯誤（トークン消費の大半）がローカルに寄るため、API使用は記事1本あたり磨き1呼び出しに固定される。`--no-polish` で完全ゼロコスト運転も可能。

## セットアップ（EVO-X1 / WSL2）
```bash
# Ollama 稼働確認（構築済み前提）
ollama pull qwen3:14b
curl -s http://localhost:11434/api/tags | head

# リポジトリ
git clone <repo> && cd toushi-site && npm ci

# API磨きを使う場合のみ
export OPENROUTER_API_KEY=sk-or-...   # ~/.bashrc へ

# 手動テスト（ファイルを書かず出力確認）
node ops/local/pipeline.mjs --dry-run --no-polish

# 夜間cron登録（WSL2）
crontab -e
# 0 2 * * * cd /path/to/toushi-site && ops/local/run_nightly.sh >> ops/local/nightly.log 2>&1
```

## 品質の考え方（なぜローカルでも高品質な日本語になるか）
1. **自由度を奪う**: 厳格なテンプレ＋文体アンカー（模範記事の抜粋）で、モデルは「穴埋め」に近い制約下で書く
2. **ローカル審査ループ**: 同モデルがルーブリックで採点→改稿指示→書き直し（最大2回）。試行錯誤は全部無料
3. **決定論リンター**: 翻訳調・文体混在・長文・語尾単調・冗長表現を機械検出（LLMの自己申告に頼らない）
4. **API磨きは表現のみ**: 内容変更禁止の1パス。磨き後にlintスコアが下がったら磨き前を採用（安全側）
5. **人間承認**: reviewed:true にするのは人間だけ。未達成物は公開経路に乗らない

## モデル差し替え
config.json の draftModel / judgeModel を変更するだけ。32GB機なら qwen3:14b(Q4) が安定。
判定だけ小型モデル（例 qwen3:8b）にして高速化する構成も可。
