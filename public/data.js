'use strict';
/* 学习系统 3.0 原型静态数据 */

const SUBJECTS = { math: { name: '数学', icon: '🔢' }, english: { name: '英语', icon: '🔤' }, physics: { name: '物理', icon: '🔭' } };
const STAGE_NAME = { P3: '小学三年级', J3: '初中三年级' };
const TYPE_NAME = { single: '单选题', fill: '填空题', applied: '应用题' };
const KP_TYPE_NAME = { skill: '🛠️ 技能', apply: '💡 理解应用', memory: '📌 记忆' };

// [id, 学科, 年级, 单元, 名称, 类型, 适用题型]
const KP_SEED = [
  ['m1', 'math', 'P3', '时、分、秒', '秒的认识与时间单位换算', 'skill', ['single', 'fill']],
  ['m2', 'math', 'P3', '时、分、秒', '计算经过的时间', 'apply', ['single', 'fill', 'applied']],
  ['m3', 'math', 'P3', '万以内的加法和减法（一）', '两位数加减两位数（口算）', 'skill', ['single', 'fill']],
  ['m4', 'math', 'P3', '测量', '长度单位和质量单位', 'apply', ['single', 'fill']],
  ['m5', 'math', 'P3', '万以内的加法和减法（二）', '三位数加减三位数（笔算）', 'skill', ['fill', 'applied']],
  ['m6', 'math', 'P3', '倍的认识', '倍的认识与求几倍', 'apply', ['single', 'fill', 'applied']],
  ['m7', 'math', 'P3', '多位数乘一位数', '多位数乘一位数（笔算）', 'skill', ['fill', 'applied']],
  ['m8', 'math', 'P3', '长方形和正方形', '长方形和正方形的周长', 'apply', ['single', 'fill', 'applied']],
  ['m9', 'math', 'P3', '分数的初步认识', '认识几分之一和几分之几', 'apply', ['single', 'fill']],
  ['m10', 'math', 'P3', '数学广角', '集合（重叠问题）', 'apply', ['single', 'applied']],
  ['e1', 'english', 'P3', 'Unit 1 Making friends', '文具单词（ruler、pencil…）', 'memory', ['single', 'fill']],
  ['e2', 'english', 'P3', 'Unit 1 Making friends', '打招呼与介绍自己', 'apply', ['single', 'fill']],
  ['e3', 'english', 'P3', 'Unit 2 Different families', '颜色单词', 'memory', ['single', 'fill']],
  ['e4', 'english', 'P3', 'Unit 5 The colourful world', '用颜色描述物品（It\'s red.）', 'apply', ['single', 'fill']],
  ['p1', 'physics', 'J3', '第十七章 欧姆定律', '欧姆定律 I = U / R', 'apply', ['single', 'fill', 'applied']],
  ['p2', 'physics', 'J3', '第十五章 电流和电路', '串联电路的电流、电压规律', 'apply', ['single', 'fill']],
  ['p3', 'physics', 'J3', '第十五章 电流和电路', '并联电路的电流、电压规律', 'apply', ['single', 'fill']],
  ['p4', 'physics', 'J3', '第十八章 电功率', '电功率 P = UI', 'apply', ['single', 'fill', 'applied']],
];

// 先学后学：[前置, 后学, 强度 must|suggest, 状态 ok|pending, 来源]
const PREREQ_SEED = [
  ['m1', 'm2', 'must', 'ok', '联网获取 · 教师确认'],
  ['m3', 'm5', 'must', 'ok', '联网获取 · 教师确认'],
  ['m3', 'm6', 'suggest', 'ok', '教师添加'],
  ['m6', 'm7', 'suggest', 'ok', '联网获取 · 教师确认'],
  ['m7', 'm8', 'suggest', 'ok', '联网获取 · 教师确认'],
  ['m4', 'm8', 'must', 'ok', '联网获取 · 教师确认'],
  ['m5', 'm10', 'suggest', 'pending', 'AI 建议'],
  ['e1', 'e4', 'suggest', 'ok', '教师添加'],
  ['e3', 'e4', 'must', 'ok', '教师添加'],
  ['p2', 'p1', 'must', 'ok', '联网获取 · 教师确认'],
  ['p3', 'p1', 'must', 'ok', '联网获取 · 教师确认'],
  ['p1', 'p4', 'must', 'ok', '联网获取 · 教师确认'],
];

// 合并关系：[A, B, 状态 yes|no, 怎么合并 / 原因, 确认状态 ok|pending]
const COMBO_SEED = [
  ['m1', 'm2', 'yes', '先把时间单位换算成同一种，再计算经过的时间', 'ok'],
  ['m4', 'm5', 'yes', '先统一长度单位，再笔算加减', 'ok'],
  ['m7', 'm8', 'yes', '求周长时用多位数乘一位数计算', 'ok'],
  ['m6', 'm7', 'yes', '求一个数的几倍，用乘法计算', 'ok'],
  ['m4', 'm8', 'yes', '先统一长度单位，再求周长', 'ok'],
  ['m5', 'm8', 'yes', '求出周长后，再用加减法比较或求剩余', 'ok'],
  ['m6', 'm9', 'no', '“几倍”和“几分之几”容易混淆，三年级先分开练', 'ok'],
  ['m3', 'm10', 'yes', '重叠问题中用两位数加减计算总人数', 'pending'],
  ['e1', 'e4', 'yes', '用颜色描述文具：The ruler is blue.', 'ok'],
  ['e3', 'e4', 'yes', '颜色单词作为句型中的成分', 'ok'],
  ['p1', 'p2', 'yes', '先用串联规律求总电阻或分电压，再用欧姆定律', 'ok'],
  ['p1', 'p3', 'yes', '先用并联规律求支路电流，再用欧姆定律', 'ok'],
  ['p1', 'p4', 'yes', '先用欧姆定律求电流，再求电功率', 'ok'],
  ['p2', 'p3', 'no', '串、并联规律容易混淆，需要先分开练熟', 'ok'],
];

const o = (id, text, diag) => ({ id, text, diag });
// 题目
const Q_SEED = [
  // ---- 2.x 保留（转换后） ----
  { id: 'q1', kps: ['m1'], type: 'single', level: 1, stem: '1 分 = (    ) 秒', options: [o('A', '10'), o('B', '60'), o('C', '100', '把时间当成十进制了')], answer: 'B', explain: '1 分 = 60 秒。', source: '2.x 保留', origType: '单选', vg: 'vg-m1-a', vk: '母题' },
  { id: 'q2', kps: ['m1'], type: 'single', level: 1, stem: '判断：3 分 = 300 秒。', options: [o('A', '对', '把 1 分当成了 100 秒'), o('B', '错')], answer: 'B', explain: '3 分 = 180 秒。', source: '2.x 保留', origType: '判断 → 单选（A 对 / B 错）', vg: 'vg-m1-a', vk: '换题型' },
  { id: 'q3', kps: ['m1'], type: 'single', level: 2, stem: '比较大小：2 分 (    ) 100 秒', options: [o('A', '＞'), o('B', '＜', '没有先换算单位'), o('C', '＝')], answer: 'A', explain: '2 分 = 120 秒，120 ＞ 100。', source: '2.x 保留', origType: '比较 → 单选（A ＞ / B ＜ / C ＝）', vg: 'vg-m1-b', vk: '母题' },
  { id: 'q4', kps: ['m3'], type: 'fill', level: 1, stem: '口算：46 + 38 = ①____', blanks: [['84']], explain: '6 + 8 = 14，向十位进 1；40 + 30 + 10 = 80；80 + 4 = 84。', source: '2.x 保留', origType: '填数 → 填空', vg: 'vg-m3-a', vk: '母题' },
  { id: 'q5', kps: ['m3'], type: 'fill', level: 1, stem: '口算：72 − 27 = ①____', blanks: [['45']], explain: '72 − 20 = 52，52 − 7 = 45。', source: '2.x 保留', origType: '填数 → 填空', vg: 'vg-m3-a', vk: '换数字' },
  { id: 'q6', kps: ['m5'], type: 'applied', level: 2, stem: '学校图书室有故事书 465 本，借出 178 本后，又买来 236 本。现在有故事书多少本？', answer: '523 本', rubric: [{ step: '求借出后剩下多少本', key: '287', kp: 'm5', score: 2 }, { step: '求买来后共有多少本', key: '523', kp: 'm5', score: 2 }, { step: '写出答句和单位', key: '本', kp: null, score: 1 }], explain: '465 − 178 = 287（本），287 + 236 = 523（本）。答：现在有故事书 523 本。', source: '2.x 保留', origType: '分步解答 → 应用题（原步骤转为评分要点）', vg: 'vg-m5-a', vk: '母题' },
  { id: 'q7', kps: ['m8'], type: 'single', level: 1, stem: '一个正方形的边长是 8 厘米，它的周长是多少厘米？', options: [o('A', '16', '只算了两条边'), o('B', '32'), o('C', '64', '算成了 8 × 8，这是面积的算法')], answer: 'B', explain: '正方形周长 = 边长 × 4 = 8 × 4 = 32（厘米）。', source: '2.x 保留', origType: '单选', vg: 'vg-m8-a', vk: '母题' },
  { id: 'q8', kps: ['m6'], type: 'fill', level: 1, stem: '红花有 6 朵，黄花的朵数是红花的 3 倍。黄花有 ①____ 朵。', blanks: [['18']], explain: '求一个数的几倍用乘法：6 × 3 = 18。', source: '2.x 保留', origType: '填数 → 填空', vg: 'vg-m6-a', vk: '母题' },
  { id: 'q9', kps: ['p1'], type: 'applied', level: 1, stem: '导体两端电压为 4 V 时，通过的电流是 0.2 A，它的电阻是多少 Ω？', answer: '20 Ω', rubric: [{ step: '选用公式 R = U / I', key: 'U/I', kp: 'p1', score: 1 }, { step: '代入计算', key: '20', kp: 'p1', score: 2 }, { step: '写单位 Ω', key: 'Ω', kp: null, score: 1 }], explain: 'R = U / I = 4 V / 0.2 A = 20 Ω。', source: '2.x 保留', origType: '分步解答 → 应用题（原“选公式”选择步骤改为文字要点）', vg: 'vg-p1-a', vk: '母题' },
  { id: 'q10', kps: ['e3'], type: 'single', level: 1, stem: '“红色”的英文是：', options: [o('A', 'red'), o('B', 'blue', '蓝色'), o('C', 'green', '绿色')], answer: 'A', explain: 'red 红色。', source: '2.x 保留', origType: '单选', vg: 'vg-e3-a', vk: '母题' },
  { id: 'q11', kps: ['e1'], type: 'fill', level: 1, stem: '看图拼单词：尺子 r①____', blanks: [['uler']], explain: 'ruler 尺子。', source: '2.x 保留', origType: '填空', vg: 'vg-e1-a', vk: '母题' },
  { id: 'q12', kps: ['p2'], type: 'fill', level: 1, stem: '两个电阻串联，通过 R₁ 的电流是 0.3 A，通过 R₂ 的电流是 ①____ A。', blanks: [['0.3']], explain: '串联电路中电流处处相等。', source: '2.x 保留', origType: '填数 → 填空', vg: 'vg-p2-a', vk: '母题' },
  // ---- AI 生成（规则文件） ----
  { id: 'q13', kps: ['m1'], type: 'fill', level: 2, stem: '小明跑步用了 150 秒，合 ①____ 分 ②____ 秒。', blanks: [['2'], ['30']], explain: '150 秒 = 120 秒 + 30 秒 = 2 分 30 秒。', source: 'AI 生成', rule: '小学数学出题规则 v1.2', ai: '开发代理（离线）', vg: 'vg-m1-a', vk: '反过来问', verify: { result: '通过' } },
  { id: 'q14', kps: ['m1', 'm2'], type: 'applied', level: 3, stem: '一节课 40 分钟，第一节课 8:10 开始。下课后休息 600 秒，第二节课几点开始？', answer: '9:00', rubric: [{ step: '求第一节课下课时间', key: '8:50', kp: 'm2', score: 2 }, { step: '把 600 秒换算成分', key: '10', kp: 'm1', score: 2 }, { step: '求第二节课开始时间', key: '9:00', kp: 'm2', score: 1 }], explain: '8:10 经过 40 分是 8:50；600 秒 = 10 分；8:50 再过 10 分是 9:00。答：第二节课 9:00 开始。', source: 'AI 生成', rule: '小学数学出题规则 v1.2', ai: '开发代理（离线）', vg: 'vg-m12-a', vk: '母题', verify: { result: '更正', reason: '原题“休息 10 分”没有用到“秒的换算”，与标注的知识点 m1 不符；改为 600 秒，并补上换算这一评分要点。', before: '……下课后休息 10 分钟，第二节课几点开始？（评分要点只有 2 条，m1 无对应步骤）' } },
  { id: 'q15', kps: ['m7', 'm8'], type: 'applied', level: 3, stem: '用一根铁丝正好围成一个边长 26 厘米的正方形。这根铁丝长多少厘米？如果改围成一个长 30 厘米的长方形，宽是多少厘米？', answer: '104 厘米；22 厘米', rubric: [{ step: '求正方形周长（铁丝长）', key: '104', kp: 'm7', score: 2 }, { step: '求长方形长与宽的和', key: '52', kp: 'm8', score: 1 }, { step: '求长方形的宽', key: '22', kp: 'm8', score: 2 }], explain: '26 × 4 = 104（厘米）；104 ÷ 2 = 52（厘米）；52 − 30 = 22（厘米）。', source: 'AI 生成', rule: '小学数学出题规则 v1.2', ai: '开发代理（离线）', vg: 'vg-m78-a', vk: '母题', verify: { result: '通过' }, prog: '程序复算 104、52、22 一致' },
  { id: 'q16', kps: ['m8'], type: 'fill', level: 2, stem: '一个长方形的周长是 30 厘米，长是 9 厘米，宽是 ①____ 厘米。', blanks: [['6']], explain: '30 ÷ 2 = 15，15 − 9 = 6（厘米）。', source: 'AI 生成', rule: '小学数学出题规则 v1.2', ai: '开发代理（离线）', vg: 'vg-m8-a', vk: '反过来问', verify: { result: '通过' }, prog: '程序复算一致' },
  { id: 'q17', kps: ['m8'], type: 'single', level: 2, stem: '把两个边长 5 厘米的正方形拼成一个长方形，长方形的周长是多少厘米？', options: [o('A', '40', '把两个正方形的周长直接相加，没去掉拼在一起的两条边'), o('B', '30'), o('C', '20', '只算了一个正方形的周长')], answer: 'B', explain: '拼成长 10 厘米、宽 5 厘米的长方形，周长 (10 + 5) × 2 = 30（厘米）。', source: 'AI 生成', rule: '小学数学出题规则 v1.2', ai: '开发代理（离线）', vg: 'vg-m8-b', vk: '换情境', verify: { result: '更正', reason: '原答案标为 A（40），错误：拼接后两条边重合不再算周长，正确答案是 B（30）；同时补充了 A 选项的错误诊断。', before: '答案：A；解析：5 × 4 × 2 = 40' } },
  { id: 'q18', kps: ['m6', 'm7'], type: 'applied', level: 3, stem: '一辆小货车一次运 125 千克苹果，大货车一次运的是小货车的 4 倍。大货车一次运多少千克？两车各运一次共运多少千克？', answer: '500 千克；625 千克', rubric: [{ step: '用乘法求大货车运的（几倍）', key: '500', kp: 'm6', score: 2 }, { step: '多位数乘一位数笔算正确', key: '500', kp: 'm7', score: 1 }, { step: '求两车共运多少', key: '625', kp: 'm5', score: 2 }], explain: '125 × 4 = 500（千克）；500 + 125 = 625（千克）。', source: 'AI 生成', rule: '小学数学出题规则 v1.2', ai: '开发代理（离线）', vg: 'vg-m67-a', vk: '母题', verify: { result: '通过' }, status: '待审核', note: '题中用到 m5（三位数加法），但知识点只标了 m6、m7，已标为待审核' },
  { id: 'q19', kps: ['m2'], type: 'single', level: 1, stem: '电影 14:30 开始，16:00 结束，放映了多长时间？', options: [o('A', '1 小时 30 分'), o('B', '2 小时 30 分', '把 16 − 14 和 30 分加在一起了'), o('C', '1 小时 70 分', '按十进制减')], answer: 'A', explain: '从 14:30 到 16:00 经过 1 小时 30 分。', source: 'AI 生成', rule: '小学数学出题规则 v1.2', ai: '开发代理（离线）', vg: 'vg-m2-a', vk: '母题', verify: { result: '通过' } },
  { id: 'q20', kps: ['m2'], type: 'applied', level: 2, stem: '小红 7:45 从家出发，路上走了 25 分钟到学校。学校 8:00 开始早读，她迟到了吗？如果迟到，迟到了几分钟？', answer: '迟到了 10 分钟', rubric: [{ step: '求到校时间', key: '8:10', kp: 'm2', score: 2 }, { step: '判断是否迟到', key: '迟到', kp: 'm2', score: 1 }, { step: '求迟到几分钟', key: '10', kp: 'm2', score: 2 }], explain: '7:45 经过 25 分是 8:10，比 8:00 晚 10 分钟。答：迟到了，迟到 10 分钟。', source: 'AI 生成', rule: '小学数学出题规则 v1.2', ai: '开发代理（离线）', vg: 'vg-m2-b', vk: '换情境', verify: { result: '通过' } },
  { id: 'q21', kps: ['e2'], type: 'single', level: 1, stem: '别人对你说 “Hello! I\'m Sam.”，你应该回答：', options: [o('A', 'Hi! I\'m Amy.'), o('B', 'Goodbye!', '这是告别用语'), o('C', 'Thank you.', '这是道谢用语')], answer: 'A', explain: '对方介绍自己时，打招呼并介绍自己。', source: 'AI 生成', rule: '通用出题规则 v1.0', ai: '开发代理（离线）', vg: 'vg-e2-a', vk: '母题', verify: { result: '通过' } },
  { id: 'q22', kps: ['e1', 'e4'], type: 'fill', level: 3, stem: '— What colour is your ①____（尺子）?\n— It\'s ②____（蓝色的）.', blanks: [['ruler'], ['blue']], blankKp: ['e1', 'e4'], explain: 'ruler 尺子；blue 蓝色。', source: 'AI 生成', rule: '通用出题规则 v1.0', ai: '开发代理（离线）', vg: 'vg-e14-a', vk: '母题', verify: { result: '通过' } },
  { id: 'q23', kps: ['p1', 'p4'], type: 'applied', level: 3, stem: '一个电阻为 10 Ω 的电热器接在 6 V 电源上，通过它的电流是多少？它的电功率是多少？', answer: '0.6 A；3.6 W', rubric: [{ step: '用欧姆定律求电流 I = U / R', key: '0.6', kp: 'p1', score: 2 }, { step: '用 P = UI 求电功率', key: '3.6', kp: 'p4', score: 2 }, { step: '单位正确（A、W）', key: 'W', kp: null, score: 1 }], explain: 'I = U / R = 6 V / 10 Ω = 0.6 A；P = UI = 6 V × 0.6 A = 3.6 W。', source: 'AI 生成', rule: '初中物理出题规则 v0.9', ai: '开发代理（离线）', vg: 'vg-p14-a', vk: '母题', verify: { result: '通过' }, prog: '程序复算 0.6、3.6 一致' },
  { id: 'q24', kps: ['p3'], type: 'single', level: 1, stem: '两个灯泡并联在 3 V 电源上，L₁ 两端的电压是：', options: [o('A', '1.5 V', '按串联分压来算了'), o('B', '3 V'), o('C', '6 V')], answer: 'B', explain: '并联电路各支路两端电压相等，都等于电源电压。', source: 'AI 生成', rule: '初中物理出题规则 v0.9', ai: '开发代理（离线）', vg: 'vg-p3-a', vk: '母题', verify: { result: '通过' } },
  // ---- 老师导入 ----
  { id: 'q25', kps: ['m10'], type: 'applied', level: 1, stem: '三（1）班参加跳绳比赛的有 18 人，参加踢毽子比赛的有 15 人，两项都参加的有 6 人。参加这两项比赛的一共有多少人？', answer: '27 人', rubric: [{ step: '两项人数相加', key: '33', kp: 'm10', score: 2 }, { step: '减去重复的人数', key: '27', kp: 'm10', score: 2 }, { step: '写出答句', key: '人', kp: null, score: 1 }], explain: '18 + 15 − 6 = 27（人）。', source: '老师导入', file: '三年级上册单元卷.xlsx', vg: 'vg-m10-a', vk: '母题', verify: { result: '通过' } },
  { id: 'q26', kps: ['m9'], type: 'single', level: 1, stem: '把一张纸平均分成 4 份，涂色 1 份，涂色部分是这张纸的：', options: [o('A', '1/4'), o('B', '4/1', '分子分母写反了'), o('C', '1/3', '没有平均分的份数当分母')], answer: 'A', explain: '平均分成 4 份，取 1 份，是 1/4。', source: '老师导入', file: '三年级上册单元卷.xlsx', vg: 'vg-m9-a', vk: '母题' },
  { id: 'q27', kps: ['m4'], type: 'fill', level: 1, stem: '3 千米 = ①____ 米；5000 千克 = ②____ 吨', blanks: [['3000'], ['5']], explain: '1 千米 = 1000 米；1 吨 = 1000 千克。', source: '老师导入', file: '三年级上册单元卷.xlsx', vg: 'vg-m4-a', vk: '母题' },
];

const RULE_TEMPLATE = `---
名称: （规则名称，如：小学数学出题规则）
版本: 1.0
适用学科: 数学          # 可多个；“全部”表示通用
适用年级: P3, P4        # 可省略，表示全部
适用题型: 单选, 填空, 应用题
作者: （姓名）
---

## 总体要求
- 题目必须只考所标注的知识点，语言符合该年级学生的阅读水平。
- 数据、情境贴近学生生活，不出现不健康、带有偏见的内容。

## 题型规范
### 单选
- 3～4 个选项，只有一个正确；错误选项必须对应一种常见错误，并写出“错误原因”。
### 填空
- 每空只有一个确定答案，或列出全部可接受的写法；空用 ①②③ 标号。
### 应用题
- 必须写出“评分要点”：每一步做什么、关键结果、对应知识点、分值。

## 难度与变式
- ★1 基础：标准问法。★2 变式：换情境、反过来问、加干扰信息。★3 起：多个知识点。
- 变式要写明变式方式：换数字 / 换情境 / 反过来问 / 换表示方式 / 加干扰 / 换题型。

## 多知识点合并
- 只能合并“知识点管理”中设为“可合并”的知识点，按“怎么合并”的描述串联步骤。
- 每个知识点至少落在一个评分要点、一个空或一个错误选项上。
- 后一步的题面不能泄露前一步的答案。

## 干扰项与常见错误
- （列出本学科常见错误，如：周长和面积混淆、时间按十进制计算……）

## 自检清单
1. 答案唯一且正确，计算已验算。
2. 每个标注的知识点都被用到。
3. 解析完整，评分要点与解析一致。

## 示例
题型：应用题　知识点：长方形和正方形的周长　难度：★1
题干：一个长方形花坛长 8 米、宽 5 米，围一圈栅栏要多少米？
答案：26 米
评分要点：1) 列式 (8 + 5) × 2，对应“周长”，2 分；2) 计算得 26，2 分；3) 写单位和答句，1 分
解析：(8 + 5) × 2 = 26（米）。答：要 26 米。

## 禁止事项
- 不出需要看图才能作答的题（除非另附图片说明）。
`;

const RULE_SEED = [
  { id: 'r1', name: '通用出题规则', version: '1.0', scope: '全部学科 · 全部年级', types: '单选、填空、应用题', author: '开发方', status: '启用', at: '2026-10-24', size: 6.2, stats: { gen: 46, pass: 41, fix: 4, drop: 1 } },
  { id: 'r2', name: '小学数学出题规则', version: '1.2', scope: '数学 · P3、P4', types: '单选、填空、应用题', author: '张老师（在 Kimi 中训练）', status: '启用', at: '2026-10-24', size: 11.8, stats: { gen: 120, pass: 108, fix: 9, drop: 3 } },
  { id: 'r3', name: '小学数学出题规则', version: '1.1', scope: '数学 · P3、P4', types: '单选、填空、应用题', author: '张老师', status: '历史版本', at: '2026-10-20', size: 9.4, stats: { gen: 80, pass: 63, fix: 12, drop: 5 } },
  { id: 'r4', name: '初中物理出题规则', version: '0.9', scope: '物理 · J2、J3', types: '单选、填空、应用题', author: '开发方', status: '启用', at: '2026-10-24', size: 8.1, stats: { gen: 30, pass: 27, fix: 3, drop: 0 } },
];

const AI_PROFILES_SEED = [
  { id: 'dev', name: '开发代理（离线）', vendor: '开发代理', model: '由开发方完成', url: '—', key: false, vision: true, web: true },
  { id: 'ds', name: 'DeepSeek-V3', vendor: 'DeepSeek', model: 'deepseek-chat', url: 'https://api.deepseek.com/v1', key: false, vision: false, web: false },
  { id: 'qw', name: '通义千问 Max（联网）', vendor: '阿里云百炼', model: 'qwen-max', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', key: false, vision: false, web: true },
  { id: 'db', name: '豆包视觉', vendor: '火山方舟', model: 'doubao-vision-pro', url: 'https://ark.cn-beijing.volces.com/api/v3', key: false, vision: true, web: false },
  { id: 'mu', name: 'MinerU', vendor: 'MinerU', model: '文档识别', url: 'https://mineru.net', key: true, vision: true, web: false },
];

const ROLES = [
  { id: 'kp', name: '知识点整理', icon: '📚', desc: '联网获取教材知识点，建议先学后学和可合并关系', verify: null, note: '3.0 新增角色（需求 §0.2 A1）。可不填，不填时使用出题 AI' },
  { id: 'gen', name: '出题', icon: '✏️', desc: '按规则文件生成习题和变式', verify: '验证题目是否合理、答案是否正确、解析和评分要点是否正确完整；不对时给出更正后的题目' },
  { id: 'judge', name: '判题', icon: '✅', desc: '判断应用题对错，指出错在哪一步', verify: '验证对错判断和指出的错误点是否正确；不对时给出更正后的结论' },
  { id: 'ocr', name: '识别', icon: '📷', desc: '读出纸质试卷照片中的作答', verify: '对照照片验证识别是否准确；不对时逐题更正' },
  { id: 'eval', name: '学习评估', icon: '📈', desc: '按知识点掌握情况调整出题比例和难度', verify: null, note: '不填时使用规则算法（需求 §9.4）' },
];

const STUDENTS_SEED = [
  { id: 's1', nick: '小禾', avatar: '🐣', stage: 'P3', user: 'student_a' },
  { id: 's2', nick: '阿远', avatar: '🚀', stage: 'J3', user: 'student_c' },
];

// 学生最近作答：kp -> { c1: ★1 计数, c2: ★2 计数, recent: 最近作答对错串 }
const MASTERY_SEED = {
  s1: { m1: [5, 3, '1111011111'], m2: [2, 0, '0101100110'], m3: [5, 5, '1111111111'], m4: [5, 1, '1101111011'], m5: [3, 0, '1001101001'], m6: [1, 0, '0010010001'], m7: [0, 0, ''], m8: [4, 0, '1101101110'], m9: [0, 0, ''], m10: [0, 0, ''], e1: [5, 2, '1111111011'], e2: [4, 0, '1110110111'], e3: [5, 5, '1111111111'], e4: [1, 0, '0110100'] },
  s2: { p1: [3, 0, '1011010110'], p2: [5, 4, '1111111110'], p3: [2, 0, '0100101001'], p4: [0, 0, ''] },
};
