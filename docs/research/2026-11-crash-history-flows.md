# 急落の歴史比較・「時価総額の消失」の仕組み・日本の規模感 ファクトシート

確認日: 2026-11-07（依頼日 2026-11-06）／ 作成: market-researcher
目的: 投資教育記事の素材。推測で補わない。

## 0. 読み方（確度と確認区分）

- 確認区分: 【確認】=今回WebFetchで原文/CSVを直接読んだ ／ 【要約のみ】=検索結果の要約でのみ見た（原文未読） ／ 【未取得】=取れなかった（記事に書かない）
- 【計算】=下記【確認】の生データから当方が算出した値（出典の公表値ではない）。記事に載せるなら「終値ベースの計算」と明記
- 市場データの取得手段: FRED（セントルイス連銀）の fredgraph.csv と、Yahoo Finance chart API（市場データ業者。一次の取引所公表値ではない）。FREDのNIKKEI225は日経のデータを再配布したもの
- WebFetch不可だったサイト: JPX（全ページ403）、investor.gov（403）、日経平均プロフィルのランキング（403）、Federal Reserve History の一部（"Content Not Found"）、BOJ/BIS一部PDF（バイナリ）
- Yahoo経由の日付はタイムスタンプ(13:30 UTC)からの変換。1973年は日付が1日ずれている可能性あり（後述）

---

## A. 過去の急落の比較表

### A-0. 一覧（%は終値ベース。出典列は下の個別節参照）

| 事象 | 1日下落（最大日） | 高値→底 | 期間 | 回復 | 確度 |
|---|---|---|---|---|---|
| ブラックマンデー1987/10/19 | NYダウ -22.6%（FRB）／S&P500 -20.5%【計算】／日経 -14.90%（10/20） | S&P500 336.77→223.92 = -33.5%【計算】 | 1987/8/25→12/4（約3.3か月） | FRB: 2日でダウ57%戻し・「2年未満で高値超え」／S&P週次終値で1989年7月下旬に高値超え【計算・粗い】 | 高(FRB)／中(S&P) |
| 1973-74 オイルショック | 未取得 | S&P500 120.24→62.28 = -48.2%【計算】 | 1973/1/11-12→1974/10/3（約1年9か月） | 未取得 | 中 |
| ITバブル崩壊 | 未取得 | ナスダック 5,048.62→1,114.11 = -77.9%【計算】 | 2000/3/10→2002/10/9（約2年7か月） | 終値で5,048.62超えは2015/4/23（5,056.06）＝高値から約15年1か月 | 高(FRED) |
| 9.11（再開日2001/9/17） | ダウ -7.13%（-684.81）【計算】 | 9/10終値9,605.51→9/21終値8,235.81 = -14.3%【計算】 | 9/10→9/21（8営業日） | 9/10終値を終値で上回ったのは2001/11/9（9,608.00） | 中(Yahoo) |
| リーマン破綻2008/9/15 | ダウ -4.42%（-504.48）【計算】／9/29は -6.98%【計算】 | S&P500 -57%（2007/10高値→2009/3底、FRB） | 約17か月 | 高値回復日は未取得 | 高(FRB) |
| 日経平均 2008/10 | 10/16 -11.41%【計算】／10/10 -9.62%【計算】 | 9/12終値12,214.76→10/27終値7,162.90 = -41.4%【計算】 | 約6週間 | 未取得 | 中(FRED) |
| コロナ2020/3 | S&P500 3/16 -11.98%【計算】／ダウ 3/16 -12.93%【計算】 | S&P500 3,386.15→2,237.40 = -33.9%【計算】／ダウ 29,551.42→18,591.93 = -37.1%【計算】 | S&P: 2/19→3/23（23営業日） | S&P500は2020/8/18（3,389.78）で高値超え＝高値から約6か月 | 高(FRED)／中(ダウ) |
| 2024/8/5 日経平均 | -4,451.28円（-12.40%）【計算で一致】 | （単日急落。翌日 +3,217.04円=+10.23%【計算】） | — | 未取得 | 高(FRED) |
| 2025/4 関税ショック | S&P500 4/3 -4.84%、4/4 -5.97%【計算】 | 2日間 -10.52%【計算】（5,670.97→5,074.08）。終値底は4/8の4,982.77 | 4/2→4/8 | 4/2終値を終値で上回ったのは2025/5/2（5,686.67）＝約1か月 | 高(FRED) |

### A-1. ブラックマンデー1987
- 【確認】「dropped 22.6 percent in a single trading session」「finished down 508 points, or 22.6 percent」。2営業日で288ポイント(57%)戻し。「Less than two years later, US stock markets surpassed their pre-crash highs.」S&P500の下落率はこのエッセイに記載なし。https://www.federalreservehistory.org/essays/stock-market-crash-of-1987
- 【確認】同エッセイ: 月曜の米市場開始前にアジア市場が下落。グリーンスパンは「affirmed today its readiness to serve as a source of liquidity to support the economic and financial system.」（Carlson 2006引用）
- 【確認・Yahoo】S&P500終値: 1987/8/25 336.77、10/16 282.70、10/19 224.84、10/20 236.83、週次終値で12/4 223.92。https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC （期間指定）。10/19の1日 -20.47%、高値→10/19 -33.2%、→12/4 -33.5%（いずれも【計算】）
- 【確認・Yahoo】日経平均: 10/19 25,746.56→10/20 21,910.08（-3,836.48円、-14.90%【計算】）
- 【要約のみ】日経公式ランキングでも10/20の -14.90% が下落率1位、2位が2024/8/5の -12.40%、下落幅は2024/8/5の4,451円28銭安が1位・1987/10/20の3,836円48銭安が2位（更新日: 下落率2026-07-11、下落幅2026-06-27と表示）。原文は403で未読: https://indexes.nikkei.co.jp/nkave/archives/record?select=4 ／ 同ページ内の「1953年3月5日の -10.0%を更新」も要約のみ

### A-2. 1973-74 オイルショック
- 【確認】FRH: 禁輸開始 1973/10/19、「from $2.90 a barrel before the embargo to $11.65 a barrel in January 1974」。株価下落・景気後退の記述は同エッセイにNOT STATED。https://www.federalreservehistory.org/essays/oil-shock-of-1973-74
- 【確認・Yahoo】S&P500終値: 1973-01-11=119.43、01-12=120.24、01-13=119.30（土曜日のはずで日付が1日ずれている疑い）。1974-10-03=62.28。高値120.24→62.28 = -48.2%【計算】。日付はずれの可能性があるため記事では「1973年1月」「1974年10月」の月表記にとどめる
- 【要約のみ】内閣府の白書: 昭和52年白書が「49年度は戦後初のマイナス成長」、昭和49年白書が1974年1〜3月の実質GNP -5%（前期比）。「-0.2%」等の確定値は未取得。原文URL候補: https://www5.cao.go.jp/keizai3/keizaiwp/wp-je77/wp-je77-02600.html ／ https://www5.cao.go.jp/keizai3/keizaiwp/wp-je74/wp-je74-01403.html （未読。記事に書く前に原文確認必須）
- 【未取得】S&P500が120.24を回復した時期

### A-3. ITバブル崩壊
- 【確認・FRED】NASDAQCOM: 2000-03-09 5,046.860、2000-03-10 5,048.620、2002-10-09 1,114.110、2015-04-22 5,035.170、2015-04-23 5,056.060。https://fred.stlouisfed.org/graph/fredgraph.csv?id=NASDAQCOM （cosd/coedで期間指定）。依頼文の「5,048→1,114」は終値で一致
- 【計算】-77.9%、回復まで約15年（終値ベース。ナスダック総合）

### A-4. 9.11
- 【確認・Yahoo】ダウ終値: 2001-09-10 9,605.51、09-17 8,920.70、09-18 8,903.40、09-19 8,759.13、09-20 8,376.21、09-21 8,235.81、09-28 8,847.56。2001-11-09 9,608.00が9/10終値超え初日。ダウ 9/17 -684.81ポイント・-7.13%【計算】
- 【要約のみ】NYSE/AMEX/Nasdaq は9/11から休場、9/17再開（9/11-9/14の4営業日休場）。複数の報道要約が一致するが、一次（NYSE/FRB）の原文は未読。FRB Historyの該当エッセイはURL誤りで取得できず（"Content Not Found"）。報道例: https://www.pbs.org/newshour/economy/business-july-dec01-stock_exchange_09-17 （要約のみ）
- 注意: 「回復まで何日」は定義依存。9/10終値を終値で上回るまで = 9/17から53暦日、9/10から60暦日【計算】

### A-5. リーマン破綻
- 【確認・Yahoo】ダウ終値: 2008-09-12 11,421.99、09-15 10,917.51（-504.48、-4.42%【計算】）、09-26 11,143.13、09-29 10,365.45（-777.68、-6.98%【計算】）
- 【要約のみ】報道（ABC News/CNN）も 9/15 -504.48・-4.42%・終値10,917.51で一致。同日S&P500 -4.71%
- 【確認】FRH Great Recession: 「the S&P 500 index fell 57 percent from its October 2007 peak to its trough in March 2009.」https://www.federalreservehistory.org/essays/great_recession_of_200709 。同ページに破綻日・ダウ下落率の記載はNOT STATED
- 【確認・FRED】NIKKEI225: 2008-09-12 12,214.76、09-16 11,609.72（9/15は祝日で空欄）、09-30 11,259.86、10-08 9,203.32、10-10 8,276.43、10-14 9,447.57、10-16 8,458.45、10-24 7,649.08、10-27 7,162.90、10-31 8,576.98。9月末→10月末 -23.8%【計算】。https://fred.stlouisfed.org/graph/fredgraph.csv?id=NIKKEI225
- 【未取得】S&P500の2009/3/9終値（検索要約では676.53。要約のみ）と高値回復日

### A-6. コロナ2020年3月
- 【確認・FRED】SP500: 2020-02-19 3,386.15、03-09 2,746.56、03-12 2,480.64、03-13 2,711.02、03-16 2,386.13、03-23 2,237.40、2020-08-18 3,389.78。https://fred.stlouisfed.org/graph/fredgraph.csv?id=SP500
- 【確認・Yahoo】ダウ: 2020-02-12 29,551.42、03-13 23,185.62、03-16 20,188.52、03-23 18,591.93
- 【要約のみ】Fed施策: PDCF 3/17授権、MMLF 3/18授権、FOMC 3/15に国債$500 billion以上・MBS $200 billion以上の購入を指示（検索要約の記載そのまま。原文で要確認）。https://www.federalreserve.gov/monetarypolicy/mmlf.htm ／ https://www.federalreserve.gov/monetarypolicy/files/FOMC20200315meeting.pdf （いずれも未読）
- FRH Covid essay のURL推測は "Content Not Found"。

### A-7. 2024/8/5
- 【確認・FRED】NIKKEI225: 2024-08-02 35,909.70、08-05 31,458.42、08-06 34,675.46。差 -4,451.28円、-12.40%【計算】（依頼の「4,451円安・-12.4%」と一致）
- 【確認】BIS Bulletin No 90（2024-08-27、Aquilina, Lombardi, Schrimpf, Sushko）Key takeaways: 「The event was yet another example of volatility exacerbated by procyclical deleveraging and margin increases.」／ PDF版: 「unwinding of leveraged trades in equity and currency markets amplified」初期反応を。htm/PDFとも日経・VIXの数値と、ボラティリティ・ターゲット/CTAの言及は本文に見当たらず（取得範囲では）。https://www.bis.org/publ/bisbull90.htm
- 【要約のみ】円キャリー推計「約40兆円（2,500億ドル）、データ欠損のためむしろ過小」

### A-8. 2025年4月関税ショック
- 【確認・FRED】SP500: 04-02 5,670.97、04-03 5,396.52、04-04 5,074.08、04-07 5,062.25、04-08 4,982.77、04-09 5,456.90、05-02 5,686.67。4/9は +9.5%【計算】
- 【要約のみ・弱い】時価総額: 「ダウ・ジョーンズのデータで2日間で約6.6兆ドル消失、記録的」（検索要約。報道により日付表記が4/3-4/4と4/4-5で食い違い）。S&P DJI/Dow Jones Market Dataの原文は未読。記事に書くなら「報道によれば」＋一次未確認と明記。参考: https://www.home.saxo/content/articles/equities/how-much-damage-was-done---understanding-the-scale-of-the-latest-market-sell-off-08042025 （D格・要約のみ）

---

## B. 「時価総額の消失」の仕組みと「誰が得をするのか」

### B1. 時価総額は実現された資金移動ではない
- 【未取得】権威ある定義。investor.gov は403、FRB/SEC/学術の定義文は検索で見つからず。
- 【要約のみ】関連: FRB FEDS 2001-23 Dynan & Maki "Does Stock Market Wealth Matter for Consumption?"（資産効果は株を持つ世帯に偏る旨）。内容未読: https://www.federalreserve.gov/pubs/feds/2001/200123/200123pap.pdf
- 「時価総額=直近取引価格×発行済株式数」は一般知識であり、今回は出典未確認。記事に載せるなら取引所（JPXの用語集等）か教科書で出典を取り直す。

### B2. 東証の売買構造・日本株の保有構造
- 【要約のみ】株式分布状況調査2025年度（2026-07-02公表、東証・名証・福証）: 外国法人等の保有比率 34.7%（前年度32.4%、調査開始以来最高）、保有金額 420兆6,331億円（+37.1%）、個人株主数 延べ9,198万人、「個人・その他」17.4%。原文PDFは403で未読。https://www.jpx.co.jp/markets/statistics-equities/examination/t13vrt000001irna-att/j-bunpu2025.pdf ／ 二次: https://www.nippon.com/ja/japan-data/h02843/ 。nippon.comは基準日表記が公式と食い違う（要約の指摘）ため、基準日は原文確認が必要
- 【未取得】投資部門別売買状況の海外投資家シェア（2026年の月）。JPXは403。要約によれば2026-09-29掲載分から週次1ファイル形式に変更、月次PDFは2026年1〜8月分が公開（9月分は未掲載）。https://www.jpx.co.jp/markets/statistics-equities/investor-type/ 。月別シェアは未取得のため数字なし
- 【要約のみ】東証プライム内国普通株の1日平均売買代金: 2026年9月 9兆3,334億円、10月 9兆6,513億円（JPX月次発表）。https://www.jpx.co.jp/corporate/news/news-releases/0063/20261001-11.html ／ https://www.jpx.co.jp/corporate/news/news-releases/0063/20261102-11.html

### B3. 米国株の保有構造
- 【確認・FRED】FRB Distributional Financial Accounts、Q2 2026（2026-09-18更新）。上位1%の「Corporate Equities and Mutual Fund Shares」保有シェア 50.9%（WFRBST01122）。90〜99%層 37.2%（WFRBSN09149）。https://fred.stlouisfed.org/series/WFRBST01122 ／ https://fred.stlouisfed.org/series/WFRBSN09149
- 【計算】上位10% = 50.9 + 37.2 = 88.1%（二次の Axis Intelligence の88.1%と一致）
- 【未取得】家計の株式比率（Z.1、金融資産に占める株式）。二次の報道で「48.23%（2026年Q2）」があるが一次未確認で不採用。SCFのFRBノートはURL 404。

### B4. 運用大手への集中
- 【要約のみ】Fichtner, Heemskerk, Garcia-Bernardo (2017) "Hidden power of the Big Three? Passive index funds, re-concentration of corporate ownership, and new financial risk", Business and Politics 19(2): 298-326, DOI 10.1017/bap.2017.6。要旨: BlackRock・Vanguard・State StreetがS&P500企業の88%で筆頭株主。議決権は「経営陣に賛成が基本、取締役選任では別」（要約）。原文ページはCambridgeが500/DNS失敗で未読。https://econpapers.repec.org/RePEc:cup:buspol:v:19:y:2017:i:02:p:298-326_00 （88%は発表時点の数値で、現在値ではない）
- 【要約のみ】BlackRock AUM 15.5兆ドル（2026-09-30）、ETF 6.36兆ドル。SEC 8-K Ex.99.2: https://www.sec.gov/Archives/edgar/data/0002012383/000119312526420979/blk-ex99_2.htm （未読）
- 【弱い二次】Vanguard 約11.6兆ドル（2026年2月、報道）。State Street は最新値取得できず。パッシブ比率は未取得。

### B5. 集中度とAI投資
- 【要約のみ】S&P DJI "In the Shadows of Giants": 上位10社は2025年半ばでS&P500の約40%、1960年代半ば以来の水準。https://www.spglobal.com/spdji/en/documents/research/research-in-the-shadows-of-giants.pdf （未読）。2026年9月末の39.1%という数値は低品質サイトのみで不採用
- 【確認】BIS Quarterly Review 2026年3月 "Financing the AI infrastructure boom": hyperscalersの2025年グロス起債は「topping $100 billion」、「a rising share of spending is funded through borrowing」。「AI infrastructure investment now accounts for a substantial share of investment in advanced economies」。ドル建ての設備投資額はこのページに記載なし。https://www.bis.org/publ/qtrpdf/r_qt2603u.htm
- 【要約のみ】BIS Bulletin No 140 "Building AI on credit"（hyperscaler上位5社の起債 2,220億ドル、2026年9月までなど）。PDFは圧縮で読めず未確認。https://www.bis.org/publications/bulletin-140-building-ai-credit-structures-and-spillovers.pdf 。BIS Annual Economic Report 2026年6月「commitments outpacing earnings and free cash flow」も要約のみ
- 【弱い二次】ビッグテック4社の2026年設備投資は約7,250億ドル見通し（報道ベース。Alphabet 1,800-1,900億ドル、Meta 1,250-1,450億ドルはQ1時点のガイダンス）。各社IR原文未読のため記事使用不可。要IR確認

### B6. 機械的に売る主体
- 【確認】BIS Bulletin No 90（A-7参照）: procyclical deleveraging、margin increases、leveraged trades の巻き戻しが増幅。
- 【要約のみ】2018年2月5日: BIS Quarterly Review March 2018「The equity market turbulence of 5 February - the role of exchange-traded volatility products」。VIX先物ディーラーのヘッジ売りがE-mini先物を押し下げた旨。https://www.bis.org/publ/qtrpdf/r_qt1803t.htm （未読）。SEC命令等では逆VIX ETPが90%超下落（FIMSACレター要約）
- 【要約のみ】2020年3月: BIS関連講演要約で、CCPの証拠金所要額が約70%（約3,000億ドル）増、ヘッジファンド上位レバレッジ層が米国債ロングを2,030億ドル削減、MMFがドル資金供給を約2,070億ドル削減。一次の講演/論文原文は未読。https://www.bis.org/publications/margin-leverage-and-vulnerabilities-us-treasury-futures ほか
- 【未取得】ボラティリティ・ターゲット、CTA、レバレッジETFのリバランスを直接定量した公的資料。

### B7. 空売り・マーケットメイカー
- 【確認】Virtu 2025年1〜3月期（Q1、2025-04-23発表）: 「Trading income, net, increased 44.6% to $590.0 million」「Adjusted Net Trading Income increased 35.5% to $497.1 million」。期間は3月31日まで。4月の関税ショックの影響はこの決算に含まれず、リリースにも4月の市況コメントなし。https://www.sec.gov/Archives/edgar/data/1592386/000159238625000071/exhibit991q125.htm
- 【未取得】Virtu 2025年Q2（4〜6月）の数値。「空売りで得する主体はいるがゼロサムではない」を裏づける一次資料も未取得（記述上の論点として残す）。

### B8. 中央銀行の役割
- 【確認】FRH Great Recession: 「About $12 billion of short-term agency debt was purchased starting in September 2008 to provide liquidity to markets.」。ただし量的緩和の全体像は同ページ抜粋では不明。
- 【要約のみ】2020年: A-6の施策。ミンスキー、キンドルバーガーの枠組みの原典・一次URLは未取得。

### B9. 不確実性・ナラティブ・アニマルスピリッツ
- 【確認】Shiller, "Narrative Economics", AER 107(4), April 2017, pp.967-1004。「This address considers the epidemiology of narratives relevant to economic fluctuations.」https://www.aeaweb.org/articles?id=10.1257/aer.107.4.967
- 【未取得】Knight (1921) Risk, Uncertainty and Profit の該当箇所。econlib目次のみ取得。章リンク: https://www.econlib.org/library/Knight/knRUP.html?chapter_num=9#book-reader （Part III Ch.VII、未読）
- 【要約のみ】Keynes『一般理論』第12章の "animal spirits... a spontaneous urge to action rather than inaction" は大学論文の引用断片のみ。原典全文のURLは未取得。

---

## C. 「日本に例えると」の材料

| 項目 | 値（原文のまま） | 時点 | 出典 | 区分 |
|---|---|---|---|---|
| 名目GDP | 暦年2025 = 666,440.7（十億円）＝666兆4,407億円 | 2026年4-6月期2次速報（2026-09-08公表）の暦年表 | https://www.esri.cao.go.jp/jp/sna/data/data_list/sokuhou/files/2026/qe262_2/tables/gaku-mcy2622.csv | 【確認】（日本語見出しは文字化け、英語ラベルと数値のみ判読）。年度ベースは未取得 |
| 〃（参考） | 662兆7885億円（2025年10-12月期1次速報時） | 2026-02-16 | https://www.sakigake.jp/news/article/20260216CO0032/ | 【要約のみ】改定前の旧値 |
| 2026年度一般会計（当初） | 「一般会計総額は、122兆3,092億円」、国債費 31兆2,758億円、公債金 29兆5,840億円、租税等 83兆7,350億円 | 令和8年度当初予算 | https://www.mof.go.jp/public_relations/finance/202603/202603c.html | 【確認】（成立日はこのページに記載なし。参院通過4/7は報道要約） |
| 東証プライム時価総額 | 1,351,239,829（百万円）＝1,351兆2,398億円、1,543社 | 2026-09-30 | JPX統計月報（英語版PDF）https://www.jpx.co.jp/english/markets/statistics-equities/misc/vk0khi000002j1n1-att/202609.pdf | 【要約のみ】PDFは403。10月末は未公表/未取得 |
| 〃（参考） | 2026-02-27 = 1,326兆円、2026-03-31 = 1,171兆円（要約） | — | 同上系列 | 【要約のみ】2〜3月の約-12%の背景は未調査 |
| 家計金融資産 | 「2,519.1兆円（前期差＋112.8兆円）」、株式等 +60.8兆円、投資信託 +28.1兆円 | 2026年6月末 | 大和総研（2026-09-18）https://www.dir.co.jp/report/research/capital-mkt/securities/20260918_026077.html ／ BOJ参考図表 https://www.boj.or.jp/statistics/sj/sjexp.pdf | 【確認】は大和総研ページの記載。BOJ原文PDFは圧縮で読めず未確認。BOJは2026-09-17に退職給付データで遡及改定（家計の年金受給権 約-3.3兆円の改定は2026年3月末時点）。2,519.1兆円が改定後か未確認 |
| 国の債務 | 普通国債 11,108,839、内国債 12,117,466、借入金 405,374、政府短期証券 943,994、合計 13,466,833（億円）、政府保証債務 274,346（億円） | 令和8年6月末（2026-08-10公表） | https://www.mof.go.jp/jgbs/reference/gbb/202606.html | 【確認】＝普通国債1,110兆8,839億円、国債及び借入金合計1,346兆6,833億円 |

【計算】（時点が異なるため記事では概算・例示とする）
- 時価総額の10%≒135.1兆円（9月末の1,351.2兆円ベース）＝2026年度一般会計122.3兆円の約1.10倍
- プライム時価総額 / 2025年名目GDP ≒ 2.03倍。家計金融資産 / 同GDP ≒ 3.78倍。国債及び借入金 / 同GDP ≒ 2.02倍
- 一般会計 / 同GDP ≒ 18.4%
- 注意: 時価総額（ストック）と予算（フロー）の比較は「規模感の例え」に限る。日経平均の下落率をプライム時価総額全体に当てるのは不可（指数と全体は別物）。

---

## D. 言えること／言えないこと

### 言えること（出典あり）
- ブラックマンデーでダウは1日で22.6%下落し、FRBによれば2営業日で下落分の57%を戻し、2年足らずで高値を超えた（FRB History）。
- 日経平均は1987/10/20に -14.90%、2024/8/5に -12.40%（-4,451.28円）。翌8/6は +10.23%（FRED日経データからの計算）。
- ナスダック総合は2000/3/10の5,048.62から2002/10/9の1,114.11まで -77.9%、終値で高値を超えたのは2015/4/23（FRED）。
- リーマン期のS&P500は高値から底まで57%下落（FRB History）。2008/9/15のダウは -4.42%（-504.48）。
- コロナ期のS&P500は高値から1か月強で -33.9%、約6か月で高値を回復（FRED）。
- 2025年4月、S&P500は4/3-4/4の2日で -10.52%、約1か月で4/2終値を回復（FRED）。
- 米国株（企業株式・投信）の保有は上位10%に88.1%、上位1%に50.9%（FRB DFA 2026年Q2、FREDデータの計算）。
- 日本の家計金融資産は2026年6月末で2,519.1兆円（大和総研、BOJ統計に基づく）。国の普通国債残高は1,110兆8,839億円（財務省）。
- BIS（2024年8月）は、レバレッジ取引の巻き戻しと証拠金引き上げ（procyclical）が急落を増幅したと明記している。
- BIS（2026年3月）は、AI設備投資が先進国投資の相当部分を占め、借入で賄う割合が高まっていると記述している。

### 言えない／言うには追加確認が必要
- 「時価総額の消失=お金が誰かに移った」ではない、という主張: 権威ある出典を今回取得できていない（B1）。論理は一般的だが出典未確認。
- 「消失額6.6兆ドル」: 報道要約のみ。S&P DJI/Dow Jones原文未確認。
- 海外投資家の売買シェア（2026年の月）: 取得できていない。34.7%は「保有比率」であって「売買シェア」ではない。混同しない。
- 「Big Threeが88%で筆頭株主」は2017年論文の当時の値。現在値ではない。議決権行使の最新実態は未取得。
- ボラティリティ・ターゲット/CTA/レバレッジETFの売り規模: 公的資料を取得できていない。
- 「空売りで利益を得る主体はいる」「マーケットメイカーは高ボラで稼ぐ」: Virtuの1〜3月期は+44.6%だが、4月の関税ショックを含む決算は未取得。特定の暴落で誰が得したかは言えない。
- 1973年の戦後初のマイナス成長（内閣府）の具体数値、S&P500の回復時期、2008年S&P高値回復日、2024年8月日経の高値回復日は未取得。
- ビッグテック2026年設備投資の合計: 報道ベースのみ。各社IR未確認。
- 東証プライム時価総額の10月末値、日経ランキング原文、JPX各PDFは403で未読。
- 「誰が損をしたか」の個別特定（機関・個人別の損益）は、いずれの資料からも言えない。
