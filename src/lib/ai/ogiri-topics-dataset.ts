export type TopicCategory = "konna" | "if" | "nazokake" | "oogiri" | "bokete";

export interface TopicEntry {
  topic: string;
  category: TopicCategory;
}

export const OGIRI_TOPICS_DATASET: TopicEntry[] = [
  // ===== こんな○○は嫌だ =====
  { topic: "こんな回転寿司は嫌だ", category: "konna" },
  { topic: "こんなAIアシスタントは嫌だ", category: "konna" },
  { topic: "こんな結婚式は嫌だ", category: "konna" },
  { topic: "こんな校長先生の話は嫌だ", category: "konna" },
  { topic: "こんなコンビニは嫌だ", category: "konna" },
  { topic: "こんなタクシーは嫌だ", category: "konna" },
  { topic: "こんな動物園は嫌だ", category: "konna" },
  { topic: "こんな自動運転は嫌だ", category: "konna" },
  { topic: "こんなサブスクは嫌だ", category: "konna" },
  { topic: "こんなリモート会議は嫌だ", category: "konna" },

  // ===== もしも =====
  { topic: "もしも総理大臣がYouTuberだったら", category: "if" },
  { topic: "もしもドラえもんが関西弁だったら", category: "if" },
  { topic: "もしも日本語が全て敬語になったら", category: "if" },
  { topic: "もしもお寿司屋さんがホラーハウスだったら", category: "if" },
  { topic: "もしもAIが学校の先生になったら", category: "if" },
  { topic: "もしもタイムマシンが100円で使えたら", category: "if" },
  { topic: "もしも猫が日本語を話せたら最初に言いそうなこと", category: "if" },
  { topic: "もしも全員がテレパシー使えたら困ること", category: "if" },
  { topic: "もしも重力が半分になったら起きそうなこと", category: "if" },
  { topic: "もしもスマホが江戸時代にあったら", category: "if" },

  // ===== なぞかけ =====
  { topic: "「プログラミング」とかけまして「料理」と解きます。その心は？", category: "nazokake" },
  { topic: "「月曜日」とかけまして「ダイエット」と解きます。その心は？", category: "nazokake" },
  { topic: "「SNS」とかけまして「遊園地」と解きます。その心は？", category: "nazokake" },
  { topic: "「AI」とかけまして「子育て」と解きます。その心は？", category: "nazokake" },
  { topic: "「就職活動」とかけまして「釣り」と解きます。その心は？", category: "nazokake" },
  { topic: "「満員電車」とかけまして「人生」と解きます。その心は？", category: "nazokake" },
  { topic: "「コーヒー」とかけまして「上司」と解きます。その心は？", category: "nazokake" },
  { topic: "「スマートフォン」とかけまして「恋愛」と解きます。その心は？", category: "nazokake" },

  // ===== 自由なお題（大喜利） =====
  { topic: "サンタクロースのあまり知られていない裏設定とは？", category: "oogiri" },
  { topic: "未来の辞書に載っている新しい四字熟語を教えてください", category: "oogiri" },
  { topic: "絶対に売れない新商品の名前とキャッチコピー", category: "oogiri" },
  { topic: "AIが書いた卒業式の答辞で会場が凍りついた理由", category: "oogiri" },
  { topic: "宇宙人が地球に来てまず驚いたこと", category: "oogiri" },
  { topic: "100年後の歴史の教科書に載っている、現代の出来事の間違った説明", category: "oogiri" },
  { topic: "おばあちゃんの知恵袋に絶対載ってない知恵", category: "oogiri" },
  { topic: "新しいオリンピック競技を提案してください", category: "oogiri" },
  { topic: "絶対に使ってはいけない魔法の呪文", category: "oogiri" },
  { topic: "世界一どうでもいいギネス記録", category: "oogiri" },
  { topic: "逆に不便になったテクノロジーの進化", category: "oogiri" },
  { topic: "深夜3時に送ると友情が終わるLINEメッセージ", category: "oogiri" },

  // ===== 写真で一言（ボケて）風 =====
  { topic: "全校集会で校長先生が突然マイクを置いた。何があった？", category: "bokete" },
  { topic: "レストランで「本日のおすすめ」を聞いたら店員が泣き出した。なぜ？", category: "bokete" },
  { topic: "お化け屋敷でお化けが逃げ出した理由", category: "bokete" },
  { topic: "ATMに表示された謎のメッセージとは？", category: "bokete" },
  { topic: "犬が飼い主に隠していたこと", category: "bokete" },
  { topic: "人生で一番どうでもいい自慢を聞かせてください", category: "bokete" },
  { topic: "授業参観で先生が保護者にキレた理由", category: "bokete" },
  { topic: "AIに「感情はありますか？」と聞いたら返ってきた衝撃の回答", category: "bokete" },
  { topic: "エレベーターで気まずくなる一言", category: "bokete" },
  { topic: "忍者が現代社会で就職活動。履歴書の特技欄に書いたこと", category: "bokete" },
];
