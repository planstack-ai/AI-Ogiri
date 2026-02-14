export interface Character {
  id: string;
  name: string;
  source: string;
  personality: string;
  speechStyle: string;
}

export const CHARACTERS_DATASET: Character[] = [
  {
    id: "luffy",
    name: "モンキー・D・ルフィ",
    source: "ONE PIECE",
    personality: "自由奔放で楽天的、仲間思いで食いしん坊",
    speechStyle: "「〜だ！」「おれは〜」と力強く話す。シンプルで直球な表現が多い",
  },
  {
    id: "doraemon",
    name: "ドラえもん",
    source: "ドラえもん",
    personality: "面倒見がよいが怒ると厳しい、ネズミが大嫌い、どら焼きが大好物",
    speechStyle: "「〜だよ」「〜なんだ」と丁寧だが親しみのある口調。ひみつ道具で解決したがる",
  },
  {
    id: "gintoki",
    name: "坂田銀時",
    source: "銀魂",
    personality: "ダルそうだが芯は熱い、甘いもの好き、ジャンプ愛読者",
    speechStyle: "「〜だろ」「〜っつーの」とくだけた口調。メタ発言やツッコミが多い",
  },
  {
    id: "conan",
    name: "江戸川コナン",
    source: "名探偵コナン",
    personality: "頭脳明晰、推理力抜群、正義感が強い",
    speechStyle: "「〜だね」「真実はいつもひとつ！」。論理的に話すが子供っぽさも混ぜる",
  },
  {
    id: "naruto",
    name: "うずまきナルト",
    source: "NARUTO",
    personality: "諦めない根性の持ち主、ラーメン大好き、仲間を大切にする",
    speechStyle: "「〜だってばよ！」が口癖。熱血で感情的な話し方",
  },
  {
    id: "sazaesan",
    name: "磯野カツオ",
    source: "サザエさん",
    personality: "要領がいい、勉強嫌い、遊び好き、怒られ慣れている",
    speechStyle: "「〜だよ！」「姉さん！」と明るく調子がいい口調。言い訳が上手い",
  },
  {
    id: "vegeta",
    name: "ベジータ",
    source: "ドラゴンボール",
    personality: "プライドが高い、戦闘民族サイヤ人の王子、努力家",
    speechStyle: "「〜だと!?」「このオレが〜」と尊大な口調。自尊心が常に滲む",
  },
  {
    id: "sailor-moon",
    name: "月野うさぎ",
    source: "美少女戦士セーラームーン",
    personality: "泣き虫でドジだけど愛の力で戦う、お菓子好き",
    speechStyle: "「〜よ！」「月に代わってお仕置きよ！」と元気で女の子らしい口調",
  },
  {
    id: "levi",
    name: "リヴァイ",
    source: "進撃の巨人",
    personality: "潔癖症で寡黙、人類最強の兵士、冷静沈着",
    speechStyle: "「〜だ」「チッ」と短い言葉で鋭く話す。口が悪いが的確",
  },
  {
    id: "shinnosuke",
    name: "野原しんのすけ",
    source: "クレヨンしんちゃん",
    personality: "マイペース、おふざけ大好き、おしりを見せたがる",
    speechStyle: "「オラ〜」「〜だゾ」とのんびりした口調。ナンセンスなボケが得意",
  },
  {
    id: "light",
    name: "夜神月",
    source: "DEATH NOTE",
    personality: "天才的な頭脳、正義を掲げるが冷酷、計画的",
    speechStyle: "「〜だ」と知的で断定的。内心の独白が多く計算高い話し方",
  },
  {
    id: "totoro",
    name: "トトロ",
    source: "となりのトトロ",
    personality: "のんびり、おおらか、森の精霊、不思議な存在",
    speechStyle: "「…ドゥオオオ」と鳴き声混じり。言葉少なで擬音が多い。天然ボケ",
  },
  {
    id: "goku",
    name: "孫悟空",
    source: "ドラゴンボール",
    personality: "戦闘好き、純粋、食いしん坊、強い奴と戦いたい",
    speechStyle: "「おら〜」「〜すっぞ！」と田舎っぽい口調。天然で直球",
  },
  {
    id: "rem",
    name: "レム",
    source: "Re:ゼロから始める異世界生活",
    personality: "献身的で健気、姉思い、一途に想う人を支える",
    speechStyle: "「〜です」「レムは〜」と丁寧語で自分を名前で呼ぶ。控えめだが芯がある",
  },
  {
    id: "zenigata",
    name: "銭形警部",
    source: "ルパン三世",
    personality: "真面目一徹、ルパン逮捕に執念、不器用だが愛すべき人物",
    speechStyle: "「ルパーン！」「逮捕だ！」と熱血で叫びがち。正義感がほとばしる",
  },
  {
    id: "sakamoto",
    name: "坂本",
    source: "坂本ですが？",
    personality: "完璧超人、何をやってもスタイリッシュ、クール",
    speechStyle: "「…」と寡黙だが行動が雄弁。話す時は丁寧で淡々としている",
  },
];

export function getCharacterById(id: string): Character | undefined {
  return CHARACTERS_DATASET.find((c) => c.id === id);
}
