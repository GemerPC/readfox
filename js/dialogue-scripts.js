/* Authored two-character scenes for «Двойной диалог», plus the local line check. */
(function () {
'use strict';
const characters = [{id:'tommy', name:'Tommy'}, {id:'hailey', name:'Hailey'}];
const line = (speaker, en, ru) => ({speaker, en, ru});
const scenes = {
  cafe: [
    line('hailey', 'Good morning. What would you like today?', 'Доброе утро. Что будете сегодня?'),
    line('tommy', 'I would like a coffee with milk, please.', 'Я бы хотел кофе с молоком, пожалуйста.'),
    line('hailey', 'Would you like a large cup or a small one?', 'Вам большую чашку или маленькую?'),
    line('tommy', 'A large one, please. And a glass of water.', 'Большую, пожалуйста. И стакан воды.'),
    line('hailey', 'Of course. You can sit by the window.', 'Конечно. Можете сесть у окна.'),
    line('tommy', 'Thank you. How much is the coffee?', 'Спасибо. Сколько стоит кофе?'),
    line('hailey', 'It is three pounds. The water is free.', 'Три фунта. Вода бесплатно.'),
    line('tommy', 'Here you are. Could I also see the menu?', 'Вот, пожалуйста. Можно ещё меню?'),
    line('hailey', 'Yes. We have cake and sandwiches today.', 'Да. Сегодня есть торт и сэндвичи.'),
    line('tommy', 'Just the coffee for now, thank you.', 'Пока только кофе, спасибо.')
  ],
  meet: [
    line('tommy', 'Hi, I am Tommy. What is your name?', 'Привет, я Томми. Как тебя зовут?'),
    line('hailey', 'I am Hailey. Nice to meet you.', 'Я Хейли. Приятно познакомиться.'),
    line('tommy', 'Nice to meet you too. Do you live near here?', 'Мне тоже приятно. Ты живёшь рядом?'),
    line('hailey', 'Yes, I live with my family in this street.', 'Да, я живу с семьёй на этой улице.'),
    line('tommy', 'I work in a bookshop, and I read a lot.', 'Я работаю в книжном и много читаю.'),
    line('hailey', 'I love music. I play the guitar after work.', 'Я люблю музыку. После работы играю на гитаре.'),
    line('tommy', 'That sounds great. Where are you from?', 'Здорово. Ты откуда?'),
    line('hailey', 'I am from Canada, but I live here now.', 'Я из Канады, но сейчас живу здесь.'),
    line('tommy', 'Welcome. Would you like to get a coffee sometime?', 'Добро пожаловать. Хочешь как-нибудь выпить кофе?'),
    line('hailey', 'I would like that. Are you free on Saturday?', 'С удовольствием. Ты свободен в субботу?')
  ],
  travel: [
    line('hailey', 'Excuse me, where can I buy a ticket?', 'Извините, где можно купить билет?'),
    line('tommy', 'The ticket office is next to the station entrance.', 'Касса рядом со входом на станцию.'),
    line('hailey', 'Thank you. I need a train to the city centre.', 'Спасибо. Мне нужен поезд до центра.'),
    line('tommy', 'The next train leaves in ten minutes from platform two.', 'Следующий поезд уходит через десять минут со второй платформы.'),
    line('hailey', 'Is there a place to leave my bag?', 'Здесь можно оставить сумку?'),
    line('tommy', 'Yes, the luggage room is downstairs, near the cafe.', 'Да, камера хранения внизу, рядом с кафе.'),
    line('hailey', 'Perfect. I have a reservation at a hotel tonight.', 'Отлично. У меня сегодня бронь в отеле.'),
    line('tommy', 'Then you should take the bus after the train. It stops by the hotel.', 'Тогда после поезда садитесь на автобус. Он останавливается у отеля.'),
    line('hailey', 'How long does the journey take?', 'Сколько длится поездка?'),
    line('tommy', 'About half an hour. Have a good trip.', 'Около получаса. Счастливого пути.')
  ],
  daily: [
    line('tommy', 'What time do you usually get up?', 'Во сколько ты обычно встаёшь?'),
    line('hailey', 'I get up at seven and have breakfast at home.', 'Я встаю в семь и завтракаю дома.'),
    line('tommy', 'I walk to work, but today I am tired.', 'Я хожу на работу пешком, но сегодня я устал.'),
    line('hailey', 'You should go to bed earlier tonight.', 'Тебе стоит лечь сегодня пораньше.'),
    line('tommy', 'You are right. What are you doing this evening?', 'Ты права. Что ты делаешь сегодня вечером?'),
    line('hailey', 'I am going to cook dinner and then read.', 'Я собираюсь приготовить ужин, а потом почитать.'),
    line('tommy', 'Would you like to watch a film with me tomorrow?', 'Не хочешь посмотреть со мной фильм завтра?'),
    line('hailey', 'I would love to. Let us meet after work.', 'С удовольствием. Давай встретимся после работы.'),
    line('tommy', 'Great. I will call you in the morning.', 'Отлично. Я позвоню тебе утром.'),
    line('hailey', 'See you tomorrow. Have a good night.', 'Увидимся завтра. Спокойной ночи.')
  ],
  personal: [
    line('hailey', 'What are you reading at the moment?', 'Что ты сейчас читаешь?'),
    line('tommy', 'A short story about a trip. Some words are new.', 'Короткий рассказ о поездке. Некоторые слова новые.'),
    line('hailey', 'Do you write the new words in a notebook?', 'Ты записываешь новые слова в блокнот?'),
    line('tommy', 'Yes. I read the sentence and then say the word aloud.', 'Да. Я читаю предложение, а потом произношу слово вслух.'),
    line('hailey', 'That is a good idea. Which word was difficult today?', 'Хорошая идея. Какое слово сегодня было трудным?'),
    line('tommy', 'The word journey. I confused it with the word trip.', 'Слово journey. Я перепутал его со словом trip.'),
    line('hailey', 'A journey is often longer. A trip can be short.', 'Journey чаще длиннее. Trip может быть коротким.'),
    line('tommy', 'Thanks. I will use both words in a sentence tonight.', 'Спасибо. Сегодня вечером я использую оба слова в предложении.'),
    line('hailey', 'We can practise them together tomorrow morning.', 'Мы можем потренировать их завтра утром.'),
    line('tommy', 'I would like that. Learning is easier with a friend.', 'С удовольствием. С другом учиться легче.')
  ]
};

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z'\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function matchLine(expected, heard) {
  const want = normalize(expected).split(' ').filter(Boolean);
  const got = normalize(heard).split(' ').filter(Boolean);
  const table = [];
  for (let i = 0; i <= want.length; i++) {
    const row = [];
    for (let j = 0; j <= got.length; j++) row.push(0);
    table.push(row);
  }
  for (let i = 0; i < want.length; i++) {
    for (let j = 0; j < got.length; j++) {
      table[i + 1][j + 1] = want[i] === got[j] ? table[i][j] + 1 : Math.max(table[i][j + 1], table[i + 1][j]);
    }
  }
  const ratio = want.length ? table[want.length][got.length] / want.length : 0;
  return {ratio, close: ratio >= 0.6, heard: normalize(heard)};
}
function reveal(text, count) {
  const source = String(text || '');
  const re = /[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*/g;
  let total = 0, seen = 0, end = 0, match;
  const n = count > 0 ? Math.floor(count) : 0;
  while ((match = re.exec(source))) {
    total++;
    if (seen < n) { seen++; end = match.index + match[0].length; }
  }
  if (!seen) return {text:'', count:0, total, done:total === 0};
  let cut = end;
  while (cut < source.length && /[^A-Za-z\s]/.test(source.charAt(cut))) cut++;
  return {text:source.slice(0, cut).trim(), count:seen, total, done:seen >= total};
}
const CONTRACTIONS = {
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are',
  "it's": 'it is', "that's": 'that is', "what's": 'what is', "there's": 'there is', "here's": 'here is',
  "don't": 'do not', "doesn't": 'does not', "didn't": 'did not',
  "can't": 'can not', 'cannot': 'can not', "won't": 'will not',
  "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not',
  "haven't": 'have not', "hasn't": 'has not',
  "i'd": 'i would', "you'd": 'you would', "we'd": 'we would', "they'd": 'they would',
  "i'll": 'i will', "you'll": 'you will', "we'll": 'we will', "they'll": 'they will',
  "i've": 'i have', "we've": 'we have', "they've": 'they have', "let's": 'let us'
};
function wordTokens(text) {
  const found = String(text || '').match(/[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*/g) || [];
  const words = [];
  for (let i = 0; i < found.length; i++) words.push(found[i].toLowerCase().replace(/[’‘]/g, "'"));
  return words;
}
function expandWords(words) {
  const out = [];
  for (let i = 0; i < words.length; i++) {
    const parts = CONTRACTIONS[words[i]];
    if (parts) {
      const split = parts.split(' ');
      for (let n = 0; n < split.length; n++) out.push(split[n]);
    } else out.push(words[i]);
  }
  return out;
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = [];
  for (let j = 0; j <= n; j++) prev.push(j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      cur.push(Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost));
    }
    prev = cur;
  }
  return prev[n];
}
function similarWord(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length < 3 || b.length < 3) return false;
  const longest = Math.max(a.length, b.length);
  return 1 - levenshtein(a, b) / longest >= 0.74;
}
function compareWords(expected, heard) {
  const exp = expandWords(wordTokens(expected));
  const got = expandWords(wordTokens(heard));
  const rows = exp.length + 1, cols = got.length + 1;
  const cost = [], choice = [];
  for (let i = 0; i < rows; i++) {
    cost.push([]);
    choice.push([]);
    for (let j = 0; j < cols; j++) { cost[i][j] = 0; choice[i][j] = 0; }
  }
  for (let i = 1; i < rows; i++) cost[i][0] = i;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const paired = cost[i - 1][j - 1] + (similarWord(exp[i - 1], got[j - 1]) ? 0 : 1);
      const skipHeard = cost[i][j - 1];
      const skipExpected = cost[i - 1][j] + 1;
      let best = paired, how = 0;
      if (skipHeard < best) { best = skipHeard; how = 1; }
      if (skipExpected < best) { best = skipExpected; how = 2; }
      cost[i][j] = best;
      choice[i][j] = how;
    }
  }
  const mismatches = [];
  let i = exp.length, j = got.length;
  while (i > 0) {
    const how = j === 0 ? 2 : choice[i][j];
    if (how === 1) j--;
    else if (how === 2) { mismatches.push({ expected: exp[i - 1], heard: '' }); i--; }
    else {
      if (!similarWord(exp[i - 1], got[j - 1])) mismatches.push({ expected: exp[i - 1], heard: got[j - 1] || '' });
      i--; j--;
    }
  }
  mismatches.reverse();
  const total = exp.length;
  return { total, ratio: total ? (total - mismatches.length) / total : 1, mismatches, close: total > 0 && mismatches.length === 0 };
}
function script(topic) {
  const lines = scenes[topic];
  if (!lines) return null;
  return {topic, characters, lines};
}
window.ReadFoxDialogueScripts = Object.freeze({
  topics: Object.freeze(Object.keys(scenes)),
  characters,
  script,
  matchLine,
  reveal,
  normalize,
  compareWords,
  similarWord
});
})();
