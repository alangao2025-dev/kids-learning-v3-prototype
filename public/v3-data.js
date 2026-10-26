'use strict';
/* 学习系统 3.0 原型：在 2.1 原型数据基础上的 3.0 变化（题型转换、知识点关系、规则文件、AI 配置等） */

// ================= 题型转换（需求 §4.6） =================
const QTYPE_NAME = { single: '单选题', fill: '填空题', applied: '应用题' };
const ORIG_NAME = { choice: '单选', judge: '判断', listen: '听音选择', fill: '填空', order: '排序', steps: '分步解答', twotier: '两段式选择', balance: '方程式配平' };
const CIRCLED = '①②③④⑤⑥⑦⑧⑨';
function hashStr(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function seededOrder(n, seed) {
  const idx = [...Array(n).keys()]; let h = hashStr(seed) || 1;
  for (let i = n - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; const j = h % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  if (n > 1 && idx.every((x, i) => x === i)) idx.push(idx.shift());
  return idx;
}
// 选择形式的步骤改为文字要点：数学式子用整个选项，文字选项取与其它选项区分开的最短前缀
function stepKey(st) {
  if (st.kind !== 'choice') return st.answer[0];
  const ans = st.options[st.answer];
  if (/\d/.test(ans)) return ans.replace(/\s/g, '');
  const others = st.options.filter((_, i) => i !== st.answer);
  for (let n = 1; n <= ans.length; n++) if (others.every(o => !o.startsWith(ans.slice(0, n)))) return ans.slice(0, n);
  return ans;
}
function convertQ(q) {
  if (q.v3) return;
  const t = q.type; q.origType = ORIG_NAME[t]; q.source ||= '2.x 保留';
  if (t === 'choice' || t === 'listen') q.type = 'single';
  else if (t === 'judge') { q.type = 'single'; q.judge = true; q.conv = '判断 → 单选（A 对 / B 错）'; }
  else if (t === 'twotier') {
    const combos = [[q.answer, q.reasonAnswer]];
    const wrongR = q.reasons.map((_, i) => i).filter(i => i !== q.reasonAnswer);
    const wrongA = q.options.map((_, i) => i).filter(i => i !== q.answer);
    for (const c of [[q.answer, wrongR[0]], [wrongA[0], wrongR[0]], [wrongA[0], q.reasonAnswer], [q.answer, wrongR[1]]]) if (c[1] != null && combos.length < 4 && !combos.some(x => x[0] === c[0] && x[1] === c[1])) combos.push(c);
    const order = seededOrder(combos.length, q.id);
    const opts = order.map(i => combos[i]);
    q.options = opts.map(([a, r]) => `${q.options[a]}；理由：${q.reasons[r]}`);
    q.answer = opts.findIndex(([a, r]) => a === combos[0][0] && r === combos[0][1]);
    q.diag = Object.fromEntries(opts.map(([a, r], i) => [i, a === combos[0][0] ? '答案对了，但理由不对' : r === combos[0][1] ? '理由对了，但答案不对' : '答案和理由都不对']).filter(([i]) => Number(i) !== q.answer));
    q.type = 'single'; q.conv = '两段式 → 单选（选项为“答案 + 理由”的组合，只保留正确组合和 3 个最常见的错误组合）';
  } else if (t === 'order') {
    const order = seededOrder(q.tokens.length, q.id); const shown = order.map(i => q.tokens[i]);
    const pos = []; const taken = new Set();
    for (const tok of q.answer) { const i = shown.findIndex((s, j) => s === tok && !taken.has(j)); taken.add(i); pos.push(i + 1); }
    q.stem += `\n${shown.map((s, i) => `${CIRCLED[i]} ${s}`).join('　')}`;
    q.blanks = [{ pre: '按顺序写出序号：', suf: '', ans: [pos.join('')] }]; q.orderMode = true;
    q.type = 'fill'; q.conv = '排序 → 填空（按顺序写出序号，一空）';
  } else if (t === 'balance') {
    q.stem += `\n${q.parts.map((p, i) => `${i === q.split ? ` =${q.cond || ''}= ` : i ? ' + ' : ''}${CIRCLED[i]}${p.f}`).join('')}`;
    q.blanks = q.parts.map((p, i) => ({ pre: `${CIRCLED[i]} ${p.f} 的化学计量数`, suf: '', ans: [String(q.coefs[i])] }));
    q.balance = true; q.type = 'fill'; q.conv = '配平 → 填空（每个化学计量数一空，判分仍检查原子守恒）';
  } else if (t === 'steps') {
    q.rubric = q.steps.map(st => ({ step: st.label + (st.kind === 'choice' ? '' : `（${st.pre || ''}…${st.suf || ''}）`), key: stepKey(st), kp: 'kp' in st ? st.kp : (q.kps?.[0] ?? null), score: 2 }));
    q.answer = q.answerText; q.type = 'applied'; q.conv = '分步解答 → 应用题（原来的每一步转为评分要点；选择形式的步骤改为文字描述）';
  }
  q.v3 = true;
}

// ================= 3.0 新增题目：AI 生成（按规则文件）、老师导入 =================
const V3_QUESTIONS = [
  { id: 'a1', subject: 'math', stage: 'P3', kps: ['math-P3-1'], level: 2, type: 'fill', stem: '小明跑步用了 150 秒，合几分几秒？', blanks: [{ pre: '150 秒 =', suf: '分', ans: ['2'] }, { pre: '', suf: '秒', ans: ['30'] }], hints: ['1 分 = 60 秒，150 里面有几个 60？', '150 = 120 + 30。'], explain: '150 秒 = 120 秒 + 30 秒 = 2 分 30 秒。', answerText: '2 分 30 秒', source: 'AI 生成', rule: '小学数学出题规则 v1.2', ai: '开发代理（离线）', verify: { result: '通过' }, vk: '反过来问' },
  { id: 'a2', subject: 'math', stage: 'P3', kps: ['math-P3-2', 'math-P3-1'], level: 3, type: 'applied', stem: '一节课 40 分钟，第一节课 8:10 开始。下课后休息 600 秒，第二节课几点开始？', answer: '9:00', rubric: [{ step: '求第一节课下课时间', key: '8:50', kp: 'math-P3-2', score: 2 }, { step: '把 600 秒换算成分', key: '10', kp: 'math-P3-1', score: 2 }, { step: '求第二节课开始时间', key: '9:00', kp: 'math-P3-2', score: 1 }], hints: ['先算第一节课几点下课。', '600 秒是几分？'], explain: '8:10 经过 40 分是 8:50；600 秒 = 10 分；8:50 再过 10 分是 9:00。答：第二节课 9:00 开始。', answerText: '9:00', source: 'AI 生成', rule: '小学数学出题规则 v1.2', ai: '开发代理（离线）', verify: { result: '更正', reason: '原题“休息 10 分”没有用到“秒的换算”，与标注的知识点不符；改为 600 秒，并补上换算这一评分要点。', before: '……下课后休息 10 分钟，第二节课几点开始？（评分要点只有 2 条，“秒的认识”没有对应步骤）' } },
  { id: 'a3', subject: 'math', stage: 'P3', kps: ['math-P3-8', 'math-P3-7'], level: 3, type: 'applied', stem: '用一根铁丝正好围成一个边长 26 厘米的正方形。这根铁丝长多少厘米？如果改围成一个长 30 厘米的长方形，宽是多少厘米？', answer: '104 厘米；22 厘米', rubric: [{ step: '求正方形周长（铁丝长）', key: '104', kp: 'math-P3-7', score: 2 }, { step: '求长方形长与宽的和', key: '52', kp: 'math-P3-8', score: 1 }, { step: '求长方形的宽', key: '22', kp: 'math-P3-8', score: 2 }], hints: ['铁丝长 = 正方形周长。', '长 + 宽 = 周长 ÷ 2。'], explain: '26 × 4 = 104（厘米）；104 ÷ 2 = 52（厘米）；52 − 30 = 22（厘米）。', answerText: '104 厘米；22 厘米', source: 'AI 生成', rule: '小学数学出题规则 v1.2', ai: '开发代理（离线）', verify: { result: '通过' }, prog: '程序复算 104、52、22 一致' },
  { id: 'a4', subject: 'math', stage: 'P3', kps: ['math-P3-8'], level: 2, type: 'single', stem: '把两个边长 5 厘米的正方形拼成一个长方形，长方形的周长是多少厘米？', options: ['40', '30', '20'], answer: 1, diag: { 0: '把两个正方形的周长直接相加，没去掉拼在一起的两条边', 2: '只算了一个正方形的周长' }, hints: ['拼成的长方形长多少、宽多少？', '长 10 厘米、宽 5 厘米。'], explain: '拼成长 10 厘米、宽 5 厘米的长方形，周长 (10 + 5) × 2 = 30（厘米）。', answerText: 'B. 30', source: 'AI 生成', rule: '小学数学出题规则 v1.2', ai: '开发代理（离线）', verify: { result: '更正', reason: '原答案标为 A（40），错误：拼接后两条边重合不再算周长，正确答案是 B（30）；同时补充了 A 选项的错误诊断。', before: '答案：A；解析：5 × 4 × 2 = 40' }, vk: '换情境' },
  { id: 'a5', subject: 'math', stage: 'P3', kps: ['math-P3-6', 'math-P3-7'], level: 3, type: 'applied', stem: '一辆小货车一次运 125 千克苹果，大货车一次运的是小货车的 4 倍。大货车一次运多少千克？两车各运一次共运多少千克？', answer: '500 千克；625 千克', rubric: [{ step: '用乘法求大货车运的（几倍）', key: '125×4', kp: 'math-P3-6', score: 2 }, { step: '多位数乘一位数笔算', key: '500', kp: 'math-P3-7', score: 2 }, { step: '求两车共运多少', key: '625', kp: 'math-P3-5', score: 1 }], hints: ['4 倍就是 4 个 125。', '共运 = 大货车 + 小货车。'], explain: '125 × 4 = 500（千克）；500 + 125 = 625（千克）。', answerText: '500 千克；625 千克', source: 'AI 生成', rule: '小学数学出题规则 v1.2', ai: '开发代理（离线）', verify: { result: '通过' }, status: '待审核', note: '题中用到“三位数加减三位数”，但知识点只标了“倍的认识”“多位数乘一位数”，程序检查标为待审核' },
  { id: 'a6', subject: 'math', stage: 'P3', kps: ['math-P3-2'], level: 2, type: 'applied', stem: '小红 7:45 从家出发，路上走了 25 分钟到学校。学校 8:00 开始早读，她迟到了吗？如果迟到，迟到了几分钟？', answer: '迟到了 10 分钟', rubric: [{ step: '求到校时间', key: '8:10', kp: 'math-P3-2', score: 2 }, { step: '判断是否迟到', key: '迟到', kp: 'math-P3-2', score: 1 }, { step: '求迟到几分钟', key: '10', kp: 'math-P3-2', score: 2 }], hints: ['7:45 再过 25 分是几点？', '和 8:00 比一比。'], explain: '7:45 经过 25 分是 8:10，比 8:00 晚 10 分钟。答：迟到了，迟到 10 分钟。', answerText: '迟到了 10 分钟', source: 'AI 生成', rule: '小学数学出题规则 v1.2', ai: '开发代理（离线）', verify: { result: '通过' } },
  { id: 'a7', subject: 'math', stage: 'P3', kps: ['math-P3-2'], level: 1, type: 'single', stem: '电影 14:30 开始，16:00 结束，放映了多长时间？', options: ['1 小时 30 分', '2 小时 30 分', '1 小时 70 分'], answer: 0, diag: { 1: '把 16 − 14 和 30 分加在一起了', 2: '按十进制减了' }, hints: ['从 14:30 到 15:30 是多久？', '15:30 到 16:00 还有 30 分。'], explain: '从 14:30 到 16:00 经过 1 小时 30 分。', answerText: 'A. 1 小时 30 分', source: 'AI 生成', rule: '小学数学出题规则 v1.2', ai: '开发代理（离线）', verify: { result: '通过' } },
  { id: 'a8', subject: 'math', stage: 'P3', kps: ['math-P3-5'], level: 2, type: 'applied', stem: '学校图书室有故事书 465 本，借出 178 本后，又买来 236 本。现在有故事书多少本？', answer: '523 本', rubric: [{ step: '求借出后剩下多少本', key: '287', kp: 'math-P3-5', score: 2 }, { step: '求买来后共有多少本', key: '523', kp: 'math-P3-5', score: 2 }, { step: '写出答句和单位', key: '本', kp: null, score: 1 }], hints: ['先算借出后还剩多少本。', '再加上买来的。'], explain: '465 − 178 = 287（本），287 + 236 = 523（本）。答：现在有故事书 523 本。', answerText: '523 本', source: 'AI 生成', rule: '小学数学出题规则 v1.2', ai: '开发代理（离线）', verify: { result: '通过' }, prog: '程序复算 287、523 一致' },
  { id: 't1', subject: 'math', stage: 'P3', kps: ['math-P3-10'], level: 1, type: 'applied', stem: '三（1）班参加跳绳比赛的有 18 人，参加踢毽子比赛的有 15 人，两项都参加的有 6 人。参加这两项比赛的一共有多少人？', answer: '27 人', rubric: [{ step: '两项人数相加', key: '33', kp: 'math-P3-10', score: 2 }, { step: '减去重复的人数', key: '27', kp: 'math-P3-10', score: 2 }, { step: '写出答句', key: '人', kp: null, score: 1 }], hints: ['两项都参加的人被算了两次。', '18 + 15 − 6。'], explain: '18 + 15 − 6 = 27（人）。', answerText: '27 人', source: '老师导入', file: '三年级上册单元卷.xlsx', verify: { result: '通过' } },
  { id: 't2', subject: 'math', stage: 'P3', kps: ['math-P3-4'], level: 1, type: 'fill', stem: '填一填：', blanks: [{ pre: '3 千米 =', suf: '米', ans: ['3000'] }, { pre: '5000 千克 =', suf: '吨', ans: ['5'] }], hints: ['1 千米 = 1000 米。', '1 吨 = 1000 千克。'], explain: '1 千米 = 1000 米；1 吨 = 1000 千克。', answerText: '3000；5', source: '老师导入', file: '三年级上册单元卷.xlsx' },
  { id: 'a9', subject: 'english', stage: 'P3', book: 'en-pep24', kps: ['english-P3-12'], level: 1, type: 'fill', stem: '— What colour is the apple?\n— It\'s ______.（红色的）', blanks: [{ pre: 'It\'s', suf: '.', ans: ['red'] }], hints: ['苹果常常是什么颜色？', '红色：red。'], explain: 'red 红色的。', answerText: 'red', source: 'AI 生成', rule: '通用出题规则 v1.0', ai: '开发代理（离线）', verify: { result: '通过' } },
];
for (const q of V3_QUESTIONS) q.v3 = true;
QUESTIONS.push(...V3_QUESTIONS);
QUESTIONS.forEach(convertQ);
// 变式组：同一知识点、同一难度为一组（§4.3）
(() => {
  const groups = {};
  for (const q of QUESTIONS) { const k = `${(q.kps || [q.subject + '-' + q.band]).join('+')}|${q.level || 1}`; (groups[k] ||= []).push(q); }
  let n = 0;
  for (const list of Object.values(groups)) {
    const vg = `VG${String(++n).padStart(3, '0')}`;
    list.forEach((q, i) => { q.vg = vg; q.vk ||= i === 0 ? '母题' : q.type !== list[0].type ? '换题型' : /变式/.test(q.stem) ? '换情境' : ['换数字', '反过来问', '加干扰'][i % 3]; });
  }
})();

// ================= 知识点关系（§3） =================
// 先学后学：[前置, 后学, must|suggest, ok|pending, 来源]
const PREREQ_SEED = [
  ['math-P3-1', 'math-P3-2', 'must', 'ok', '联网获取 · 教师确认'],
  ['math-P3-3', 'math-P3-5', 'must', 'ok', '联网获取 · 教师确认'],
  ['math-P3-3', 'math-P3-6', 'suggest', 'ok', '教师添加'],
  ['math-P3-6', 'math-P3-7', 'suggest', 'ok', '联网获取 · 教师确认'],
  ['math-P3-7', 'math-P3-8', 'suggest', 'ok', '联网获取 · 教师确认'],
  ['math-P3-4', 'math-P3-8', 'must', 'ok', '联网获取 · 教师确认'],
  ['math-P3-5', 'math-P3-10', 'suggest', 'pending', 'AI 建议'],
  ['math-P3-7', 'math-P4-5', 'must', 'ok', '联网获取 · 教师确认'],
  ['math-P4-5', 'math-P4-6', 'must', 'ok', '联网获取 · 教师确认'],
  ['math-P4-5', 'math-P4-8', 'suggest', 'ok', '教师添加'],
  ['english-P3-8', 'english-P3-9', 'suggest', 'ok', '教师添加'],
  ['english-P3-11', 'english-P3-12', 'suggest', 'ok', '教师添加'],
  ['physics-J3-4', 'physics-J3-6', 'must', 'ok', '联网获取 · 教师确认'],
  ['physics-J3-5', 'physics-J3-6', 'suggest', 'ok', '联网获取 · 教师确认'],
  ['physics-J3-6', 'physics-J3-7', 'must', 'ok', '联网获取 · 教师确认'],
  ['chemistry-J3-4', 'chemistry-J3-5', 'must', 'ok', '联网获取 · 教师确认'],
  ['chemistry-J3-5', 'chemistry-J3-7', 'must', 'ok', '联网获取 · 教师确认'],
  ['chemistry-J3-6', 'chemistry-J3-7', 'must', 'ok', '联网获取 · 教师确认'],
  ['chemistry-J3-7', 'chemistry-J3-8', 'must', 'ok', '联网获取 · 教师确认'],
];
// 3.0 补充的合并关系：[A, B, yes|no, 怎么合并 / 原因, ok|pending]
const COMBO_V3 = [
  ['math-P3-1', 'math-P3-2', 'yes', '先把时间单位换算成同一种，再计算经过的时间', 'ok'],
  ['math-P3-6', 'math-P3-9', 'no', '“几倍”和“几分之几”容易混淆，三年级先分开练', 'ok'],
  ['math-P3-3', 'math-P3-10', 'yes', '重叠问题中用两位数加减计算总人数', 'pending'],
  ['physics-J3-6', 'physics-J3-7', 'yes', '先用欧姆定律求电流，再求电功率', 'ok'],
  ['physics-J3-4', 'physics-J3-6', 'yes', '先用串、并联规律求电流或电压，再用欧姆定律', 'ok'],
];

// 学生最近 10 次作答（评估用，1 对 0 错）
const RECENT_SEED = {
  s1: { 'math-P3-1': '1101011011', 'math-P3-3': '1111111111', 'math-P3-4': '1101111011', 'math-P3-5': '1001101001', 'math-P3-6': '0010010001', 'math-P3-7': '1111011111', 'math-P3-8': '1101101110', 'english-P3-8': '1110110111', 'english-P3-12': '1111111011', 'english-P3-13': '0110100' },
};

// 联网获取教材知识点（模拟结果，§2.2）
const FETCH_SIM = {
  'math-P3': {
    book: '人教版 · 数学 · 三年级上册（2024 年版）',
    add: [
      { name: '万以内数的估算', unit: '万以内的加法和减法（二）', type: '理解应用', qtypes: ['single', 'fill'], src: '人教社教材目录 第 4 单元；课程标准（2022 年版）“运算能力”' },
      { name: '口算多位数乘一位数', unit: '多位数乘一位数', type: '技能', qtypes: ['fill'], src: '人教社教材目录 第 6 单元', dup: 'math-P3-7' },
      { name: '分数的简单加减法', unit: '分数的初步认识', type: '技能', qtypes: ['single', 'fill'], src: '人教社教材目录 第 8 单元' },
      { name: '认识四边形', unit: '长方形和正方形', type: '理解应用', qtypes: ['single'], src: '人教社教材目录 第 7 单元' },
      { name: '数字编码', unit: '数学广角', type: '理解应用', qtypes: ['single'], src: null },
    ],
    rename: [{ id: 'math-P3-4', to: '毫米、分米、千米和吨的认识', src: '人教社教材目录 第 3 单元' }],
    rels: [
      { k: 'pre', a: 'math-P3-5', b: '#0', kind: 'suggest', why: '估算建立在笔算加减之上' },
      { k: 'combo', a: '#0', b: 'math-P3-5', how: '先估算，再笔算，并用估算检验笔算结果' },
      { k: 'pre', a: '#1', b: 'math-P3-7', kind: 'suggest', why: '教材中口算在笔算之前' },
      { k: 'pre', a: 'math-P3-9', b: '#2', kind: 'must', why: '同分母分数加减要先认识分数' },
      { k: 'combo', a: '#2', b: 'math-P3-6', v: 'no', how: '“几分之几”和“几倍”容易混淆' },
      { k: 'pre', a: '#3', b: 'math-P3-8', kind: 'must', why: '求周长前要认识长方形、正方形的特征' },
    ],
  },
};

// ================= 出题规则（§5） =================
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

// ================= AI 配置（§8） =================
const AI_PROFILES_SEED = [
  { id: 'dev', name: '开发代理（离线）', vendor: '开发代理', model: '由开发方完成', url: '—', key: false, vision: true, web: true },
  { id: 'ds', name: 'DeepSeek-V3', vendor: 'DeepSeek', model: 'deepseek-chat', url: 'https://api.deepseek.com/v1', key: true, vision: false, web: false },
  { id: 'qw', name: '通义千问 Max（联网）', vendor: '阿里云百炼', model: 'qwen-max', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', key: false, vision: false, web: true },
  { id: 'db', name: '豆包视觉', vendor: '火山方舟', model: 'doubao-vision-pro', url: 'https://ark.cn-beijing.volces.com/api/v3', key: false, vision: true, web: false },
  { id: 'mu', name: 'MinerU', vendor: 'MinerU', model: '文档识别', url: 'https://mineru.net', key: true, vision: true, web: false },
];
const ROLES = [
  { id: 'kp', name: '知识点整理', icon: '📚', desc: '联网获取教材知识点，建议先学后学和可合并关系', verify: null, note: '3.0 新增角色（需求 A1）。不填时使用出题 AI' },
  { id: 'gen', name: '出题', icon: '✏️', desc: '按规则文件生成习题和变式', verify: '验证题目是否合理、答案是否正确、解析和评分要点是否正确完整；不对时给出更正后的题目' },
  { id: 'judge', name: '判题', icon: '✅', desc: '判断应用题对错，指出错在哪一步', verify: '验证对错判断和指出的错误点是否正确；不对时给出更正后的结论' },
  { id: 'ocr', name: '识别', icon: '📷', desc: '读出纸质试卷照片中的作答', verify: '对照照片验证识别是否准确；不对时逐题更正' },
  { id: 'eval', name: '学习评估', icon: '📈', desc: '按知识点掌握情况调整出题比例和难度', verify: null, note: '不填时使用规则算法（需求 §9.4）' },
];
