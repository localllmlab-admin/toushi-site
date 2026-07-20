# ファクトシート: DeFi上のトークン化株式（Tokenized Stocks）— SpaceX IPO後の動向

- 調査目的: 「2026年6月12日のSpaceX IPOを機にDeFi上での証券トレードが広がった」という仮説の検証
- 確認日: 2026-07-20
- 調査手法: WebSearch/WebFetchによる一次情報（SEC・Kraken公式ブログ・Citi公式レポート等）優先の確認。二次メディア（CoinDesk等業界専門メディア）は複数ソース照合の上でC〜B格付けとして採用
- 出典格付け目安: A=政府/取引所/発行体公式 B=業界専門メディア（CoinDesk, The Block等）複数照合 C=単独業界メディア D=まとめサイト・SNS（本ファクトシートでは補足のみ、単独では根拠にしない）

---

## 1. 結論サマリー

SpaceXの2026年6月12日IPO（$135/株・評価額約$2兆〜$2.5兆、調達額$75億〜$750億で報道にばらつきあり※後述）を機に、**DeFi/暗号資産取引所上のトークン化株式（tokenized equities）取引高は2026年6月に月間$3.86Bと過去最高を記録し、前月比+145%増加**した。うちSpaceXトークン（SPCX/SPCXx）だけで$1.19B（月間出来高の31%）を占めた（CoinDesk, 2026-07-07）。ただし同時に、①複数の「SPCXトークン」が実体の異なる商品（現物裏付け型／トラッカー証明書／無担保パーペチュアル先物）として同一ティッカーで並存し投資家に混乱を招いた、②Binance/Bybit/Bitget WalletがSpaceX事前IPOトークン配布を配分不足でキャンセル・返金する事態が発生した、③米SEC・証券振替代理人団体（Securities Transfer Association）がissuerの同意なきトークンは「株式ではない」と明確化・問題提起している、という「広がりと同時に構造的な粗さが露呈した」という二面性が一次資料から確認できる。

---

## 2. SpaceX株のDeFi/取引所での取扱い

### 2.1 商品構造の多様性（同一ティッカーで性質が異なる4種類）

CryptoSlateの分析（2026-06-13付、複数業界データ照合）によれば、SpaceX株（ティッカーSPCX）は少なくとも4種類の異なる商品として取引されていた。

| 商品 | 提供者/チェーン | 権利内容 |
|---|---|---|
| Nasdaq現物株 | 従来型証券口座 | 完全な株主権・議決権 |
| 現物担保型トークン | Backpack Securities（Solana） | 1:1株式裏付け・償還可能、CEOは「証券をシステム横断でポータブルにする」と説明 |
| トラッカー証明書 | xStocks（Kraken/Bybit提供、Backed Finance発行） | 価格連動のみ。Kraken FAQは「株主権・議決権・法的請求権を一切伴わない」と明記 |
| 無担保パーペチュア先物 | Hyperliquid | 現金決済のデリバティブ、原資産への請求権なし |

出典: [CryptoSlate "SpaceX's IPO exposes the first crack in tokenized stocks"](https://cryptoslate.com/spacexs-ipo-exposes-the-first-crack-in-tokenized-stocks/)（2026-06-13）

### 2.2 取引高データ（2026年6月）

- 月間トークン化株式出来高: **$3.86B**（前月比+145%）
- SpaceXトークン（全体）出来高: **$1.19B**（月間出来高の31%）
- うちBackpack取引所のSPCX: **$1.08B**（Backpack Securities全体の月間出来高は$1.42B）
- xStocksのSPCXx: **$852M**
- セクター全体の時価総額: **$1.53B**（前月比+6.64%、15カ月連続成長）
- SpaceX IPO時のバリュエーション: $135/株・完全希薄化後評価額 約$1.8兆

出典: [CoinDesk "SpaceX IPO powers record $3.86 billion in tokenized equities trading in June"](https://www.coindesk.com/markets/2026/07/07/spacex-ipo-powers-record-usd3-86-billion-in-tokenized-equities-trading-in-june)（2026-07-07）

※SpaceX IPOの調達額・評価額は報道によって数値に幅がある（CoinDesk記事は評価額「$1.8兆」、他の検索結果スニペットでは「$75億調達・評価額$2兆超」「評価額$2.5兆」等の表記も見られた）。IPO自体の正確な財務条件は本タスクの主眼である「トークン化株式市場動向」の範囲外のため、複数の数値が存在する点のみ明示し、断定は避ける（確度: 低〜中、要SpaceX/主幹事証券の一次開示での再確認）。

### 2.3 配分トラブル（供給不足・キャンセル）

- Binanceの事前IPOトークンキャンペーンは27,689アドレスから$557M相当の応募があったが、供給不足によりユーザー一律4.2786 SPCXトークンの按分配布となった
- Binance Wallet、Bybit、Bitget WalletはxStocks経由でのSpaceX株確保に失敗し、事前IPOオファリングをキャンセルし顧客に返金した（Yahoo Finance, 2026-07付）
- Hyperliquidのパーペチュア契約はIPO前（5月18日上場）に$220超まで上昇し、6月11日のIPO価格$135・上場日のNasdaq実勢レンジ$150-168を大きく上回るなど、償還アンカーを持たないデリバティブの価格乖離が顕在化した

出典: [CryptoSlate（同上）](https://cryptoslate.com/spacexs-ipo-exposes-the-first-crack-in-tokenized-stocks/)、[Yahoo Finance "Crypto Platforms Promised SpaceX IPO Access. The Tokenized Stocks Never Arrived."](https://finance.yahoo.com/markets/crypto/articles/crypto-platforms-promised-spacex-ipo-172639546.html)

### 2.4 Robinhood（EU）

- Robinhoodは2025年6月30日、カンヌでのイベントでEU/EEAユーザー向けに200銘柄超の米国株・ETFトークン化商品（"Classic Stock Tokens"）を開始。最低投資額€1
- カタログは200超から2,000超銘柄に拡大（時期は記事執筆時点=2026年、詳細な拡大時期は「確認できず」）
- トークンはArbitrum上で運用開始、将来的に自社L2「Robinhood Chain」（Arbitrumスタック採用）へ移行予定。2026年7月2日付TechTimes記事によれば "Robinhood Chain" は既にライブ化しているが、**Robinhood Stock Tokensは「株式ではなく債券（debt securities）として構成されており、保有者に株主権はない」**という重要な留保が付されている
- 2025年後半（H2 2025）のトークン化株式カテゴリ全体は約$1Bに到達、半期で+128%成長

出典: [Robinhood Newsroom](https://robinhood.com/us/en/newsroom/robinhood-launches-stock-tokens-reveals-layer-2-blockchain-and-expands-crypto-suite-in-eu-and-us-with-perpetual-futures-and-staking/)、[TechTimes "Robinhood Chain Goes Live With Tokenized Stocks and a Key Ownership Caveat"](https://www.techtimes.com/articles/319564/20260702/robinhood-chain-goes-live-tokenized-stocks-key-ownership-caveat.htm)（2026-07-02）

### 2.5 Kraken xStocks / Solana

- xStocksは2026年2月17日時点で累計取引高が取引所・DEX合計で**$25B超**（うちオンチェーン分$3.5B超）に到達
- ユニークオンチェーン保有者数: 80,000超、xStocks全体のAUM: 約$225M（2026-02-17時点）
- Solana上のトークン化株式取引高: 2026年上半期（H1）で**$4.9B**（2025年下半期比6倍）
- クロスチェーン合計のトークン化株式取引高は2026年5月に月間$5.3Bの過去最高を記録（4月比+44%）
- Solanaはクロスチェーン取引高の95%超を一貫して占有。Dune Analytics集計ではxStocksがトークン化株式市場全体の46.9%のシェア

出典: [Kraken Blog "xStocks remain largest provider of tokenized equities, surpass $25 billion in total transaction volume"](https://blog.kraken.com/product/xstocks/25-billion-in-total-transaction-volume)、[The Block](https://www.theblock.co/post/390537/tokenized-xstocks-surpass-25-billion-total-transaction-volume-kraken)、[CryptoBriefing "Solana tokenized stocks trading volume surges to $4.9B in first half of 2026"](https://cryptobriefing.com/solana-tokenized-stocks-volume-surges-h1-2026/)

---

## 3. トークン化株式・トークン化資産市場の規模

### 3.1 トークン化株式（狭義）

- EU MiCA関連報道: オンチェーン・トークン化株式の市場価値は約**$2.16B**、月次+45%成長（時点は記事文脈からMiCA関連=2026年前半、詳細日付は元記事で「確認できず」）
- 前掲2.2のCoinDesk記事: セクター時価総額$1.53B（2026年6月時点、15カ月連続成長）

※両ソースで時価総額の絶対値に差（$1.53B vs $2.16B）があり、集計対象銘柄・時点の違いによるものと推測される。単一の確定値としては扱わず、レンジとして提示する（確度: 中）。

出典: [CryptoBriefing "European Commission set to expand MiCA rules to tokenization and stablecoins"](https://cryptobriefing.com/european-commission-expand-mica-tokenization-stablecoins/)

### 3.2 トークン化資産市場（広義・RWA全体）

- Forbes（2026-07-02、複数のRWAデータプロバイダー集計に基づく分析記事）: トークン化された実物資産（RWA）市場全体は**$60B**、7,000商品・12資産クラスに分散。ただし**$32.9B（54%）・910資産は週次取引がゼロ**。上位62資産が全体価値の88%、上位5商品で約50%を占める寡占構造
  - $100,000超のトークン化資産のうち70%超が取引実績なし
  - 約$27Bは「Represented tokens」＝譲渡を前提としない閉鎖台帳上のデジタル受領証であり、そもそも公開流通を意図していない
  - EtherFuse CEO David Taylor氏のコメント: 「97%の人が触れられない$60B市場で、資産の半分が動かないなら、それはまだ市場ではない。待合室だ」
- McKinsey: 2030年までにトークン化資産（ステーブルコイン除く）**約$2兆**（悲観〜楽観シナリオで$1兆〜$4兆）と保守的に予測
- BCG: 2030年までに**$16兆**という試算（2022年レポート、トップダウン方式）。ADDXとの共同分析では最良ケース$68兆。BCG×Ripple 2025年更新版はより穏当な**$9.4兆（2030年）、$19兆近く（2033年）**という数字も提示
- Citi「Tokenization 2030」レポート（2026年6月付、Citigroup公式）: トークン化資産市場はベースケースで2030年までに**$5.5兆**、弱気シナリオ$2.7兆、強気シナリオ$8.2兆。現在（レポート執筆時点）のグローバル・トークン化資産市場規模は約**$17B**。米国個人投資家の10%がオンチェーンソリューションを利用すると仮定した場合、トークン化された公開株式への需要は約$2.6兆に達しうるとの試算
  - 現状は米国株・国債などパブリック市場証券が牽引役になると予測。プライベート市場（未上場株）のトークン化は「初期段階かつ構造的制約が大きい」と評価
  - 出典: [Citigroup "Tokenization 2030"](https://www.citigroup.com/global/insights/tokenization-2030)、[Citigroup GPS Report PDF](https://www.citigroup.com/rcs/citigpa/storage/public/Citi_Institute_GPS_Report_Tokenization_2030.pdf)、[CoinDesk "Citi predicts the tokenized securities market will grow to $5.5 trillion by 2030"](https://www.coindesk.com/markets/2026/06/01/citi-predicts-the-tokenized-securities-market-will-grow-to-usd5-5-trillion-by-2030)（2026-06-01）

### 3.3 市場規模データのばらつきについて（明示的注記）

RWA/トークン化資産の市場規模推計は、集計対象（証券のみか／不動産・プライベートクレジット・国債を含む広義RWAか）、ステーブルコインを含むか、オンチェーン取引高か時価総額かによって**$12B〜$60B超**まで幅がある（2026年前半時点）。トークン化株式単体では$1.5B〜$2.2B程度、より広いRWA全体では$60B規模、というように「対象範囲」の違いが数字の差の主因と考えられる（確度: 中、複数ソース照合済み）。

---

## 4. SpaceX IPO前後の需要変化（プレIPOトークン含む）

### 4.1 SpaceX上場前（プレIPO）トークンの需要

- Coinbaseは2026年6月4日、SpaceXを皮切りにプレIPOパーペチュア先物を上場。USDC決済・無期限・IPO後は通常のSpaceXパーペチュアに自動移行する設計
- OKXはSpaceX・OpenAI・Anthropicのプレupcoming IPOパーペチュア先物をUSDT決済・レバレッジ0.01x〜5xで提供
- Forbes（2026-05-26付）は「プレIPO SpaceX・OpenAI株を売る不透明な市場」と題し、セカンダリー市場での実態を批判的に報道
- Citigroupはウェルス/機関投資家向けに未上場企業（SpaceX・Anthropic等）持分をトークン化して取引できるブロックチェーン基盤の準備を進めていると報道されている（一次確認は「確認できず」、業界報道ベース）

出典: [crypto.news "Coinbase is selling pre-IPO perps on SpaceX, OpenAI, and Anthropic"](https://crypto.news/coinbase-pre-ipo-perps-spacex-openai-anthropic/)、[Forbes "Inside The Murky Market Selling Pre-IPO SpaceX And OpenAI Shares"](https://www.forbes.com/sites/phoebeliu/2026/05/26/inside-the-murky-market-selling-pre-ipo-spacex-and-openai-shares/)、[CoinCentral "Citigroup Plans Tokenized Private Company Shares as SpaceX and Anthropic IPO Demand Builds"](https://coincentral.com/citigroup-plans-tokenized-private-company-shares-as-spacex-and-anthropic-ipo-demand-builds/)

### 4.2 発行体側の拒絶姿勢（OpenAI・Anthropic）

- OpenAI・AnthropicはいずれもセカンダリーでのSPV経由持分売買・トークン化に対して積極的に取り締まりを行っており、法的にこれらの取引を無効化できる立場にある。The Motley Fool（2026-07-03付）は、セカンダリー市場やSPV経由で購入した株式（トークン化版含む）はIPO前に無価値化するリスクがあると指摘
- OpenAIは2025年7月2日、X（旧Twitter）公式アカウントで「これら『OpenAIトークン』はOpenAIの株式ではない。Robinhoodとの提携はなく、関与も承認もしていない。OpenAI持分の譲渡には当社の承認が必要であり、いかなる譲渡も承認していない」と明言（詳細は5.3節参照）

出典: [The Motley Fool "How to Buy Pre-IPO Shares in Anthropic and OpenAI (And Why You Might Not Want To)"](https://www.fool.com/investing/2026/07/03/how-to-buy-pre-ipo-shares-in-anthropic-and-openai/)、[X @OpenAINewsroom](https://x.com/OpenAINewsroom/status/1940502391037874606)

### 4.3 SpaceX上場後の需要（結論との整合）

2節で示した通り、SpaceX上場（2026-06-12）を受けてトークン化株式の月間出来高は前月比+145%・SPCXが月間出来高の31%を占めるなど、**「上場を機に需要が急増した」という定量的裏付けは複数ソース（CoinDesk記事・CryptoSlate記事）で確認できる**。一方で、この急増は同時に配分トラブル・商品構造の不透明性という副作用を伴っており、「順調な拡大」ではなく「急拡大と粗さの併存」という評価が実態に近い（確度: 高、複数一次〜準一次ソースで裏付けあり）。

---

## 5. 規制状況

### 5.1 米国SEC

- 2026年1月28日、SEC企業金融局（Corp Fin）・投資管理局・トレーディング市場局が共同で「トークン化証券に関する声明（Statement on Tokenized Securities）」を発表
- 定義: 「トークン化証券」＝連邦証券法上の証券の定義に該当する金融商品で、暗号ネットワーク上またはそれを通じて所有権記録の全部または一部が維持されるものとしてフォーマットまたは表現されたもの
- 基本原則: 証券が発行・記録・移転される技術形式（ブロックチェーンか否か）は、その法的性質や連邦証券法の適用可否を変えない。適用の可否はブロックチェーン利用の有無ではなく、付与される権利の経済的・法的実質による
- 「発行体スポンサー型トークン化証券」と「第三者スポンサー型トークン化証券」の2類型に整理し、前者は真の所有権を表しうる一方、後者（合成エクスポージャーやカストディ権益のみを提供するもの）はより厳格な規制上の精査対象になるとしている（CoinDesk, 2026-01-29）
- 2026年6月2日、SECは2026-2030年度戦略計画のドラフトを公表し、Goal 1の第一の規制目標としてデジタル資産・分散台帳技術を掲げた
- 2026年7月13日、証券振替代理人団体（Securities Transfer Association）がSECに請願書を提出し、「発行体の同意なしにブロックチェーン上のトークンを株式として販売する行為は真の株式ではない」とし、発行体の同意を要件化するよう要求（TechTimes, 2026-07-13）

出典: [SEC.gov「Statement on Tokenized Securities」](https://www.sec.gov/newsroom/speeches-statements/corp-fin-statement-tokenized-securities-012826-statement-tokenized-securities)（※本文取得は403エラーでWebFetch不可のため見出し・検索結果スニペットベース、確度: 中）、[Norton Rose Fulbright](https://www.nortonrosefulbright.com/en/knowledge/publications/f587fc3c/sec-issues-guidance-on-tokenized-securities)、[Sidley Austin](https://www.sidley.com/en/insights/newsupdates/2026/01/sec-staff-unveils-a-playbook-for-tokenized-securities)、[CoinDesk「SEC clarifies rules for tokenized stocks, tightening scrutiny on synthetic equity」](https://www.coindesk.com/policy/2026/01/29/sec-clarifies-rules-for-tokenized-stocks-tightening-scrutiny-on-synthetic-equity)（2026-01-29）、[TechTimes「Transfer Agents File SEC Petition」](https://www.techtimes.com/articles/320341/20260713/transfer-agents-file-sec-petition-without-issuer-sign-off-stock-tokens-are-not-shares.htm)（2026-07-13）

### 5.2 EU MiCA

- MiCAは2024年12月30日に全面適用開始。移行期間は2026年7月1日にEU全域で終了し、以降MiCAライセンスなしでEU顧客に暗号資産サービスを提供する事業者はEU法違反となる
- **MiCAはトークン化証券（株式・債券等）を直接規律していない**。トークン化された株式は既存の証券法制（特にMiFID II）の下に置かれ、「ブロックチェーン上の欧州企業株式は暗号資産としてではなく株式として規制される」という整理
- 欧州委員会は2026年5月、MiCAの適用範囲をトークン化資産・非EUステーブルコイン発行体まで拡張するための公開協議を開始（意見募集期限2026年9月30日）。改正の実現は早くとも2027年
- Robinhoodのトークン化株式（OpenAI・SpaceX関連）について、リトアニア中央銀行がRobinhoodに対し商品構造・消費者向け説明について説明を求める照会を実施（DL News, 時期は2025年7月付、OpenAI論争を受けたもの）

出典: [CryptoBriefing「European Commission set to expand MiCA rules to tokenization and stablecoins」](https://cryptobriefing.com/european-commission-expand-mica-tokenization-stablecoins/)、[The Block](https://www.theblock.co/amp/post/407613/european-commission-expand-mica-tokenization-non-eu-stablecoin-report)、[Tokeny「Tokenized Securities Unaffected by MiCA」](https://tokeny.com/tokenized-securities-unaffected-by-mica-utility-tokens-and-stablecoins-face-stricter-rules/)、[CNBC「Robinhood stock tokens face scrutiny in the European Union after OpenAI warning」](https://www.cnbc.com/2025/07/07/robinhood-stock-tokens-face-scrutiny-in-the-eu-after-openai-warning.html)

### 5.3 Robinhood × OpenAIトークン論争（規制論点として重要なため独立記載）

- Robinhoodは欧州ユーザー向けにOpenAI・SpaceXの「トークン化株式」提供を開始したが、OpenAIは2025年7月2日、Xで「これらの『OpenAIトークン』はOpenAI株式ではない。Robinhoodと提携しておらず、関与も承認もしていない。OpenAI持分の譲渡には当社の承認が必要で、いかなる譲渡も承認していない」と公式に否定（CNBC, 2025-07-02）
- Robinhood CEO Vlad Tenevは「これらが技術的にエクイティでないことは事実」と認めつつ、「技術的にエクイティ商品でないことはさほど重要ではない」と述べ、OpenAI株式トークンは「Robinhoodが保有するSPV（特別目的事業体）持分によって成立している」と説明（CNBC, 2025-07-08 / DL News）
- 前掲5.1の通り、2026年1月のSEC声明・2026年7月のSTA請願は、この種の「発行体非承認の合成トークン」を明確に問題視する方向性を示している

出典: [CNBC「OpenAI says Robinhood's tokens aren't equity in the company」](https://www.cnbc.com/2025/07/02/openai-robinhood-tokens.html)、[CNBC「Robinhood CEO downplays OpenAI concerns on tokenized stock structure」](https://www.cnbc.com/2025/07/08/robinhood-ceo-downplays-openai-concerns-on-tokenized-stock-structure.html)、[DL News](https://www.dlnews.com/articles/markets/robinhood-ceo-responds-tokenised-openai-giveaway-backlash/)

### 5.4 日本

- トークン化株式そのものを対象とした金融庁の個別規制枠組みは、本調査の検索範囲では**確認できず**
- 関連する動きとして、2026年4月10日に金融庁が「金融商品取引法及び資金決済に関する法律の一部を改正する法律案」を国会に提出（2025年12月10日の金融審議会ワーキング・グループ報告書が基礎）。暗号資産規制を資金決済法から金融商品取引法へ移管し、インサイダー取引規制の創設・国内105銘柄への情報開示義務化などを盛り込む
- 2026年3月31日、所得税法等の一部を改正する法律が成立・公布され、上記法案の成立を前提に暗号資産取引に係る所得の分離課税化が含まれる
- これらは暗号資産全般の規制再編であり、「トークン化株式（証券をブロックチェーン上で表現する商品）」を名指しした制度整備は本調査では確認できなかった（確度: 低、追加調査推奨）

出典: [金融庁 資料](https://www.fsa.go.jp/singi/singi_kinyu/angoshisanseido_wg/gijishidai/20251107/02.pdf)、[So & Sato「Japan's 2026 FIEA Amendment Bill」](https://innovationlaw.jp/en/japans-2026-fiea-amendment-bill/)、[長島・大野・常松法律事務所](https://www.nagashima.com/publications/publication20260424-1/)

---

## 6. 機関予測と懐疑論

### 6.1 主要機関の2030年予測（再掲・比較表）

| 機関 | 対象 | ベース予測 | レンジ | 公表時期 |
|---|---|---|---|---|
| McKinsey | トークン化資産（ステーブルコイン除く） | 約$2兆 | $1兆〜$4兆 | 記事言及のみ、原典日付「確認できず」 |
| BCG（2022） | 広義RWA（トップダウン） | $16兆 | 最良ケース$68兆 | 2022年（2026年時点でも引用継続） |
| BCG×Ripple（2025更新） | 広義RWA | $9.4兆（2030）/ $19兆近く（2033） | - | 2025年 |
| Citi「Tokenization 2030」 | トークン化資産全体 | $5.5兆 | $2.7兆〜$8.2兆 | 2026-06 |

出典: [Ledger Insights](https://www.ledgerinsights.com/mckinsey-estimates-tokenization-will-be-less-than-2-trillion-by-2030/)、[Citigroup「Tokenization 2030」](https://www.citigroup.com/global/insights/tokenization-2030)、[CoinDesk（2026-06-01）](https://www.coindesk.com/markets/2026/06/01/citi-predicts-the-tokenized-securities-market-will-grow-to-usd5-5-trillion-by-2030)

※McKinsey/BCGの一次レポート本文へは本調査ではアクセスしておらず、業界メディア・ブログ経由の二次引用である点に留意（確度: 中、原典未確認）。

### 6.2 懐疑論

- Forbes（2026-07-02）: 「$60億市場は97%の人が触れられず、資産の半分が動かない『市場ではなく待合室』」（EtherFuse CEO David Taylor氏のコメント引用）。トークン化資産の54%（$32.9B）が週次取引ゼロという実態を指摘し、「トークン化＝流動性向上」という業界の前提そのものに疑問を呈している
- Equiniti CEO Dan Kramer氏: 「発行体が承認せず、トランスファーエージェントを通じて記録されていないトークンはトークン化株式ではない。それは投資家をリスクに晒し発行体に求償手段を残さない合成商品だ」（業界メディア引用、原典一次確認は「確認できず」）
- Securities Transfer Association（証券振替代理人協会）は2026年7月13日、SECに対し「発行体の同意なきトークンは株式ではない」とする請願を提出（5.1節参照）

出典: [Forbes「The Tokenized Asset Market Is $60 Billion. Most Of It Isn't Moving.」](https://www.forbes.com/sites/astanley/2026/07/02/the-tokenized-asset-market-is-60-billion-most-of-it-isnt-moving/)（2026-07-02）

---

## 7. リスク

### 7.1 原資産の裏付け・カストディリスク

- 「現物担保型」を称するトークンでも、原資産を保有するカストディアンが破綻・凍結・アクセス制限を行った場合、トークン保有者が原資産に対する直接請求権を持たない可能性がある（業界解説記事、原典一次確認なし、確度: 中）
- トークンの価値はカストディアンの信用力に依存する（同上）

### 7.2 価格乖離（ペグ乖離）リスク

- 米国株式市場は平日約16時間・週末終日クローズするのに対し、トークンは24時間365日取引されるため、市場クローズ中は最終公式価格から乖離しうる
- 通常時（NYSE開場中）はアービトラージにより裏付け型トークンの価格はタイトに連動するが、市場クローズ後はペグが緩む可能性がある
- 実例: 2.3節のHyperliquidパーペチュアがIPO前に$220超まで乖離、上場日もNasdaq実勢比+$12〜$26の乖離を記録

出典: [CryptoDaily「Equities on Crypto Rails: Tokenized Stocks Need More Than Mirror Prices to Win」](https://cryptodaily.co.uk/2026/06/equities-on-crypto-rails-beyond-mirror-prices)、[CryptoSlate（前掲）](https://cryptoslate.com/spacexs-ipo-exposes-the-first-crack-in-tokenized-stocks/)

### 7.3 「株式ではないトークン」問題（発行体非承認リスク）

- Robinhood OpenAI/SpaceXトークン論争（5.3節）が典型例。発行体（OpenAI）が明確に「これは株式ではない」と否定したにもかかわらず、プラットフォーム側は商品提供を継続し、CEOも「技術的にエクイティでないことはさほど重要ではない」と述べた
- Robinhood自身のStock Tokensも「株式ではなく債券として構成」（2.4節）
- xStocksのトラッカー証明書も「株主権・議決権・法的請求権を一切伴わない」とFAQで明記（2.1節）
- SEC・STA（証券振替代理人協会）はこの構造を規制上の主要論点として扱っている（5.1節）

### 7.4 配分・オペレーショナルリスク

- SpaceX IPOでのBinance/Bybit/Bitget Walletによる事前IPOトークン配布キャンセル・返金（2.3節）
- 供給不足時の按分配布（Binance: 一律4.2786 SPCXトークン）

### 7.5 プレIPOトークンの無効化リスク

- OpenAI・Anthropicはセカンダリー市場でのSPV経由取引・トークン化を法的に無効化できる立場にあり、実際に取り締まりを強化している。IPO前に投資が無価値化するリスクがThe Motley Foolにより指摘されている（4.2節）

### 7.6 流動性の偏在リスク

- 広義RWA市場全体で54%の資産が週次取引ゼロ、上位62資産が価値の88%を占める寡占構造（6.2節、Forbes）。トークン化株式についても、SpaceXのような話題性の高い銘柄に出来高が極端に集中する傾向が示唆される（2.2節: SpaceXが月間出来高の31%）

---

## 8. 総括（事実と仮説の切り分け）

**事実（複数ソースで確認済み、確度: 高）:**
- SpaceX IPO（2026-06-12）後、DeFi/暗号資産取引所上のトークン化株式取引高は月間$3.86Bと過去最高を記録し、前月比+145%増加した
- SpaceXトークンが2026年6月の月間出来高の31%を占め、単一銘柄として市場を牽引した
- 同時に、配分キャンセル・商品構造の不透明性・価格乖離という副作用が複数の一次〜準一次ソースで報告されている
- 米SECは2026年1月に規制指針を発表し、発行体非承認の合成トークンへの規制強化姿勢を明確にしている
- OpenAIはRobinhoodのトークン化商品を公式に「株式ではない」と否定している

**仮説・推定（単独ソースまたは二次引用、確度: 中〜低）:**
- トークン化株式市場全体の時価総額（$1.53B〜$2.16Bとソースにより差）
- McKinsey/BCGの2030年予測（原典未確認、業界メディア経由の二次引用）
- Citigroupのプライベート企業トークン化プラットフォーム計画（業界報道ベース、Citi公式発表は本調査では未確認）
- 日本におけるトークン化株式固有の規制動向（確認できず、暗号資産全般の規制再編のみ確認）

**結論として、背景で示された仮説（「SpaceX IPOを機にDeFi上での証券トレードが広がった」）は、取引高データ（+145%）という点では裏付けられる一方、「広がり」の実態は健全な市場拡大というより、商品構造の不透明性・配分トラブル・発行体との対立を伴う「急拡大に制度・実務が追いついていない」状態であることが、規制当局（SEC）・業界団体（STA）・発行体（OpenAI）・業界批評（Forbes等）の複数方向から確認できる。**

---

## 出典一覧（URL・媒体・確認日）

1. [CoinDesk "SpaceX IPO powers record $3.86 billion in tokenized equities trading in June"](https://www.coindesk.com/markets/2026/07/07/spacex-ipo-powers-record-usd3-86-billion-in-tokenized-equities-trading-in-june) — 2026-07-07
2. [CryptoSlate "SpaceX's IPO exposes the first crack in tokenized stocks"](https://cryptoslate.com/spacexs-ipo-exposes-the-first-crack-in-tokenized-stocks/) — 2026-06-13
3. [Yahoo Finance "Crypto Platforms Promised SpaceX IPO Access. The Tokenized Stocks Never Arrived."](https://finance.yahoo.com/markets/crypto/articles/crypto-platforms-promised-spacex-ipo-172639546.html)
4. [Robinhood Newsroom "Robinhood Launches Stock Tokens..."](https://robinhood.com/us/en/newsroom/robinhood-launches-stock-tokens-reveals-layer-2-blockchain-and-expands-crypto-suite-in-eu-and-us-with-perpetual-futures-and-staking/)
5. [TechTimes "Robinhood Chain Goes Live With Tokenized Stocks and a Key Ownership Caveat"](https://www.techtimes.com/articles/319564/20260702/robinhood-chain-goes-live-tokenized-stocks-key-ownership-caveat.htm) — 2026-07-02
6. [Kraken Blog "xStocks remain largest provider of tokenized equities, surpass $25 billion in total transaction volume"](https://blog.kraken.com/product/xstocks/25-billion-in-total-transaction-volume) — 2026-02-17時点データ
7. [The Block "Tokenized xStocks surpass $25 billion in total transaction volume: Kraken"](https://www.theblock.co/post/390537/tokenized-xstocks-surpass-25-billion-total-transaction-volume-kraken)
8. [CryptoBriefing "Solana tokenized stocks trading volume surges to $4.9B in first half of 2026"](https://cryptobriefing.com/solana-tokenized-stocks-volume-surges-h1-2026/)
9. [CryptoBriefing "European Commission set to expand MiCA rules to tokenization and stablecoins"](https://cryptobriefing.com/european-commission-expand-mica-tokenization-stablecoins/)
10. [Forbes "The Tokenized Asset Market Is $60 Billion. Most Of It Isn't Moving."](https://www.forbes.com/sites/astanley/2026/07/02/the-tokenized-asset-market-is-60-billion-most-of-it-isnt-moving/) — 2026-07-02
11. [Citigroup "Tokenization 2030"](https://www.citigroup.com/global/insights/tokenization-2030) — 2026-06
12. [Citigroup GPS Report PDF](https://www.citigroup.com/rcs/citigpa/storage/public/Citi_Institute_GPS_Report_Tokenization_2030.pdf)
13. [CoinDesk "Citi predicts the tokenized securities market will grow to $5.5 trillion by 2030"](https://www.coindesk.com/markets/2026/06/01/citi-predicts-the-tokenized-securities-market-will-grow-to-usd5-5-trillion-by-2030) — 2026-06-01
14. [Ledger Insights "McKinsey estimates tokenization will be less than $2 trillion by 2030"](https://www.ledgerinsights.com/mckinsey-estimates-tokenization-will-be-less-than-2-trillion-by-2030/)
15. [SEC.gov "Statement on Tokenized Securities"](https://www.sec.gov/newsroom/speeches-statements/corp-fin-statement-tokenized-securities-012826-statement-tokenized-securities) — 2026-01-28（本文取得不可、見出しのみ確認）
16. [CoinDesk "SEC clarifies rules for tokenized stocks, tightening scrutiny on synthetic equity"](https://www.coindesk.com/policy/2026/01/29/sec-clarifies-rules-for-tokenized-stocks-tightening-scrutiny-on-synthetic-equity) — 2026-01-29
17. [TechTimes "Transfer Agents File SEC Petition: Without Issuer Sign-Off, Stock Tokens Are Not Shares"](https://www.techtimes.com/articles/320341/20260713/transfer-agents-file-sec-petition-without-issuer-sign-off-stock-tokens-are-not-shares.htm) — 2026-07-13
18. [CNBC "OpenAI says Robinhood's tokens aren't equity in the company"](https://www.cnbc.com/2025/07/02/openai-robinhood-tokens.html) — 2025-07-02
19. [CNBC "Robinhood CEO downplays OpenAI concerns on tokenized stock structure"](https://www.cnbc.com/2025/07/08/robinhood-ceo-downplays-openai-concerns-on-tokenized-stock-structure.html) — 2025-07-08
20. [CNBC "Robinhood stock tokens face scrutiny in the European Union after OpenAI warning"](https://www.cnbc.com/2025/07/07/robinhood-stock-tokens-face-scrutiny-in-the-eu-after-openai-warning.html) — 2025-07-07
21. [DL News "Robinhood CEO responds to OpenAI giveaway concerns"](https://www.dlnews.com/articles/markets/robinhood-ceo-responds-tokenised-openai-giveaway-backlash/)
22. [X @OpenAINewsroom公式声明](https://x.com/OpenAINewsroom/status/1940502391037874606)
23. [crypto.news "Coinbase is selling pre-IPO perps on SpaceX, OpenAI, and Anthropic"](https://crypto.news/coinbase-pre-ipo-perps-spacex-openai-anthropic/)
24. [Forbes "Inside The Murky Market Selling Pre-IPO SpaceX And OpenAI Shares"](https://www.forbes.com/sites/phoebeliu/2026/05/26/inside-the-murky-market-selling-pre-ipo-spacex-and-openai-shares/) — 2026-05-26
25. [The Motley Fool "How to Buy Pre-IPO Shares in Anthropic and OpenAI (And Why You Might Not Want To)"](https://www.fool.com/investing/2026/07/03/how-to-buy-pre-ipo-shares-in-anthropic-and-openai/) — 2026-07-03
26. [CoinCentral "Citigroup Plans Tokenized Private Company Shares as SpaceX and Anthropic IPO Demand Builds"](https://coincentral.com/citigroup-plans-tokenized-private-company-shares-as-spacex-and-anthropic-ipo-demand-builds/)
27. [金融庁 資料PDF](https://www.fsa.go.jp/singi/singi_kinyu/angoshisanseido_wg/gijishidai/20251107/02.pdf)
28. [So & Sato "Japan's 2026 FIEA Amendment Bill: Overview and Practical Implications for Cryptoasset Regulation"](https://innovationlaw.jp/en/japans-2026-fiea-amendment-bill/)
29. [長島・大野・常松法律事務所「暗号資産に係る規制・税制の改正の内容」](https://www.nagashima.com/publications/publication20260424-1/)
30. [CryptoDaily "Equities on Crypto Rails: Tokenized Stocks Need More Than Mirror Prices to Win"](https://cryptodaily.co.uk/2026/06/equities-on-crypto-rails-beyond-mirror-prices)
