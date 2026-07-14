(function(){
"use strict";

const SOUND_ICON = '<svg class="sound-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10"/></svg>';

/* ============================================================
   ДАННЫЕ: тексты для чтения
   ============================================================ */
const TEXTS = [
  {
    id:'morning', level:'beginner', title:'Моё утро',
    teaser:'Простой рассказ о ежедневном утреннем распорядке — хороший текст для начала.',
    body:
`Every morning, I wake up at seven o'clock. First, I open the window and look at the sky. The air is fresh and cool. I make my bed and go to the bathroom. I wash my face and brush my teeth.

Then I go to the kitchen and make breakfast. I usually eat eggs, bread, and fruit. I drink a cup of tea or coffee. After breakfast, I get dressed and pack my bag. I check my phone for messages.

At eight o'clock, I leave the house and walk to the bus stop. The bus comes, and I sit near the window. I watch the streets and the people. I think about my plans for the day. School starts at nine, and I am never late.`
  },
  {
    id:'park', level:'beginner', title:'Прогулка в парке',
    teaser:'Воскресная прогулка семьи в парке: утки, велосипед и закат.',
    body:
`On Sunday, my family likes to walk in the park near our home. The park is big and green, with tall trees and a small lake. We usually go there after lunch.

My little sister loves to feed the ducks. She brings bread and throws small pieces into the water. The ducks swim fast when they see food. My father likes to ride his bicycle along the path, while my mother sits on a bench and reads a book. I often play with our dog. He runs after a ball and brings it back to me.

Sometimes we see other families having a picnic on the grass. When the sun starts to set, the sky turns orange and pink. We sit together and watch the colors change. Then we walk home, tired but happy.`
  },
  {
    id:'coffee', level:'intermediate', title:'Кофейня на углу',
    teaser:'Короткая история об уютной кофейне и её хозяине по имени Том.',
    body:
`There is a small coffee shop on the corner of my street. It opened two years ago, but it already feels like an old friend. Every morning, the owner, a quiet man named Tom, stands behind the counter and grinds fresh coffee beans. The smell fills the whole street and pulls people inside.

I usually stop there before work, even though I am always in a hurry. Tom remembers my order without asking. He simply nods and starts making my coffee while I find a seat by the window. The shop is narrow, with wooden tables and shelves full of old books. Soft music plays quietly in the background.

Sometimes I notice strangers having quiet conversations, sharing secrets or making plans. Once, an elderly woman told me that this shop reminded her of a place she visited as a child in another country. I think that is why people keep coming back — not just for the coffee, but for the feeling of being somewhere familiar. When I finally leave with my cup in hand, the cold morning air feels a little warmer.`
  },
  {
    id:'internet', level:'intermediate', title:'Как интернет изменил всё',
    teaser:'Небольшое размышление о том, как технологии изменили общение, бизнес и образование.',
    body:
`Thirty years ago, very few people had access to the internet. Today, it is hard to imagine daily life without it. The internet has changed the way we communicate, work, and learn. In the past, sending a letter took days or even weeks. Now, a message can reach someone on the other side of the world in seconds.

Businesses have also changed completely. Small shops can sell their products to customers in different countries through online stores. Education has become more open as well. Anyone with an internet connection can watch lectures from famous universities for free.

However, these changes also bring new problems. People spend more time looking at screens and less time talking face to face. Some experts worry that young people are losing important social skills. Others believe that technology simply created new ways to connect, rather than replacing old ones. Whatever the truth is, one thing is certain: the internet will continue to shape our future in ways we cannot fully predict yet.`
  },
  {
    id:'new-apartment', level:'intermediate', title:'Переезд в новую квартиру',
    teaser:'Первые дни после переезда: коробки, новая мебель и знакомство с соседями.',
    body:
`Last month, I moved into a new apartment on the other side of the city. The building is not new, but the rooms are bright and the kitchen is much larger than the one in my old place. On the first evening, I was too tired to unpack, so I ordered a pizza and ate it while sitting on a box.

The next morning, I started organizing everything. I put my clothes in the bedroom cupboard, arranged my books on a shelf, and found a place for the coffee machine. I still need to buy a small table for the kitchen and some curtains for the living room. Moving is expensive, so I am trying not to buy everything at once.

My neighbors seem friendly. A woman from the apartment upstairs brought me a plant and told me where the nearest supermarket was. The area is quieter than my old neighborhood, although the bus stop is a little farther away. The apartment does not feel completely like home yet, but every day it becomes more comfortable.`
  },
  {
    id:'weekly-shopping', level:'intermediate', title:'Покупки на неделю',
    teaser:'Как составить список продуктов, уложиться в бюджет и ничего не забыть.',
    body:
`Every Saturday morning, I do the shopping for the whole week. I used to go to the supermarket without a plan, but I often bought things I did not need and forgot something important. Now I check the fridge first and write a list on my phone.

This week, I needed vegetables, rice, chicken, bread, and a few things for breakfast. I also wanted to buy coffee, but my usual brand had become much more expensive. I compared several packages and chose a cheaper one that was on sale. At the fruit section, I noticed that local apples cost less than imported ones, so I bought a large bag.

Before paying, I looked through my basket one more time. I had almost forgotten washing-up liquid, which was the main reason I had come to the shop. The final price was slightly higher than I expected, but I stayed close to my budget. Making a list may seem boring, but it saves both time and money.`
  },
  {
    id:'missed-bus', level:'intermediate', title:'Утро без автобуса',
    teaser:'Опоздание на остановку, неожиданный маршрут и попытка вовремя попасть на работу.',
    body:
`On Tuesday, I left home five minutes later than usual. I thought I could still catch my bus, but I saw it leaving the stop as I turned the corner. The next one was not due for twenty minutes, and I had an important meeting at nine.

I checked a transport app and found another route. It involved taking a tram and then walking for ten minutes. The tram was crowded, but at least it moved faster than the traffic around us. When I got off, it started raining, and I realized that my umbrella was still at home.

I arrived at the office wet and out of breath, only two minutes before the meeting began. My manager smiled and said that several other people were late because of the weather. Since then, I have started preparing my bag in the evening and leaving home a little earlier. It is a small change, but my mornings have become much less stressful.`
  },
  {
    id:'washing-machine', level:'intermediate', title:'Сломанная стиральная машина',
    teaser:'Обычная стирка превращается в бытовую проблему, которую приходится быстро решать.',
    body:
`I was doing laundry on Sunday when the washing machine suddenly made a strange noise and stopped. The door would not open, and there was still water inside. I turned the machine off, waited a few minutes, and tried again, but nothing changed.

First, I looked for the instruction manual, but I could not find it. Then I searched for the model online and watched a short repair video. It explained how to empty the water through a small filter near the floor. I put several towels under the machine and opened the filter carefully. A coin was stuck inside it.

After I removed the coin, the machine started working again. Unfortunately, the bathroom floor was already covered with water, so I spent another half hour cleaning it. I was relieved that I did not have to call a repair service. I also learned an important lesson: always check the pockets of your clothes before putting them in the washing machine.`
  },
  {
    id:'dinner-guests', level:'intermediate', title:'Ужин для друзей',
    teaser:'Подготовка домашнего ужина, небольшая ошибка на кухне и тёплый вечер.',
    body:
`Last Friday, I invited three friends to dinner at my place. I decided to cook pasta with vegetables because it was simple and everyone could eat it. I bought the ingredients on my way home and started cooking an hour before they arrived.

At first, everything went well. I cut the vegetables, prepared a salad, and put some music on. Then I noticed that I had forgotten to buy cheese. I called my friend Anna, who was already on her way, and asked her to stop at a small shop near my building. She arrived with two different kinds because she did not know which one I wanted.

The pasta was ready a little too early, so it became slightly cold while we were talking. Nobody complained. We added the cheese, opened a bottle of juice, and spent the evening sharing stories. The meal was not perfect, but the atmosphere was relaxed and cheerful. Next time, I will make a better shopping list, but I will invite the same people.`
  },
  {
    id:'dentist-visit', level:'intermediate', title:'Визит к стоматологу',
    teaser:'Запись на приём, волнение перед осмотром и полезные рекомендации врача.',
    body:
`For several days, one of my teeth had been sensitive whenever I drank something cold. I hoped the problem would disappear, but it slowly became worse. Finally, I called a dental clinic near my office and made an appointment for Thursday afternoon.

I was nervous in the waiting room because I had not visited a dentist for almost two years. The dentist asked me a few questions and took an X-ray. Fortunately, there was no serious damage. An old filling had become loose and needed to be replaced.

The treatment took about thirty minutes and was less uncomfortable than I expected. Before I left, the dentist showed me a better way to brush the back teeth and recommended using dental floss every evening. I also booked another check-up for six months later. Going to the dentist is never my favorite activity, but dealing with a small problem early is much easier than waiting until it becomes painful and expensive.`
  },
  {
    id:'returning-package', level:'intermediate', title:'Возврат интернет-заказа',
    teaser:'Неудачная покупка одежды онлайн и оформление возврата через пункт выдачи.',
    body:
`I recently ordered a jacket from an online shop. The photos looked good, and the reviews were mostly positive. When the package arrived, however, the jacket was much darker than it appeared on the website, and the sleeves were too short.

I checked the return policy and learned that I had fourteen days to send it back. First, I filled in an online form and selected the reason for the return. Then I printed a label, packed the jacket in the original bag, and took it to a collection point near the train station.

The employee scanned the label and gave me a receipt with a tracking number. Three days later, I received an email saying that the shop had accepted the return. The money appeared in my bank account at the end of the week. The process was easier than I expected, but I will be more careful with size charts in the future. Online shopping is convenient, although you cannot always trust colors and sizes on a screen.`
  },
  {
    id:'noisy-neighbors', level:'intermediate', title:'Шумные соседи',
    teaser:'Как спокойно обсудить громкую музыку и договориться без конфликта.',
    body:
`A young couple moved into the apartment next to mine a few weeks ago. They seemed polite when we met in the hall, but they often played loud music late in the evening. At first, I ignored it because I did not want to create a problem with new neighbors.

Last Wednesday, the music continued after midnight, and I could not sleep. I considered calling the building manager, but I decided to speak to them first. I knocked on their door and politely explained that my bedroom was next to their living room and that I had to get up early for work.

They were surprised and apologized immediately. They had not realized how clearly the sound traveled through the wall. They turned the music down and gave me their phone number, asking me to send a message if it happened again. Since that conversation, the building has been quiet at night. I am glad I spoke to them directly instead of becoming angry or making an official complaint.`
  },
  {
    id:'cleaning-saturday', level:'intermediate', title:'Большая субботняя уборка',
    teaser:'Домашние дела, ненужные вещи и порядок, который помогает начать неделю спокойнее.',
    body:
`By the end of a busy week, my apartment usually becomes untidy. Clothes collect on a chair, cups stay on the desk, and papers cover the kitchen table. On Saturday, I decided to spend the morning cleaning everything properly.

I opened the windows, put on a podcast, and started with the bedroom. I changed the bed sheets, put away my clothes, and found two sweaters that I no longer wore. Instead of throwing them away, I placed them in a bag to donate. Then I cleaned the bathroom and vacuumed the floors.

The kitchen took the longest because I also checked the cupboards. Some food had passed its expiration date, and several containers were almost empty. I wrote down what I needed to replace before my next shopping trip. The whole job took nearly three hours, but the apartment felt completely different afterward. I made tea, sat down with a book, and enjoyed the quiet. A clean home does not solve every problem, but it helps me feel more organized.`
  },
  {
    id:'working-from-home', level:'intermediate', title:'Рабочий день из дома',
    teaser:'Как организовать удалённую работу, не отвлекаться и вовремя закончить день.',
    body:
`I work from home twice a week. At first, I enjoyed staying in comfortable clothes and avoiding the morning commute. After a while, however, I noticed that I was easily distracted by housework, messages, and the kitchen.

Now I follow a simple routine. I get dressed before eight, make coffee, and sit at a small desk in the living room. I keep my phone in another room during important tasks and take a short break every hour. At lunchtime, I leave the apartment for a walk instead of eating in front of the computer.

The most difficult part is finishing work on time. When the office is at home, it is easy to answer one more email or continue working after dinner. I now shut down my laptop at six and put it in a drawer. This small action helps me understand that the working day is over. Remote work gives me more freedom, but it also requires clear habits and a little self-discipline.`
  },
  {
    id:'fox', level:'advanced', title:'Лиса и путник',
    teaser:'Оригинальная басня о хитрой лисе и заблудшем путнике.',
    body:
`Long ago, in a forest where the trees grew taller than towers, there lived a fox known for her cleverness. One evening, a tired traveler lost his way and wandered into her territory. Hungry and confused, he sat beneath an old oak and wept quietly, certain that he would never find the road again.

The fox watched him from behind a bush, curious about this strange creature who seemed so helpless. Instead of running away, she stepped closer and asked why he was crying. Surprised that an animal could speak, the traveler explained his situation, expecting little sympathy. To his astonishment, the fox offered to guide him, on one condition: he had to listen carefully to everything she said, without questioning her choices.

The traveler agreed, desperate enough to trust a stranger, even one with sharp teeth and clever eyes. They walked through narrow paths and crossed a shallow river, the fox leading confidently as if she had memorized every stone and shadow. By dawn, they reached the edge of the forest, where a distant village glowed beneath the rising sun.

The traveler thanked her with tears of relief, offering whatever he could give in return. The fox merely smiled and said that kindness, unlike gold, never needs to be repaid. Then she disappeared back into the shadows, leaving the man to wonder whether he had imagined the entire encounter, or whether wisdom truly could wear fur and walk on four legs.`
  }
];

const LEVEL_LABEL = {beginner:'Начальный', intermediate:'B1 · Средний', advanced:'Продвинутый', custom:'Свой текст'};
const LEVEL_SHORT = {beginner:'нач', intermediate:'B1', advanced:'прод', custom:'свой'};
const LEVEL_DOTS = {beginner:1, intermediate:2, advanced:3, custom:0};

/* ============================================================
   ДАННЫЕ: встроенный словарь (база) и неправильные формы
   ============================================================ */
const BASE_DICT = {
  // местоимения
  "i":"я","you":"ты, вы","he":"он","she":"она","it":"оно, это","we":"мы","they":"они",
  "me":"меня, мне","him":"его, ему","her":"её, ей","us":"нас, нам","them":"их, им",
  "my":"мой","your":"твой, ваш","his":"его","its":"его, её (о предмете)","our":"наш","their":"их",
  "mine":"моё","yours":"твоё, ваше","ours":"наше","theirs":"их",
  "myself":"себя (я сам)","yourself":"себя (ты сам)","himself":"себя (он сам)","herself":"себя (она сама)",
  "itself":"само","ourselves":"себя (мы сами)","yourselves":"себя (вы сами)","themselves":"себя (они сами)",
  "this":"этот, это","that":"тот, то","these":"эти","those":"те",
  "who":"кто","whom":"кого, кому","whose":"чей","which":"который, какой","what":"что, какой",
  "when":"когда","where":"где, куда","how":"как","first":"первый, сначала","not":"не",
  "someone":"кто-то","somebody":"кто-то","something":"что-то","somewhere":"где-то, куда-то",
  "anyone":"кто-нибудь","anybody":"кто-нибудь","anything":"что-нибудь","anywhere":"где-нибудь",
  "everyone":"каждый, все","everybody":"все","everything":"всё","everywhere":"везде",
  "nobody":"никто","nothing":"ничто","nowhere":"нигде",
  // артикли / детерминаторы
  "a":"артикль (один, какой-то)","an":"артикль (перед гласным звуком)","the":"определённый артикль",
  "some":"немного, некоторые","any":"любой, какой-нибудь","no":"никакой, нет",
  "every":"каждый","each":"каждый (из)","all":"все, весь","both":"оба",
  "few":"мало, немного","many":"много","much":"много",
  "more":"больше","most":"большинство, больше всего","less":"меньше","least":"меньше всего",
  "other":"другой","another":"другой, ещё один","such":"такой","own":"собственный",
  "good":"хороший","better":"лучше","best":"лучший, лучше всего",
  "bad":"плохой","worse":"хуже","worst":"худший",
  // предлоги
  "in":"в","on":"на","at":"в, у (момент времени)","by":"у, около, к (сроку)","for":"для, за",
  "with":"с","about":"о, около","against":"против","between":"между","into":"внутрь",
  "through":"через","during":"во время","before":"до, перед","after":"после",
  "above":"над","below":"под","to":"к, в","from":"от, из","up":"вверх","down":"вниз",
  "off":"с (поверхности)","over":"над, через","under":"под","of":"из, о (родительный падеж)",
  "out":"из, наружу","near":"рядом, около","along":"вдоль","across":"через, напротив",
  "behind":"за, позади","beyond":"за пределами","beside":"рядом с","among":"среди",
  "around":"вокруг","without":"без","within":"в пределах","toward":"к, в направлении","upon":"на",
  // союзы
  "and":"и","but":"но","or":"или","nor":"ни","so":"поэтому, так","yet":"всё же, однако",
  "because":"потому что","although":"хотя","though":"хотя, всё же","while":"пока, в то время как",
  "if":"если","unless":"если не","since":"с тех пор как, поскольку","whether":"ли (частица)",
  "as":"как, так как","than":"чем","however":"однако","rather":"скорее, вместо",
  "whatever":"что бы ни","cannot":"не могу, не может",
  // вспомогательные/модальные глаголы
  "be":"быть","am":"есть (я)","is":"есть (он/она/оно)","are":"есть (мы/вы/они)",
  "was":"был(а)","were":"были","been":"был (причастие)","being":"будучи",
  "have":"иметь","has":"имеет","had":"имел(а)","having":"имея",
  "do":"делать","does":"делает","did":"делал(а)","doing":"делая","done":"сделано, готово",
  "will":"буду, будет (будущее время)","would":"бы (условное наклонение)",
  "shall":"буду (формальное будущее)","should":"следует, должен",
  "can":"могу, умею","could":"мог(ла) бы","may":"может быть, могу","might":"мог бы (вероятность)","must":"должен, обязан",
  // сокращённые формы (контракции)
  "don't":"не (с глаголом в наст. времени)","doesn't":"не (с глаголом, он/она/оно)","didn't":"не (с глаголом в прош. времени)",
  "isn't":"не является, не","aren't":"не являются, не","wasn't":"не был(а)","weren't":"не были",
  "can't":"не могу, не может","couldn't":"не мог(ла) бы","won't":"не буду, не будет","wouldn't":"не стал(а) бы",
  "shouldn't":"не должен, не следует","haven't":"не имею, не имеем","hasn't":"не имеет","hadn't":"не имел(а)",
  "i'm":"я (есть)","you're":"ты, вы (есть)","he's":"он (есть), у него есть","she's":"она (есть), у неё есть",
  "it's":"это (есть)","we're":"мы (есть)","they're":"они (есть)",
  "i've":"я (имею — перфект)","you've":"вы (имеете)","we've":"мы (имеем)","they've":"они (имеют)",
  "i'll":"я (буду)","you'll":"ты (будешь)","he'll":"он (будет)","she'll":"она (будет)","we'll":"мы (будем)","they'll":"они (будут)",
  "i'd":"я (хотел бы / had)","let's":"давай, давайте","that's":"это (есть)","there's":"там есть, имеется",
  "what's":"что (это)","who's":"кто (это)",
  // время
  "morning":"утро","afternoon":"день (после полудня)","evening":"вечер","night":"ночь",
  "today":"сегодня","yesterday":"вчера","tomorrow":"завтра",
  "day":"день","week":"неделя","month":"месяц","year":"год","hour":"час","minute":"минута","second":"секунда",
  "time":"время","now":"сейчас","then":"тогда, потом",
  "always":"всегда","never":"никогда","sometimes":"иногда","often":"часто","usually":"обычно",
  "already":"уже","still":"всё ещё","again":"снова","soon":"скоро","later":"позже",
  "early":"рано","late":"поздно","ago":"назад (тому)","once":"однажды, один раз","twice":"два раза",
  "o'clock":"час (при указании времени)",
  // числа
  "one":"один","two":"два","three":"три","four":"четыре","five":"пять",
  "six":"шесть","seven":"семь","eight":"восемь","nine":"девять","ten":"десять",
  "eleven":"одиннадцать","twelve":"двенадцать","twenty":"двадцать","thirty":"тридцать",
  "forty":"сорок","fifty":"пятьдесят","hundred":"сто","thousand":"тысяча","number":"число, номер",
  // дни недели
  "monday":"понедельник","tuesday":"вторник","wednesday":"среда","thursday":"четверг",
  "friday":"пятница","saturday":"суббота","sunday":"воскресенье",
  // утро (текст 1)
  "wake":"просыпаться","open":"открывать","window":"окно","look":"смотреть","sky":"небо",
  "air":"воздух","fresh":"свежий","cool":"прохладный","make":"делать, готовить","bed":"кровать",
  "go":"идти, ехать","bathroom":"ванная","wash":"мыть","face":"лицо","brush":"чистить щёткой, щётка",
  "tooth":"зуб","kitchen":"кухня","breakfast":"завтрак","eat":"есть, кушать","egg":"яйцо",
  "bread":"хлеб","fruit":"фрукт","drink":"пить, напиток","cup":"чашка","tea":"чай","coffee":"кофе",
  "dress":"одеваться, платье","dressed":"одетый","pack":"паковать, собирать","bag":"сумка",
  "check":"проверять","phone":"телефон","message":"сообщение","leave":"уходить, покидать",
  "house":"дом","walk":"идти пешком, гулять","bus":"автобус","stop":"остановка, останавливаться",
  "come":"приходить","sit":"сидеть","watch":"смотреть, наблюдать, часы","street":"улица",
  "people":"люди","person":"человек","think":"думать","plan":"план, планировать","school":"школа",
  "start":"начинать",
  // парк (текст 2)
  "family":"семья","like":"нравиться, любить","home":"дом","big":"большой","green":"зелёный",
  "tall":"высокий","tree":"дерево","small":"маленький","lake":"озеро","lunch":"обед","park":"парк",
  "little":"маленький, немного","sister":"сестра","love":"любить","feed":"кормить","duck":"утка",
  "bring":"приносить","throw":"бросать","piece":"кусок","water":"вода","swim":"плавать",
  "fast":"быстрый, быстро","see":"видеть","food":"еда","father":"отец","ride":"ехать верхом, катаься",
  "bicycle":"велосипед","path":"тропа, путь","mother":"мать","bench":"скамейка","read":"читать",
  "book":"книга","play":"играть","dog":"собака","run":"бегать","ball":"мяч","back":"назад, спина",
  "having":"имея",
  "picnic":"пикник","grass":"трава","sun":"солнце","set":"садиться (о солнце), устанавливать",
  "turn":"поворачивать(ся), превращаться","orange":"оранжевый, апельсин","pink":"розовый",
  "together":"вместе","color":"цвет","change":"менять(ся)","tired":"усталый","happy":"счастливый",
  // кофейня (текст 3)
  "there":"там","shop":"магазин","corner":"угол","two":"два",
  "feel":"чувствовать","old":"старый","friend":"друг","owner":"владелец","quiet":"тихий",
  "man":"мужчина","name":"имя","named":"по имени","stand":"стоять",
  "counter":"прилавок","grind":"молоть","bean":"зерно, бобы","smell":"запах, пахнуть",
  "fill":"заполнять","whole":"весь, целый","pull":"тянуть, притягивать","inside":"внутри",
  "work":"работать, работа","even":"даже","hurry":"спешить, спешка",
  "remember":"помнить","order":"заказ, заказывать","ask":"спрашивать","simply":"просто",
  "nod":"кивать","seat":"место, сиденье","narrow":"узкий","wooden":"деревянный","table":"стол",
  "shelf":"полка","full":"полный","soft":"мягкий","music":"музыка","quietly":"тихо",
  "background":"фон","notice":"замечать","stranger":"незнакомец","conversation":"разговор",
  "share":"делиться","secret":"секрет","elderly":"пожилой","woman":"женщина","tell":"говорить, рассказывать",
  "remind":"напоминать","place":"место","visit":"посещать","country":"страна","why":"почему",
  "keep":"хранить, продолжать","just":"просто, только","feeling":"чувство","familiar":"знакомый",
  "finally":"наконец","hand":"рука","cold":"холодный","warm":"тёплый","warmer":"теплее",
  // интернет (текст 4)
  "very":"очень","access":"доступ","hard":"трудный, тяжело","imagine":"представлять (себе)",
  "daily":"ежедневный","life":"жизнь","communicate":"общаться","learn":"учить(ся)",
  "past":"прошлое, прошлый","send":"посылать","letter":"письмо","take":"брать, занимать (время)",
  "reach":"достигать","side":"сторона","world":"мир","business":"бизнес, дело",
  "also":"также","completely":"полностью","sell":"продавать","product":"продукт",
  "customer":"покупатель, клиент","different":"другой, разный","store":"магазин",
  "education":"образование","become":"становиться","well":"хорошо, колодец","connection":"связь, подключение",
  "online":"онлайн","internet":"интернет",
  "lecture":"лекция","famous":"известный","university":"университет","free":"бесплатный, свободный",
  "problem":"проблема","spend":"тратить","screen":"экран","talk":"говорить, разговаривать",
  "expert":"эксперт","worry":"беспокоиться","young":"молодой","lose":"терять","important":"важный",
  "social":"социальный","skill":"навык","believe":"верить, полагать","technology":"технология",
  "create":"создавать","way":"способ, путь","connect":"соединять","replace":"заменять",
  "truth":"правда","certain":"определённый, уверенный","continue":"продолжать","shape":"формировать, форма",
  "future":"будущее","fully":"полностью","predict":"предсказывать",
  // лиса и путник (текст 5)
  "long":"длинный, долго","forest":"лес","grow":"расти","tower":"башня","live":"жить",
  "known":"известный","cleverness":"хитрость, сообразительность","traveler":"путник, путешественник",
  "wander":"блуждать","territory":"территория","hungry":"голодный","confused":"сбитый с толку",
  "beneath":"под","oak":"дуб","weep":"плакать","road":"дорога","bush":"куст","curious":"любопытный",
  "strange":"странный","creature":"существо","seem":"казаться","helpless":"беспомощный","clever":"умный, хитрый",
  "instead":"вместо (этого)","away":"прочь","step":"шаг, шагать","close":"закрывать, близкий",
  "closer":"ближе","cry":"плакать, кричать","surprise":"удивлять","surprised":"удивлённый",
  "animal":"животное","speak":"говорить","explain":"объяснять","situation":"ситуация",
  "expect":"ожидать","sympathy":"сочувствие","astonishment":"изумление","offer":"предлагать",
  "guide":"вести, гид","condition":"условие","listen":"слушать","carefully":"осторожно, внимательно",
  "question":"вопрос, расспрашивать","choice":"выбор","agree":"соглашаться","desperate":"отчаянный",
  "enough":"достаточно","trust":"доверять","sharp":"острый","eye":"глаз","cross":"пересекать",
  "shallow":"неглубокий","river":"река","lead":"вести","confidently":"уверенно",
  "memorize":"запоминать наизусть","stone":"камень","shadow":"тень","dawn":"рассвет",
  "edge":"край","distant":"дальний, отдалённый","village":"деревня","glow":"светиться",
  "rise":"подниматься","thank":"благодарить","tear":"слеза","relief":"облегчение","give":"давать",
  "return":"возвращать(ся), возвращение","merely":"просто, всего лишь","smile":"улыбка, улыбаться",
  "kind":"добрый, вид (тип)","kindness":"доброта","unlike":"в отличие от","gold":"золото",
  "need":"нуждаться, нужда","repay":"отплатить","disappear":"исчезать","wonder":"удивляться, интересоваться",
  "entire":"весь, целый","encounter":"встреча, столкновение","wisdom":"мудрость","truly":"истинно, действительно",
  "wear":"носить (одежду)","fur":"мех","leg":"нога",
  // дополнительные общеупотребительные слова
  "english":"английский","text":"текст","new":"новый","word":"слово","sentence":"предложение",
  "fox":"лиса","right":"право, правый, верно","left":"левый, ушёл (от leave)",
  "high":"высокий","low":"низкий","light":"свет, легкий","dark":"тёмный","heavy":"тяжёлый",
  "strong":"сильный","weak":"слабый","rich":"богатый","poor":"бедный","clean":"чистый","dirty":"грязный",
  "empty":"пустой","cheap":"дешёвый","expensive":"дорогой","far":"далеко","slow":"медленный",
  "hot":"горячий","wet":"влажный, мокрый","dry":"сухой","easy":"лёгкий, простой","loud":"громкий",
  "beautiful":"красивый","ugly":"уродливый","nice":"приятный, милый","rude":"грубый","polite":"вежливый",
  "brave":"смелый","afraid":"испуганный","angry":"злой, сердитый","sad":"печальный",
  "bored":"скучающий","excited":"взволнованный, восторженный","comfortable":"удобный",
  "dangerous":"опасный","safe":"безопасный","careful":"осторожный","lucky":"удачливый",
  "popular":"популярный","common":"обычный, общий","rare":"редкий","special":"особенный",
  "normal":"нормальный","simple":"простой","complex":"сложный","modern":"современный",
  "ancient":"древний","traditional":"традиционный","natural":"природный, естественный",
  "public":"публичный, общественный","private":"частный","busy":"занятой","available":"доступный",
  "ready":"готовый","sure":"уверенный","necessary":"необходимый","useful":"полезный","useless":"бесполезный",
  "similar":"похожий","equal":"равный","exact":"точный","perfect":"идеальный","terrible":"ужасный",
  "use":"использовать, использование",
  "wonderful":"чудесный","amazing":"удивительный","fantastic":"фантастический","excellent":"превосходный",
  "fine":"хороший, в порядке","city":"город","town":"городок","building":"здание","room":"комната",
  "door":"дверь","wall":"стена","floor":"пол, этаж","roof":"крыша","garden":"сад","yard":"двор",
  "key":"ключ","lock":"замок, запирать","lamp":"лампа","chair":"стул","box":"коробка","bottle":"бутылка",
  "glass":"стакан, стекло","plate":"тарелка","knife":"нож","fork":"вилка","spoon":"ложка",
  "towel":"полотенце","soap":"мыло","mirror":"зеркало","clock":"часы (настенные)","calendar":"календарь",
  "map":"карта","picture":"картина, фото","photo":"фото","painting":"картина","shape":"форма",
  "size":"размер","weight":"вес","length":"длина","width":"ширина","height":"высота","distance":"расстояние",
  "speed":"скорость","temperature":"температура","weather":"погода","rain":"дождь","snow":"снег",
  "wind":"ветер","cloud":"облако","storm":"шторм, буря","ice":"лёд","fire":"огонь","smoke":"дым",
  "earth":"земля","ground":"земля, почва","hill":"холм","mountain":"гора","valley":"долина",
  "sea":"море","ocean":"океан","island":"остров","beach":"пляж","desert":"пустыня","jungle":"джунгли",
  "field":"поле","farm":"ферма","leaf":"лист","root":"корень","seed":"семя","vegetable":"овощ",
  "plant":"растение, сажать","bird":"птица","fish":"рыба","insect":"насекомое","snake":"змея",
  "lion":"лев","tiger":"тигр","bear":"медведь","wolf":"волк","elephant":"слон","monkey":"обезьяна",
  "rabbit":"кролик","mouse":"мышь","horse":"лошадь","cow":"корова","sheep":"овца","pig":"свинья",
  "chicken":"курица","goat":"коза","cat":"кошка","wing":"крыло","tail":"хвост","feather":"перо",
  "claw":"коготь","paw":"лапа","body":"тело","head":"голова","hair":"волосы","ear":"ухо","nose":"нос",
  "mouth":"рот","lip":"губа","tongue":"язык","neck":"шея","shoulder":"плечо","arm":"рука (от плеча)",
  "elbow":"локоть","finger":"палец (руки)","nail":"ноготь","chest":"грудь","stomach":"живот",
  "knee":"колено","foot":"нога, ступня","toe":"палец (ноги)","skin":"кожа","bone":"кость",
  "blood":"кровь","heart":"сердце","brain":"мозг","voice":"голос","breath":"дыхание","dream":"мечта, сон",
  "health":"здоровье","illness":"болезнь","pain":"боль","medicine":"лекарство","doctor":"врач",
  "nurse":"медсестра","hospital":"больница","patient":"пациент","disease":"болезнь",
  "baby":"младенец","boy":"мальчик","girl":"девочка","adult":"взрослый","teenager":"подросток",
  "parent":"родитель","brother":"брат","son":"сын","daughter":"дочь","husband":"муж","wife":"жена",
  "child":"ребёнок","neighbor":"сосед","enemy":"враг","guest":"гость","host":"хозяин (принимающий)",
  "teacher":"учитель","student":"студент, ученик","worker":"работник","employee":"сотрудник",
  "manager":"менеджер","boss":"начальник","engineer":"инженер","lawyer":"юрист","police":"полиция",
  "soldier":"солдат","artist":"художник","writer":"писатель","musician":"музыкант","actor":"актёр",
  "scientist":"учёный","farmer":"фермер","driver":"водитель","cook":"повар, готовить",
  "king":"король","queen":"королева","president":"президент","government":"правительство",
  "leader":"лидер","citizen":"гражданин","society":"общество","culture":"культура",
  "religion":"религия","language":"язык (речь)","nation":"нация","war":"война","peace":"мир (без войны)",
  "army":"армия","weapon":"оружие","law":"закон","rule":"правило","freedom":"свобода",
  "justice":"справедливость","crime":"преступление","prison":"тюрьма","court":"суд","judge":"судья",
  "money":"деньги","bank":"банк","coin":"монета","price":"цена","cost":"стоимость, стоить",
  "value":"ценность","profit":"прибыль","loss":"потеря","market":"рынок","trade":"торговля",
  "company":"компания","factory":"завод","office":"офис","service":"услуга","class":"класс, занятие",
  "lesson":"урок","page":"страница","story":"история, рассказ","novel":"роман","poem":"стихотворение",
  "news":"новости","newspaper":"газета","magazine":"журнал","article":"статья","report":"отчёт",
  "information":"информация","knowledge":"знание","idea":"идея","answer":"ответ","solution":"решение",
  "example":"пример","fact":"факт","opinion":"мнение","argument":"аргумент, спор","discussion":"обсуждение",
  "grammar":"грамматика","meaning":"значение","email":"электронное письмо","call":"звонок, звонить",
  "computer":"компьютер","keyboard":"клавиатура","program":"программа","application":"приложение",
  "website":"сайт","video":"видео","song":"песня","sound":"звук","noise":"шум","silence":"тишина",
  "area":"область, район","region":"регион","location":"местоположение","direction":"направление",
  "north":"север","south":"юг","east":"восток","west":"запад","top":"верх","bottom":"низ",
  "middle":"середина","center":"центр","end":"конец","beginning":"начало","part":"часть",
  "half":"половина","level":"уровень","line":"линия, строка","point":"точка, момент","space":"пространство",
  "help":"помогать","want":"хотеть","hate":"ненавидеть","hope":"надеяться","wish":"желать",
  "prefer":"предпочитать","decide":"решать","choose":"выбирать","try":"пытаться","allow":"позволять",
  "forbid":"запрещать","suggest":"предлагать","recommend":"рекомендовать","disagree":"не соглашаться",
  "accept":"принимать","refuse":"отказывать(ся)","promise":"обещать","warn":"предупреждать",
  "describe":"описывать","discuss":"обсуждать","mention":"упоминать","announce":"объявлять",
  "declare":"заявлять","admit":"признавать","deny":"отрицать","pretend":"притворяться",
  "doubt":"сомневаться","guess":"угадывать, предполагать","assume":"предполагать","realize":"понимать, осознавать",
  "recognize":"узнавать, признавать","study":"изучать","practice":"практиковать(ся)","understand":"понимать",
  "know":"знать","discover":"открывать, обнаруживать","explore":"исследовать","search":"искать",
  "find":"находить","seek":"искать","hear":"слышать","taste":"вкус, пробовать на вкус","touch":"трогать",
  "measure":"измерять","count":"считать","calculate":"вычислять","compare":"сравнивать",
  "examine":"осматривать","prove":"доказывать","solve":"решать (проблему)","produce":"производить",
  "design":"проектировать, дизайн","invent":"изобретать","develop":"развивать, разрабатывать",
  "improve":"улучшать","repair":"ремонтировать","fix":"исправлять, ремонтировать","destroy":"разрушать",
  "damage":"повреждать","protect":"защищать","save":"спасать, сохранять","rescue":"спасать",
  "defend":"защищать","attack":"атаковать","fight":"драться, бороться","hurt":"причинять боль, больно",
  "injure":"ранить","kill":"убивать","die":"умирать","survive":"выживать","exist":"существовать",
  "happen":"случаться","occur":"происходить","finish":"заканчивать","complete":"завершать",
  "succeed":"преуспевать","fail":"терпеть неудачу","win":"победить, выигрывать","compete":"соревноваться",
  "achieve":"достигать","arrive":"прибывать","enter":"входить","exit":"выходить","stay":"оставаться",
  "remain":"оставаться","wait":"ждать","rush":"торопиться","hesitate":"колебаться","pause":"приостанавливаться, пауза",
  "rest":"отдыхать, отдых","relax":"расслабляться","sleep":"спать, сон","travel":"путешествовать",
  "journey":"путешествие, поездка","trip":"поездка","tour":"тур, экскурсия","move":"двигать(ся)",
  "jump":"прыгать","climb":"подниматься, лазать","fall":"падать","drop":"падать, бросать",
  "fly":"летать","drive":"водить (машину)","carry":"носить, нести","receive":"получать",
  "buy":"покупать","pay":"платить","borrow":"брать взаймы","lend":"давать взаймы",
  "owe":"быть должным","earn":"зарабатывать","afford":"позволить себе (финансово)","divide":"делить",
  "join":"присоединяться, соединять","separate":"разделять, отдельный","combine":"объединять",
  "mix":"смешивать","add":"добавлять","remove":"удалять","increase":"увеличивать(ся)",
  "decrease":"уменьшать(ся)","shrink":"сжиматься","expand":"расширять(ся)","reduce":"уменьшать",
  "raise":"поднимать, повышать","lift":"поднимать","lower":"опускать, снижать","push":"толкать",
  "catch":"ловить, поймать","kick":"пинать","grab":"хватать","release":"отпускать, выпускать",
  "cover":"покрывать","hide":"прятать(ся)","reveal":"раскрывать, показывать","show":"показывать",
  "act":"действовать, поступать","behave":"вести себя","sound":"звучать, звук",
  // базовые формы для неправильных глаголов (см. IRREGULAR)
  "begin":"начинать","break":"ломать","build":"строить","deal":"иметь дело, сделка",
  "draw":"рисовать","forget":"забывать","get":"получать, доставать","hang":"висеть, вешать",
  "hold":"держать","lay":"класть","mean":"означать","meet":"встречать(ся)","ring":"звонить, кольцо",
  "say":"говорить, сказать","shine":"светить(ся)","shoot":"стрелять","sing":"петь",
  "strike":"ударять, бастовать","swear":"клясться, ругаться","teach":"учить (кого-то)","write":"писать",
  "goose":"гусь","loaf":"буханка (хлеба)","scarf":"шарф"
};

const IRREGULAR = {
  "went":"go","gone":"go","was":"be","were":"be","is":"be","am":"be","are":"be","been":"be","being":"be",
  "has":"have","had":"have","having":"have","did":"do","does":"do","doing":"do",
  "took":"take","taken":"take","saw":"see","seen":"see","came":"come","made":"make",
  "knew":"know","thought":"think","gave":"give","given":"give","told":"tell","got":"get","gotten":"get",
  "left":"leave","felt":"feel","kept":"keep","brought":"bring","bought":"buy","caught":"catch",
  "taught":"teach","held":"hold","heard":"hear","met":"meet","ran":"run","sent":"send",
  "slept":"sleep","spent":"spend","stood":"stand","understood":"understand","woke":"wake","woken":"wake",
  "wrote":"write","written":"write","fell":"fall","fallen":"fall","flew":"fly","flown":"fly",
  "forgot":"forget","forgotten":"forget","hung":"hang","drew":"draw","drawn":"draw",
  "ate":"eat","eaten":"eat","drank":"drink","drunk":"drink","spoke":"speak","spoken":"speak",
  "broke":"break","broken":"break","chose":"choose","chosen":"choose","drove":"drive","driven":"drive",
  "rode":"ride","ridden":"ride","rose":"rise","risen":"rise","grew":"grow","grown":"grow",
  "threw":"throw","thrown":"throw","won":"win","began":"begin","begun":"begin","swam":"swim","swum":"swim",
  "sang":"sing","sung":"sing","rang":"ring","rung":"ring","built":"build","dealt":"deal",
  "meant":"mean","paid":"pay","laid":"lay","led":"lead","lent":"lend","lost":"lose","sold":"sell",
  "shone":"shine","shot":"shoot","struck":"strike","swore":"swear","sworn":"swear","wore":"wear",
  "worn":"wear","wept":"weep","sat":"sit","said":"say","repaid":"repay","fought":"fight","sought":"seek",
  "hid":"hide","hidden":"hide","children":"child","men":"man","women":"woman","feet":"foot",
  "teeth":"tooth","mice":"mouse","geese":"goose","leaves":"leaf","wolves":"wolf","knives":"knife",
  "wives":"wife","loaves":"loaf","halves":"half","scarves":"scarf","shelves":"shelf"
};

/* ============================================================
   ПРИМЕРНАЯ ЧАСТОТНОСТЬ СЛОВ (грубая оценка по 4 уровням)
   Это не точная статистика, а приближённая прикидка «на глаз»:
   функциональные слова и базовая лексика — самые частые,
   книжная/узкая лексика из басни про лису — самая редкая,
   остальное — где-то по середине.
   ============================================================ */
const FREQ_TOP = new Set([
  "i","you","he","she","it","we","they","me","him","her","us","them","my","your","his","its","our","their",
  "a","an","the","this","that","these","those","some","any","every","each","all","other","another",
  "in","on","at","by","for","with","about","to","from","up","down","off","over","under","of","out","near",
  "and","but","or","so","yet","because","if","as","than",
  "be","have","do","will","would","can","could","may","might","must","should","shall",
  "not","no","yes","who","what","which","when","where","how","why",
  "go","get","make","take","see","know","think","come","give","find","want","use","work","say","look","ask","need","feel","try","call","tell",
  "day","time","way","year","man","woman","people","thing","life","world","hand","place","word","water",
  "good","bad","big","small","new","old","first","long","right","here","there","now","then",
  "very","more","most","much","many","just","only","also","one","two"
]);
const FREQ_COMMON = new Set([
  "house","home","school","food","friend","family","father","mother","sister","brother","child","baby",
  "money","book","music","color","weather","morning","evening","night","week","month","city","town",
  "street","room","door","window","table","chair","bed","car","bus","phone","letter","message",
  "walk","run","play","eat","drink","sleep","read","write","buy","sell","help","start","stop","open","close",
  "love","like","believe","remember","forget","understand","learn","teach","explain","decide","agree",
  "continue","change","move","turn","leave","arrive","stay","wait","talk","speak","listen","watch","show",
  "bring","send","receive","follow","lead","build","create","break","fix","clean","wash","cook","grow",
  "happy","sad","angry","tired","hungry","hot","cold","easy","hard","important","different","same",
  "free","busy","ready","sure","safe","dangerous","strong","weak","young","beautiful","nice","kind",
  "quiet","loud","clean","cheap","expensive","fast","slow","early","late","high","low","heavy","light",
  "full","empty","check","plan","piece","fruit","bread","egg","tea","coffee","breakfast","lunch","dinner",
  "park","tree","grass","sun","sky","rain","snow","wind","dog","cat","bird","fish","animal",
  "country","road","path","river","sea","mountain","forest","village","shop","store","market","price",
  "business","company","job","work","office","computer","internet","phone","email","video","photo",
  "doctor","teacher","student","worker","police","government","country","war","peace","law",
  "body","head","face","eye","ear","hand","arm","leg","foot","heart","health","pain",
  "sound","voice","color","shape","size","number","question","answer","problem","reason","idea",
  "true","false","public","private","social","important","possible","necessary","clear","strange",
  "guide","order","secret","stranger","owner","customer","product","service","education","technology",
  "skill","experience","knowledge","memory","dream","hope","fear","anger","joy","surprise","worry"
]);
const FREQ_RARE = new Set([
  "cleverness","astonishment","sympathy","territory","encounter","wisdom","repay","kindness","helpless",
  "desperate","confidently","memorize","wander","glow","dawn","shallow","distant","merely","unlike",
  "entire","truly","fur","claw","paw","oak","bush","wept","wisdom","beneath","cleverness","curiosity",
  "elderly","astonishment","situation","condition","instead","whatever","whichever","whomever",
  "predict","fully","shape","spend","screen","expert","skill","losing","replacing","truth","certain",
  "shrink","expand","hesitate","pause","relief","disappear","wonder","grind","narrow","wooden","shelf",
  "background","stranger","conversation","familiar","warmer","completely","businesses","connection",
  "lecture","famous","university","whatever","cannot","predict","yet","unlike","gold","kindness"
]);

function frequencyInfo(key){
  if(FREQ_TOP.has(key)) return {tier:1, bars:4, label:"Одно из самых частых слов в английском"};
  if(FREQ_COMMON.has(key)) return {tier:2, bars:3, label:"Частое, повседневное слово"};
  if(FREQ_RARE.has(key)) return {tier:4, bars:1, label:"Редкое или специализированное слово"};
  return {tier:3, bars:2, label:"Встречается умеренно часто"};
}

/* ============================================================
   СОСТОЯНИЕ И ХРАНИЛИЩЕ
   ============================================================ */
const STORAGE_KEY = "readfox-state";
let state = { userWords:{}, customTexts:[], readTextIds:[], settings:{voiceName:null, fontSize:19, theme:"dark"} };
let currentText = null;
let currentFilter = "all";
let practiceQueue = [];
let practiceIndex = 0;
let practiceRevealed = false;
let practiceMode = "flashcards";
let quizQueue = [];
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;
let saveTimer = null;
let storageWorks = null;   // null = ещё не проверяли, true/false — результат самопроверки
let storageBackend = null; // "claude" | "local" — какой механизм реально используется

// window.storage существует только внутри артефактов Claude. Если его нет —
// значит, страница открыта отдельно от чата (как обычный файл/сайт), и можно
// смело использовать localStorage браузера, который в этом случае работает
// без всяких ограничений песочницы.
function hasClaudeStorage(){
  return typeof window.storage !== "undefined" && window.storage
    && typeof window.storage.get === "function" && typeof window.storage.set === "function";
}

async function loadState(){
  storageBackend = hasClaudeStorage() ? "claude" : "local";
  try{
    let raw = null;
    if(storageBackend === "claude"){
      const r = await window.storage.get(STORAGE_KEY, false);
      if(r) raw = r.value;
    } else {
      raw = localStorage.getItem(STORAGE_KEY);
    }
    if(raw){
      const parsed = JSON.parse(raw);
      state.userWords = parsed.userWords || {};
      state.customTexts = parsed.customTexts || [];
      state.readTextIds = parsed.readTextIds || [];
      state.settings = parsed.settings || {voiceName:null, fontSize:19, theme:"dark"};
      if(typeof state.settings.fontSize !== "number") state.settings.fontSize = 19;
      if(!state.settings.theme) state.settings.theme = "dark";
    }
  }catch(e){
    // ключа пока нет или хранилище недоступно — используем значения по умолчанию
  }
}

// Реальная самопроверка: пишем тестовое значение и сразу читаем его обратно.
// Так понятно, действительно ли хранилище работает в этом окружении,
// а не просто «не упало с ошибкой».
async function checkStorageWorks(){
  const probe = "probe-" + Date.now();
  try{
    if(storageBackend === "claude"){
      const setRes = await window.storage.set(STORAGE_KEY + "-probe", probe, false);
      if(!setRes){ storageWorks = false; return false; }
      const getRes = await window.storage.get(STORAGE_KEY + "-probe", false);
      storageWorks = !!(getRes && getRes.value === probe);
    } else {
      localStorage.setItem(STORAGE_KEY + "-probe", probe);
      storageWorks = localStorage.getItem(STORAGE_KEY + "-probe") === probe;
      localStorage.removeItem(STORAGE_KEY + "-probe");
    }
    return storageWorks;
  }catch(e){
    storageWorks = false;
    return false;
  }
}

function showToast(message, isError){
  const layer = document.getElementById("toastLayer");
  const el = document.createElement("div");
  el.className = "toast" + (isError ? " error" : "");
  el.textContent = message;
  layer.appendChild(el);
  setTimeout(()=>{ el.classList.add("out"); setTimeout(()=>el.remove(), 300); }, 2200);
}
function showStorageWarningBanner(){
  if(document.getElementById("storageWarning")) return;
  const banner = document.createElement("div");
  banner.id = "storageWarning";
  banner.className = "storage-warning";
  const msg = storageBackend === "claude"
    ? `Сохранение прямо в чате сейчас не работает. Самый надёжный вариант — скачайте файл и откройте его отдельно в браузере (не через чат): тогда сохранение пойдёт через localStorage и будет работать всегда. А пока используйте «Экспорт» в разделе «Мой словарь».`
    : `Браузер не разрешает сохранение на этой странице (например, включён режим приватного просмотра). Используйте «Экспорт» в разделе «Мой словарь», чтобы не потерять прогресс.`;
  banner.innerHTML = msg + ` <button id="dismissWarning" aria-label="Скрыть">✕</button>`;
  document.body.appendChild(banner);
  document.getElementById("dismissWarning").addEventListener("click", ()=>banner.remove());
}

// Сохраняет состояние немедленно, с одной повторной попыткой при сбое.
// Возвращает true/false — пригодилось для discreet-действий (добавление текста),
// где важно явно знать, прошло ли сохранение.
async function persistState(){
  const payload = JSON.stringify(state);
  if(storageBackend === "local"){
    try{ localStorage.setItem(STORAGE_KEY, payload); return true; }
    catch(e){ console.error("Ошибка сохранения ReadFox (localStorage):", e); return false; }
  }
  for(let attempt=0; attempt<2; attempt++){
    try{
      const result = await window.storage.set(STORAGE_KEY, payload, false);
      if(result) return true;
    }catch(e){
      console.error("Ошибка сохранения ReadFox (попытка " + (attempt+1) + "):", e);
    }
  }
  return false;
}

// Debounced-версия для частых, мелких изменений (например, клики по словам подряд).
// В отличие от прежней версии, теперь реально сообщает, если сохранение не удалось —
// раньше сбой просто уходил в консоль, и снаружи выглядело так, будто "ничего не сохраняется".
function saveState(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async ()=>{
    const ok = await persistState();
    if(!ok) showStorageWarningBanner();
  }, 250);
}

// Немедленная версия для редких, важных действий (добавление/удаление своего текста).
async function saveStateNow(){
  clearTimeout(saveTimer);
  const ok = await persistState();
  if(!ok) showStorageWarningBanner();
  return ok;
}

/* ============================================================
   ЭКСПОРТ / ИМПОРТ СЛОВАРЯ — надёжная резервная копия,
   не зависящая от того, работает ли автосохранение в браузере.
   ============================================================ */
function exportData(){
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "ReadFox",
    userWords: state.userWords,
    customTexts: state.customTexts,
    readTextIds: state.readTextIds
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0,10);
  a.href = url;
  a.download = "readfox-backup-" + stamp + ".json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
  showToast("Резервная копия скачана");
}
async function importDataFromFile(file){
  try{
    const text = await file.text();
    const data = JSON.parse(text);
    const importedWords = data.userWords || {};
    const importedTexts = Array.isArray(data.customTexts) ? data.customTexts : [];
    const wordCountBefore = Object.keys(state.userWords).length;
    Object.assign(state.userWords, importedWords);
    const existingIds = new Set(state.customTexts.map(t=>t.id));
    importedTexts.forEach(t=>{ if(t && t.id && !existingIds.has(t.id)) state.customTexts.unshift(t); });
    if(state.customTexts.length > 10) state.customTexts.length = 10;
    const wordsAdded = Object.keys(state.userWords).length - wordCountBefore;
    refreshWordVisuals();
    updateStatsUI();
    renderLibrary();
    const ok = await saveStateNow();
    showToast(`Импортировано слов: ${wordsAdded}. ${ok ? "Сохранено." : "Но сохранить не удалось — экспортируйте копию снова."}`, !ok);
  }catch(e){
    showToast("Не удалось прочитать файл резервной копии", true);
  }
}

/* ============================================================
   ПОИСК СЛОВА В СЛОВАРЕ (с разбором форм)
   ============================================================ */
function candidatesFor(w){
  const out = [];
  if(w.endsWith("ies") && w.length>3) out.push(w.slice(0,-3)+"y");
  if(w.endsWith("oes") && w.length>3) out.push(w.slice(0,-2));
  if((w.endsWith("ses")||w.endsWith("xes")||w.endsWith("zes")||w.endsWith("ches")||w.endsWith("shes")) && w.length>4){
    out.push(w.slice(0,-2));
  }
  if(w.endsWith("s") && !w.endsWith("ss") && w.length>3) out.push(w.slice(0,-1));
  if(w.endsWith("ing") && w.length>4){
    const base = w.slice(0,-3);
    out.push(base+"e", base);
    if(base.length>=2 && base[base.length-1]===base[base.length-2] && !/[aeiou]/.test(base[base.length-1])){
      out.push(base.slice(0,-1));
    }
  }
  if(w.endsWith("ed") && w.length>3){
    const b1 = w.slice(0,-2);
    const b2 = w.slice(0,-1);
    out.push(b2, b1);
    if(b1.length>=2 && b1[b1.length-1]===b1[b1.length-2] && !/[aeiou]/.test(b1[b1.length-1])){
      out.push(b1.slice(0,-1));
    }
  }
  if(w.endsWith("er") && w.length>4) out.push(w.slice(0,-2));
  if(w.endsWith("est") && w.length>5) out.push(w.slice(0,-3));
  return out;
}

function lookupWord(token){
  const w = token.toLowerCase();
  if(state.userWords[w]) return {key:w, translation:state.userWords[w].translation};
  if(BASE_DICT.hasOwnProperty(w)) return {key:w, translation:BASE_DICT[w]};
  if(IRREGULAR.hasOwnProperty(w)){
    const base = IRREGULAR[w];
    if(state.userWords[base]) return {key:base, translation:state.userWords[base].translation};
    if(BASE_DICT.hasOwnProperty(base)) return {key:base, translation:BASE_DICT[base]};
  }
  for(const c of candidatesFor(w)){
    let cc = c;
    if(IRREGULAR.hasOwnProperty(cc)) cc = IRREGULAR[cc];
    if(state.userWords[cc]) return {key:cc, translation:state.userWords[cc].translation};
    if(BASE_DICT.hasOwnProperty(cc)) return {key:cc, translation:BASE_DICT[cc]};
  }
  return null;
}

/* ============================================================
   РЕНДЕР ТЕКСТА С КЛИКАБЕЛЬНЫМИ СЛОВАМИ И КОНТЕКСТОМ
   ============================================================ */
function escapeHtml(s){
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
const WORD_RE = /[A-Za-z]+(?:'[A-Za-z]+)?/g;

// Сюда складываются предложения текущего текста, чтобы по индексу
// можно было достать «контекст» для всплывающей подсказки.
let readerSentences = [];

function splitSentences(text){
  const out = [];
  const re = /[^.!?]*[.!?]+\s*|[^.!?]+$/g;
  let m;
  while((m = re.exec(text))){
    if(m[0].length === 0){ re.lastIndex++; continue; }
    out.push(m[0]);
  }
  return out.length ? out : [text];
}

function wordSpan(token, sIdx){
  const info = lookupWord(token);
  const key = info ? info.key : token.toLowerCase();
  let cls = "word";
  if(info){
    cls += " w-hit";
    const uw = state.userWords[key];
    if(uw){ cls += uw.status === "known" ? " w-known" : " w-learning"; }
  }
  const sidxAttr = (sIdx !== undefined && sIdx !== null) ? ` data-sidx="${sIdx}"` : "";
  return `<span class="${cls}" tabindex="0" role="button" data-token="${escapeHtml(token)}"${sidxAttr}>${escapeHtml(token)}</span>`;
}
function buildSentenceHtml(sentence, sIdx){
  let html = "";
  let lastIndex = 0;
  let m;
  WORD_RE.lastIndex = 0;
  while((m = WORD_RE.exec(sentence))){
    html += escapeHtml(sentence.slice(lastIndex, m.index));
    html += wordSpan(m[0], sIdx);
    lastIndex = WORD_RE.lastIndex;
  }
  html += escapeHtml(sentence.slice(lastIndex));
  return html;
}
// withContext=true пополняет readerSentences и проставляет каждому слову
// data-sidx, чтобы потом можно было показать предложение-контекст.
function buildLineHtml(line, withContext){
  if(!withContext){
    return buildSentenceHtml(line, null);
  }
  let html = "";
  for(const sentence of splitSentences(line)){
    readerSentences.push(sentence.trim());
    html += buildSentenceHtml(sentence, readerSentences.length - 1);
  }
  return html;
}
function renderReaderBody(text){
  readerSentences = [];
  return text.split(/\n+/).filter(p=>p.trim().length).map(p=>`<p>${buildLineHtml(p.trim(), true)}</p>`).join("");
}
function wordCount(text){
  return (text.match(WORD_RE) || []).length;
}

/* ============================================================
   ВИДЫ (VIEWS) И НАВИГАЦИЯ
   ============================================================ */
function showView(name){
  document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
  const target = document.querySelector(`.view[data-view="${name}"]`);
  if(target) target.classList.remove("hidden");
  document.querySelectorAll(".nav button[data-view]").forEach(b=>{
    b.classList.toggle("active", b.dataset.view===name);
  });
  hideTooltip();
  stopReading();
  window.scrollTo({top:0, behavior:"auto"});
}

/* ============================================================
   СТАТИСТИКА
   ============================================================ */
function updateStatsUI(){
  const vals = Object.values(state.userWords);
  const learning = vals.filter(v=>v.status==="learning").length;
  const known = vals.filter(v=>v.status==="known").length;
  document.getElementById("statLearning").textContent = learning;
  document.getElementById("statKnown").textContent = known;
  document.getElementById("statLearningCount").textContent = learning;
  document.getElementById("statKnownCount").textContent = known;
  document.getElementById("statTextsCount").textContent = state.readTextIds.length;
}

function allTexts(){
  return TEXTS.concat(state.customTexts);
}
function levelDotsHtml(level){
  const n = LEVEL_DOTS[level] || 0;
  let dots = "";
  for(let i=1;i<=3;i++) dots += `<span class="dot ${i<=n?'on':''}"></span>`;
  return dots;
}
function renderLibrary(){
  const grid = document.getElementById("libraryGrid");
  let html = "";
  TEXTS.forEach(t=>{
    html += `
    <div class="text-card" data-id="${t.id}" data-kind="built-in" tabindex="0" aria-label="Открыть текст ${escapeHtml(t.title)}">
      <div class="level">${levelDotsHtml(t.level)}<span>${LEVEL_LABEL[t.level]}</span></div>
      <h3>${escapeHtml(t.title)}</h3>
      <p class="teaser">${escapeHtml(t.teaser)}</p>
      <div class="row">
        <span class="meta">${wordCount(t.body)} слов</span>
        <button class="go" data-open="${t.id}">Читать →</button>
      </div>
    </div>`;
  });
  state.customTexts.forEach(t=>{
    html += `
    <div class="text-card" data-id="${t.id}" data-kind="custom" tabindex="0" aria-label="Открыть текст ${escapeHtml(t.title)}">
      <div class="level">${levelDotsHtml("custom")}<span>${LEVEL_LABEL.custom}</span></div>
      <h3>${escapeHtml(t.title)}</h3>
      <p class="teaser">${escapeHtml(t.teaser || "Текст, который вы добавили сами.")}</p>
      <div class="row">
        <span class="meta">${wordCount(t.body)} слов</span>
        <span style="display:flex;gap:10px;">
          <button class="del" data-del="${t.id}">Удалить</button>
          <button class="go" data-open="${t.id}">Читать →</button>
        </span>
      </div>
    </div>`;
  });
  html += `
    <div class="text-card add-own" id="addOwnCard">
      <div>
        <div style="font-size:28px;margin-bottom:6px;">＋</div>
        <button id="addOwnBtn">Добавить свой текст</button>
      </div>
    </div>`;
  grid.innerHTML = html;

  function openCardText(card){
    const id = card.dataset.id;
    const t = allTexts().find(x=>x.id===id);
    if(t) openText(t);
  }

  grid.querySelectorAll(".text-card[data-id]").forEach(card=>{
    card.addEventListener("click", (e)=>{
      if(e.target.closest("button")) return;
      openCardText(card);
    });
    card.addEventListener("keydown", (e)=>{
      if(e.target.closest("button")) return;
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        openCardText(card);
      }
    });
  });

  grid.querySelectorAll("[data-open]").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      e.stopPropagation();
      const card = btn.closest(".text-card[data-id]");
      if(card) openCardText(card);
    });
  });
  grid.querySelectorAll("[data-del]").forEach(btn=>{
    btn.addEventListener("click", async (e)=>{
      e.stopPropagation();
      const id = btn.dataset.del;
      state.customTexts = state.customTexts.filter(x=>x.id!==id);
      renderLibrary();
      const ok = await saveStateNow();
      if(!ok) showToast("Не удалось сохранить изменения. Проверьте соединение.", true);
    });
  });
  document.getElementById("addOwnBtn").addEventListener("click", toggleCustomForm);
}

function toggleCustomForm(){
  const wrap = document.getElementById("customFormWrap");
  if(!wrap.classList.contains("hidden")){
    wrap.classList.add("hidden");
    wrap.innerHTML = "";
    return;
  }
  wrap.classList.remove("hidden");
  wrap.innerHTML = `
    <div class="custom-form">
      <label for="customTitle">Название текста</label>
      <input id="customTitle" type="text" placeholder="Например: Статья из блога">
      <label for="customBody">Текст на английском</label>
      <textarea id="customBody" placeholder="Вставьте сюда любой английский текст…"></textarea>
      <div class="actions">
        <button class="btn" id="customSubmit">Начать чтение</button>
        <button class="btn secondary" id="customCancel">Отмена</button>
      </div>
    </div>`;
  document.getElementById("customCancel").addEventListener("click", toggleCustomForm);
  document.getElementById("customSubmit").addEventListener("click", async ()=>{
    const title = document.getElementById("customTitle").value.trim() || "Мой текст";
    const body = document.getElementById("customBody").value.trim();
    if(!body){
      document.getElementById("customBody").focus();
      return;
    }
    const submitBtn = document.getElementById("customSubmit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Сохраняем…";
    const obj = {
      id: "custom-" + Date.now(),
      title, level:"custom", teaser:"",
      body
    };
    state.customTexts.unshift(obj);
    if(state.customTexts.length > 10) state.customTexts.length = 10;
    const ok = await saveStateNow();
    toggleCustomForm();
    renderLibrary();
    openText(obj);
    showToast(ok ? "Текст сохранён" : "Текст добавлен, но не удалось сохранить его — он может пропасть после перезагрузки.", !ok);
  });
  wrap.scrollIntoView({behavior:"smooth", block:"start"});
}

/* ============================================================
   ЧТЕНИЕ ТЕКСТА
   ============================================================ */
function openText(text){
  currentText = text;
  if(!state.readTextIds.includes(text.id)){
    state.readTextIds.push(text.id);
    saveState();
  }
  document.getElementById("navReader").classList.remove("hidden");
  document.getElementById("navReader").textContent = "Чтение";
  document.getElementById("readerTitle").textContent = text.title;
  renderReaderContent();
  updateStatsUI();
  showView("reader");
}
function renderReaderContent(){
  if(!currentText) return;
  document.getElementById("readerBody").innerHTML = renderReaderBody(currentText.body);
  updateReaderProgress();
}
function updateReaderProgress(){
  if(!currentText) return;
  const tokens = currentText.body.match(WORD_RE) || [];
  const keys = new Set();
  tokens.forEach(t=>{
    const info = lookupWord(t);
    if(info) keys.add(info.key);
  });
  let known = 0;
  keys.forEach(k=>{
    if(state.userWords[k] && state.userWords[k].status==="known") known++;
  });
  document.getElementById("readerProgress").textContent =
    keys.size ? `Изучено ${known} из ${keys.size} слов в этом тексте` : "";
}

/* ============================================================
   ПОДСКАЗКА (TOOLTIP) ПРИ КЛИКЕ НА СЛОВО
   ============================================================ */
function hideTooltip(){
  document.getElementById("tooltipLayer").innerHTML = "";
}
function refreshWordVisuals(){
  if(currentText) renderReaderContent();
  renderDemoSentence();
  const dictView = document.querySelector('.view[data-view="dictionary"]');
  if(dictView && !dictView.classList.contains("hidden")) renderDictionary();
}
function addWord(key, translation, status, example){
  const prev = state.userWords[key];
  state.userWords[key] = {
    translation,
    status,
    addedAt: prev ? prev.addedAt : Date.now(),
    example: (prev && prev.example) ? prev.example : (example || ""),
    type: "word",
    source: BASE_DICT.hasOwnProperty(key) ? "built-in" : "custom"
  };
  saveState();
  refreshWordVisuals();
  updateStatsUI();
}
function addPhrase(text, translation, example){
  const key = text.trim().toLowerCase();
  const prev = state.userWords[key];
  state.userWords[key] = {
    translation,
    status: "learning",
    addedAt: prev ? prev.addedAt : Date.now(),
    example: example || (prev && prev.example) || "",
    type: "phrase",
    source: "custom"
  };
  saveStateNow(); // немедленно, иначе фраза может не сохраниться при быстрых действиях
  refreshWordVisuals();
  updateStatsUI();
}
function setStatus(key, status){
  if(state.userWords[key]){
    state.userWords[key].status = status;
    saveState();
    refreshWordVisuals();
    updateStatsUI();
  }
}
function removeWord(key){
  delete state.userWords[key];
  saveState();
  refreshWordVisuals();
  updateStatsUI();
}

/* ============================================================
   ОЗВУЧКА (Web Speech API) — при клике на слово/фразу и для всего текста
   ============================================================ */
/* ============================================================
   ВЫБОР ГОЛОСА. Браузер обычно даёт несколько английских голосов
   разного качества — пытаемся выбрать самый «живой» автоматически,
   но даём возможность выбрать вручную в настройках (⚙).
   ============================================================ */
let availableVoices = [];
function loadVoices(){
  try{ availableVoices = window.speechSynthesis ? window.speechSynthesis.getVoices() : []; }
  catch(e){ availableVoices = []; }
}
if("speechSynthesis" in window){
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
function englishVoices(){
  return availableVoices.filter(v => v.lang && v.lang.toLowerCase().startsWith("en"));
}
// Голоса с такими словами в названии почти всегда заметно естественнее
// дефолтного системного синтезатора (облачные/нейросетевые голоса).
const NICE_VOICE_HINTS = ["natural", "neural", "enhanced", "premium", "online", "google", "wavenet", "siri", "aria", "jenny", "guy"];
function pickBestVoice(){
  const en = englishVoices();
  if(!en.length) return null;
  for(const hint of NICE_VOICE_HINTS){
    const found = en.find(v => v.name.toLowerCase().includes(hint));
    if(found) return found;
  }
  return en.find(v => v.lang.toLowerCase() === "en-us") || en[0];
}
function getActiveVoice(){
  if(!availableVoices.length) loadVoices();
  if(state.settings && state.settings.voiceName){
    const chosen = availableVoices.find(v => v.name === state.settings.voiceName);
    if(chosen) return chosen;
  }
  return pickBestVoice();
}
function applyVoice(utterance){
  const voice = getActiveVoice();
  if(voice){ utterance.voice = voice; utterance.lang = voice.lang; }
  else { utterance.lang = "en-US"; }
}

function speak(text){
  try{
    if(!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    resetReadAloudButton();
    const u = new SpeechSynthesisUtterance(text);
    applyVoice(u);
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  }catch(e){ /* синтез речи недоступен в этом браузере — молча пропускаем */ }
}

function clearSpeakingHighlight(){
  const prev = document.querySelector(".word.word-speaking");
  if(prev) prev.classList.remove("word-speaking");
}
function resetReadAloudButton(){
  const btn = document.getElementById("readAloudBtn");
  if(btn){ btn.innerHTML = SOUND_ICON + " Слушать текст"; btn.dataset.playing = "0"; }
  const floatBtn = document.getElementById("floatingStopBtn");
  if(floatBtn) floatBtn.classList.add("hidden");
  clearSpeakingHighlight();
}
function playAudioUrl(url, fallbackText){
  try{
    window.speechSynthesis.cancel();
    resetReadAloudButton();
    const audio = new Audio(url);
    const useFallback = ()=>{ if(fallbackText) speak(fallbackText); };
    audio.addEventListener("error", useFallback);
    audio.play().catch(useFallback);
  }catch(e){
    if(fallbackText) speak(fallbackText);
  }
}
function stopReading(){
  try{ if("speechSynthesis" in window) window.speechSynthesis.cancel(); }catch(e){}
  resetReadAloudButton();
}

// Отличаем прокрутку, которую вызвали мы сами (чтобы показать читаемое
// слово), от прокрутки, которую сделал пользователь вручную. Если человек
// прокручивает сам — например, чтобы подняться и нажать «Остановить» —
// на несколько секунд перестаём «возвращать» его вниз.
let lastProgrammaticScrollAt = 0;
let userScrollSuspendUntil = 0;
window.addEventListener("scroll", ()=>{
  if(Date.now() - lastProgrammaticScrollAt < 700) return; // это была наша прокрутка
  userScrollSuspendUntil = Date.now() + 4000;
}, {passive:true});

function readTextAloud(text){
  const btn = document.getElementById("readAloudBtn");
  if(!("speechSynthesis" in window)){
    showToast("Озвучка не поддерживается в этом браузере", true);
    return;
  }
  window.speechSynthesis.cancel();
  clearSpeakingHighlight();

  const flat = text.replace(/\n+/g, " ");
  const chunks = splitSentences(flat);
  if(!chunks.length) return;

  // Индекс слов: позиции токенов в «плоском» тексте + те же слова в DOM,
  // в том же порядке — так onboundary можно превратить в подсветку нужного span.
  const positions = [];
  WORD_RE.lastIndex = 0;
  let m;
  while((m = WORD_RE.exec(flat))){
    positions.push({start: m.index, end: m.index + m[0].length});
  }
  const wordSpans = Array.from(document.querySelectorAll("#readerBody .word"));
  const canHighlight = wordSpans.length === positions.length;

  let cumulative = 0;
  const chunkOffsets = chunks.map(c => { const off = cumulative; cumulative += c.length; return off; });

  function highlightAt(globalIndex){
    if(!canHighlight) return;
    let idx = positions.findIndex(p => globalIndex >= p.start && globalIndex < p.end);
    if(idx === -1) idx = positions.findIndex(p => p.start >= globalIndex);
    if(idx === -1) return;
    clearSpeakingHighlight();
    const el = wordSpans[idx];
    if(el){
      el.classList.add("word-speaking");
      // Подсветка обновляется всегда; а вот навязчивую прокрутку приостанавливаем,
      // если человек только что сам листал страницу (например, тянется к «Стоп»).
      if(Date.now() >= userScrollSuspendUntil){
        lastProgrammaticScrollAt = Date.now();
        el.scrollIntoView({behavior:"smooth", block:"nearest"});
      }
    }
  }

  const utterances = chunks.map((c, i) => {
    const u = new SpeechSynthesisUtterance(c);
    applyVoice(u);
    u.rate = 0.92;
    // Не во всех браузерах есть пословная гранулярность — берём charIndex,
    // какой бы ни пришёл (word или sentence), это всё равно лучше, чем ничего.
    u.onboundary = (event) => {
      if(typeof event.charIndex === "number") highlightAt(chunkOffsets[i] + event.charIndex);
    };
    return u;
  });
  utterances[utterances.length - 1].onend = resetReadAloudButton;
  utterances[utterances.length - 1].onerror = resetReadAloudButton;
  utterances.forEach(u=>window.speechSynthesis.speak(u));
  if(btn){ btn.textContent = "⏹ Остановить"; btn.dataset.playing = "1"; }
  // Плавающая кнопка «Стоп» — всегда на экране, не нужно прокручивать
  // вверх к панели чтения, чтобы остановить озвучку.
  const floatBtn = document.getElementById("floatingStopBtn");
  if(floatBtn) floatBtn.classList.remove("hidden");
}

/* ============================================================
   РАЗМЕР ШРИФТА — применяется сразу везде, где есть читаемый текст
   (чтение, подсказки, словарь, тренировка), а не только в самом тексте.
   ============================================================ */
const FONT_BASE = 19, FONT_MIN = 15, FONT_MAX = 30, FONT_STEP = 2;
function applyFontSize(){
  const size = (state.settings && state.settings.fontSize) || FONT_BASE;
  const scale = size / FONT_BASE;
  document.documentElement.style.setProperty("--reader-font-size", size + "px");
  document.documentElement.style.setProperty("--font-scale", scale.toFixed(3));
}
function changeFontSize(delta){
  let size = ((state.settings && state.settings.fontSize) || FONT_BASE) + delta;
  size = Math.max(FONT_MIN, Math.min(FONT_MAX, size));
  state.settings.fontSize = size;
  applyFontSize();
  saveState();
}

/* ============================================================
   ТЕМА (СВЕТЛАЯ / ТЁМНАЯ)
   ============================================================ */
function applyTheme(){
  const theme = (state.settings && state.settings.theme) || "dark";
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("themeToggleBtn");
  if(btn) btn.textContent = theme === "dark" ? "☀" : "🌙";
}
function toggleTheme(){
  const current = (state.settings && state.settings.theme) || "dark";
  state.settings.theme = current === "dark" ? "light" : "dark";
  applyTheme();
  saveState();
}

function toggleVoicePanel(){
  const existing = document.getElementById("voicePanel");
  if(existing){ existing.remove(); return; }
  loadVoices();
  const en = englishVoices();
  const active = getActiveVoice();
  const btn = document.getElementById("voiceSettingsBtn");
  const panel = document.createElement("div");
  panel.id = "voicePanel";
  panel.className = "voice-panel";

  let optionsHtml = `<option value="">Автоматически (лучший доступный)</option>`;
  optionsHtml += en.map(v =>
    `<option value="${escapeHtml(v.name)}" ${state.settings.voiceName===v.name ? "selected":""}>${escapeHtml(v.name)} (${escapeHtml(v.lang)})</option>`
  ).join("");

  panel.innerHTML = `
    <h4>Голос для озвучки</h4>
    ${en.length ? `<select id="voiceSelect">${optionsHtml}</select>` : `<div class="hint">Браузер пока не отдал список голосов — некоторые browsers (например, мобильный Safari) подгружают их только после первого звука. Нажмите «Проверить».</div>`}
    <div class="actions">
      <button class="primary" id="voiceTestBtn">▶ Проверить</button>
      <button id="voiceCloseBtn">Закрыть</button>
    </div>
    <div class="hint">Список голосов зависит от вашего браузера и операционной системы — отличается на Windows, Mac, Android и т.д.${active ? " Сейчас используется: " + escapeHtml(active.name) + "." : ""}</div>
  `;
  document.body.appendChild(panel);
  const rect = btn.getBoundingClientRect();
  panel.style.position = "absolute";
  panel.style.top = (window.scrollY + rect.bottom + 8) + "px";
  let left = window.scrollX + rect.right - 280;
  if(left < 8) left = 8;
  panel.style.left = left + "px";

  const select = document.getElementById("voiceSelect");
  if(select){
    select.addEventListener("change", ()=>{
      state.settings.voiceName = select.value || null;
      saveState();
    });
  }
  document.getElementById("voiceTestBtn").addEventListener("click", ()=>{
    loadVoices();
    if(select){
      select.innerHTML = `<option value="">Автоматически (лучший доступный)</option>` + englishVoices().map(v =>
        `<option value="${escapeHtml(v.name)}" ${state.settings.voiceName===v.name ? "selected":""}>${escapeHtml(v.name)} (${escapeHtml(v.lang)})</option>`
      ).join("");
    }
    speak("Hello! This is how I sound when reading English texts to you.");
  });
  document.getElementById("voiceCloseBtn").addEventListener("click", ()=>panel.remove());
}

function highlightInSentence(sentence, token){
  const idx = sentence.toLowerCase().indexOf(token.toLowerCase());
  if(idx === -1) return escapeHtml(sentence);
  return escapeHtml(sentence.slice(0, idx)) +
    "<mark>" + escapeHtml(sentence.slice(idx, idx + token.length)) + "</mark>" +
    escapeHtml(sentence.slice(idx + token.length));
}

/* ============================================================
   ОНЛАЙН-СЛОВАРИ: перевод (MyMemory) и транскрипция (Free Dictionary API)
   Используются только если слова нет в локальном словаре —
   как подстраховка, а не основной источник. Результаты кэшируются
   в памяти на время сессии, чтобы не запрашивать одно и то же слово дважды.
   ============================================================ */
const apiTranslationCache = {};
const transcriptionCache = {};
const TRANSCRIPTION_FALLBACKS = {
  constantine: "/ˈkɒnstəntaɪn/"
};

async function fetchWithTimeout(url, ms){
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), ms);
  try{
    return await fetch(url, {signal: controller.signal});
  } finally {
    clearTimeout(timer);
  }
}

async function fetchApiTranslation(text){
  const k = text.toLowerCase();
  if(apiTranslationCache.hasOwnProperty(k)) return apiTranslationCache[k];
  let result = null;
  try{
    const resp = await fetchWithTimeout(
      "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=en|ru", 6000);
    if(resp.ok){
      const data = await resp.json();
      let translated = data && data.responseData && data.responseData.translatedText;
      if(translated){
        translated = translated.trim();
        if(translated && translated.toLowerCase() !== text.toLowerCase() && !/no query|mymemory warning/i.test(translated)){
          result = translated;
        }
      }
    }
  }catch(e){ /* сеть/CORS/таймаут — просто остаёмся без перевода из API */ }
  apiTranslationCache[k] = result;
  return result;
}

async function fetchTranscription(word){
  const k = word.toLowerCase();
  if(transcriptionCache.hasOwnProperty(k)) return transcriptionCache[k];
  let result = TRANSCRIPTION_FALLBACKS[k] ? {ipa: TRANSCRIPTION_FALLBACKS[k], audio:null} : null;
  if(result){ transcriptionCache[k] = result; return result; }
  try{
    const resp = await fetchWithTimeout(
      "https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(k), 6000);
    if(resp.ok){
      const data = await resp.json();
      let ipa = null, audio = null;
      if(Array.isArray(data)){
        for(const entry of data){
          if(!ipa && entry.phonetic) ipa = entry.phonetic;
          if(Array.isArray(entry.phonetics)){
            for(const p of entry.phonetics){
              if(!ipa && p.text) ipa = p.text;
              if(!audio && p.audio) audio = p.audio;
            }
          }
        }
      }
      if(ipa || audio) result = {ipa, audio};
    }
  }catch(e){ /* словарь недоступен — транскрипцию просто не показываем */ }
  transcriptionCache[k] = result;
  return result;
}

async function fetchPhraseTranscription(text){
  const tokens = text.match(/[A-Za-z']+/g) || [];
  if(!tokens.length) return null;
  if(tokens.length > 20) return null;
  const parts = await Promise.all(tokens.map(token=>fetchTranscription(token)));
  const ipa = parts.map((part, index)=>part && part.ipa ? part.ipa : tokens[index]).join(" ");
  return parts.some(Boolean) ? ipa : null;
}

let tooltipRequestId = 0;

function showTooltip(el, token, forcedSentence){
  const reqId = ++tooltipRequestId;
  let info = lookupWord(token);
  const key = info ? info.key : token.toLowerCase();
  const layer = document.getElementById("tooltipLayer");
  const sIdx = el.dataset ? el.dataset.sidx : undefined;
  const sentence = forcedSentence || ((sIdx !== undefined && readerSentences[sIdx]) ? readerSentences[sIdx] : null);

  // Состояние, которое со временем дополняется асинхронными ответами API
  const view = {
    info,
    fromApi: false,
    apiStatus: info ? "skip" : "loading",
    ipa: null,
    ipaStatus: "loading",
    audioUrl: (transcriptionCache[key.toLowerCase()] && transcriptionCache[key.toLowerCase()].audio) || null,
    sentenceTranslation: null,   // перевод контекстного предложения, добавляется асинхронно
    sentenceTranslationStatus: sentence ? "loading" : "skip"
  };
  if(view.audioUrl) playAudioUrl(view.audioUrl, token); else speak(token);

  function paint(){
    if(reqId !== tooltipRequestId) return; // открыта уже другая подсказка
    const curKey = view.info ? view.info.key : key;
    const existing = state.userWords[curKey];

    let inner = `<button class="tt-close" id="ttClose" aria-label="Закрыть">✕</button>`;
    inner += `<div class="tt-word-row"><span class="tt-word">${escapeHtml(token)}</span>
      <button class="tt-speak" id="ttSpeak" aria-label="Произнести слово" title="Произнести слово">${SOUND_ICON}</button></div>`;
    if(view.info && view.info.key !== token.toLowerCase()){
      inner += `<div class="tt-lemma">словарная форма: ${escapeHtml(view.info.key)}</div>`;
    }
    if(view.ipaStatus === "loading"){
      inner += `<div class="tt-ipa loading">ищем транскрипцию…</div>`;
    } else if(view.ipa){
      inner += `<div class="tt-ipa">${escapeHtml(view.ipa)}</div>`;
    }

    if(view.info){
      inner += `<div class="tt-translation">${escapeHtml(view.info.translation)}</div>`;
      if(view.fromApi){
        inner += `<div class="tt-source">🌐 перевод из онлайн-словаря</div>`;
      }
      const freq = frequencyInfo(view.info.key);
      inner += `<div class="tt-freq">
        <span class="freq-bars" aria-hidden="true">
          <span class="fbar h1 ${freq.bars>=1?'on':''}"></span>
          <span class="fbar h2 ${freq.bars>=2?'on':''}"></span>
          <span class="fbar h3 ${freq.bars>=3?'on':''}"></span>
          <span class="fbar h4 ${freq.bars>=4?'on':''}"></span>
        </span>
        <span>${escapeHtml(freq.label)}</span>
      </div>`;
    } else if(view.apiStatus === "loading"){
      inner += `<div class="tt-hint">Ищем перевод в онлайн-словаре…</div>`;
    }
    if(sentence){
      inner += `<div class="tt-context-row">
        <div class="tt-context">${highlightInSentence(sentence, token)}</div>
        <button class="tt-speak tt-speak-sm" id="ttSpeakContext" aria-label="Прочитать предложение" title="Прочитать предложение">${SOUND_ICON}</button>
      </div>`;
      if(view.sentenceTranslationStatus === "loading"){
        inner += `<div class="tt-sentence-ru loading">переводим предложение…</div>`;
      } else if(view.sentenceTranslation){
        // Подсвечиваем перевод самого слова внутри перевода предложения, если оно там встречается
        const wordRu = view.info ? view.info.translation.split(/[,，;(]/)[0].trim() : null;
        inner += `<div class="tt-sentence-ru">${wordRu ? highlightInSentence(view.sentenceTranslation, wordRu) : escapeHtml(view.sentenceTranslation)}</div>`;
      }
    }

    if(view.info){
      if(!existing){
        inner += `<div class="tt-actions">
          <button class="primary" id="ttAddLearning">+ В изучение</button>
          <button id="ttAddKnown">Уже знаю</button>
        </div>`;
      } else if(existing.status === "learning"){
        inner += `<div class="tt-status">Статус: в изучении</div>
        <div class="tt-actions">
          <button id="ttMarkKnown">Отметить как изучено</button>
          <button class="danger" id="ttRemove">Убрать из словаря</button>
        </div>`;
      } else {
        inner += `<div class="tt-status">Статус: изучено</div>
        <div class="tt-actions">
          <button id="ttMarkLearning">Вернуть в изучение</button>
          <button class="danger" id="ttRemove">Убрать из словаря</button>
        </div>`;
      }
    } else if(view.apiStatus !== "loading"){
      inner += `<div class="tt-hint">Перевод не найден. Добавьте свой:</div>
        <input class="tt-input" id="ttInput" type="text" placeholder="Например: красивый">
        <div class="tt-actions">
          <button class="primary" id="ttSaveCustom">Сохранить</button>
        </div>`;
    }

    layer.innerHTML = `<div class="tooltip" id="ttBox">${inner}</div>`;

    const box = document.getElementById("ttBox");
    const rect = el.getBoundingClientRect();
    const top = window.scrollY + rect.bottom + 8;
    let left = window.scrollX + rect.left;
    const maxLeft = window.scrollX + document.documentElement.clientWidth - 332;
    if(left > maxLeft) left = Math.max(8, maxLeft);
    box.style.top = top + "px";
    box.style.left = left + "px";

    document.getElementById("ttClose").addEventListener("click", hideTooltip);
    document.getElementById("ttSpeak").addEventListener("click", ()=>{
      if(view.audioUrl) playAudioUrl(view.audioUrl, token); else speak(token);
    });
    const speakContext = document.getElementById("ttSpeakContext");
    if(speakContext) speakContext.addEventListener("click", ()=>speak(sentence));
    const addLearning = document.getElementById("ttAddLearning");
    if(addLearning) addLearning.addEventListener("click", ()=>{
      addWord(curKey, view.info.translation, "learning", sentence);
      showToast("Добавлено в «В изучении» ✓");
      paint();
    });
    const addKnown = document.getElementById("ttAddKnown");
    if(addKnown) addKnown.addEventListener("click", ()=>{
      addWord(curKey, view.info.translation, "known", sentence);
      showToast("Добавлено в «Изучено» ✓");
      paint();
    });
    const markKnown = document.getElementById("ttMarkKnown");
    if(markKnown) markKnown.addEventListener("click", ()=>{
      setStatus(curKey, "known");
      showToast("Отмечено как изучено ✓");
      paint();
    });
    const markLearning = document.getElementById("ttMarkLearning");
    if(markLearning) markLearning.addEventListener("click", ()=>{
      setStatus(curKey, "learning");
      showToast("Возвращено в «В изучении» ✓");
      paint();
    });
    const removeBtn = document.getElementById("ttRemove");
    if(removeBtn) removeBtn.addEventListener("click", ()=>{
      removeWord(curKey);
      showToast("Убрано из словаря");
      paint();
    });
    const saveCustom = document.getElementById("ttSaveCustom");
    if(saveCustom){
      const input = document.getElementById("ttInput");
      input.focus();
      const submit = ()=>{
        const val = input.value.trim();
        if(!val) return;
        addWord(key, val, "learning", sentence);
        view.info = {key, translation: val};
        showToast("Добавлено в «В изучении» ✓");
        paint();
      };
      saveCustom.addEventListener("click", submit);
      input.addEventListener("keydown", (e)=>{ if(e.key==="Enter") submit(); });
    }
  }

  paint();

  // Транскрипция — пробуем для любого слова, локального или нет.
  fetchTranscription(key).then(result=>{
    view.ipaStatus = "done";
    view.ipa = result ? result.ipa : null;
    if(result && result.audio) view.audioUrl = result.audio;
    paint();
  });

  // Перевод через API — только если в локальном словаре слова не нашлось.
  if(!info){
    fetchApiTranslation(token).then(translated=>{
      view.apiStatus = translated ? "done" : "failed";
      if(translated){
        view.info = {key, translation: translated};
        view.fromApi = true;
      }
      paint();
    });
  }

  // Перевод контекстного предложения — запрашиваем всегда, если предложение есть.
  if(sentence){
    fetchApiTranslation(sentence).then(translated=>{
      view.sentenceTranslationStatus = "done";
      view.sentenceTranslation = translated || null;
      paint();
    });
  }
}

/* ============================================================
   ВЫДЕЛЕНИЕ НЕСКОЛЬКИХ СЛОВ (ФРАЗА)
   ============================================================ */
function showPhraseTooltip(range, text, sentence){
  const reqId = ++tooltipRequestId;
  const key = text.toLowerCase();
  const existing = state.userWords[key];
  const layer = document.getElementById("tooltipLayer");

  speak(text);

  let inner = `<button class="tt-close" id="ttClose" aria-label="Закрыть">✕</button>`;
  inner += `<div class="tt-word-row"><span class="tt-word" style="font-size:16px;">«${escapeHtml(text)}»</span>
    <button class="tt-speak" id="ttSpeak" aria-label="Произнести фразу" title="Произнести фразу">${SOUND_ICON}</button></div>`;
  inner += `<div class="tt-lemma">слова по отдельности (нажмите для перевода):</div>`;
  inner += `<div class="tt-phrase-words">${buildLineHtml(text)}</div>`;
  if(sentence && sentence.toLowerCase() !== text.toLowerCase()){
    inner += `<div class="tt-context-row">
      <div class="tt-context">${highlightInSentence(sentence, text)}</div>
      <button class="tt-speak tt-speak-sm" id="ttSpeakContext" aria-label="Прочитать предложение" title="Прочитать предложение">${SOUND_ICON}</button>
    </div>`;
  }

  if(existing){
    inner += `<div class="tt-status">Сохранено как фраза, статус: ${existing.status==="known" ? "изучено" : "в изучении"}</div>
      <div class="tt-actions">
        <button id="ttPhraseToggle">${existing.status==="known" ? "Вернуть в изучение" : "Отметить как изучено"}</button>
        <button class="danger" id="ttPhraseRemove">Убрать из словаря</button>
      </div>`;
  } else {
    inner += `<div class="tt-hint">Сохранить всю фразу со своим переводом:</div>
      <input class="tt-input" id="ttPhraseInput" type="text" placeholder="Например: между прочим">
      <div class="tt-ipa loading" id="ttPhraseLoading">ищем вариант перевода…</div>
      <div class="tt-actions">
        <button class="primary" id="ttPhraseSave">Сохранить фразу</button>
      </div>`;
  }

  layer.innerHTML = `<div class="tooltip wide" id="ttBox">${inner}</div>`;

  const box = document.getElementById("ttBox");
  const rect = range.getBoundingClientRect();
  const top = window.scrollY + rect.bottom + 8;
  let left = window.scrollX + rect.left;
  const maxLeft = window.scrollX + document.documentElement.clientWidth - 372;
  if(left > maxLeft) left = Math.max(8, maxLeft);
  box.style.top = top + "px";
  box.style.left = left + "px";

  document.getElementById("ttClose").addEventListener("click", hideTooltip);
  document.getElementById("ttSpeak").addEventListener("click", ()=>speak(text));
  const speakContext = document.getElementById("ttSpeakContext");
  if(speakContext) speakContext.addEventListener("click", ()=>speak(sentence));
  const toggleBtn = document.getElementById("ttPhraseToggle");
  if(toggleBtn) toggleBtn.addEventListener("click", ()=>{
    const newStatus = existing.status==="known" ? "learning" : "known";
    setStatus(key, newStatus);
    showToast(newStatus==="known" ? "Отмечено как изучено ✓" : "Возвращено в «В изучении» ✓");
    hideTooltip();
  });
  const removeBtn = document.getElementById("ttPhraseRemove");
  if(removeBtn) removeBtn.addEventListener("click", ()=>{
    removeWord(key);
    showToast("Убрано из словаря");
    hideTooltip();
  });
  const saveBtn = document.getElementById("ttPhraseSave");
  if(saveBtn){
    const input = document.getElementById("ttPhraseInput");
    input.focus();
    const submit = ()=>{
      const val = input.value.trim();
      if(!val) return;
      addPhrase(text, val, sentence);
      showToast("Фраза добавлена в «В изучении» ✓");
      hideTooltip();
    };
    saveBtn.addEventListener("click", submit);
    input.addEventListener("keydown", (e)=>{ if(e.key==="Enter") submit(); });

    fetchApiTranslation(text).then(suggested=>{
      if(reqId !== tooltipRequestId) return; // подсказка уже закрыта/сменилась
      const loadingEl = document.getElementById("ttPhraseLoading");
      if(loadingEl) loadingEl.remove();
      const liveInput = document.getElementById("ttPhraseInput");
      if(suggested && liveInput && !liveInput.value.trim()){
        liveInput.value = suggested;
        liveInput.select();
      }
    });
  }
}


/* ============================================================
   ГЛАВНАЯ — ИНТЕРАКТИВНОЕ ДЕМО
   ============================================================ */
const DEMO_SENTENCE = "A curious fox can read English texts and learn new words every day.";
function renderDemoSentence(){
  document.getElementById("demoSentence").innerHTML = buildLineHtml(DEMO_SENTENCE);
}

/* ============================================================
   МОЙ СЛОВАРЬ
   ============================================================ */
function renderDictionary(){
  const content = document.getElementById("dictContent");
  let entries = Object.entries(state.userWords);
  if(currentFilter !== "all") entries = entries.filter(([,v])=>v.status===currentFilter);
  entries.sort((a,b)=>b[1].addedAt - a[1].addedAt);

  if(entries.length === 0){
    content.innerHTML = `<div class="empty-state">
      ${currentFilter==="all"
        ? "Словарь пока пуст. Откройте текст и нажимайте на слова, чтобы добавлять их сюда."
        : "Здесь пока ничего нет для этого фильтра."}
      <br><button class="btn" id="dictGoRead">Перейти к текстам</button>
    </div>`;
    const goRead = document.getElementById("dictGoRead");
    if(goRead) goRead.addEventListener("click", ()=>showView("home"));
    return;
  }

  content.innerHTML = `<div class="dict-grid">${entries.map(([key,v])=>`
    <div class="dict-chip" data-key="${escapeHtml(key)}">
      <div class="w-row" style="display:flex;align-items:baseline;justify-content:space-between;gap:6px;">
        <span class="w">${escapeHtml(key)}</span>
        <button class="tt-speak" data-speak="${escapeHtml(key)}" aria-label="Произнести" title="Произнести" style="width:22px;height:22px;font-size:11px;">${SOUND_ICON}</button>
      </div>
      <div class="dict-ipa loading" data-ipa-key="${escapeHtml(key)}">ищем транскрипцию…</div>
      <div class="t">${escapeHtml(v.translation)}</div>
      ${v.example ? `<div class="ex-row">
        <div class="ex">${highlightInSentence(v.example, key)}</div>
        <button class="tt-speak tt-speak-sm" data-speak-example="${escapeHtml(v.example)}" aria-label="Прочитать предложение" title="Прочитать предложение">${SOUND_ICON}</button>
      </div><div class="dict-ex-ipa loading" data-ex-ipa="${escapeHtml(v.example)}">ищем транскрипцию примера…</div>` : ""}
      <span class="badge ${v.status}">${v.status==="known" ? "изучено" : "в изучении"}</span>
      ${v.type==="phrase" ? `<span class="badge" style="background:var(--amber-soft2);color:var(--ink-soft);">фраза</span>` : ""}
      <div class="chip-actions">
        ${v.status==="known"
          ? `<button data-act="learning">В изучение</button>`
          : `<button data-act="known">Изучено</button>`}
        <button data-act="remove">Удалить</button>
      </div>
    </div>`).join("")}</div>`;

  content.querySelectorAll(".dict-chip").forEach(chip=>{
    const key = chip.dataset.key;
    chip.querySelectorAll("button[data-act]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        if(btn.dataset.act === "remove") removeWord(key);
        else setStatus(key, btn.dataset.act);
        renderDictionary();
      });
    });
    const speakBtn = chip.querySelector("[data-speak]");
    if(speakBtn) speakBtn.addEventListener("click", ()=>speak(key));
    const speakExampleBtn = chip.querySelector("[data-speak-example]");
    if(speakExampleBtn) speakExampleBtn.addEventListener("click", ()=>speak(speakExampleBtn.dataset.speakExample));
  });

  content.querySelectorAll(".dict-ipa").forEach(ipaEl=>{
    fetchTranscription(ipaEl.dataset.ipaKey).then(result=>{
      if(!ipaEl.isConnected) return;
      if(result && result.ipa){
        ipaEl.textContent = result.ipa;
        ipaEl.classList.remove("loading");
      } else {
        ipaEl.remove();
      }
    });
  });

  content.querySelectorAll(".dict-ex-ipa").forEach(ipaEl=>{
    fetchPhraseTranscription(ipaEl.dataset.exIpa).then(ipa=>{
      if(!ipaEl.isConnected) return;
      if(ipa){ ipaEl.textContent = ipa; ipaEl.classList.remove("loading"); }
      else ipaEl.remove();
    });
  });
}

/* ============================================================
   ТРЕНИРОВКА (ФЛЕШ-КАРТОЧКИ)
   ============================================================ */
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}
function buildPracticeQueue(){
  practiceQueue = shuffle(Object.entries(state.userWords)
    .filter(([,v])=>v.status==="learning")
    .map(([k,v])=>({key:k, translation:v.translation, example:v.example||"", streak:0})));
  practiceIndex = 0;
  practiceRevealed = false;
}

function isQuizWord(key){
  return /^[A-Za-z]+(?:['-][A-Za-z]+)*$/.test(key);
}

function quizWordPattern(key){
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("\\b" + escaped + "\\b", "i");
}

function buildQuizSentence(sentence, key){
  const match = quizWordPattern(key).exec(sentence);
  if(!match) return null;
  return escapeHtml(sentence.slice(0, match.index)) +
    `<span class="quiz-blank" aria-label="пропущенное слово">&nbsp;</span>` +
    escapeHtml(sentence.slice(match.index + match[0].length));
}

function buildQuizOptions(correct){
  const pool = [...new Set([...Object.keys(state.userWords), ...Object.keys(BASE_DICT)])]
    .filter(key=>key !== correct && isQuizWord(key));
  shuffle(pool);
  pool.sort((a,b)=>Math.abs(a.length - correct.length) - Math.abs(b.length - correct.length));
  return shuffle([correct, ...pool.slice(0, 3)]);
}

function buildQuizQueue(){
  quizQueue = shuffle(Object.entries(state.userWords)
    .filter(([key, value])=>value.status === "learning" && value.example && isQuizWord(key) && quizWordPattern(key).test(value.example))
    .map(([key, value])=>({
      key,
      translation:value.translation,
      example:value.example,
      options:buildQuizOptions(key)
    })));
  quizIndex = 0;
  quizScore = 0;
  quizAnswered = false;
}

function resetPracticeSession(){
  if(practiceMode === "quiz") buildQuizQueue();
  else buildPracticeQueue();
  renderPractice();
}
let practiceRequestId = 0;
let practiceKeyHandler = null; // глобальный обработчик клавиш — нужно чистить при смене карточки

function renderPractice(){
  if(practiceMode === "quiz") renderQuiz();
  else renderFlashcards();
}

function renderFlashcards(){
  const reqId = ++practiceRequestId;
  const content = document.getElementById("practiceContent");

  // Убираем предыдущий обработчик клавиш
  if(practiceKeyHandler){ document.removeEventListener("keydown", practiceKeyHandler); practiceKeyHandler = null; }

  if(practiceQueue.length === 0){
    content.innerHTML = `<div class="empty-state">
      Нет слов для тренировки. Сначала откройте текст и добавьте слова в раздел «В изучении».
      <br><button class="btn" id="practiceGoRead">Перейти к текстам</button>
    </div>`;
    const goRead = document.getElementById("practiceGoRead");
    if(goRead) goRead.addEventListener("click", ()=>showView("home"));
    return;
  }

  const item = practiceQueue[practiceIndex];
  practiceRevealed = false;

  // Вычисляем перевод слова (первое значение без уточнений) для подсветки
  const wordRu = item.translation ? item.translation.split(/[,，;(]/)[0].trim() : null;

  content.innerHTML = `
    <div class="practice-wrap">
      <div class="fc-progress">
        <span>Карточка ${practiceIndex + 1}&thinsp;/&thinsp;${practiceQueue.length}</span>
        ${item.streak > 0 ? `<span class="fc-streak">🔥 ×${item.streak}</span>` : "<span></span>"}
      </div>

      <div class="fc-scene" id="fcScene" tabindex="0" role="button" aria-label="Нажмите, чтобы перевернуть карточку">
        <div class="fc-card" id="fcCard">

          <div class="fc-front">
            <div class="fc-side-label">🇬🇧 English</div>
            <div class="fc-word-row-en">
              <span class="fc-word-en">${escapeHtml(item.key)}</span>
              <button class="tt-speak" id="pSpeak" aria-label="Произнести" title="Произнести">${SOUND_ICON}</button>
            </div>
            <div class="fc-ipa loading" id="fcIpa"></div>
            ${item.example ? `
              <div class="fc-example-row">
                <div class="fc-example">${highlightInSentence(item.example, item.key)}</div>
                <button class="tt-speak tt-speak-sm" id="pSpeakEx" aria-label="Прочитать" title="Прочитать">${SOUND_ICON}</button>
              </div>
            ` : ""}
            <div class="fc-hint">нажмите, чтобы увидеть перевод</div>
          </div>

          <div class="fc-back">
            <div class="fc-side-label">🇷🇺 Русский</div>
            <div class="fc-word-ru">${escapeHtml(item.translation)}</div>
            ${item.example
              ? `<div class="fc-context-back loading" id="fcContextBack">переводим…</div>`
              : `<div class="fc-hint">нажмите, чтобы увидеть английское слово</div>`}
          </div>

        </div>
      </div>

      <div class="practice-actions hidden" id="practiceActions">
        <button class="btn-forgot" id="pForgot">✗ Забыл</button>
        <button class="btn-know" id="pRemember">✓ Помню</button>
      </div>
      <div class="practice-progress">Слов в изучении: ${practiceQueue.length}</div>
      <div class="fc-keyboard-hint"><kbd class="kbd">Пробел</kbd> перевернуть &nbsp; <kbd class="kbd">→</kbd> помню &nbsp; <kbd class="kbd">←</kbd> забыл</div>
    </div>`;

  /* ── Переворачивание ─────────────────────────── */
  const scene  = document.getElementById("fcScene");
  const card   = document.getElementById("fcCard");
  const actions = document.getElementById("practiceActions");

  function flip(){
    practiceRevealed = !practiceRevealed;
    card.classList.toggle("flipped", practiceRevealed);
    actions.classList.toggle("hidden", !practiceRevealed);
    if(practiceRevealed) speak(item.key);
  }
  scene.addEventListener("click", flip);
  scene.addEventListener("keydown", e=>{ if(e.key === " " || e.key === "Enter"){ e.preventDefault(); flip(); } });

  /* ── Обработчик клавиш для кнопок после переворота ── */
  practiceKeyHandler = (e)=>{
    const inPractice = !!document.getElementById("practiceContent");
    if(!inPractice){ document.removeEventListener("keydown", practiceKeyHandler); return; }
    if(e.key === " " || e.key === "Enter"){ e.preventDefault(); flip(); }
    else if(e.key === "ArrowRight" && practiceRevealed){ document.getElementById("pRemember")?.click(); }
    else if(e.key === "ArrowLeft"  && practiceRevealed){ document.getElementById("pForgot")?.click(); }
  };
  document.addEventListener("keydown", practiceKeyHandler);

  /* ── Кнопки оценки ──────────────────────────── */
  document.getElementById("pRemember").addEventListener("click", ()=>{
    item.streak++;
    if(item.streak >= 3){
      setStatus(item.key, "known");
      practiceQueue.splice(practiceIndex, 1);
    } else {
      practiceQueue.push(practiceQueue.splice(practiceIndex, 1)[0]);
    }
    afterPracticeStep();
  });
  document.getElementById("pForgot").addEventListener("click", ()=>{
    item.streak = 0;
    practiceQueue.push(practiceQueue.splice(practiceIndex, 1)[0]);
    afterPracticeStep();
  });

  /* ── Кнопки озвучки ─────────────────────────── */
  document.getElementById("pSpeak").addEventListener("click", e=>{ e.stopPropagation(); speak(item.key); });
  const speakEx = document.getElementById("pSpeakEx");
  if(speakEx) speakEx.addEventListener("click", e=>{ e.stopPropagation(); speak(item.example); });

  /* ── Транскрипция ───────────────────────────── */
  fetchTranscription(item.key).then(result=>{
    if(reqId !== practiceRequestId) return;
    const ipaEl = document.getElementById("fcIpa");
    if(!ipaEl) return;
    if(result && result.ipa){ ipaEl.textContent = result.ipa; ipaEl.classList.remove("loading"); }
    else { ipaEl.remove(); }
  });

  /* ── Перевод предложения ────────────────────── */
  if(item.example){
    fetchApiTranslation(item.example).then(translated=>{
      if(reqId !== practiceRequestId) return;
      const backEl  = document.getElementById("fcContextBack");
      const html = translated
        ? (wordRu ? highlightInSentence(translated, wordRu) : escapeHtml(translated))
        : null;
      if(backEl){  if(html){ backEl.innerHTML  = html; backEl.classList.remove("loading");  } else backEl.remove(); }
    });
  }
}

function afterPracticeStep(){
  practiceRevealed = false;
  if(practiceKeyHandler){ document.removeEventListener("keydown", practiceKeyHandler); practiceKeyHandler = null; }
  if(practiceIndex >= practiceQueue.length) practiceIndex = 0;
  renderPractice();
}

function renderQuiz(){
  const content = document.getElementById("practiceContent");
  if(practiceKeyHandler){ document.removeEventListener("keydown", practiceKeyHandler); practiceKeyHandler = null; }

  if(quizQueue.length === 0){
    content.innerHTML = `<div class="empty-state">
      Для квиза нужны слова со статусом «в изучении» и предложением-примером.
      <br><button class="btn" id="quizGoRead">Перейти к текстам</button>
    </div>`;
    document.getElementById("quizGoRead")?.addEventListener("click", ()=>showView("home"));
    return;
  }

  if(quizIndex >= quizQueue.length){
    const percent = Math.round((quizScore / quizQueue.length) * 100);
    content.innerHTML = `<div class="quiz-result">
      <div class="quiz-result-label">Квиз завершён</div>
      <strong>${quizScore}&thinsp;/&thinsp;${quizQueue.length}</strong>
      <p>${percent >= 80 ? "Отличный результат." : percent >= 50 ? "Хороший результат — попробуйте ещё раз." : "Повторите слова и пройдите квиз снова."}</p>
      <button class="btn" id="quizRestart">Пройти ещё раз</button>
    </div>`;
    document.getElementById("quizRestart").addEventListener("click", ()=>{
      buildQuizQueue();
      renderQuiz();
    });
    return;
  }

  const item = quizQueue[quizIndex];
  const sentence = buildQuizSentence(item.example, item.key);
  quizAnswered = false;

  content.innerHTML = `<div class="quiz-wrap">
    <div class="quiz-meta">
      <span>Вопрос ${quizIndex + 1}&thinsp;/&thinsp;${quizQueue.length}</span>
      <span>Верно: ${quizScore}</span>
    </div>
    <div class="quiz-question">
      <div class="quiz-label">Выберите пропущенное слово</div>
      <div class="quiz-sentence-row">
        <p class="quiz-sentence">${sentence}</p>
        <button class="tt-speak" id="quizSpeak" aria-label="Прослушать предложение" title="Прослушать предложение">${SOUND_ICON}</button>
      </div>
      <div class="quiz-options">
        ${item.options.map((option, index)=>`<button type="button" data-quiz-option="${escapeHtml(option)}">
          <span class="quiz-option-index">${index + 1}</span>
          <span>${escapeHtml(option)}</span>
        </button>`).join("")}
      </div>
      <div class="quiz-feedback" id="quizFeedback" aria-live="polite"></div>
    </div>
    <button class="btn quiz-next hidden" id="quizNext">Следующий вопрос</button>
    <div class="fc-keyboard-hint"><kbd class="kbd">1–4</kbd> выбрать ответ &nbsp; <kbd class="kbd">Enter</kbd> дальше</div>
  </div>`;

  const optionButtons = [...content.querySelectorAll("[data-quiz-option]")];
  const feedback = document.getElementById("quizFeedback");
  const nextBtn = document.getElementById("quizNext");

  function answer(selected, selectedButton){
    if(quizAnswered) return;
    quizAnswered = true;
    const isCorrect = selected === item.key;
    if(isCorrect) quizScore++;

    optionButtons.forEach(button=>{
      button.disabled = true;
      if(button.dataset.quizOption === item.key) button.classList.add("correct");
    });
    if(!isCorrect) selectedButton.classList.add("wrong");

    feedback.className = "quiz-feedback " + (isCorrect ? "success" : "error");
    feedback.innerHTML = isCorrect
      ? `<strong>Верно.</strong> ${escapeHtml(item.translation)}`
      : `<strong>Правильный ответ: ${escapeHtml(item.key)}.</strong> ${escapeHtml(item.translation)}`;
    nextBtn.classList.remove("hidden");
    nextBtn.focus();
  }

  optionButtons.forEach(button=>{
    button.addEventListener("click", ()=>answer(button.dataset.quizOption, button));
  });
  document.getElementById("quizSpeak").addEventListener("click", ()=>speak(item.example));
  nextBtn.addEventListener("click", ()=>{
    quizIndex++;
    renderQuiz();
  });

  practiceKeyHandler = (event)=>{
    const target = event.target;
    if(target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    if(!quizAnswered && /^[1-4]$/.test(event.key)){
      event.preventDefault();
      optionButtons[Number(event.key) - 1]?.click();
    } else if(quizAnswered && event.key === "Enter"){
      event.preventDefault();
      nextBtn.click();
    }
  };
  document.addEventListener("keydown", practiceKeyHandler);
}


/* ============================================================
   ИНИЦИАЛИЗАЦИЯ
   ============================================================ */
function wireGlobalEvents(){
  document.querySelectorAll(".nav button[data-view]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const view = btn.dataset.view;
      if(view === "reader" && !currentText) return;
      if(view !== "practice" && practiceKeyHandler){
        document.removeEventListener("keydown", practiceKeyHandler);
        practiceKeyHandler = null;
      }
      showView(view);
      if(view === "dictionary") renderDictionary();
      if(view === "practice") resetPracticeSession();
    });
  });

  document.querySelectorAll("[data-practice-mode]").forEach(button=>{
    button.addEventListener("click", ()=>{
      practiceMode = button.dataset.practiceMode;
      document.querySelectorAll("[data-practice-mode]").forEach(tab=>{
        const active = tab === button;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      resetPracticeSession();
    });
  });

  document.getElementById("readerBack").addEventListener("click", ()=>showView("home"));
  document.getElementById("fontDecrease").addEventListener("click", ()=>changeFontSize(-FONT_STEP));
  document.getElementById("fontIncrease").addEventListener("click", ()=>changeFontSize(FONT_STEP));
  document.getElementById("readAloudBtn").addEventListener("click", ()=>{
    const btn = document.getElementById("readAloudBtn");
    if(btn.dataset.playing === "1"){
      stopReading();
    } else if(currentText){
      readTextAloud(currentText.body);
    }
  });
  document.getElementById("floatingStopBtn").addEventListener("click", stopReading);
  document.getElementById("heroStart").addEventListener("click", ()=>{
    document.getElementById("libraryGrid").scrollIntoView({behavior:"smooth", block:"start"});
  });

  document.querySelectorAll(".dict-tabs button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      currentFilter = btn.dataset.filter;
      document.querySelectorAll(".dict-tabs button").forEach(b=>b.classList.toggle("active", b===btn));
      renderDictionary();
    });
  });

  document.getElementById("exportBtn").addEventListener("click", exportData);
  document.getElementById("importBtn").addEventListener("click", ()=>{
    document.getElementById("importFile").click();
  });
  document.getElementById("importFile").addEventListener("change", (e)=>{
    const file = e.target.files && e.target.files[0];
    if(file) importDataFromFile(file);
    e.target.value = "";
  });
  document.getElementById("voiceSettingsBtn").addEventListener("click", (e)=>{
    e.stopPropagation();
    toggleVoicePanel();
  });
  document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);

  document.addEventListener("click", (e)=>{
    if(!e.target.closest("#voicePanel, #voiceSettingsBtn")){
      const panel = document.getElementById("voicePanel");
      if(panel) panel.remove();
    }
    const sel = window.getSelection();
    if(sel && !sel.isCollapsed && sel.toString().trim().length > 0){
      return; // активное выделение обрабатывается через mouseup ниже
    }
    const wordEl = e.target.closest(".word");
    if(wordEl){
      showTooltip(wordEl, wordEl.dataset.token);
      return;
    }
    if(!e.target.closest("#tooltipLayer")) hideTooltip();
  });

  // Считаем, удерживается ли сейчас мышь/палец — это нужно, чтобы не
  // показывать подсказку и не озвучивать слово ПОКА пользователь ещё
  // тянет выделение (раньше это срабатывало на любую короткую паузу).
  let activePointers = 0;
  const onPointerDown = ()=>{ activePointers++; };
  const onPointerUp = ()=>{
    activePointers = Math.max(0, activePointers - 1);
    setTimeout(handleSelectionUp, 30);
  };
  document.addEventListener("mousedown", onPointerDown);
  document.addEventListener("mouseup", onPointerUp);
  document.addEventListener("touchstart", onPointerDown, {passive:true});
  document.addEventListener("touchend", onPointerUp);
  document.addEventListener("touchcancel", ()=>{ activePointers = Math.max(0, activePointers - 1); });

  // На телефоне выделение иногда тянут за «ручки» нативного UI, для которых
  // touchend может не дойти до наших обработчиков — selectionchange ловит
  // это в любом случае. Но запускаем подсказку из него только если ни одна
  // кнопка/палец сейчас не зажаты — иначе именно это и озвучивало слово
  // посреди выделения.
  let selectionSettleTimer = null;
  document.addEventListener("selectionchange", ()=>{
    clearTimeout(selectionSettleTimer);
    selectionSettleTimer = setTimeout(()=>{
      if(activePointers > 0) return; // всё ещё тянут — рано
      handleSelectionUp();
    }, 450);
  });
  // Подавляем нативное контекстное меню (копировать/найти и т.п.) внутри
  // читаемого текста — вместо него показываем свою подсказку.
  document.addEventListener("contextmenu", (e)=>{
    if(e.target.closest(".reader-body, .demo-card")) e.preventDefault();
  });

  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape"){ hideTooltip(); return; }
    if((e.key === "Enter" || e.key === " ") && e.target.classList.contains("word")){
      e.preventDefault();
      showTooltip(e.target, e.target.dataset.token);
    }
  });
}

function isSelectionInsideContent(sel){
  if(!sel.anchorNode) return false;
  const container = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
  return !!(container && container.closest(".reader-body, .demo-card"));
}
// Находит предложение-контекст, в котором началось выделение, используя
// data-sidx ближайшего слова — тот же индекс, что заполняется при рендере текста.
function findContainingSentence(sel){
  if(!sel.rangeCount) return null;
  const node = sel.getRangeAt(0).startContainer;
  const el = node.nodeType === 1 ? node : node.parentElement;
  const wordEl = el ? el.closest(".word[data-sidx]") : null;
  if(!wordEl) return null;
  const sidx = wordEl.dataset.sidx;
  return readerSentences[sidx] || null;
}
function handleSelectionUp(){
  const sel = window.getSelection();
  if(!sel || sel.isCollapsed) return;
  const text = sel.toString().trim();
  if(!text || !isSelectionInsideContent(sel)) return;
  // Запоминаем контекстное предложение и положение ДО того, как снимем
  // выделение — иначе данные о диапазоне будут потеряны.
  const sentence = findContainingSentence(sel);
  const rect = sel.getRangeAt(0).getBoundingClientRect();
  const anchor = { getBoundingClientRect: () => rect };
  // Снимаем нативное выделение — это убирает системное меню
  // (копировать/найти и т.п.), которое мешает на телефоне.
  sel.removeAllRanges();
  const tokens = text.match(WORD_RE) || [];
  if(tokens.length <= 1){
    // выделено фактически одно слово — показываем привычную подсказку для слова
    if(tokens.length === 1) showTooltip(anchor, tokens[0], sentence);
    return;
  }
  showPhraseTooltip(anchor, text, sentence);
}


async function init(){
  await loadState();
  applyTheme();
  applyFontSize();
  renderLibrary();
  renderDemoSentence();
  updateStatsUI();
  wireGlobalEvents();
  const works = await checkStorageWorks();
  const indicator = document.getElementById("storageIndicator");
  if(indicator){
    if(storageBackend === "local"){
      indicator.textContent = works ? "· сохранение: в этом браузере (localStorage) ✓" : "· сохранение сейчас не работает";
    } else {
      indicator.textContent = works ? "· сохранение: через Claude" : "· сохранение сейчас не работает";
    }
  }
  if(!works) showStorageWarningBanner();
}
init();

})();
