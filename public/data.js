'use strict';
/* 原型静态数据：阶段、学科、知识点、示例题目、单词 */

const STAGES = [
  ['P1', '小学一年级'], ['P2', '小学二年级'], ['P3', '小学三年级'], ['P4', '小学四年级'], ['P5', '小学五年级'], ['P6', '小学六年级'],
  ['J1', '初中一年级'], ['J2', '初中二年级'], ['J3', '初中三年级'],
];
const ALL_STAGES = STAGES.map(s => s[0]);

const SUBJECT_SEED = [
  { id: 'chinese', name: '语文', icon: '📖', stages: ALL_STAGES, wordbook: false },
  { id: 'math', name: '数学', icon: '🔢', stages: ALL_STAGES, wordbook: false },
  { id: 'english', name: '英语', icon: '🔤', stages: ['P3', 'P4', 'P5', 'P6', 'J1', 'J2', 'J3'], wordbook: true },
  { id: 'physics', name: '物理', icon: '🔭', stages: ['J2', 'J3'], wordbook: false },
  { id: 'chemistry', name: '化学', icon: '⚗️', stages: ['J3'], wordbook: false },
];

// 2.1：教材版本库（在“学生 → 教材版本”中管理），每个学生每个学科单独选择版本
const P_STAGES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'], J_STAGES = ['J1', 'J2', 'J3'];
const BOOK_SEED = [
  { id: 'cn-tb', subject: 'chinese', name: '统编版', stages: ALL_STAGES },
  { id: 'ma-rj', subject: 'math', name: '人教版', stages: ALL_STAGES },
  { id: 'ma-bs', subject: 'math', name: '北师大版', stages: ALL_STAGES },
  { id: 'en-pep24', subject: 'english', name: '人教PEP（2024 新版）', stages: ['P3', 'P4', 'P5', 'P6'] },
  { id: 'en-pep12', subject: 'english', name: '人教PEP（2012 旧版）', stages: ['P3', 'P4', 'P5', 'P6'] },
  { id: 'en-gox', subject: 'english', name: '人教新目标（Go for it!）', stages: J_STAGES },
  { id: 'en-wy', subject: 'english', name: '外研版（三年级起点）', stages: ['P3', 'P4', 'P5', 'P6', ...J_STAGES] },
  { id: 'ph-rj', subject: 'physics', name: '人教版', stages: ['J2', 'J3'] },
  { id: 'ch-rj', subject: 'chemistry', name: '人教版', stages: ['J3'] },
];
// 新学生的默认版本：[小学, 初中]
const BOOK_DEFAULT_SEED = { chinese: ['cn-tb', 'cn-tb'], math: ['ma-rj', 'ma-rj'], english: ['en-pep24', 'en-gox'], physics: ['ph-rj', 'ph-rj'], chemistry: ['ch-rj', 'ch-rj'] };

// [单元, 知识点名称, 知识点难度 1基础 2中等 3较难, 教材版本（省略时用该学科的默认版本）]
const KP_SEED = {
  P3: {
    chinese: [['第一单元', '会写词语（《大青树下的小学》等）', 1], ['第二单元', '古诗三首（山行、赠刘景文、夜书所见）背诵默写', 1], ['第二单元', '联系上下文理解词语', 2], ['第三单元', '童话：感受丰富的想象', 2], ['第四单元', '预测：一边读一边猜', 2], ['第六单元', '古诗三首（望天门山、饮湖上初晴后雨、望洞庭）背诵默写', 1], ['语文园地', 'ABB 式与 AABB 式词语', 1], ['语文园地', '比喻句与拟人句', 2], ['语文园地', '冒号和引号的用法', 1]],
    math: [['时、分、秒', '秒的认识与时间单位换算', 1], ['时、分、秒', '计算经过的时间', 2], ['万以内的加法和减法（一）', '两位数加减两位数（口算）', 1], ['测量', '长度单位和质量单位（毫米、分米、千米、吨）', 2], ['万以内的加法和减法（二）', '三位数加减三位数（笔算）', 2], ['倍的认识', '倍的认识与求几倍', 2], ['多位数乘一位数', '多位数乘一位数（笔算）', 2], ['长方形和正方形', '长方形和正方形的周长', 2], ['分数的初步认识', '认识几分之一和几分之几', 1], ['数学广角', '集合（重叠问题）', 3]],
    english: [
      ['Unit 1 Hello!', '文具单词（ruler、pencil…）', 1, 'en-pep12'], ['Unit 1 Hello!', '打招呼与介绍自己', 1, 'en-pep12'], ['Unit 2 Colours', '颜色单词', 1, 'en-pep12'], ['Unit 3 Look at me!', '身体部位单词', 1, 'en-pep12'], ['Unit 4 We love animals', '动物单词', 1, 'en-pep12'], ['Unit 5 Let\'s eat!', '点餐与分享（I\'d like… / Have some…）', 2, 'en-pep12'], ['Unit 6 Happy birthday!', '数字 1–10 与询问年龄', 1, 'en-pep12'],
      ['Unit 1 Making friends', '问候与自我介绍（Nice to meet you.）', 1, 'en-pep24'], ['Unit 2 Different families', '介绍家人（This is my…）', 1, 'en-pep24'], ['Unit 3 Amazing animals', '动物单词', 1, 'en-pep24'], ['Unit 4 Plants around us', '询问物品（What\'s this? It\'s a…）', 1, 'en-pep24'], ['Unit 5 The colourful world', '询问和描述颜色（What colour…?）', 1, 'en-pep24'], ['Unit 6 Useful numbers', '数字 1–10 与 How many…?', 1, 'en-pep24'],
    ],
  },
  P2: {
    chinese: [['第一单元', '看拼音写词语（二上生字）', 1], ['识字', '量词搭配（一只、一棵……）', 1], ['第三单元', '多音字辨析', 2], ['第四单元', '古诗《登鹳雀楼》《望庐山瀑布》背诵默写', 1], ['第五单元', '近义词与反义词', 2], ['第七单元', '把句子写完整', 2]],
    math: [['长度单位', '认识厘米和米', 1], ['100以内的加法和减法（二）', '两位数加两位数（进位）', 1], ['100以内的加法和减法（二）', '两位数减两位数（退位）', 2], ['角的初步认识', '认识角和直角', 1], ['表内乘法（一）', '2–6 的乘法口诀', 1], ['表内乘法（二）', '7–9 的乘法口诀', 2], ['观察物体', '从不同位置观察物体', 2]],
  },
  P4: {
    chinese: [['第一单元', '边读边想象画面', 2], ['第二单元', '阅读时提出不懂的问题', 2], ['第三单元', '古诗三首（暮江吟、题西林壁、雪梅）默写', 1], ['第四单元', '神话故事的起因、经过、结果', 2], ['第七单元', '古诗三首（出塞、凉州词、夏日绝句）默写', 1], ['语文园地', '形近字与多音字', 1], ['语文园地', '修辞手法判断', 2]],
    math: [['大数的认识', '亿以内数的读写', 1], ['大数的认识', '数的改写与近似数', 2], ['公顷和平方千米', '面积单位的换算', 2], ['角的度量', '用量角器量角', 1], ['三位数乘两位数', '三位数乘两位数（笔算）', 2], ['三位数乘两位数', '积的变化规律', 2], ['平行四边形和梯形', '平行与垂直', 1], ['除数是两位数的除法', '除数是两位数的除法（试商）', 3], ['条形统计图', '读条形统计图', 1]],
    english: [['Unit 1', '教室物品词汇（My classroom）', 1], ['Unit 2', '书包物品词汇（My schoolbag）', 1], ['Unit 5', '食物与餐具词汇（Dinner\'s ready）', 1], ['Unit 3', '描述朋友（He / She has…）', 2], ['Unit 4', 'There is / There are（My home）', 2], ['Unit 6', '家庭成员与职业', 1]],
  },
  J2: {
    chinese: [['第一单元', '新闻的结构与特点', 2], ['第三单元', '文言文《三峡》实词释义', 2], ['第三单元', '古诗词默写（《野望》等）', 1], ['第四单元', '散文的线索与情感', 3], ['综合', '病句辨析与修改', 2], ['综合', '标点符号的使用', 1]],
    math: [['三角形', '三角形的内角和', 1], ['全等三角形', '全等三角形的判定', 2], ['轴对称', '等腰三角形的性质', 2], ['整式的乘法与因式分解', '幂的运算', 1], ['整式的乘法与因式分解', '乘法公式', 2], ['整式的乘法与因式分解', '因式分解', 3], ['分式', '分式方程', 3]],
    english: [['Unit 1', '一般过去时', 1], ['Unit 3', '形容词比较级', 2], ['Unit 4', '形容词最高级', 2], ['Unit 5', '动词不定式作宾语', 2], ['Unit 6', 'be going to 表示将来', 2], ['Unit 7', 'will 表示将来', 2]],
    physics: [['机械运动', '长度和时间的测量', 1], ['机械运动', '速度的计算', 2], ['声现象', '声音的产生与传播', 1], ['物态变化', '熔化和凝固', 2], ['光现象', '光的反射定律', 2], ['光现象', '平面镜成像', 2], ['质量与密度', '天平的使用', 1], ['质量与密度', '密度的计算', 3]],
  },
  J3: {
    chinese: [['第一单元', '诗歌的意象与情感', 2], ['第二单元', '议论文的论点与论据', 2], ['第三单元', '文言文《岳阳楼记》实词虚词', 3], ['第三单元', '古诗词默写（《行路难》等）', 1], ['第四单元', '小说的人物形象分析', 3], ['综合', '成语的正确使用', 2]],
    math: [['一元二次方程', '配方法与公式法', 2], ['一元二次方程', '根的判别式', 2], ['二次函数', '二次函数的图像与性质', 2], ['二次函数', '二次函数与一元二次方程', 3], ['旋转', '图形的旋转', 1], ['圆', '垂径定理', 2], ['圆', '圆周角定理', 3], ['概率初步', '用列举法求概率', 1]],
    english: [['Unit 1', 'by + 动名词 表示方式', 1], ['Unit 2', '宾语从句（if / whether）', 2], ['Unit 3', '宾语从句（特殊疑问词）', 3], ['Unit 4', 'used to 的用法', 1], ['Unit 5', '一般现在时的被动语态', 2], ['Unit 6', '一般过去时的被动语态', 2]],
    physics: [['内能', '分子热运动', 1], ['内能', '比热容', 2], ['内能的利用', '热机效率', 3], ['电流和电路', '串联和并联电路', 1], ['电压 电阻', '影响电阻大小的因素', 2], ['欧姆定律', '欧姆定律的计算', 3], ['电功率', '电功率的计算', 3]],
    chemistry: [['走进化学世界', '物理变化和化学变化', 1], ['走进化学世界', '常见仪器与基本操作', 1], ['我们周围的空气', '氧气的性质与制取', 2], ['物质构成的奥秘', '元素符号与元素周期表', 1], ['自然界的水', '化学式与化合价', 2], ['化学方程式', '质量守恒定律', 2], ['化学方程式', '化学方程式的书写与配平', 3], ['化学方程式', '根据化学方程式的简单计算', 3]],
  },
};

// 2.1：知识点之间的组合关系（教师维护，系统和 AI 可建议）。[知识点A, 知识点B, 组合方式]
const COMBO_SEED = [
  ['math-P3-8', 'math-P3-7', '求周长时要用多位数乘一位数计算'],
  ['math-P3-6', 'math-P3-7', '求一个数的几倍，用乘法计算'],
  ['math-P3-1', 'math-P3-3', '先换算时间单位，再口算比较'],
  ['math-P3-4', 'math-P3-5', '先统一长度单位，再笔算加减'],
  ['math-P3-4', 'math-P3-8', '先统一长度单位，再求周长'],
  ['math-P3-6', 'math-P3-5', '先求几倍，再求和或差'],
  ['math-P3-8', 'math-P3-5', '求出周长后，再求剩余或相差多少'],
  ['english-P3-2', 'english-P3-7', '对话中先问候，再询问年龄'],
  ['english-P3-2', 'english-P3-1', '对话中用到文具单词（单词作为成分，不计掌握度）'],
  ['english-P3-12', 'english-P3-13', '先数一数，再说颜色'],
  ['english-P3-8', 'english-P3-9', '认识新朋友后介绍家人'],
];

// 模拟“联网搜索生成知识点”时返回的候选
const SEARCH_CANDIDATES = {
  'math-P3': [['时、分、秒', '秒的认识与时间计算', 1], ['万以内的加法和减法（一）', '两位数加减两位数（口算）', 1], ['测量', '毫米、分米、千米和吨', 2], ['倍的认识', '求一个数是另一个数的几倍', 2], ['多位数乘一位数', '多位数乘一位数（笔算）', 2], ['长方形和正方形', '长方形和正方形的周长', 2], ['分数的初步认识', '认识几分之一', 1]],
  'math-P4': [['大数的认识', '亿以内数的读写', 1], ['公顷和平方千米', '面积单位换算', 2], ['角的度量', '用量角器量角', 1], ['三位数乘两位数', '三位数乘两位数（笔算）', 2], ['平行四边形和梯形', '平行与垂直', 1], ['除数是两位数的除法', '试商与调商', 3], ['条形统计图', '读条形统计图', 1]],
};

/*
 * 示例题目。band: P 小学 / J 初中。
 * 题型：choice 单选、judge 判断、listen 听音选择、fill 填空、order 排序、steps 分步解答、twotier 两段式选择、balance 方程式配平
 */
const QUESTIONS = [
  // ================= 2.1：三年级题库（题目与知识点逐一对应）=================
  // kps：这道题考查的全部知识点；level：1 基础 2 变式 3 组合两个 4 组合三个；
  // 分步题每一步、填空题每一空用 kp 标出考查的知识点；选择题 diag 标出错误选项对应的错误原因
  // ---- 数学 · 三年级
  { id: 'm3a', subject: 'math', stage: 'P3', kps: ['math-P3-1'], level: 1, type: 'fill', stem: '填一填：', blanks: [{ pre: '1 分 =', suf: '秒', ans: ['60'] }], hints: ['秒针走一圈是多少秒？', '秒针走一圈，分针走一小格，就是 1 分。'], explain: '1 分 = 60 秒。', answerText: '60' },
  { id: 'm3b', subject: 'math', stage: 'P3', kps: ['math-P3-1'], level: 1, type: 'choice', stem: '小明跑 50 米大约用了 9 ____。', options: ['时', '分', '秒'], answer: 2, diag: { 0: '9 时是一整个上午那么长', 1: '9 分可以走很远，跑 50 米用不了这么久' }, hints: ['想一想跑 50 米需要多久，是一眨眼还是很久？', '时间很短，用最小的单位。'], explain: '跑 50 米只要几秒钟，填“秒”。', answerText: 'C. 秒' },
  { id: 'm3c', subject: 'math', stage: 'P3', kps: ['math-P3-1'], level: 2, type: 'fill', stem: '换算（变式）：', blanks: [{ pre: '2 分 15 秒 =', suf: '秒', ans: ['135'] }], hints: ['先算 2 分是多少秒。', '2 分 = 120 秒，再加上 15 秒。'], explain: '2 分 = 120 秒，120 + 15 = 135（秒）。', answerText: '135' },
  { id: 'm3d', subject: 'math', stage: 'P3', kps: ['math-P3-2'], level: 1, type: 'fill', stem: '从 8:00 到 8:45，经过了多长时间？', blanks: [{ pre: '经过了', suf: '分', ans: ['45'] }], hints: ['都是 8 时，只看分。', '45 − 0 = ?'], explain: '8:45 − 8:00 = 45 分。', answerText: '45 分' },
  { id: 'm3e', subject: 'math', stage: 'P3', kps: ['math-P3-2'], level: 2, type: 'fill', stem: '一场电影 14:30 开始，16:10 结束。这场电影放映了多少分？', blanks: [{ pre: '放映了', suf: '分', ans: ['100'] }], hints: ['先算 14:30 到 16:00，再算 16:00 到 16:10。', '14:30 到 16:00 是 1 时 30 分 = 90 分。'], explain: '14:30 → 16:00 是 90 分，16:00 → 16:10 是 10 分，一共 100 分（1 时 40 分）。', answerText: '100 分' },
  { id: 'm3f', subject: 'math', stage: 'P3', kps: ['math-P3-3'], level: 1, type: 'fill', stem: '口算：', blanks: [{ pre: '46 + 38 =', ans: ['84'] }], hints: ['先算 46 + 30，再加 8。', '76 + 8 = ?'], explain: '46 + 30 = 76，76 + 8 = 84。', answerText: '84' },
  { id: 'm3g', subject: 'math', stage: 'P3', kps: ['math-P3-3'], level: 1, type: 'fill', stem: '口算：', blanks: [{ pre: '72 − 27 =', ans: ['45'] }], hints: ['先算 72 − 20，再减 7。', '52 − 7 = ?'], explain: '72 − 20 = 52，52 − 7 = 45。', answerText: '45' },
  { id: 'm3h', subject: 'math', stage: 'P3', kps: ['math-P3-3'], level: 2, type: 'fill', stem: '在 □ 里填数（变式：逆着想）：', blanks: [{ pre: '□ + 37 = 82，□ =', ans: ['45'] }], hints: ['求一个加数，用和减去另一个加数。', '82 − 37 = ?'], explain: '□ = 82 − 37 = 45。', answerText: '45' },
  { id: 'm3i', subject: 'math', stage: 'P3', kps: ['math-P3-4'], level: 1, type: 'choice', stem: '一枚 1 元硬币厚约 2 ____。', options: ['毫米', '厘米', '分米', '米'], answer: 0, diag: { 1: '2 厘米差不多有一节手指那么长', 2: '2 分米比铅笔还长' }, hints: ['硬币很薄。', '最小的长度单位是哪个？'], explain: '硬币很薄，厚约 2 毫米。', answerText: 'A. 毫米' },
  { id: 'm3j', subject: 'math', stage: 'P3', kps: ['math-P3-4'], level: 1, type: 'fill', stem: '填一填：', blanks: [{ pre: '1 千米 =', suf: '米', ans: ['1000'] }], hints: ['千米也叫公里。', '1 千米 = 1000 米。'], explain: '1 千米 = 1000 米。', answerText: '1000' },
  { id: 'm3k', subject: 'math', stage: 'P3', kps: ['math-P3-4'], level: 2, type: 'choice', stem: '比较大小（变式）：5 分米 ○ 45 厘米', options: ['>', '<', '='], answer: 0, diag: { 1: '只比较了 5 和 45，没有先统一单位' }, hints: ['单位不同，先统一单位再比较。', '5 分米 = 50 厘米。'], explain: '5 分米 = 50 厘米，50 厘米 > 45 厘米。', answerText: 'A. >' },
  { id: 'm3l', subject: 'math', stage: 'P3', kps: ['math-P3-5'], level: 1, type: 'fill', stem: '用竖式计算：', blanks: [{ pre: '365 + 278 =', ans: ['643'] }], hints: ['从个位加起，满十向前一位进 1。', '个位 5 + 8 = 13，写 3 进 1。'], explain: '365 + 278 = 643（个位、十位都要进位）。', answerText: '643' },
  { id: 'm3m', subject: 'math', stage: 'P3', kps: ['math-P3-5'], level: 1, type: 'fill', stem: '用竖式计算：', blanks: [{ pre: '602 − 357 =', ans: ['245'] }], hints: ['个位 2 不够减 7，要向十位借，但十位是 0。', '先从百位借 1 到十位，十位再借 1 到个位。'], explain: '602 − 357 = 245（中间有 0 的连续退位）。', answerText: '245' },
  { id: 'm3n', subject: 'math', stage: 'P3', kps: ['math-P3-5'], level: 2, type: 'judge', stem: '判断（变式）：要检查 500 − 263 = 237 算得对不对，可以算 237 + 263 是否等于 500。', options: ['对', '错'], answer: 0, hints: ['差 + 减数 = ?', '减法可以用加法验算。'], explain: '差 + 减数 = 被减数，所以可以用 237 + 263 = 500 验算。', answerText: '对' },
  { id: 'm3o', subject: 'math', stage: 'P3', kps: ['math-P3-6'], level: 1, type: 'fill', stem: '红花有 3 朵，黄花有 12 朵。', blanks: [{ pre: '黄花的朵数是红花的', suf: '倍', ans: ['4'] }], hints: ['12 里面有几个 3？', '12 ÷ 3 = ?'], explain: '12 ÷ 3 = 4，黄花是红花的 4 倍。', answerText: '4' },
  { id: 'm3p', subject: 'math', stage: 'P3', kps: ['math-P3-6'], level: 1, type: 'choice', stem: '求 24 是 6 的几倍，列式是', options: ['24 − 6', '24 ÷ 6', '24 × 6'], answer: 1, diag: { 0: '把“几倍”当成了“多几”', 2: '求“是几倍”要看 24 里有几个 6，用除法' }, hints: ['24 里面有几个 6？', '求一个数是另一个数的几倍，用除法。'], explain: '求 24 是 6 的几倍，就是求 24 里面有几个 6：24 ÷ 6 = 4。', answerText: 'B. 24 ÷ 6' },
  { id: 'm3q', subject: 'math', stage: 'P3', kps: ['math-P3-6'], level: 2, type: 'fill', stem: '小明有 8 本书，小红的书是小明的 3 倍。（变式：求一个数的几倍是多少）', blanks: [{ pre: '小红有', suf: '本', ans: ['24'] }], hints: ['3 倍就是 3 个 8。', '8 × 3 = ?'], explain: '8 × 3 = 24（本）。', answerText: '24' },
  { id: 'm3r', subject: 'math', stage: 'P3', kps: ['math-P3-7'], level: 1, type: 'fill', stem: '用竖式计算：', blanks: [{ pre: '214 × 3 =', ans: ['642'] }], hints: ['用 3 依次乘个位、十位、百位。', '4 × 3 = 12，写 2 进 1。'], explain: '214 × 3 = 642。', answerText: '642' },
  { id: 'm3s', subject: 'math', stage: 'P3', kps: ['math-P3-7'], level: 1, type: 'fill', stem: '用竖式计算：', blanks: [{ pre: '58 × 6 =', ans: ['348'] }], hints: ['8 × 6 = 48，写 8 进 4。', '5 × 6 = 30，再加上进的 4。'], explain: '58 × 6 = 348。', answerText: '348' },
  { id: 'm3t', subject: 'math', stage: 'P3', kps: ['math-P3-7'], level: 2, type: 'choice', stem: '估算（变式）：398 × 5 的积大约是', options: ['200', '2000', '20000'], answer: 1, diag: { 0: '398 接近 400，不是 40', 2: '多写了一个 0' }, hints: ['398 接近几百？', '400 × 5 = ?'], explain: '398 ≈ 400，400 × 5 = 2000。', answerText: 'B. 2000' },
  { id: 'm3u', subject: 'math', stage: 'P3', kps: ['math-P3-8'], level: 1, type: 'choice', stem: '长方形长 8 厘米、宽 5 厘米，它的周长是', options: ['13 厘米', '26 厘米', '40 厘米', '21 厘米'], answer: 1, diag: { 0: '只算了一条长加一条宽，忘了乘 2', 2: '算成了 8 × 5，这不是周长', 3: '长算了两次，宽只算了一次' }, hints: ['周长是围成图形一周的长度，长方形有 4 条边。', '(长 + 宽) × 2。'], explain: '(8 + 5) × 2 = 26（厘米）。', answerText: 'B. 26 厘米' },
  { id: 'm3v', subject: 'math', stage: 'P3', kps: ['math-P3-8'], level: 1, type: 'fill', stem: '正方形边长 7 分米。', blanks: [{ pre: '周长是', suf: '分米', ans: ['28'] }], hints: ['正方形 4 条边一样长。', '7 × 4 = ?'], explain: '7 × 4 = 28（分米）。', answerText: '28' },
  { id: 'm3w', subject: 'math', stage: 'P3', kps: ['math-P3-8'], level: 2, type: 'fill', stem: '一个正方形的周长是 36 厘米。（变式：已知周长求边长）', blanks: [{ pre: '它的边长是', suf: '厘米', ans: ['9'] }], hints: ['周长是 4 条边的和。', '36 ÷ 4 = ?'], explain: '36 ÷ 4 = 9（厘米）。', answerText: '9' },
  { id: 'm3x', subject: 'math', stage: 'P3', kps: ['math-P3-9'], level: 1, type: 'choice', stem: '把一个蛋糕平均分成 4 份，1 份是这个蛋糕的', options: ['二分之一', '四分之一', '四分之三'], answer: 1, hints: ['平均分成几份，分母就是几。', '取了 1 份，分子是 1。'], explain: '平均分成 4 份，1 份是它的四分之一（1/4）。', answerText: 'B. 四分之一' },
  { id: 'm3y', subject: 'math', stage: 'P3', kps: ['math-P3-9'], level: 1, type: 'fill', stem: '把一张纸平均分成 8 份，涂色 3 份。（分数写成 3/5 这样的形式）', blanks: [{ pre: '涂色部分是这张纸的', ans: ['3/8', '八分之三'] }], hints: ['分成 8 份，分母是 8。', '涂了 3 份，分子是 3。'], explain: '涂色部分是这张纸的 3/8。', answerText: '3/8' },
  { id: 'm3z', subject: 'math', stage: 'P3', kps: ['math-P3-9'], level: 2, type: 'choice', stem: '比较大小（变式）：1/3 ○ 1/5', options: ['>', '<', '='], answer: 0, diag: { 1: '只看了 3 比 5 小。分子都是 1 时，分母越大，每份越小' }, hints: ['同一个饼，分成 3 份和分成 5 份，哪一份大？', '分子相同，分母越小，分数越大。'], explain: '分子都是 1，分母越小每一份越大，所以 1/3 > 1/5。', answerText: 'A. >' },
  { id: 'm3aa', subject: 'math', stage: 'P3', kps: ['math-P3-10'], level: 1, type: 'fill', stem: '参加跳绳的有 8 人，参加踢毽子的有 6 人，两项都参加的有 3 人。', blanks: [{ pre: '参加这两项活动的一共有', suf: '人', ans: ['11'] }], hints: ['两项都参加的 3 人被数了两次。', '8 + 6 − 3 = ?'], explain: '8 + 6 = 14，其中 3 人被重复计算，14 − 3 = 11（人）。', answerText: '11' },
  { id: 'm3ab', subject: 'math', stage: 'P3', kps: ['math-P3-10'], level: 2, type: 'fill', stem: '三（1）班有 30 人，喜欢语文的有 18 人，喜欢数学的有 20 人，每人至少喜欢一科。（变式：求重叠部分）', blanks: [{ pre: '两科都喜欢的有', suf: '人', ans: ['8'] }], hints: ['18 + 20 比全班人数多出来的，就是重复数的人。', '18 + 20 − 30 = ?'], explain: '18 + 20 = 38，38 − 30 = 8（人）。', answerText: '8' },
  // ---- 数学 · 三年级 · 组合题（每一步考一个知识点）
  { id: 'm3c1', subject: 'math', stage: 'P3', kps: ['math-P3-8', 'math-P3-7'], level: 3, type: 'steps', stem: '学校有一块正方形草坪，边长 125 米。小明绕草坪跑一圈，跑了多少米？', steps: [{ label: '列式', kp: 'math-P3-8', kind: 'choice', options: ['125 × 4', '125 × 2', '125 + 4'], answer: 0, show: '正方形周长 = 边长 × 4：125 × 4' }, { label: '计算', kp: 'math-P3-7', kind: 'fill', pre: '跑一圈的长度 =', suf: '米', answer: ['500'], show: '125 × 4 = 500（米）' }], hints: ['跑一圈就是求正方形的周长。', '125 × 4：个位 5 × 4 = 20，写 0 进 2。'], explain: '跑一圈的长度 = 正方形周长 = 125 × 4 = 500（米）。', answerText: '125 × 4 = 500，跑了 500 米' },
  { id: 'm3c2', subject: 'math', stage: 'P3', kps: ['math-P3-6', 'math-P3-7'], level: 3, type: 'steps', stem: '果园里有梨树 36 棵，苹果树的棵数是梨树的 4 倍。苹果树有多少棵？', steps: [{ label: '列式', kp: 'math-P3-6', kind: 'choice', options: ['36 × 4', '36 ÷ 4', '36 + 4'], answer: 0, show: '求 36 的 4 倍：36 × 4' }, { label: '计算', kp: 'math-P3-7', kind: 'fill', pre: '苹果树有', suf: '棵', answer: ['144'], show: '36 × 4 = 144（棵）' }], hints: ['“是梨树的 4 倍”就是 4 个 36。', '6 × 4 = 24，写 4 进 2；3 × 4 = 12，再加 2。'], explain: '36 × 4 = 144（棵）。', answerText: '36 × 4 = 144，苹果树有 144 棵' },
  { id: 'm3c3', subject: 'math', stage: 'P3', kps: ['math-P3-1', 'math-P3-3'], level: 3, type: 'steps', stem: '跳绳比赛，小明用了 1 分 20 秒，小刚用了 95 秒。谁用的时间短？短多少秒？', steps: [{ label: '统一单位', kp: 'math-P3-1', kind: 'fill', pre: '1 分 20 秒 =', suf: '秒', answer: ['80'], show: '1 分 20 秒 = 60 秒 + 20 秒 = 80 秒' }, { label: '计算相差', kp: 'math-P3-3', kind: 'fill', pre: '两人相差', suf: '秒', answer: ['15'], show: '95 − 80 = 15（秒）' }, { label: '得出结论', kp: null, kind: 'choice', options: ['小明用的时间短', '小刚用的时间短'], answer: 0, show: '80 秒 < 95 秒，小明用的时间短' }], hints: ['两个时间单位不一样，先都换成秒。', '时间越短，跳得越快。'], explain: '1 分 20 秒 = 80 秒，80 < 95，小明用的时间短，短 95 − 80 = 15（秒）。', answerText: '小明用的时间短，短 15 秒' },
  { id: 'm3c4', subject: 'math', stage: 'P3', kps: ['math-P3-4', 'math-P3-5'], level: 3, type: 'steps', stem: '一条公路长 2 千米，已经修好了 865 米。还剩多少米没修？', steps: [{ label: '统一单位', kp: 'math-P3-4', kind: 'fill', pre: '2 千米 =', suf: '米', answer: ['2000'], show: '2 千米 = 2000 米' }, { label: '计算', kp: 'math-P3-5', kind: 'fill', pre: '还剩', suf: '米', answer: ['1135'], show: '2000 − 865 = 1135（米）' }], hints: ['千米和米不能直接相减，先换算。', '2000 − 865：连续退位，从千位借起。'], explain: '2 千米 = 2000 米，2000 − 865 = 1135（米）。', answerText: '还剩 1135 米' },
  { id: 'm3c5', subject: 'math', stage: 'P3', kps: ['math-P3-4', 'math-P3-8'], level: 3, type: 'steps', stem: '一个长方形相框，长 3 分米，宽 18 厘米。它的周长是多少厘米？', steps: [{ label: '统一单位', kp: 'math-P3-4', kind: 'fill', pre: '3 分米 =', suf: '厘米', answer: ['30'], show: '3 分米 = 30 厘米' }, { label: '求周长', kp: 'math-P3-8', kind: 'fill', pre: '周长 =', suf: '厘米', answer: ['96'], show: '(30 + 18) × 2 = 96（厘米）' }], hints: ['长和宽的单位不同，先统一成厘米。', '长方形周长 = (长 + 宽) × 2。'], explain: '3 分米 = 30 厘米，(30 + 18) × 2 = 96（厘米）。', answerText: '96 厘米' },
  { id: 'm3c6', subject: 'math', stage: 'P3', kps: ['math-P3-8', 'math-P3-7'], level: 3, type: 'choice', stem: '用一根铁丝正好围成一个边长 26 厘米的正方形。这根铁丝长多少厘米？', options: ['104 厘米', '52 厘米', '30 厘米', '84 厘米'], answer: 0, diag: { 1: { kp: 'math-P3-8', t: '只算了两条边，正方形有 4 条边' }, 2: { kp: 'math-P3-8', t: '把边长和 4 相加了，周长要用乘法' }, 3: { kp: 'math-P3-7', t: '26 × 4 算错了：6 × 4 = 24，要向十位进 2' } }, hints: ['铁丝的长度就是正方形的周长。', '26 × 4，注意进位。'], explain: '铁丝长 = 正方形周长 = 26 × 4 = 104（厘米）。', answerText: 'A. 104 厘米' },
  { id: 'm3c7', subject: 'math', stage: 'P3', kps: ['math-P3-4', 'math-P3-8', 'math-P3-5'], level: 4, type: 'steps', stem: '用一根 2 米长的彩带，给一个长 35 厘米、宽 25 厘米的长方形贺卡围一圈花边。还剩多少厘米彩带？', steps: [{ label: '统一单位', kp: 'math-P3-4', kind: 'fill', pre: '2 米 =', suf: '厘米', answer: ['200'], show: '2 米 = 200 厘米' }, { label: '求周长', kp: 'math-P3-8', kind: 'fill', pre: '贺卡的周长 =', suf: '厘米', answer: ['120'], show: '(35 + 25) × 2 = 120（厘米）' }, { label: '求剩余', kp: 'math-P3-5', kind: 'fill', pre: '还剩', suf: '厘米', answer: ['80'], show: '200 − 120 = 80（厘米）' }], hints: ['围一圈用掉的彩带 = 长方形的周长。', '剩下的 = 彩带总长 − 用掉的。'], explain: '2 米 = 200 厘米；周长 (35 + 25) × 2 = 120 厘米；200 − 120 = 80（厘米）。', answerText: '还剩 80 厘米' },
  { id: 'm3c8', subject: 'math', stage: 'P3', kps: ['math-P3-6', 'math-P3-7', 'math-P3-5'], level: 4, type: 'steps', stem: '养殖场有鸡 135 只，鸭的只数是鸡的 3 倍。鸡和鸭一共有多少只？', steps: [{ label: '列式求鸭', kp: 'math-P3-6', kind: 'choice', options: ['135 × 3', '135 ÷ 3', '135 + 3'], answer: 0, show: '鸭：135 × 3' }, { label: '计算鸭的只数', kp: 'math-P3-7', kind: 'fill', pre: '鸭有', suf: '只', answer: ['405'], show: '135 × 3 = 405（只）' }, { label: '求一共', kp: 'math-P3-5', kind: 'fill', pre: '鸡和鸭一共有', suf: '只', answer: ['540'], show: '405 + 135 = 540（只）' }], hints: ['先求鸭有多少只，再求一共。', '一共 = 鸭 + 鸡。'], explain: '鸭：135 × 3 = 405（只）；一共：405 + 135 = 540（只）。', answerText: '一共 540 只' },
  // ---- 语文 · 三年级（语文小学中年级综合上限为 1：只有基础和变式两级，综合能力通过阅读表达型练习）
  { id: 'c3a', subject: 'chinese', stage: 'P3', kps: ['chinese-P3-3'], level: 1, type: 'choice', stem: '“小鸟在树上欢快地唱歌，好像在开音乐会。”句中“欢快”的意思是', options: ['欢乐而轻快', '飞得很快', '伤心难过'], answer: 0, hints: ['小鸟在开音乐会，心情怎么样？', '“欢”是高兴，“快”在这里是轻快。'], explain: '“欢快”是欢乐而轻快的意思。', answerText: 'A. 欢乐而轻快' },
  { id: 'c3b', subject: 'chinese', stage: 'P3', kps: ['chinese-P3-3'], level: 1, type: 'choice', stem: '“天空灰蒙蒙的，一会儿就下起了小雨。”“灰蒙蒙”是什么样子？', options: ['阳光明亮', '昏暗、看不清楚', '五颜六色'], answer: 1, hints: ['后面说一会儿就下雨了。', '下雨前天空是什么颜色？'], explain: '快下雨时天空昏暗，看不清楚，就是“灰蒙蒙”。', answerText: 'B. 昏暗、看不清楚' },
  { id: 'c3c', subject: 'chinese', stage: 'P3', kps: ['chinese-P3-3'], level: 2, type: 'choice', stem: '“这道题他想了很久，听了老师的提示，终于恍然大悟。”根据上下文，“恍然大悟”的意思是', options: ['一下子明白过来', '突然睡着了', '非常着急'], answer: 0, hints: ['前面“想了很久”，后面“终于”怎么样了？', '听了提示后，他明白了没有？'], explain: '“想了很久……终于”说明他一下子明白了。', answerText: 'A. 一下子明白过来' },
  { id: 'c3d', subject: 'chinese', stage: 'P3', kps: ['chinese-P3-7'], level: 1, type: 'choice', stem: '下面哪个是 ABB 式词语？', options: ['红彤彤', '高高兴兴', '又大又圆'], answer: 0, hints: ['ABB：第一个字不同，后两个字一样。', '红 + 彤彤。'], explain: '“红彤彤”是 ABB 式；“高高兴兴”是 AABB 式。', answerText: 'A. 红彤彤' },
  { id: 'c3e', subject: 'chinese', stage: 'P3', kps: ['chinese-P3-7'], level: 1, type: 'fill', stem: '照样子写词语：绿油油', blanks: [{ pre: '白', ans: ['花花', '茫茫', '晃晃', '生生', '嫩嫩', '胖胖'] }], hints: ['后面两个字要一样。', '白（ ）（ ）：白花花的银子、白茫茫的大雪。'], explain: '可以填：白花花、白茫茫、白晃晃、白嫩嫩等。', answerText: '花花（或茫茫、晃晃等）' },
  { id: 'c3f', subject: 'chinese', stage: 'P3', kps: ['chinese-P3-7'], level: 2, type: 'choice', stem: '选词填空（变式）：小朋友们 ____ 地走进教室。', options: ['高高兴兴', '红彤彤', '亮晶晶'], answer: 0, diag: { 1: '“红彤彤”写颜色，不能修饰“走”', 2: '“亮晶晶”写光亮，不能修饰“走”' }, hints: ['“走进教室”前面要填写人的心情的词。', '哪个词能写人的心情？'], explain: '写人走路时的心情，用“高高兴兴”。', answerText: 'A. 高高兴兴' },
  { id: 'c3g', subject: 'chinese', stage: 'P3', kps: ['chinese-P3-8'], level: 1, type: 'choice', stem: '“弯弯的月亮像小船。”这是', options: ['比喻句', '拟人句', '都不是'], answer: 0, hints: ['把月亮比作了什么？', '把一种东西比作另一种样子相像的东西，是比喻。'], explain: '把弯弯的月亮比作小船，是比喻句。', answerText: 'A. 比喻句' },
  { id: 'c3h', subject: 'chinese', stage: 'P3', kps: ['chinese-P3-8'], level: 1, type: 'choice', stem: '“小草从地下探出头来。”这是', options: ['比喻句', '拟人句'], answer: 1, hints: ['“探出头来”是谁才会做的动作？', '把东西当作人来写，是拟人。'], explain: '小草像人一样“探出头来”，是拟人句。', answerText: 'B. 拟人句' },
  { id: 'c3i', subject: 'chinese', stage: 'P3', kps: ['chinese-P3-8'], level: 2, type: 'choice', stem: '下面哪一句是比喻句？（变式：有“像”字不一定是比喻）', options: ['他长得像爸爸。', '天上的白云像一团团棉花。', '他好像在哪儿见过我。'], answer: 1, diag: { 0: '他和爸爸是同一类（都是人），这是比较，不是比喻', 2: '“好像”表示猜测，不是比喻' }, hints: ['比喻要把一种东西比作另一种不同的东西。', '白云和棉花是不同的东西，但样子很像。'], explain: '把白云比作棉花才是比喻；A 是比较，C 是猜测。', answerText: 'B' },
  { id: 'c3j', subject: 'chinese', stage: 'P3', kps: ['chinese-P3-9'], level: 1, type: 'choice', stem: '老师说（　）“同学们，上课了。”括号里应该填', options: ['：', '，', '。'], answer: 0, hints: ['后面是老师说的话。', '提示下面要说话了，用什么标点？'], explain: '“说”后面引出人物说的话，用冒号。', answerText: 'A. ：' },
  { id: 'c3k', subject: 'chinese', stage: 'P3', kps: ['chinese-P3-9'], level: 1, type: 'judge', stem: '判断：引号可以用来表示人物说的话。', options: ['对', '错'], answer: 0, hints: ['想想课文里人物说话是怎么写的。', '“……”'], explain: '人物说的话要放在引号里。', answerText: '对' },
  { id: 'c3l', subject: 'chinese', stage: 'P3', kps: ['chinese-P3-9'], level: 2, type: 'choice', stem: '下面标点使用正确的一句是（变式）', options: ['妈妈说：“快来吃饭吧！”', '妈妈说“快来吃饭吧！”', '妈妈说：快来吃饭吧！”'], answer: 0, diag: { 1: '“说”后面少了冒号', 2: '少了前引号' }, hints: ['冒号、前引号、后引号都要有。', '逐一检查三个标点。'], explain: '“说”后用冒号，说的话放在一对引号里。', answerText: 'A' },
  // ---- 英语 · 三年级 · 人教PEP（2012 旧版）
  { id: 'e3a', subject: 'english', stage: 'P3', book: 'en-pep12', kps: ['english-P3-2'], level: 1, type: 'choice', stem: "— Hello! I'm Sarah.<br>— ____", options: ["Hi, I'm Mike.", 'Goodbye.', 'Thank you.'], answer: 0, hints: ['别人向你打招呼并介绍自己，你也要……', '用 Hi 回应，再说出自己的名字。'], explain: "别人说 Hello，要回应 Hi，并介绍自己 I'm…", answerText: "A. Hi, I'm Mike." },
  { id: 'e3b', subject: 'english', stage: 'P3', book: 'en-pep12', kps: ['english-P3-2'], level: 1, type: 'choice', stem: '放学了，和老师告别，你说：', options: ['Hello!', 'Goodbye!', 'Thank you!'], answer: 1, hints: ['告别时说什么？', '“再见”的英语。'], explain: '告别说 Goodbye!', answerText: 'B. Goodbye!' },
  { id: 'e3c', subject: 'english', stage: 'P3', book: 'en-pep12', kps: ['english-P3-2'], level: 2, type: 'listen', speak: "What's your name?", stem: '听一听，选出合适的回答。（变式：听问句选答语）', options: ["My name's Chen Jie.", "I'm fine.", 'Goodbye.'], answer: 0, hints: ['再听一遍，问的是 name。', "What's your name? 问的是名字。"], explain: "What's your name? 问名字，回答 My name's…", answerText: "A. My name's Chen Jie." },
  { id: 'e3d', subject: 'english', stage: 'P3', book: 'en-pep12', kps: ['english-P3-6'], level: 1, type: 'choice', stem: '— Have some bread.<br>— ____', options: ['Thank you.', 'Goodbye.', "I'm Mike."], answer: 0, words: ['bread'], hints: ['别人请你吃东西，要有礼貌。', '说“谢谢”。'], explain: '别人请你吃东西，回答 Thank you.', answerText: 'A. Thank you.' },
  { id: 'e3e', subject: 'english', stage: 'P3', book: 'en-pep12', kps: ['english-P3-6'], level: 1, type: 'choice', stem: "— I'd like some ____.（我想要一些果汁。）", options: ['juice', 'bread', 'egg'], answer: 0, words: ['juice'], hints: ['果汁是喝的。', 'j 开头。'], explain: '果汁：juice。', answerText: 'A. juice' },
  { id: 'e3f', subject: 'english', stage: 'P3', book: 'en-pep12', kps: ['english-P3-6'], level: 2, type: 'order', stem: '连词成句（变式）：', tokens: ["I'd", 'like', 'some', 'milk', '.'], answer: ["I'd", 'like', 'some', 'milk', '.'], hints: ["先放 I'd。", "I'd like some + 食物。"], explain: "I'd like some milk.（我想要一些牛奶。）", answerText: "I'd like some milk." },
  { id: 'e3g', subject: 'english', stage: 'P3', book: 'en-pep12', kps: ['english-P3-7'], level: 1, type: 'choice', stem: '— How old are you?<br>— ____', options: ["I'm nine.", "I'm fine.", "I'm Mike."], answer: 0, diag: { 1: "I'm fine 回答的是 How are you?", 2: "I'm Mike 回答的是名字" }, hints: ['How old 问的是年龄。', '用数字回答。'], explain: "How old are you? 问年龄，回答 I'm + 数字。", answerText: "A. I'm nine." },
  { id: 'e3h', subject: 'english', stage: 'P3', book: 'en-pep12', kps: ['english-P3-7'], level: 1, type: 'listen', speak: 'seven', stem: '听一听，选出你听到的数字。', options: ['five', 'seven', 'nine'], answer: 1, words: ['seven'], hints: ['再听一遍，开头是 /s/。', '一共有两个音节：se-ven。'], explain: '听到的是 seven（7）。', answerText: 'B. seven' },
  { id: 'e3i', subject: 'english', stage: 'P3', book: 'en-pep12', kps: ['english-P3-7'], level: 2, type: 'fill', stem: '算一算，用英文单词写出答案（变式）：', blanks: [{ pre: '3 + 4 =', ans: ['seven'] }], words: ['seven'], hints: ['先算出得数。', '7 的英文：s-e-v-e-n。'], explain: '3 + 4 = 7，seven。', answerText: 'seven' },
  { id: 'e3c1', subject: 'english', stage: 'P3', book: 'en-pep12', kps: ['english-P3-2', 'english-P3-7'], level: 3, type: 'fill', stem: "补全对话（每个空考一个知识点）：<br>A: Hello! I'm Wu Binbin. What's your name?<br>B: ① ____ Sarah.<br>A: How old are you?<br>B: I'm ② ____ .（9 岁）", blanks: [{ pre: '①', kp: 'english-P3-2', ans: ["I'm", "My name's", 'My name is'] }, { pre: '②', kp: 'english-P3-7', ans: ['nine'] }], words: ['nine'], hints: ["① 介绍自己的名字：I'm… 或 My name's…", '② 9 的英文是 n-i-n-e。'], explain: "① I'm / My name's Sarah. ② I'm nine.", answerText: "① I'm（或 My name's）② nine" },
  { id: 'e3c2', subject: 'english', stage: 'P3', book: 'en-pep12', kps: ['english-P3-2', 'english-P3-1'], level: 3, type: 'fill', stem: "补全对话：<br>A: Hello, I'm Amy.<br>B: ① ____ , I'm Zoom.<br>A: Look! I have a ② ____ .（尺子）", blanks: [{ pre: '①', kp: 'english-P3-2', ans: ['Hi', 'Hello'] }, { pre: '②', kp: 'english-P3-1', ans: ['ruler'] }], words: ['ruler'], hints: ['① 回应别人的问候。', '② 尺子：r-u-l-e-r。'], explain: "① Hi / Hello ② ruler。第 ② 空用到的是记忆型知识点（单词），答错会加入单词本，不计掌握度。", answerText: '① Hi（或 Hello）② ruler' },
  // ---- 英语 · 三年级 · 人教PEP（2024 新版）
  { id: 'e3j', subject: 'english', stage: 'P3', book: 'en-pep24', kps: ['english-P3-8'], level: 1, type: 'choice', stem: "— Hello! I'm Sam. Nice to meet you.<br>— ____", options: ['Nice to meet you, too.', 'Thank you.', 'Goodbye.'], answer: 0, hints: ['第一次见面，对方说很高兴认识你。', '回答时加上 too（也）。'], explain: 'Nice to meet you. 的回答是 Nice to meet you, too.', answerText: 'A. Nice to meet you, too.' },
  { id: 'e3k', subject: 'english', stage: 'P3', book: 'en-pep24', kps: ['english-P3-8'], level: 2, type: 'order', stem: '连词成句（变式）：', tokens: ['Nice', 'to', 'meet', 'you', '.'], answer: ['Nice', 'to', 'meet', 'you', '.'], hints: ['大写字母开头的词放最前面。', 'Nice to meet you.'], explain: 'Nice to meet you.（很高兴认识你。）', answerText: 'Nice to meet you.' },
  { id: 'e3l', subject: 'english', stage: 'P3', book: 'en-pep24', kps: ['english-P3-9'], level: 1, type: 'choice', stem: '向朋友介绍你的爸爸，你说：', options: ['This is my father.', 'This is my mother.', 'This is my sister.'], answer: 0, words: ['father'], hints: ['爸爸的英文是什么？', 'father = 爸爸。'], explain: '介绍爸爸：This is my father.', answerText: 'A. This is my father.' },
  { id: 'e3m', subject: 'english', stage: 'P3', book: 'en-pep24', kps: ['english-P3-9'], level: 2, type: 'choice', stem: '— Who is she?<br>— ____（变式）', options: ["She's my mother.", "He's my father.", "I'm fine."], answer: 0, diag: { 1: 'she 是“她”，要用 She，不用 He' }, hints: ['问的是 she（她）。', '回答也要用 She。'], explain: "问 she，回答 She's my mother.", answerText: "A. She's my mother." },
  { id: 'e3n', subject: 'english', stage: 'P3', book: 'en-pep24', kps: ['english-P3-11'], level: 1, type: 'choice', stem: "— What's this?<br>— ____ a tree.", options: ["It's", "I'm", 'This'], answer: 0, hints: ['问“这是什么”，回答“它是……”。', 'It is 的缩写。'], explain: "What's this? 回答 It's a…", answerText: "A. It's" },
  { id: 'e3o', subject: 'english', stage: 'P3', book: 'en-pep24', kps: ['english-P3-12'], level: 1, type: 'choice', stem: '— What colour is it?<br>— ____', options: ["It's red.", "It's a cat.", "I'm nine."], answer: 0, hints: ['问的是颜色。', '用颜色词回答。'], explain: "What colour is it? 回答 It's + 颜色。", answerText: "A. It's red." },
  { id: 'e3p', subject: 'english', stage: 'P3', book: 'en-pep24', kps: ['english-P3-12'], level: 1, type: 'listen', speak: 'yellow', stem: '听一听，选出你听到的颜色。', options: ['yellow', 'blue', 'green'], answer: 0, words: ['yellow'], hints: ['再听一遍，开头是 /j/。', '香蕉是这个颜色。'], explain: '听到的是 yellow（黄色）。', answerText: 'A. yellow' },
  { id: 'e3q', subject: 'english', stage: 'P3', book: 'en-pep24', kps: ['english-P3-13'], level: 1, type: 'choice', stem: '— How many birds?<br>— ____', options: ['Seven.', "It's red.", 'Nice to meet you.'], answer: 0, hints: ['How many 问数量。', '用数字回答。'], explain: 'How many…? 问数量，用数字回答。', answerText: 'A. Seven.' },
  { id: 'e3r', subject: 'english', stage: 'P3', book: 'en-pep24', kps: ['english-P3-13'], level: 2, type: 'fill', stem: '算一算，用英文单词写出答案（变式）：', blanks: [{ pre: '2 + 8 =', ans: ['ten'] }], words: ['ten'], hints: ['先算出得数。', '10 的英文：t-e-n。'], explain: '2 + 8 = 10，ten。', answerText: 'ten' },
  { id: 'e3c3', subject: 'english', stage: 'P3', book: 'en-pep24', kps: ['english-P3-13', 'english-P3-12'], level: 3, type: 'fill', stem: "看一看：🎈🎈🎈🎈🎈🎈（6 个红气球）<br>A: How many balloons?<br>B: ① ____ .<br>A: What colour are they?<br>B: They're ② ____ .", blanks: [{ pre: '①', kp: 'english-P3-13', ans: ['six', 'Six'] }, { pre: '②', kp: 'english-P3-12', ans: ['red'] }], words: ['six', 'red'], hints: ['① 数一数有几个，用英文写。', '② 红色：r-e-d。'], explain: '① Six. ② red。', answerText: '① six ② red' },
  { id: 'e3c4', subject: 'english', stage: 'P3', book: 'en-pep24', kps: ['english-P3-8', 'english-P3-9'], level: 3, type: 'fill', stem: "补全对话：<br>A: Hi, I'm Lily. Nice to meet you.<br>B: ① ____ , too.<br>A: Who's she?<br>B: She's my ② ____ .（妈妈）", blanks: [{ pre: '①', kp: 'english-P3-8', ans: ['Nice to meet you'] }, { pre: '②', kp: 'english-P3-9', ans: ['mother', 'mum', 'mom'] }], words: ['mother'], hints: ['① 回答 Nice to meet you.', '② 妈妈：mother 或 mum。'], explain: "① Nice to meet you, too. ② She's my mother.", answerText: '① Nice to meet you ② mother' },
  // ---- 数学 · 小学
  { id: 'mp1', subject: 'math', band: 'P', type: 'fill', stem: '用竖式计算：', blanks: [{ pre: '36 × 24 =', ans: ['864'] }], hints: ['先算 36 × 4，再算 36 × 20，最后把两个结果相加。', '36 × 4 = 144，36 × 20 = 720，再检查加法是否进位。'], explain: '36 × 4 = 144，36 × 20 = 720，144 + 720 = 864。', answerText: '864' },
  { id: 'mp2', subject: 'math', band: 'P', type: 'steps', stem: '一块长方形菜地长 36 米、宽 24 米，它的面积是多少平方米？', steps: [{ label: '列式', kind: 'choice', options: ['36 + 24', '36 × 24', '(36 + 24) × 2'], answer: 1, show: '36 × 24' }, { label: '计算', kind: 'fill', pre: '36 × 24 =', answer: ['864'], show: '36 × 24 = 864' }, { label: '作答', kind: 'fill', pre: '面积是', suf: '平方米', answer: ['864'], show: '面积是 864 平方米' }], hints: ['长方形面积 = 长 × 宽。', '注意不是求周长，周长才是 (长 + 宽) × 2。'], explain: '面积 = 长 × 宽 = 36 × 24 = 864（平方米）。', answerText: '36 × 24 = 864，面积是 864 平方米' },
  { id: 'mp3', subject: 'math', band: 'P', type: 'choice', stem: '下面哪个算式的结果最接近 600？', options: ['19 × 31', '29 × 21', '21 × 31', '25 × 26'], answer: 1, hints: ['可以先估算，再精确计算比较。', '19 × 31 = 589，29 × 21 = 609，分别和 600 相差多少？'], explain: '589 与 600 差 11，609 与 600 差 9，651 差 51，650 差 50，所以 29 × 21 最接近。', answerText: 'B. 29 × 21' },
  { id: 'mp4', subject: 'math', band: 'P', type: 'judge', stem: '判断：两个数相乘，积一定比这两个数都大。', options: ['对', '错'], answer: 1, hints: ['试试有 0 或 1 的情况。', '比如 5 × 1 = 5，0.5 × 4 = 2。'], explain: '乘数是 0、1 或小于 1 的小数时，积不一定比两个数都大。', answerText: '错' },
  { id: 'mp5', subject: 'math', band: 'P', type: 'fill', stem: '口算：', blanks: [{ pre: '0.25 × 4 =', ans: ['1', '1.0', '1.00'] }], hints: ['0.25 是四分之一。', '25 × 4 = 100，再看小数点要移几位。'], explain: '0.25 × 4 = 1。', answerText: '1' },
  // ---- 数学 · 初中
  { id: 'mj1', subject: 'math', band: 'J', type: 'fill', stem: '解方程 x² − 5x + 6 = 0（从小到大填写）：', blanks: [{ pre: 'x₁ =', ans: ['2'] }, { pre: 'x₂ =', ans: ['3'] }], hints: ['试试因式分解：找两个数，积为 6、和为 −5。', '(x − 2)(x − 3) = 0。'], explain: '(x − 2)(x − 3) = 0，所以 x₁ = 2，x₂ = 3。', answerText: 'x₁ = 2，x₂ = 3' },
  { id: 'mj2', subject: 'math', band: 'J', type: 'choice', stem: '二次函数 y = (x − 1)² + 2 的顶点坐标是', options: ['(1, 2)', '(−1, 2)', '(1, −2)', '(2, 1)'], answer: 0, hints: ['顶点式 y = a(x − h)² + k 的顶点是 (h, k)。', '注意括号里是减号，h = 1。'], explain: '顶点式 y = a(x − h)² + k 的顶点为 (h, k)，所以是 (1, 2)。', answerText: 'A. (1, 2)' },
  { id: 'mj3', subject: 'math', band: 'J', type: 'judge', stem: '判断：全等三角形的对应角相等。', options: ['对', '错'], answer: 0, hints: ['全等是指能完全重合。', '能完全重合的两个三角形，对应边和对应角都相等。'], explain: '全等三角形的对应边相等，对应角相等。', answerText: '对' },
  { id: 'mj4', subject: 'math', band: 'J', type: 'steps', stem: '用公式法解方程 x² + 2x − 3 = 0。', steps: [{ label: '求判别式', kind: 'fill', pre: 'Δ = b² − 4ac =', answer: ['16'], show: 'Δ = 2² − 4 × 1 × (−3) = 16' }, { label: '求较小的根', kind: 'fill', pre: 'x₁ =', answer: ['-3', '−3'], show: 'x₁ = (−2 − 4) ÷ 2 = −3' }, { label: '求较大的根', kind: 'fill', pre: 'x₂ =', answer: ['1'], show: 'x₂ = (−2 + 4) ÷ 2 = 1' }], hints: ['a = 1，b = 2，c = −3。', '求根公式 x = (−b ± √Δ) ÷ 2a。'], explain: 'Δ = 4 + 12 = 16，x = (−2 ± 4) ÷ 2，x₁ = −3，x₂ = 1。', answerText: 'Δ = 16，x₁ = −3，x₂ = 1' },
  { id: 'mj5', subject: 'math', band: 'J', type: 'fill', stem: '完全平方公式：', blanks: [{ pre: '(a + b)² = a² +', suf: 'ab + b²', ans: ['2'] }], hints: ['(a + b)² = (a + b)(a + b)，展开试试。', '中间有两个 ab。'], explain: '(a + b)² = a² + 2ab + b²。', answerText: '2' },
  // ---- 语文 · 小学
  { id: 'cp1', subject: 'chinese', band: 'P', type: 'fill', stem: '看拼音写词语：', blanks: [{ pre: 'pú tao', ans: ['葡萄'] }], hints: ['是一种水果，两个字都是草字头。', '第一个字下面是“匍”的右半部分。'], explain: '葡萄（pú tao）。', answerText: '葡萄' },
  { id: 'cp2', subject: 'chinese', band: 'P', type: 'choice', stem: '“长”在“长大”中的读音是', options: ['cháng', 'zhǎng'], answer: 1, hints: ['“长”是多音字，表示长度时读一个音，表示生长时读另一个音。', '“长大”是生长的意思。'], explain: '“长大”的“长”表示生长，读 zhǎng。', answerText: 'B. zhǎng' },
  { id: 'cp3', subject: 'chinese', band: 'P', type: 'choice', stem: '一（　）大树', options: ['只', '棵', '条', '匹'], answer: 1, hints: ['想一想，我们怎么数树？', '一只小鸟、一条河、一匹马，树呢？'], explain: '树用“棵”：一棵大树。', answerText: 'B. 棵' },
  { id: 'cp4', subject: 'chinese', band: 'P', type: 'order', stem: '把词语排成一句通顺的话：', tokens: ['我们', '在操场上', '快乐地', '踢足球'], answer: ['我们', '在操场上', '快乐地', '踢足球'], hints: ['先找“谁”，再找“在哪里”。', '“快乐地”放在“踢足球”前面。'], explain: '我们在操场上快乐地踢足球。', answerText: '我们在操场上快乐地踢足球。' },
  { id: 'cp5', subject: 'chinese', band: 'P', type: 'fill', stem: '补全诗句：', blanks: [{ pre: '白日依山尽，', suf: '。', ans: ['黄河入海流'] }], hints: ['出自王之涣《登鹳雀楼》。', '这一句写的是一条大河。'], explain: '白日依山尽，黄河入海流。', answerText: '黄河入海流' },
  // ---- 语文 · 初中
  { id: 'cj1', subject: 'chinese', band: 'J', type: 'choice', stem: '下列句子没有语病的一项是', options: ['通过这次活动，使我们认识到环保的重要性。', '我们要养成良好的阅读习惯。', '他的写作水平有了明显的改进。', '能否保持乐观的心态，是取得成功的关键。'], answer: 1, hints: ['逐句找主语，并检查搭配和“两面对一面”。', 'A 缺主语；C “水平”与“改进”搭配不当；D 前面“能否”两面，后面一面。'], explain: 'A 缺主语，C 搭配不当，D 两面对一面，B 正确。', answerText: 'B' },
  { id: 'cj2', subject: 'chinese', band: 'J', type: 'fill', stem: '补全名句（范仲淹《岳阳楼记》）：', blanks: [{ pre: '先天下之忧而忧，', suf: '。', ans: ['后天下之乐而乐'] }], hints: ['上下两句结构相同。', '“先……忧”对应“后……乐”。'], explain: '先天下之忧而忧，后天下之乐而乐。', answerText: '后天下之乐而乐' },
  { id: 'cj3', subject: 'chinese', band: 'J', type: 'choice', stem: '《三峡》“虽乘奔御风不以疾也”中“奔”的意思是', options: ['奔跑', '飞奔的骏马', '逃跑', '奔流的江水'], answer: 1, hints: ['这里“奔”和“风”并列，都是名词。', '“乘”的对象，是一种很快的交通工具。'], explain: '“奔”在这里是名词，指飞奔的骏马。', answerText: 'B. 飞奔的骏马' },
  { id: 'cj4', subject: 'chinese', band: 'J', type: 'order', stem: '把下列句子排成语意连贯的一段话：', tokens: ['读书，', '可以让我们', '开阔视野，', '陶冶情操。'], answer: ['读书，', '可以让我们', '开阔视野，', '陶冶情操。'], hints: ['先找话题，再找它的作用。', '“开阔视野”在前，“陶冶情操”收尾。'], explain: '读书，可以让我们开阔视野，陶冶情操。', answerText: '读书，可以让我们开阔视野，陶冶情操。' },
  { id: 'cj5', subject: 'chinese', band: 'J', type: 'judge', stem: '判断：“不以物喜，不以己悲”出自《岳阳楼记》。', options: ['对', '错'], answer: 0, hints: ['想想范仲淹笔下“古仁人之心”。', '这句话紧接在“予尝求古仁人之心”之后。'], explain: '出自范仲淹《岳阳楼记》。', answerText: '对' },
  // ---- 英语 · 小学
  { id: 'ep1', subject: 'english', band: 'P', type: 'choice', stem: "— What would you like to drink?<br>— I'd like some ____.", options: ['tea', 'sandwich', 'hamburger', 'salad'], answer: 0, hints: ['问的是 drink（喝的）。', '四个选项里只有一个是饮料。'], explain: 'drink 问饮料，tea 是茶。', answerText: 'A. tea' },
  { id: 'ep2', subject: 'english', band: 'P', type: 'fill', stem: '根据中文拼写英文单词：', blanks: [{ pre: '星期三：', ans: ['Wednesday'] }], hints: ['首字母是 W，一共 9 个字母。', '中间有一个不发音的 d：W-e-d-n-…'], explain: '星期三：Wednesday（第一个 d 不发音）。', answerText: 'Wednesday', words: ['Wednesday'] },
  { id: 'ep3', subject: 'english', band: 'P', type: 'order', stem: '连词成句：', tokens: ['My', 'teacher', 'is', 'very', 'kind', '.'], answer: ['My', 'teacher', 'is', 'very', 'kind', '.'], hints: ['大写字母开头的词放最前面。', '主语 + is + very + 形容词。'], explain: 'My teacher is very kind.', answerText: 'My teacher is very kind.' },
  { id: 'ep4', subject: 'english', band: 'P', type: 'listen', speak: 'sandwich', stem: '听一听，选出你听到的单词。', options: ['salad', 'sandwich', 'hamburger', 'tea'], answer: 1, hints: ['再听一遍，注意开头的音。', '开头是 /s/，后面有 /w/ 的音。'], explain: '听到的是 sandwich（三明治）。', answerText: 'B. sandwich', words: ['sandwich'] },
  { id: 'ep5', subject: 'english', band: 'P', type: 'choice', stem: 'There ____ a river in front of my house.', options: ['is', 'are', 'am', 'be'], answer: 0, hints: ['看后面的名词是单数还是复数。', 'a river 是单数。'], explain: 'a river 是单数，用 There is。', answerText: 'A. is' },
  // ---- 英语 · 初中
  { id: 'ej1', subject: 'english', band: 'J', type: 'choice', stem: '— Do you know ____?<br>— Yes, next Monday.', options: ['when will they leave', 'when they will leave', 'when did they leave', 'when they left'], answer: 1, hints: ['宾语从句要用陈述语序。', '回答是 next Monday，用将来时。'], explain: '宾语从句用陈述语序，且回答是将来时间，选 when they will leave。', answerText: 'B. when they will leave' },
  { id: 'ej2', subject: 'english', band: 'J', type: 'fill', stem: '用所给词的正确形式填空：', blanks: [{ pre: 'The bridge', suf: '(build) in 2010.', ans: ['was built'] }], hints: ['桥是“被建造”的。', '2010 年是过去时间：was / were + 过去分词。'], explain: '一般过去时的被动语态：was built。', answerText: 'was built', words: ['build'] },
  { id: 'ej3', subject: 'english', band: 'J', type: 'order', stem: '连词成句：', tokens: ['I', 'used', 'to', 'be', 'shy', '.'], answer: ['I', 'used', 'to', 'be', 'shy', '.'], hints: ['used to + 动词原形。', 'I used to …'], explain: 'I used to be shy.（我过去很害羞。）', answerText: 'I used to be shy.' },
  { id: 'ej4', subject: 'english', band: 'J', type: 'choice', stem: 'English ____ by many people around the world.', options: ['speaks', 'is spoken', 'spoke', 'is speaking'], answer: 1, hints: ['English 是“被说”的。', '一般现在时的被动语态：am / is / are + 过去分词。'], explain: '一般现在时的被动语态：is spoken。', answerText: 'B. is spoken' },
  { id: 'ej5', subject: 'english', band: 'J', type: 'listen', speak: 'pronounce', stem: '听一听，选出你听到的单词。', options: ['pronounce', 'announce', 'promise', 'produce'], answer: 0, hints: ['再听一遍，注意开头。', '开头是 /prə/，结尾是 /nauns/。'], explain: '听到的是 pronounce（发音）。', answerText: 'A. pronounce', words: ['pronounce'] },
  // ---- 物理
  { id: 'pj1', subject: 'physics', band: 'J', type: 'twotier', stem: '行驶中的公交车突然刹车，站着的乘客会向哪个方向倾倒？', options: ['向前倾', '向后倒', '不会倾倒'], answer: 0, reasons: ['乘客受到一个向前的力', '乘客的上半身由于惯性，要保持原来的运动状态', '刹车时车给乘客一个向后的力'], reasonAnswer: 1, hints: ['答案和理由都要选对。想想“惯性”。', '脚随车停下，上半身还要保持原来向前运动的状态。'], explain: '脚随车减速，上半身由于惯性保持向前运动，所以向前倾。并没有“向前的力”。', answerText: '向前倾；理由：上半身由于惯性要保持原来的运动状态' },
  { id: 'pj2', subject: 'physics', band: 'J', type: 'steps', stem: '小明骑自行车 5 min 行驶了 1500 m，他的平均速度是多少 m/s？', steps: [{ label: '选公式', kind: 'choice', options: ['v = s / t', 'v = s × t', 'v = t / s'], answer: 0, show: 'v = s / t' }, { label: '统一单位', kind: 'fill', pre: 't = 5 min =', suf: 's', answer: ['300'], show: 't = 5 min = 300 s' }, { label: '计算', kind: 'fill', pre: 'v =', suf: 'm/s', answer: ['5'], show: 'v = 1500 m ÷ 300 s = 5 m/s' }], hints: ['速度 = 路程 ÷ 时间，单位要统一成 m 和 s。', '1 min = 60 s。'], explain: 't = 300 s，v = s / t = 1500 m ÷ 300 s = 5 m/s。', answerText: 'v = s / t，t = 300 s，v = 5 m/s' },
  { id: 'pj3', subject: 'physics', band: 'J', type: 'order', stem: '用托盘天平测量物体质量，正确的操作顺序是：', tokens: ['把天平放在水平台上', '游码移到零刻度线', '调节平衡螺母使横梁平衡', '左盘放物体，右盘加砝码', '读出砝码与游码示数之和'], answer: ['把天平放在水平台上', '游码移到零刻度线', '调节平衡螺母使横梁平衡', '左盘放物体，右盘加砝码', '读出砝码与游码示数之和'], hints: ['先“放平”，再“归零”，然后“调平衡”。', '测量时“左物右码”。'], explain: '放平 → 归零 → 调平衡 → 左物右码 → 读数。', answerText: '放平 → 游码归零 → 调平衡 → 左物右码 → 读数' },
  { id: 'pj4', subject: 'physics', band: 'J', type: 'fill', stem: '单位换算：', blanks: [{ pre: '1 m/s =', suf: 'km/h', ans: ['3.6'] }], hints: ['1 m = 0.001 km，1 s = 1/3600 h。', '0.001 ÷ (1/3600) = ?'], explain: '1 m/s = 0.001 km ÷ (1/3600 h) = 3.6 km/h。', answerText: '3.6' },
  { id: 'pj5', subject: 'physics', band: 'J', type: 'choice', stem: '下列现象中，属于光的反射的是', options: ['小孔成像', '水中倒影', '雨后彩虹', '筷子在水中“折断”'], answer: 1, hints: ['反射是光遇到物体表面“弹回来”。', '平静的水面像一面镜子。'], explain: '水中倒影是平面镜成像，属于光的反射。小孔成像是直线传播，彩虹是色散，筷子“折断”是折射。', answerText: 'B. 水中倒影' },
  // ---- 化学
  { id: 'hj1', subject: 'chemistry', band: 'J', type: 'balance', stem: '配平化学方程式（填写化学计量数）：', parts: [{ f: 'H₂', atoms: { H: 2 } }, { f: 'O₂', atoms: { O: 2 } }, { f: 'H₂O', atoms: { H: 2, O: 1 } }], coefs: [2, 1, 2], split: 2, cond: '点燃', hints: ['先数一数等号两边各有几个氧原子。', '右边 H₂O 前配 2，氧原子就平了，再配氢。'], explain: '2H₂ + O₂ =点燃= 2H₂O，两边 H 都是 4 个，O 都是 2 个。', answerText: '2、1、2' },
  { id: 'hj2', subject: 'chemistry', band: 'J', type: 'fill', stem: '写出二氧化碳的化学式（数字直接写在后面即可）：', blanks: [{ pre: '二氧化碳：', ans: ['CO2'], chem: true }], hints: ['“二氧化”说明有 2 个氧原子。', '碳的元素符号是 C。'], explain: '二氧化碳：CO₂。', answerText: 'CO₂' },
  { id: 'hj3', subject: 'chemistry', band: 'J', type: 'choice', stem: '下列变化属于化学变化的是', options: ['冰雪融化', '纸张燃烧', '酒精挥发', '玻璃破碎'], answer: 1, hints: ['化学变化会生成新物质。', '哪一个变化之后，原来的物质变成了别的东西？'], explain: '纸张燃烧生成二氧化碳和水等新物质，是化学变化；其他只是状态或形状改变。', answerText: 'B. 纸张燃烧' },
  { id: 'hj4', subject: 'chemistry', band: 'J', type: 'twotier', stem: '蜡烛燃烧后质量变小了，这是否违背质量守恒定律？', options: ['违背', '不违背'], answer: 1, reasons: ['蜡烛燃烧后有一部分物质消失了', '生成的二氧化碳和水蒸气逸散到了空气中', '质量守恒定律只适用于部分化学反应'], reasonAnswer: 1, hints: ['答案和理由都要选对。物质会凭空消失吗？', '燃烧生成的气体去哪里了？'], explain: '所有化学反应都遵守质量守恒定律。蜡烛质量变小，是因为生成的 CO₂ 和水蒸气跑到空气中了。', answerText: '不违背；理由：生成的二氧化碳和水蒸气逸散到空气中' },
  { id: 'hj5', subject: 'chemistry', band: 'J', type: 'steps', stem: '电解 18 g 水，最多能生成氢气多少克？', steps: [{ label: '写方程式', kind: 'choice', options: ['2H₂O =通电= 2H₂↑ + O₂↑', 'H₂O =通电= H₂↑ + O₂↑', '2H₂O =通电= H₂↑ + O₂↑'], answer: 0, show: '2H₂O =通电= 2H₂↑ + O₂↑' }, { label: '找质量比', kind: 'fill', pre: 'H₂O 与 H₂ 的质量比 = 36 :', answer: ['4'], show: '2H₂O : 2H₂ = 36 : 4' }, { label: '计算', kind: 'fill', pre: '生成氢气', suf: 'g', answer: ['2'], show: '18 g × 4 ÷ 36 = 2 g' }], hints: ['先写出配平的化学方程式。', 'H₂O 相对分子质量 18，H₂ 是 2，前面都乘 2。'], explain: '2H₂O =通电= 2H₂↑ + O₂↑，36 : 4 = 18 g : x，x = 2 g。', answerText: '2 g' },
];

// 单词词典（原型用：手动导入时自动补全释义）
const DICT = {
  old: '老的；年纪大的', young: '年轻的', funny: '滑稽的；可笑的', kind: '和蔼的；亲切的', strict: '严格的', polite: '有礼貌的', 'hard-working': '工作努力的', helpful: '有用的；乐于助人的', clever: '聪明的', shy: '害羞的',
  wednesday: '星期三', thursday: '星期四', saturday: '星期六', sandwich: '三明治', salad: '沙拉', hamburger: '汉堡包', 'ice cream': '冰淇淋', tea: '茶', fresh: '新鲜的', healthy: '健康的',
  classroom: '教室', window: '窗户', blackboard: '黑板', picture: '图画', computer: '计算机', schoolbag: '书包', storybook: '故事书', candy: '糖果', notebook: '笔记本', key: '钥匙',
  beef: '牛肉', chicken: '鸡肉', noodles: '面条', soup: '汤', vegetable: '蔬菜', chopsticks: '筷子', spoon: '勺', strong: '强壮的', quiet: '安静的', friendly: '友好的',
  ruler: '尺子', pencil: '铅笔', eraser: '橡皮', crayon: '蜡笔', bag: '书包', pen: '钢笔', 'pencil box': '铅笔盒', book: '书', red: '红色', green: '绿色', yellow: '黄色', blue: '蓝色', black: '黑色', brown: '棕色', white: '白色', orange: '橙色',
  face: '脸', ear: '耳朵', eye: '眼睛', nose: '鼻子', mouth: '嘴', arm: '胳膊', hand: '手', head: '头', body: '身体', leg: '腿', foot: '脚', duck: '鸭子', pig: '猪', cat: '猫', bear: '熊', dog: '狗', elephant: '大象', monkey: '猴子', bird: '鸟', tiger: '老虎', panda: '熊猫',
  bread: '面包', juice: '果汁', milk: '牛奶', seven: '七', nine: '九', ten: '十', six: '六', father: '父亲；爸爸', mother: '母亲；妈妈', rabbit: '兔子', fish: '鱼',
  pronounce: '发音', patient: '有耐心的', expression: '表达；表情', discover: '发现', secret: '秘密', grammar: '语法', repeat: '重复', wisely: '明智地', build: '建造', apple: '苹果', river: '河流', library: '图书馆', delicious: '美味的', thirsty: '口渴的',
};

// ---- 知识点类型：记忆 / 技能 / 理解应用 / 开放（阅读表达）
const KP_TYPE = {
  'chinese-P3-1': '记忆', 'chinese-P3-2': '记忆', 'chinese-P3-6': '记忆', 'chinese-P3-4': '开放', 'chinese-P3-5': '开放',
  'english-P3-1': '记忆', 'english-P3-3': '记忆', 'english-P3-4': '记忆', 'english-P3-5': '记忆', 'english-P3-10': '记忆',
  'chinese-P2-1': '记忆', 'chinese-P2-4': '记忆', 'math-P2-5': '记忆', 'math-P2-6': '记忆',
  'chinese-P4-3': '记忆', 'chinese-P4-5': '记忆', 'english-P4-1': '记忆', 'english-P4-2': '记忆', 'english-P4-3': '记忆',
  'chinese-J2-3': '记忆', 'chinese-J3-4': '记忆', 'chemistry-J3-4': '记忆',
  'chinese-P4-1': '开放', 'chinese-P4-2': '开放', 'chinese-P4-4': '开放',
  'chinese-J2-1': '开放', 'chinese-J2-4': '开放', 'chinese-J3-1': '开放', 'chinese-J3-2': '开放', 'chinese-J3-5': '开放',
};
function defaultType(subject, name) {
  if (/默写|口诀|元素符号|单词|词汇|生字|看拼音/.test(name)) return '记忆';
  if (['math', 'physics', 'chemistry'].includes(subject) && /计算|运算|[加减乘除]|方程|配平|因式|公式|幂|配方/.test(name)) return '技能';
  if (subject === 'chinese' && /阅读|写法|情感|形象|论点|新闻|散文|小说|复述|赏析/.test(name)) return '开放';
  return '理解应用';
}
const FIG_KPS = ['math-P2-4', 'math-P2-7', 'math-P4-4', 'math-P4-7', 'math-J2-2', 'math-J2-3', 'math-J3-5', 'math-J3-6', 'math-J3-7', 'physics-J2-5', 'physics-J2-6', 'physics-J3-4', 'chemistry-J3-2'];

/*
 * 记忆型知识点的课本数据。items: [提示, 答案或可接受答案数组]
 * rev=true：认读时显示答案、选提示（如看汉字选拼音）；false：显示提示、选答案（如看上句选下句）
 * cs=true：回忆题区分大小写（元素符号）
 */
const MEMORY_ITEMS = {
  'chinese-P3-1': { data: '三年级上册词语表（第一单元节选）', src: '课本词语表 · 字典核对拼音', read: '看词语选拼音', write: '看拼音写词语', rev: true,
    items: [['zǎo chen', '早晨'], ['dǎ ban', '打扮'], ['xiān yàn', '鲜艳'], ['fú zhuāng', '服装'], ['guó qí', '国旗'], ['jìng ài', '敬爱'], ['gǔ lǎo', '古老'], ['tiào wǔ', '跳舞'], ['kǒng què', '孔雀'], ['hóu zi', '猴子']] },
  'chinese-P3-2': { data: '古诗文原文库：《山行》《赠刘景文》《夜书所见》', src: '课本版本 · 多来源比对一致', read: '选出下一句', write: '默写下一句', rev: false,
    items: [['远上寒山石径斜', '白云生处有人家'], ['停车坐爱枫林晚', '霜叶红于二月花'], ['荷尽已无擎雨盖', '菊残犹有傲霜枝'], ['一年好景君须记', '最是橙黄橘绿时'], ['萧萧梧叶送寒声', '江上秋风动客情'], ['知有儿童挑促织', '夜深篱落一灯明']] },
  'chinese-P3-6': { data: '古诗文原文库：《望天门山》《饮湖上初晴后雨》《望洞庭》', src: '课本版本 · 多来源比对一致', read: '选出下一句', write: '默写下一句', rev: false,
    items: [['天门中断楚江开', '碧水东流至此回'], ['两岸青山相对出', '孤帆一片日边来'], ['水光潋滟晴方好', '山色空蒙雨亦奇'], ['欲把西湖比西子', '淡妆浓抹总相宜'], ['湖光秋月两相和', '潭面无风镜未磨'], ['遥望洞庭山水翠', '白银盘里一青螺']] },
  'english-P3-1': { data: '三年级上册英语词表 Unit 1（PEP 2012）', src: '电子课本提取 · 多来源比对一致', read: '看单词选中文', write: '看中文写单词', rev: true, en: true,
    items: [['尺子', 'ruler'], ['铅笔', 'pencil'], ['橡皮', 'eraser'], ['蜡笔', 'crayon'], ['书包', 'bag'], ['钢笔', 'pen'], ['铅笔盒', 'pencil box'], ['书', 'book']] },
  'english-P3-3': { data: '三年级上册英语词表 Unit 2（PEP 2012）', src: '电子课本提取 · 多来源比对一致', read: '看单词选中文', write: '看中文写单词', rev: true, en: true,
    items: [['红色', 'red'], ['绿色', 'green'], ['黄色', 'yellow'], ['蓝色', 'blue'], ['黑色', 'black'], ['棕色', 'brown'], ['白色', 'white'], ['橙色', 'orange']] },
  'english-P3-4': { data: '三年级上册英语词表 Unit 3（PEP 2012）', src: '电子课本提取 · 多来源比对一致', read: '看单词选中文', write: '看中文写单词', rev: true, en: true,
    items: [['脸', 'face'], ['耳朵', 'ear'], ['眼睛', 'eye'], ['鼻子', 'nose'], ['嘴', 'mouth'], ['胳膊', 'arm'], ['手', 'hand'], ['头', 'head'], ['身体', 'body'], ['腿', 'leg'], ['脚', 'foot']] },
  'english-P3-5': { data: '三年级上册英语词表 Unit 4（PEP 2012）', src: '电子课本提取 · 多来源比对一致', read: '看单词选中文', write: '看中文写单词', rev: true, en: true,
    items: [['鸭子', 'duck'], ['猪', 'pig'], ['猫', 'cat'], ['熊', 'bear'], ['狗', 'dog'], ['大象', 'elephant'], ['猴子', 'monkey'], ['鸟', 'bird'], ['老虎', 'tiger'], ['熊猫', 'panda']] },
  'english-P3-10': { data: '三年级上册英语词表 Unit 3（PEP 2024 新版）', src: '联网整理初稿 · 待老师对照课本核对', read: '看单词选中文', write: '看中文写单词', rev: true, en: true, pending: true,
    items: [['猫', 'cat'], ['狗', 'dog'], ['鸟', 'bird'], ['鱼', 'fish'], ['兔子', 'rabbit'], ['熊猫', 'panda'], ['老虎', 'tiger'], ['大象', 'elephant']] },
  'chinese-P2-1': { data: '二年级上册词语表（节选）', src: '联网整理 + 字典核对拼音', read: '看词语选拼音', write: '看拼音写词语', rev: true,
    items: [['qiū tiān', '秋天'], ['fēng yè', '枫叶'], ['pú tao', '葡萄'], ['hú lu', '葫芦'], ['shù lín', '树林'], ['bīng xuě', '冰雪'], ['jiā xiāng', '家乡'], ['huǒ chái', '火柴']] },
  'chinese-P2-4': { data: '古诗文原文库：《登鹳雀楼》《望庐山瀑布》', src: '公版原文', read: '选出下一句', write: '默写下一句', rev: false,
    items: [['白日依山尽', '黄河入海流'], ['欲穷千里目', '更上一层楼'], ['日照香炉生紫烟', '遥看瀑布挂前川'], ['飞流直下三千尺', '疑是银河落九天']] },
  'math-P2-5': { data: '乘法口诀表（2–6）', src: '教师录入', read: '选出得数', write: '写出得数', rev: false,
    items: [['二三得', ['六', '6']], ['三四', ['十二', '12']], ['四五', ['二十', '20']], ['五六', ['三十', '30']], ['三六', ['十八', '18']], ['四六', ['二十四', '24']], ['二五', ['一十', '十', '10']], ['六六', ['三十六', '36']]] },
  'math-P2-6': { data: '乘法口诀表（7–9）', src: '教师录入', read: '选出得数', write: '写出得数', rev: false,
    items: [['七八', ['五十六', '56']], ['六七', ['四十二', '42']], ['八九', ['七十二', '72']], ['七七', ['四十九', '49']], ['三八', ['二十四', '24']], ['九九', ['八十一', '81']], ['四七', ['二十八', '28']], ['五九', ['四十五', '45']]] },
  'chinese-P4-3': { data: '古诗文原文库：《暮江吟》《题西林壁》《雪梅》', src: '课本版本 · 多来源比对一致', read: '选出下一句', write: '默写下一句', rev: false,
    items: [['一道残阳铺水中', '半江瑟瑟半江红'], ['可怜九月初三夜', '露似真珠月似弓'], ['横看成岭侧成峰', '远近高低各不同'], ['不识庐山真面目', '只缘身在此山中'], ['梅须逊雪三分白', '雪却输梅一段香']] },
  'chinese-P4-5': { data: '古诗文原文库：《出塞》《凉州词》《夏日绝句》', src: '课本版本 · 多来源比对一致', read: '选出下一句', write: '默写下一句', rev: false,
    items: [['秦时明月汉时关', '万里长征人未还'], ['但使龙城飞将在', '不教胡马度阴山'], ['葡萄美酒夜光杯', '欲饮琵琶马上催'], ['醉卧沙场君莫笑', '古来征战几人回'], ['生当作人杰', '死亦为鬼雄']] },
  'english-P4-1': { data: '四年级上册英语词表 Unit 1', src: '电子课本提取 · 多来源比对一致', read: '看单词选中文', write: '看中文写单词', rev: true, en: true,
    items: [['教室', 'classroom'], ['窗户', 'window'], ['黑板', 'blackboard'], ['电灯', 'light'], ['图画', 'picture'], ['门', 'door'], ['计算机', 'computer'], ['风扇', 'fan']] },
  'english-P4-2': { data: '四年级上册英语词表 Unit 2', src: '电子课本提取 · 多来源比对一致', read: '看单词选中文', write: '看中文写单词', rev: true, en: true,
    items: [['书包', 'schoolbag'], ['故事书', 'storybook'], ['糖果', 'candy'], ['笔记本', 'notebook'], ['玩具', 'toy'], ['钥匙', 'key']] },
  'english-P4-3': { data: '四年级上册英语词表 Unit 5', src: '电子课本提取 · 多来源比对一致', read: '看单词选中文', write: '看中文写单词', rev: true, en: true,
    items: [['牛肉', 'beef'], ['鸡肉', 'chicken'], ['面条', 'noodles'], ['汤', 'soup'], ['蔬菜', 'vegetable'], ['筷子', 'chopsticks'], ['碗', 'bowl'], ['勺', 'spoon']] },
  'chinese-J2-3': { data: '古诗文原文库：《野望》《黄鹤楼》《使至塞上》', src: '公版原文', read: '选出下一句', write: '默写下一句', rev: false,
    items: [['树树皆秋色', '山山唯落晖'], ['牧人驱犊返', '猎马带禽归'], ['晴川历历汉阳树', '芳草萋萋鹦鹉洲'], ['日暮乡关何处是', '烟波江上使人愁'], ['大漠孤烟直', '长河落日圆']] },
  'chinese-J3-4': { data: '古诗文原文库：《行路难》《酬乐天》《水调歌头》', src: '公版原文', read: '选出下一句', write: '默写下一句', rev: false,
    items: [['长风破浪会有时', '直挂云帆济沧海'], ['欲渡黄河冰塞川', '将登太行雪满山'], ['沉舟侧畔千帆过', '病树前头万木春'], ['人有悲欢离合', '月有阴晴圆缺'], ['但愿人长久', '千里共婵娟']] },
  'chemistry-J3-4': { data: '常见元素符号表', src: '教师录入', read: '看符号选名称', write: '写出元素符号', rev: true, cs: true,
    items: [['氧', 'O'], ['氢', 'H'], ['碳', 'C'], ['氮', 'N'], ['铁', 'Fe'], ['铜', 'Cu'], ['钠', 'Na'], ['钙', 'Ca'], ['氯', 'Cl'], ['镁', 'Mg']] },
};

// 阅读表达型示例文章（原创短文）
const PASSAGES = {
  P: { title: '奶奶的菜园', src: 'AI 生成 · 教师已审核',
    text: ['奶奶的菜园在屋后的小坡上。春天，奶奶把一粒粒种子埋进土里，像是在和土地说悄悄话。没过几天，嫩绿的小芽就探出了脑袋。', '夏天到了，黄瓜挂满了架子，西红柿红得像一个个小灯笼。我最喜欢跟着奶奶去摘菜，她总是把最大的留给我，自己却说：“小的才嫩呢。”', '后来我搬进了城里，吃过很多菜，可总觉得没有奶奶菜园里的香。'],
    qs: [
      { stem: '这篇短文主要写了什么？', options: ['奶奶的菜园和“我”对奶奶的怀念', '怎样种黄瓜和西红柿', '城里的菜不好吃', '春天的美丽景色'], answer: 0, explain: '文章写菜园四季的样子和奶奶对“我”的疼爱，结尾表达怀念。' },
      { stem: '“西红柿红得像一个个小灯笼”用了什么修辞手法？', options: ['比喻', '拟人', '排比', '夸张'], answer: 0, explain: '把西红柿比作小灯笼，是比喻。' },
    ],
    open: { stem: '为什么“我”总觉得城里的菜没有奶奶菜园里的香？', ref: '因为奶奶菜园里的菜包含着奶奶对“我”的疼爱，“我”怀念和奶奶在一起的日子。', keys: [{ label: '奶奶的爱', words: ['爱', '疼', '关心', '最大的'] }, { label: '怀念 / 想念', words: ['怀念', '想念', '思念', '想奶奶'] }] } },
  J: { title: '村口的老槐树', src: '教师上传',
    text: ['村口有一棵老槐树，没有人说得清它有多少岁。树干要两个人才能合抱，树皮裂成一道道深沟，像老人额上的皱纹。', '每年五月，槐花开了，一串串白花挂满枝头，整个村子都浸在甜香里。孩子们在树下捉迷藏，老人们在树下下棋、聊天。', '前些年修路，有人提议把它砍掉，全村人都不答应，路最终绕了一个弯。', '如今我离家多年，每当想起故乡，最先浮现在眼前的，总是那棵老槐树。'],
    qs: [
      { stem: '本文围绕什么来组织材料？', options: ['老槐树', '修路', '槐花', '童年的游戏'], answer: 0, explain: '外形、花开、树下生活、修路绕弯、结尾回忆，都围绕老槐树展开，老槐树是线索。' },
      { stem: '“路最终绕了一个弯”这一细节表现了什么？', options: ['村民对老槐树的珍爱', '修路非常困难', '老槐树太大挪不动', '村民反对修路'], answer: 0, explain: '宁可让路绕弯也不砍树，表现了村民对老槐树的珍爱。' },
    ],
    open: { stem: '结尾一句表达了作者怎样的情感？请简要分析。', ref: '表达了作者对故乡的深切思念。老槐树承载着故乡的生活和记忆，是故乡的象征，寄托了作者的乡愁。', keys: [{ label: '思念故乡', words: ['思念', '怀念', '想念', '乡愁'] }, { label: '老槐树是故乡的象征 / 寄托', words: ['象征', '寄托', '代表', '记忆'] }] } },
};
