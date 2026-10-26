'use strict';
/* 学习系统 3.0 原型：在 2.1 原型上修改，纯前端模拟，数据保存在浏览器 localStorage */

// ================= 工具 =================
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function rng(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
const shuffle = (arr, r = Math.random) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const BASE_DATE = new Date(2026, 9, 20);
const ds = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function today() { const d = new Date(BASE_DATE); d.setDate(d.getDate() + (S.dayOffset || 0)); return d; }
const todayStr = () => ds(today());
function addDays(n, from) { const d = from ? new Date(from + 'T00:00:00') : today(); d.setDate(d.getDate() + n); return ds(d); }
const dayDiff = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
const md = s => s ? s.slice(5) : '—';
const fmtDur = sec => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
const nowStr = () => `${todayStr()} ${new Date().toTimeString().slice(0, 5)}`;
const pct = (a, b) => b ? Math.round(a * 100 / b) : 0;

// ================= 状态 =================
const KEY = 'kl-v3-prototype-2';
let S;
let UI = {}; // 不持久化的页面临时状态

function seedState() {
  const st = { dayOffset: 0, currentSid: null, session: null, lastResult: null, counted: {}, logs: [], tasks: [], assignments: [], aiUsedToday: 18230 };
  st.subjects = SUBJECT_SEED.map(s => ({ ...s, stages: [...s.stages], enabled: true }));
  st.books = BOOK_SEED.map(b => ({ ...b, stages: [...b.stages] }));
  st.bookDefault = JSON.parse(JSON.stringify(BOOK_DEFAULT_SEED));
  st.combos = [...COMBO_SEED.map(([a, b, how]) => ({ a, b, how, v: 'yes', state: 'ok', src: '教师确认' })), ...COMBO_V3.map(([a, b, v, how, state]) => ({ a, b, v, how, state, src: state === 'ok' ? '教师确认' : 'AI 建议 · 待确认' }))];
  st.prereqs = PREREQ_SEED.map(([a, b, kind, state, src]) => ({ a, b, kind, state, src }));
  st.mem = { s1: {}, s2: {}, s3: {} }; st.reads = { s1: {}, s2: {}, s3: {} };
  st.config = {
    threshold: [5, 5, 5, 5, 5], bankTarget: [10, 10, 10, 10, 10], examWeight: 1, examCount: 10, examScope: 'started', examUpRatio: 20, examPerKp: 2, examLimit: 0,
    practiceCount: 5, allowStageChange: true, autoBankL1: true, onDemandHigher: true, aiDirectEnable: true, reviewDays: 30, wordDays: 2, wordAllowDelete: false,
    webSearch: true, targetAcc: [75, 85], dayMin: { P: 40, J: 60 }, secPerQ: { P: 90, J: 120 }, judgeConf: 0.8, dailyBudget: 200000, monthlyBudget: 3000000, requirePrev: false, openDone: 3, allowThemeSwitch: true,
    themeByStage: { P1: 'kid', P2: 'kid', P3: 'kid', P4: 'kid', P5: 'kid', P6: 'kid', J1: 'teen', J2: 'teen', J3: 'teen' },
    comboCap: { chinese: [1, 1, 2, 2], math: [2, 3, 4, 5], english: [1, 2, 2, 3], physics: [5, 5, 5, 5], chemistry: [5, 5, 5, 5] }, comboGate: true, audioServer: true,
  };
  st.kps = [];
  const seedBook = (sub, stage, b) => b || (sub === 'english' ? (stage[0] === 'J' ? 'en-gox' : 'en-pep12') : BOOK_DEFAULT_SEED[sub][0]);
  for (const [stage, bySub] of Object.entries(KP_SEED)) {
    for (const [sub, list] of Object.entries(bySub)) {
      list.forEach(([unit, name, diff, book], i) => {
        const id = `${sub}-${stage}-${i + 1}`; const r = rng(id);
        const real = REAL_BANK_STAGES.includes(stage);
        const bank = real ? [1, 2, 3, 4, 5].map(L => QUESTIONS.filter(q => q.stage === stage && q.kps.includes(id) && q.level === L).length) : [r() < .2 ? 6 + Math.floor(r() * 4) : 10, r() < .55 ? 10 : Math.floor(r() * 7) + 2, r() < .3 ? Math.floor(r() * 8) + 2 : 0, r() < .12 ? Math.floor(r() * 4) + 1 : 0, 0];
        st.kps.push({ id, subject: sub, stage, term: '上', unit, name, diff, book: seedBook(sub, stage, book), desc: `学会“${name}”，能独立、正确地完成相关题目。`, prereq: '', status: !real && r() < .05 ? '待审核' : '启用', bank, source: real ? '联网搜索 · 教师已确认' : r() < .8 ? '联网搜索' : '教师录入', order: i, type: KP_TYPE[id] || defaultType(sub, name), needFig: FIG_KPS.includes(id) });
      });
    }
  }
  st.students = [
    { id: 's1', username: 'student_a', nick: '小禾', avatar: '🐣', stage: 'P3', status: '正常', books: { english: 'en-pep24' }, desc: '小学三年级（3.0 演示用）：数学有应用题（AI 判分、指出错在哪一步、可申诉），“计算经过的时间”要先学“秒的认识”；英语用 PEP 2024 新版' },
    { id: 's2', username: 'student_b', nick: '小满', avatar: '🐼', stage: 'P4', status: '正常', books: { english: 'en-pep12' }, desc: '学习中：小学四年级，三科都有进度，有错题、单词本和一次纸质考核' },
    { id: 's3', username: 'student_c', nick: '阿远', avatar: '🚀', stage: 'J3', status: '正常', books: {}, desc: '跨阶段：初三，初二时学得很扎实，物理化学刚开始' },
  ];
  st.stageHistory = [
    { sid: 's2', at: '2026-09-01', from: 'P3', to: 'P4', by: 'student_b' },
    { sid: 's3', at: '2025-09-01', from: 'J1', to: 'J2', by: 'teacher' },
    { sid: 's3', at: '2026-09-01', from: 'J2', to: 'J3', by: 'student_c' },
    { sid: 's3', at: '2026-09-03', from: 'J3', to: 'J2', by: 'student_c' },
    { sid: 's3', at: '2026-09-03', from: 'J2', to: 'J3', by: 'student_c' },
  ];
  // 掌握度
  st.mastery = { s1: {}, s2: {}, s3: {} };
  const T = 5;
  const p3 = { 'math-P3-1': [3, 0], 'math-P3-3': [5, 2], 'math-P3-4': [5, 1], 'math-P3-5': [5, 0], 'math-P3-6': [2, 0], 'math-P3-7': [5, 3], 'math-P3-8': [5, 1], 'chinese-P3-3': [4, 0], 'chinese-P3-8': [5, 1], 'english-P3-8': [5, 0], 'english-P3-12': [5, 2], 'english-P3-13': [3, 0] };
  for (const [k, [a, b]] of Object.entries(p3)) st.mastery.s1[k] = { c: [a, b, 0, 0, 0], last: addDays(-(1 + (a + b) % 6), '2026-10-20') };
  for (const k of st.kps) {
    if (k.stage === 'P4') {
      const r = rng('s2' + k.id); const p = r();
      if (p < .18) continue;
      const c1 = p < .45 ? 1 + Math.floor(r() * 4) : T;
      const c2 = c1 === T ? (r() < .45 ? T : Math.floor(r() * 5)) : 0;
      const c3 = c2 === T && r() < .5 ? Math.floor(r() * 6) : 0;
      st.mastery.s2[k.id] = { c: [c1, c2, c3, 0, 0], last: addDays(-Math.floor(r() * 14), '2026-10-20') };
    }
    if (k.stage === 'J2') {
      const r = rng('s3' + k.id); const strong = k.subject === 'math' || k.subject === 'physics';
      const c = strong ? [T, T, r() < .7 ? T : 3, r() < .4 ? 2 + Math.floor(r() * 4) : 0, 0] : [T, 2 + Math.floor(r() * 4), 0, 0, 0];
      st.mastery.s3[k.id] = { c, last: addDays(-(r() < .5 ? 40 + Math.floor(r() * 25) : 5 + Math.floor(r() * 20)), '2026-10-20') };
    }
    if (k.stage === 'J3') {
      const r = rng('s3' + k.id); const newSub = k.subject === 'physics' || k.subject === 'chemistry';
      if (newSub) { if (k.order < 2) st.mastery.s3[k.id] = { c: [1 + Math.floor(r() * 2), 0, 0, 0, 0], last: addDays(-Math.floor(r() * 5), '2026-10-20') }; }
      else if (r() < .7) { const c1 = 1 + Math.floor(r() * 5); st.mastery.s3[k.id] = { c: [c1, c1 === T ? Math.floor(r() * 4) : 0, 0, 0, 0], last: addDays(-Math.floor(r() * 10), '2026-10-20') }; }
    }
  }
  const seedMem = (sid, kpId, spec, date = '2026-10-13') => {
    st.mem[sid][kpId] = MEMORY_ITEMS[kpId].items.map((_, i) => {
      const v = spec[i] || 0;
      if (v === 2) return { r: [addDays(-3, date), addDays(-1, date)], w: [addDays(-2, date), date], next: null, m: date };
      if (v === 1) return { r: ['2026-10-19'], w: [], next: '2026-10-20', m: null };
      return { r: [], w: [], next: null, m: null };
    });
  };
  seedMem('s2', 'english-P4-1', [2, 2, 2, 2, 1, 1]); seedMem('s2', 'english-P4-2', [2, 2, 1]); seedMem('s2', 'chinese-P4-3', [2, 2, 1]);
  seedMem('s3', 'chinese-J2-3', [2, 2, 2, 2, 2], '2026-08-20'); seedMem('s3', 'chemistry-J3-4', [2, 2, 2, 1, 1]); seedMem('s3', 'chinese-J3-4', [2, 1, 1]);
  seedMem('s1', 'chinese-P3-2', [2, 2, 1, 1]); seedMem('s1', 'chinese-P3-1', [2, 2, 2, 1, 1, 1]);
  st.reads.s2 = { 'chinese-P4-4': [{ at: '2026-10-18', title: '奶奶的菜园', obj: '2/2', self: '答到一部分', eval: null }, { at: '2026-10-11', title: '秋天的树叶', obj: '1/2', self: '都答到了', eval: '良', comment: '要点找得准，可以写得再具体些' }], 'chinese-P4-1': [{ at: '2026-10-08', title: '走月亮（片段）', obj: '2/2', self: '都答到了', eval: null }] };
  st.reads.s3 = { 'chinese-J2-4': [{ at: '2026-06-20', title: '背影（片段）', obj: '2/2', self: '都答到了', eval: '优' }, { at: '2026-06-02', title: '白杨礼赞（片段）', obj: '2/2', self: '答到一部分', eval: '良' }, { at: '2026-05-21', title: '春', obj: '1/2', self: '答到一部分', eval: null }], 'chinese-J3-1': [{ at: '2026-10-15', title: '村口的老槐树', obj: '2/2', self: '答到一部分', eval: null }] };
  st.datasets = [
    ...Object.entries(MEMORY_ITEMS).map(([kpId, c]) => ({ id: 'd-' + kpId, kpId, name: c.data, count: c.items.length, src: c.src, status: c.pending ? '待核对' : '已核对', ...(c.pending ? { issues: [['Unit 3 词表', '联网整理：8 个单词', '只有一个来源，没有电子课本可比对，请老师对照课本逐个确认']] } : {}) })),
    { id: 'd-cn-p4', name: '四年级上册写字表', subject: 'chinese', stage: 'P4', count: 250, src: '电子课本提取 + 联网整理 + 字典', status: '待核对', auto: 247, issues: [['盛', '课本 shèng · 联网整理 chéng', '字典 shèng / chéng（多音字，按课本词语“茂盛”）'], ['薄', '课本 báo · 联网整理 bó', '字典 báo / bó / bò（多音字）'], ['嗓', '课本 sǎng · 联网整理 sāng', '字典 sǎng（联网整理声调错误）']] },
    { id: 'd-poem', name: '古诗文原文库（小学 75 首 + 初中 61 篇）', subject: 'chinese', stage: '', count: 136, src: '公版原文', status: '已核对' },
    { id: 'd-en-j3', name: '九年级英语词表（Unit 1–14）', subject: 'english', stage: 'J3', count: 612, src: '教师导入（Excel）', status: '已核对' },
  ];
  // 练习、考核记录
  st.records = [];
  const mkRec = (sid, stage, n, seed) => {
    const r = rng(seed);
    const subs = st.subjects.filter(s => s.stages.includes(stage)).map(s => s.id);
    for (let i = 0; i < n; i++) {
      const subject = subs[Math.floor(r() * subs.length)]; const exam = r() < .25; const total = exam ? 10 : 5; const correct = Math.max(1, Math.round(total * (.55 + r() * .45)));
      const daysAgo = stage === 'J2' ? 45 + Math.floor(r() * 200) : Math.floor(r() * 28);
      st.records.push({ id: `r${seed}${i}`, sid, stage, type: exam ? '考核' : '练习', subject, at: addDays(-daysAgo, '2026-10-20'), total, correct, dur: total * (40 + Math.floor(r() * 50)) });
    }
  };
  mkRec('s2', 'P4', 22, 'b'); mkRec('s3', 'J2', 30, 'c2'); mkRec('s3', 'J3', 9, 'c3'); mkRec('s1', 'P3', 12, 'd');
  st.records.sort((a, b) => b.at.localeCompare(a.at));
  // 错题
  st.mistakes = [
    { id: 'm1', sid: 's2', qid: 'mp2', kps: ['math-P4-5', 'math-P4-3'], level: 2, from: '练习', at: '2026-10-17', status: '待复习', streak: 0, next: '2026-10-20', ans: '120' },
    { id: 'm2', sid: 's2', qid: 'cp2', kps: ['chinese-P4-6'], level: 1, from: '考核', at: '2026-10-15', status: '复习中', streak: 1, next: '2026-10-21', ans: 'A. cháng' },
    { id: 'm3', sid: 's2', qid: 'ep5', kps: ['english-P4-5'], level: 1, from: '练习', at: '2026-10-18', status: '待复习', streak: 0, next: '2026-10-19', ans: 'B. are' },
    { id: 'm4', sid: 's2', qid: 'mp4', kps: ['math-P4-6'], level: 1, from: '练习', at: '2026-09-28', status: '已掌握', streak: 3, next: '2026-11-08', ans: '对' },
    { id: 'm5', sid: 's3', qid: 'pj1', kps: ['physics-J3-1'], level: 1, from: '练习', at: '2026-10-16', status: '待复习', streak: 0, next: '2026-10-18', ans: '向前倾；理由：乘客受到一个向前的力' },
    { id: 'm6', sid: 's3', qid: 'hj1', kps: ['chemistry-J3-1'], level: 1, from: '练习', at: '2026-10-19', status: '待复习', streak: 0, next: '2026-10-20', ans: '2、2、2' },
    { id: 'm7', sid: 's3', qid: 'ej1', kps: ['english-J3-2'], level: 1, from: '考核', at: '2026-10-12', status: '复习中', streak: 2, next: '2026-10-22', ans: 'A' },
  ];
  // 单词本
  const wb = (word, src, read, spell, next) => ({ id: 'w' + Math.random().toString(36).slice(2, 8), word, meaning: DICT[word.toLowerCase()] || '', src, added: addDays(-Math.floor(Math.random() * 20), '2026-10-20'), read, spell, next, mastered: null, times: 1 });
  st.words = {
    s1: [],
    s2: [
      wb('classroom', '答错加入', ['2026-10-19'], ['2026-10-19'], '2026-10-20'),
      wb('blackboard', '答错加入', ['2026-10-18'], ['2026-10-19'], '2026-10-20'),
      wb('computer', '单元词汇', ['2026-10-19'], [], '2026-10-20'),
      wb('picture', '单元词汇', [], [], '2026-10-20'),
      wb('schoolbag', '手动导入', ['2026-10-17'], [], '2026-10-20'),
      wb('storybook', '手动导入', [], [], '2026-10-20'),
      wb('notebook', '手动导入', ['2026-10-18', '2026-10-19'], ['2026-10-18'], '2026-10-20'),
      wb('candy', '手动导入', [], [], '2026-10-21'),
      wb('chopsticks', '答错加入', [], [], '2026-10-20'),
      wb('vegetable', '单元词汇', ['2026-10-16'], [], '2026-10-21'),
      wb('noodles', '单元词汇', [], [], '2026-10-20'),
      wb('chicken', '单元词汇', ['2026-10-19'], [], '2026-10-22'),
      wb('soup', '单元词汇', [], [], '2026-10-20'),
      wb('strong', '老师添加', [], [], '2026-10-20'),
      wb('quiet', '老师添加', ['2026-10-18'], ['2026-10-19'], '2026-10-21'),
      wb('friendly', '手动导入', [], [], '2026-10-23'),
      wb('key', '答错加入', ['2026-10-19'], [], '2026-10-20'),
      wb('spoon', '单元词汇', [], [], '2026-10-20'),
      wb('delicious', '阅读中标记', [], [], '2026-10-20'),
      wb('thirsty', '阅读中标记', ['2026-10-19'], [], '2026-10-20'),
    ],
    s3: [
      wb('pronounce', '答错加入', ['2026-10-19'], [], '2026-10-20'),
      wb('patient', '手动导入', [], [], '2026-10-20'),
      wb('expression', '手动导入', ['2026-10-18', '2026-10-19'], ['2026-10-19'], '2026-10-20'),
      wb('discover', '单元词汇', [], [], '2026-10-21'),
      wb('secret', '单元词汇', [], [], '2026-10-20'),
      wb('grammar', '答错加入', ['2026-10-17'], ['2026-10-18'], '2026-10-20'),
      wb('repeat', '单元词汇', [], [], '2026-10-22'),
      wb('wisely', '阅读中标记', [], [], '2026-10-20'),
    ],
  };
  const mastered = (sid, list) => list.forEach(([w, d]) => st.words[sid].push({ ...wb(w, '单元词汇', ['x', 'y'], ['x', 'y'], null), mastered: d }));
  mastered('s2', [['window', '2026-10-10'], ['tea', '2026-10-12'], ['beef', '2026-10-15'], ['apple', '2026-09-30']]);
  mastered('s3', [['library', '2026-06-01'], ['build', '2026-09-20']]);
  st.tasks = [
    { id: 't1', type: '联网获取知识点', scope: '初中三年级 · 化学 · 上学期', status: '已完成', progress: 100, tokens: 6200, result: '生成 8 个知识点，教师确认 8 个', at: '2026-09-02 10:12' },
    { id: 't2', type: '补充题库', scope: '初中三年级 · 化学 · 1 级', status: '已完成', progress: 100, tokens: 31400, result: '新增 74 道（出题 AI 按「通用出题规则 v1.0」生成，程序检查和验证 AI 后入库；验证 AI 更正 6 道，丢弃 3 道），需人工审核 5 道', at: '2026-09-02 10:40' },
    { id: 't3', type: '补充题库', scope: '小学五年级 · 数学 · 2 级（学生用到时自动补充）', status: '已完成', progress: 100, tokens: 4100, result: '新增 8 道', at: '2026-10-18 19:21' },
  ];
  st.papers = []; st.paperSeed = true;
  st.feedback = [{ qid: 'cj3', sid: 's3', at: '2026-10-14', text: '选项 D 好像也说得通？' }, { qid: 'mp3', sid: 's2', at: '2026-10-16', text: '这道题太难算了' }];
  st.logs = [{ at: '2026-10-20 08:00', who: 'system', action: '系统初始化：创建教师账号和 3 个测试学生账号' }];
  seedV3(st);
  return st;
}
function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch { S = null; }
  if (!S || !S.kps) { S = seedState(); applyQPatches(); for (const st of S.students) S.strategy[st.id] = ruleStrategy(st.id); }
  else applyQPatches();
  if (S.paperSeed) {
    S.paperSeed = false;
    const p = makePaper('s2', 'math', [], 5, '数学纸质考核：第一、二单元', null); p.created = '2026-10-16'; p.photos = 2;
    recognize(p); const recs = S.records.length; finishPaper(p); S.records.splice(0, S.records.length - recs).forEach(r => { r.at = '2026-10-16'; S.records.push(r); }); S.records.sort((a, b) => b.at.localeCompare(a.at)); p.graded = '2026-10-16';
    makePaper('s2', 'chinese', [], 5, '语文纸质考核：基础运用', null);
  }
}
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
function log(action) { S.logs.unshift({ at: nowStr(), who: 'teacher', action }); }

// ================= 领域辅助 =================
const Q = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
const REAL_BANK_STAGES = ['P3'];
const stageName = c => (STAGES.find(s => s[0] === c) || [c, c])[1];
const subj = id => S.subjects.find(s => s.id === id) || { id, name: id, icon: '📘' };
const openSubjects = stage => S.subjects.filter(s => s.enabled && s.stages.includes(stage));
const kpById = id => S.kps.find(k => k.id === id);
const kpsOf = (stage, subject, all, book) => S.kps.filter(k => k.stage === stage && k.subject === subject && (all || k.status === '启用') && (!book || !k.book || k.book === book)).sort((a, b) => a.order - b.order);
const student = id => S.students.find(s => s.id === id);
const me = () => student(S.currentSid);
const band = stage => stage.startsWith('J') ? 'J' : 'P';
// ---- 教材版本：每个学生每个学科一个版本，未设置时用默认版本
const bookById = id => S.books.find(b => b.id === id);
const bookName = id => bookById(id)?.name || '通用';
const booksFor = (subject, stage) => S.books.filter(b => b.subject === subject && (!stage || b.stages.includes(stage)));
function defaultBook(subject, stage) { const d = (S.bookDefault[subject] || [])[band(stage) === 'J' ? 1 : 0]; return bookById(d)?.stages.includes(stage) ? d : booksFor(subject, stage)[0]?.id; }
function bookOf(sid, subject, stage) { const s = student(sid); stage ||= s.stage; const b = s.books?.[subject]; return b && bookById(b)?.stages.includes(stage) ? b : defaultBook(subject, stage); }
const skps = (sid, stage, subject, all) => kpsOf(stage, subject, all, bookOf(sid, subject, stage));
const T = L => S.config.threshold[L - 1];
function getM(sid, kpId) { S.mastery[sid] ||= {}; return S.mastery[sid][kpId] ||= { c: [0, 0, 0, 0, 0], last: null }; }
const peekM = (sid, kpId) => (S.mastery[sid] || {})[kpId] || { c: [0, 0, 0, 0, 0], last: null };
// 2.1 等级：★1 基础 · ★2 变式（仍是单个知识点）· ★3 组合 2 个 · ★4 组合 3 个 · ★5 综合应用（4 个及以上或真实情境）
const kpsInLevel = L => L <= 2 ? 1 : L - 1;
function partnersOf(kp) { return S.combos.filter(c => (c.a === kp.id || c.b === kp.id) && c.v === 'yes' && c.state === 'ok').map(c => ({ id: c.a === kp.id ? c.b : c.a, how: c.how })).filter(p => kpById(p.id)?.status === '启用'); }
function maxLevel(kp) {
  const cap = comboCap(kp.subject, kp.stage); let ml = Math.min(5, cap + 1);
  if (ml >= 3 && !partnersOf(kp).length) ml = 2;
  return Math.max(1, ml);
}
const COMBINABLE = ['技能', '理解应用'];
const isComb = k => COMBINABLE.includes(k.type);
const TYPE_TAG = { 记忆: '📌 记忆', 技能: '🛠️ 技能', 理解应用: '💡 理解应用', 开放: '📖 阅读表达' };
const TYPES = ['记忆', '技能', '理解应用', '开放'];
const typeName = t => t === '开放' ? '阅读表达' : t;
const bandIdx = stage => { const n = Number(stage.slice(1)); return stage[0] === 'J' ? 3 : n <= 2 ? 0 : n <= 4 ? 1 : 2; };
const BAND_NAMES = ['小学 1–2 年级', '小学 3–4 年级', '小学 5–6 年级', '初中'];
const comboCap = (subject, stage) => (S.config.comboCap[subject] || [1, 2, 3, 3])[bandIdx(stage)];
const memCfg = kp => MEMORY_ITEMS[kp.id];
const ansList = item => Array.isArray(item[1]) ? item[1] : [item[1]];
function memState(sid, kp) { S.mem[sid] ||= {}; return S.mem[sid][kp.id] ||= memCfg(kp).items.map(() => ({ r: [], w: [], next: null, m: null })); }
const peekMem = (sid, kp) => (S.mem[sid] || {})[kp.id] || [];
function memCount(sid, kp) {
  const cfg = memCfg(kp); const st = peekMem(sid, kp); const t = todayStr();
  if (!cfg) return { total: 0, done: 0, started: false, due: 0, last: null };
  const started = st.some(x => x.r.length || x.w.length || x.m);
  return { total: cfg.items.length, done: st.filter(x => x.m).length, started,
    due: cfg.items.filter((_, i) => { const x = st[i]; return !x || (!x.m && (!x.next || x.next <= t)); }).length,
    last: st.flatMap(x => [...x.r, ...x.w, x.m]).filter(v => v && v.length === 10).sort().pop() || null };
}
const readsOf = (sid, kp) => { S.reads[sid] ||= {}; return S.reads[sid][kp.id] ||= []; };
const peekReads = (sid, kp) => ((S.reads || {})[sid] || {})[kp.id] || [];
function lastOf(sid, kp) { if (kp.type === '记忆') return memCount(sid, kp).last; if (kp.type === '开放') return peekReads(sid, kp)[0]?.at || null; return peekM(sid, kp.id).last; }
function progressOf(sid, kp) {
  if (kp.type === '开放') return null;
  if (kp.type === '记忆') { const c = memCount(sid, kp); return pct(c.done, c.total); }
  const m = peekM(sid, kp.id); const ml = maxLevel(kp); let a = 0, b = 0;
  for (let L = 1; L <= ml; L++) { a += Math.min(m.c[L - 1], T(L)); b += T(L); }
  return pct(a, b);
}
function starsOf(sid, kp) { if (!isComb(kp)) return 0; const m = peekM(sid, kp.id); let n = 0; for (let L = 1; L <= maxLevel(kp); L++) if (m.c[L - 1] >= T(L)) n++; return n; }
function statusOf(sid, kp) {
  if (kp.type === '开放') { const n = peekReads(sid, kp).length; return n ? { t: `已完成 ${n} 篇`, cls: n >= S.config.openDone ? 'ok' : 'warn', lv: n >= S.config.openDone ? 2 : 1 } : { t: '未开始', cls: 'gray', lv: 0 }; }
  if (kp.type === '记忆') {
    const c = memCount(sid, kp); if (!c.started) return { t: '未开始', cls: 'gray', lv: 0 };
    const p = pct(c.done, c.total); return p >= 100 ? { t: '熟练', cls: 'ok', lv: 3 } : p >= 80 ? { t: '基本掌握', cls: 'ok', lv: 2 } : { t: '学习中', cls: 'warn', lv: 1 };
  }
  const m = peekM(sid, kp.id); const full = L => m.c[L - 1] >= T(L); const ml = maxLevel(kp);
  if (!m.last && m.c.every(x => !x)) return { t: '未开始', cls: 'gray', lv: 0 };
  if (!full(1)) return { t: '学习中', cls: 'warn', lv: 1 };
  let all = true; for (let L = 1; L <= ml; L++) if (!full(L)) all = false;
  if (all) return { t: '精通', cls: '', lv: 4 };
  if (full(Math.min(2, ml))) return { t: '熟练', cls: 'ok', lv: 3 };
  return { t: '基本掌握', cls: 'ok', lv: 2 };
}
function needsReview(sid, kp) { if (kp.type === '开放') return false; const last = lastOf(sid, kp); return statusOf(sid, kp).lv >= 2 && last && dayDiff(last, todayStr()) > S.config.reviewDays; }
function recLevel(sid, kp) { const m = peekM(sid, kp.id); for (let L = 1; L <= maxLevel(kp); L++) if (m.c[L - 1] < T(L)) return L; return maxLevel(kp); }
const starsHtml = (n, max = 5) => `<span class="stars">${Array.from({ length: max }, (_, i) => `<span class="${i < n ? '' : 'off'}">⭐</span>`).join('')}</span>`;
const levelName = L => ['', '基础', '变式', '组合 2 个知识点', '组合 3 个知识点', '综合应用'][L];
const levelDesc = L => ['', '单个知识点，标准问法', '还是这一个知识点，换情境、反着问、有干扰', '和另一个知识点串起来，每一步考一个', '三个知识点串成多步问题', '真实情境里的综合问题'][L];
// 组合题的前提：题里的每个技能型 / 理解应用型知识点都已点亮 ★1
const gateMissing = (sid, kpIds) => S.config.comboGate ? kpIds.filter(id => { const k = kpById(id); return k && isComb(k) && peekM(sid, id).c[0] < T(1); }) : [];
const isReal = kp => REAL_BANK_STAGES.includes(kp.stage);
const qUsable = q => q.status !== '待审核' && q.status !== '丢弃' && !(S.qOff || {})[q.id];
const bankFor = (kp, L) => QUESTIONS.filter(q => q.stage === kp.stage && q.kps.includes(kp.id) && q.level === L && (!q.book || q.book === kp.book) && qUsable(q));
function subjectProgress(sid, stage, subject) {
  const list = skps(sid, stage, subject).filter(k => k.type !== '开放'); if (!list.length) return { p: 0, stars: 0, mastered: 0, total: 0 };
  return { p: Math.round(list.reduce((a, k) => a + progressOf(sid, k), 0) / list.length), stars: list.reduce((a, k) => a + starsOf(sid, k), 0), mastered: list.filter(k => statusOf(sid, k).lv >= 2).length, total: list.length };
}
const hasWordbook = stage => openSubjects(stage).some(s => s.wordbook);
const wordsOf = sid => S.words[sid] ||= [];
const activeWords = sid => wordsOf(sid).filter(w => !w.mastered);
const dueWords = sid => activeWords(sid).filter(w => w.next <= todayStr());
const dueMistakes = sid => S.mistakes.filter(m => m.sid === sid && m.status !== '已掌握' && m.next <= todayStr());

// ================= 判分 =================
function norm(s) {
  return String(s ?? '').replace(/[\uff01-\uff5e]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[₀-₉]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x2080 + 48))
    .replace(/−/g, '-').replace(/[\s\u3000]/g, '').replace(/[。．.，,！!]+$/, '').toLowerCase();
}
const gcd = (a, b) => b ? gcd(b, a % b) : a;
function balanceOk(q, a) {
  const c = (a || []).map(x => Number(norm(x)));
  if (c.length !== q.parts.length || c.some(x => !Number.isInteger(x) || x < 1)) return false;
  const count = {};
  q.parts.forEach((p, i) => { const sign = i < q.split ? 1 : -1; for (const [el, n] of Object.entries(p.atoms)) count[el] = (count[el] || 0) + sign * n * c[i]; });
  return Object.values(count).every(v => v === 0) && c.reduce(gcd) === 1;
}
// 3.0 题型：单选（系统比对）、填空（系统比对，数值等价）、应用题（判题 AI）
const fillOk = (q, b, v) => {
  if (q.orderMode) { const d = String(v ?? '').replace(/[①-⑨]/g, c => String(CIRCLED.indexOf(c) + 1)).replace(/\D/g, ''); return b.ans.includes(d); }
  const n = norm(v); if (!n) return false;
  return b.ans.some(x => norm(x) === n || (/^-?\d+(\.\d+)?$/.test(norm(x)) && /^-?\d+(\.\d+)?$/.test(n) && Number(norm(x)) === Number(n)));
};
function grade(item) {
  const q = Q[item.qid], a = item.ans; if (a == null) return false;
  switch (q.type) {
    case 'single': return a === q.answer;
    case 'fill': return q.balance ? balanceOk(q, a) : q.blanks.every((b, i) => fillOk(q, b, a[i]));
    case 'applied': return (item.ai || aiJudge(q, a)).verdict === '对';
  }
  return false;
}
function ansText(item) {
  const q = Q[item.qid], a = item.ans; if (a == null || (Array.isArray(a) && !a.length)) return '（未作答）';
  switch (q.type) {
    case 'single': return `${'ABCD'[a]}. ${q.options[a]}`.replace(/<br>/g, ' ');
    case 'fill': return a.map((x, i) => q.blanks.length > 1 ? `${CIRCLED[i]} ${x ?? ''}` : x ?? '').join('，');
    case 'applied': return String(a).replace(/\n/g, ' ');
  }
}
const hasAnswer = item => { const a = item.ans; if (a == null) return false; if (Array.isArray(a)) return a.some(x => x != null && x !== ''); if (typeof a === 'string') return a.trim() !== ''; return true; };
// 按空 / 按评分要点 / 按错误选项找出错在哪个知识点
const COMBINE = '__combine';
const weakName = id => id === COMBINE ? '把几步连起来（组合本身）' : kpById(id)?.name || id;
function diagOf(item) {
  const q = Q[item.qid]; const a = item.ans || []; const out = { parts: [], weak: [], note: '' };
  if (q.type === 'applied') { const r = item.ai || aiJudge(q, item.ans); r.steps.forEach((st, i) => out.parts.push({ i, kp: st.kp, ok: st.ok, label: `第 ${i + 1} 步「${st.step}」` })); if (!r.steps.some(x => !x.ok) && r.verdict !== '对') out.note = r.where; }
  else if (q.type === 'fill' && q.blanks.some(b => b.kp)) q.blanks.forEach((b, i) => out.parts.push({ i, kp: b.kp, ok: fillOk(q, b, a[i]), label: `${b.pre || '第 ' + (i + 1) + ' '}空` }));
  else if (q.diag && item.ans != null && item.ans !== q.answer && q.diag[item.ans]) { const d = q.diag[item.ans]; out.note = typeof d === 'string' ? d : d.t; out.weak = [typeof d === 'string' ? q.kps?.[0] : d.kp].filter(Boolean); }
  if (out.parts.length) out.weak = [...new Set(out.parts.filter(p => !p.ok).map(p => p.kp || COMBINE))];
  return out;
}
function diagText(item) {
  const q = Q[item.qid];
  if (q.type === 'applied') return (item.ai || aiJudge(q, item.ans)).where;
  const d = diagOf(item); const bad = d.parts.filter(p => !p.ok);
  if (bad.length) return bad.map(p => `${p.label}不对${p.kp ? `，这一步考的是「${kpById(p.kp)?.name}」` : '，这一步要把前面的结果用起来'}`).join('；');
  return d.note;
}

// ================= 出题 =================
function pickQ(subject, b, used, noListen) {
  const pool = QUESTIONS.filter(q => q.subject === subject && q.band === b && (!noListen || !q.speak) && qUsable(q));
  const fresh = pool.filter(q => !used.has(q.id) && !used.has(q.vg));
  const q = shuffle(fresh.length ? fresh : pool)[0]; used.add(q.id); used.add(q.vg); return q;
}
// 三年级（REAL_BANK_STAGES）用真实对应的题库；其它年级仍是 2.0 的示例题
function pickFor(kp, L, used, sid, noListen) {
  if (isReal(kp)) {
    let pool = bankFor(kp, L).filter(q => !noListen || !q.speak);
    if (L >= 3 && sid) pool = pool.filter(q => !gateMissing(sid, q.kps).length);
    const fresh = pool.filter(q => !used.has(q.id) && !used.has(q.vg)); if (!fresh.length) return null;
    const q = shuffle(fresh)[0]; used.add(q.id); used.add(q.vg); return { q, kps: q.kps };
  }
  const q = pickQ(kp.subject, band(kp.stage), used, noListen);
  return { q, kps: [kp.id, ...extraKps(kp, kpsInLevel(L) - 1)] };
}
function extraKps(kp, n) {
  const pref = shuffle(partnersOf(kp).map(p => p.id));
  const rest = shuffle(kpsOf(kp.stage, kp.subject, false, kp.book).filter(k => k.id !== kp.id && isComb(k) && !pref.includes(k.id)).map(k => k.id));
  return [...pref, ...rest].slice(0, n);
}
function mkItem(q, kps, level, mode, sid) {
  return { qid: q.id, kps, level, given: 0, ans: null, tries: 0, usedHint: false, hint: 0, done: false, fb: null, first: null };
}
function startPractice(kpIds, level, count) {
  const sid = S.currentSid; const used = new Set(); const items = [];
  const kps = kpIds.map(kpById);
  for (let i = 0, guard = 0; items.length < count && guard < count * 4; i++, guard++) {
    const kp = kps[i % kps.length];
    let p = null; for (let L = Math.min(level, maxLevel(kp)); !p && L >= 1; L--) { p = pickFor(kp, L, used, sid); if (p) p.L = L; }
    if (p) items.push(mkItem(p.q, p.kps, p.L, 'practice', sid));
  }
  const title = kps.length > 1 ? `混合练习（${kps.length} 个知识点交错出现）` : `${kps[0].name} · ★${level} ${levelName(level)}`;
  S.session = { mode: 'practice', sid, subject: kps[0].subject, title, items, idx: 0, startedAt: null, deltas: [], kpIds, limited: items.length < count, real: kps.every(isReal) };
}
function startExam(opts) {
  const sid = S.currentSid; const st = me(); const cfg = S.config;
  const subs = opts.subject && opts.subject !== 'all' ? [opts.subject] : openSubjects(st.stage).map(s => s.id);
  let cand = (opts.kps?.length ? opts.kps.map(kpById) : subs.flatMap(sub => skps(sid, st.stage, sub))).filter(isComb);
  if (!opts.kps?.length && cfg.examScope === 'started') { const started = cand.filter(k => statusOf(sid, k).lv > 0); if (started.length >= 3) cand = started; }
  const count = Math.min(opts.count || cfg.examCount, cand.length * cfg.examPerKp);
  const used = new Set(); const items = []; const per = {};
  const order = shuffle(cand);
  let i = 0, guard = 0;
  while (items.length < count && guard++ < 500 && order.length) {
    const kp = order[i++ % order.length];
    if ((per[kp.id] || 0) >= cfg.examPerKp) continue;
    let L = recLevel(sid, kp); if (Math.random() * 100 < cfg.examUpRatio) L = Math.min(maxLevel(kp), L + 1);
    let p = null; for (; !p && L >= 1; L--) { p = pickFor(kp, L, used, sid); if (p) p.L = L; }
    if (!p) continue;
    per[kp.id] = (per[kp.id] || 0) + 1;
    items.push(mkItem(p.q, p.kps, p.L, 'exam', sid));
  }
  S.session = { mode: 'exam', sid, title: opts.title || (subs.length > 1 ? '综合考核' : `${subj(subs[0]).name}考核`), items, idx: 0, startedAt: null, deltas: [], assignment: opts.assignment || null, limited: items.length < (opts.count || cfg.examCount), real: cand.every(isReal) };
}
function startReview(mids) {
  const sid = S.currentSid;
  const items = mids.map(id => { const m = S.mistakes.find(x => x.id === id); const it = mkItem(Q[m.qid], m.kps, m.level, 'review', sid); it.mid = id; return it; });
  S.session = { mode: 'review', sid, title: '错题复习', items, idx: 0, startedAt: null, deltas: [] };
}
function credit(sid, item, weight) {
  for (const kpId of item.kps) {
    const k = kpById(kpId); if (k && !isComb(k)) continue;
    const m = getM(sid, kpId); const L = item.level; const key = `${item.qid}|${kpId}|${L}`;
    const before = m.c[L - 1]; let note = '';
    S.counted[sid] ||= {};
    if (S.counted[sid][key]) note = '这道题以前计过数，不重复计数';
    else if (before >= T(L)) note = `该级已达上限 ${T(L)} 题，不再增加`;
    else { m.c[L - 1] = Math.min(T(L), before + weight); S.counted[sid][key] = 1; }
    m.last = todayStr();
    S.session.deltas.push({ kpId, L, before, after: m.c[L - 1], note });
  }
}
function touch(sid, item) { for (const kpId of item.kps) getM(sid, kpId).last = todayStr(); }
function addMistake(sid, item, from) {
  const weak = diagOf(item).weak; item.weak = weak;
  const exist = S.mistakes.find(m => m.sid === sid && m.qid === item.qid && m.status !== '已掌握');
  if (exist) { exist.status = '待复习'; exist.streak = 0; exist.next = addDays(1); exist.ans = ansText(item); exist.weak = weak; return; }
  S.mistakes.unshift({ id: 'm' + Date.now() + Math.random().toString(36).slice(2, 5), sid, qid: item.qid, kps: item.kps, weak, level: item.level, from, at: todayStr(), status: '待复习', streak: 0, next: addDays(1), ans: ansText(item) });
  const q = Q[item.qid];
  if (q.subject === 'english' && q.words) for (const w of q.words) addWord(sid, w, '答错加入');
}
function addWord(sid, word, src, meaning) {
  word = word.trim(); if (!word) return false;
  const list = wordsOf(sid); const ex = list.find(w => w.word.toLowerCase() === word.toLowerCase());
  if (ex) { ex.times++; if (ex.mastered) { ex.mastered = null; ex.read = []; ex.spell = []; ex.next = addDays(1); } return false; }
  list.unshift({ id: 'w' + Date.now() + Math.random().toString(36).slice(2, 6), word, meaning: meaning || DICT[word.toLowerCase()] || '（系统自动补全释义）', src, added: todayStr(), read: [], spell: [], next: todayStr(), mastered: null, times: 1 });
  return true;
}
function finishSession() {
  const s = S.session; const sid = s.sid;
  const dur = s.startedAt ? Math.round((Date.now() - s.startedAt) / 1000) : 0;
  let correct = 0;
  if (s.mode === 'exam') {
    for (const it of s.items) {
      const q = Q[it.qid];
      if (q.type === 'applied' && hasAnswer(it)) { it.ai = aiJudge(q, it.ans); if (it.ai.toTeacher) { it.pending = true; queueReview(sid, q, it, '应用题 · 低可信度（考核）'); continue; } }
      it.correct = grade(it); recordRecent(sid, it, it.correct); if (it.correct) { correct++; credit(sid, it, S.config.examWeight); } else { touch(sid, it); addMistake(sid, it, '考核'); }
    }
    if (s.assignment) { const a = S.assignments.find(x => x.id === s.assignment); if (a) a.done[sid] = `${correct}/${s.items.length}`; }
  } else correct = s.items.filter(it => it.first).length;
  const st = student(sid);
  if (s.mode !== 'review') {
    const subjects = [...new Set(s.items.map(it => Q[it.qid].subject))];
    S.records.unshift({ id: 'r' + Date.now(), sid, stage: st.stage, type: s.mode === 'exam' ? '考核' : '练习', subject: subjects.length > 1 ? 'mixed' : subjects[0], at: todayStr(), total: s.items.length, correct, dur });
  }
  if (s.mode !== 'review') S.strategy[sid] = evaluate(sid, '练习后自动更新');
  S.lastResult = { mode: s.mode, title: s.title, total: s.items.length, correct, dur, deltas: s.deltas, items: s.items, limited: s.limited, weak: s.items.flatMap(it => it.weak || []) };
  S.session = null;
  go('#/s/result');
}

// ================= 纸质考核 =================
const PAPER_TYPES = ['single', 'fill', 'applied'];
function makePaper(sid, subject, kpIds, count, title, assignmentId) {
  const st = student(sid);
  let cand = (kpIds.length ? kpIds.map(kpById) : skps(sid, st.stage, subject)).filter(isComb);
  if (!cand.length) cand = skps(sid, st.stage, subject).filter(isComb);
  const used = new Set(); const items = [];
  for (let i = 0, guard = 0; items.length < count && guard < count * 6 && cand.length; i++, guard++) {
    const kp = cand[i % cand.length]; let p = null;
    for (let L = Math.min(recLevel(sid, kp), maxLevel(kp)); !p && L >= 1; L--) { p = pickFor(kp, L, used, sid, true); if (p) p.L = L; }
    if (p && PAPER_TYPES.includes(p.q.type)) items.push(mkItem(p.q, p.kps, p.L, 'paper', sid));
  }
  items.sort((a, b) => PAPER_TYPES.indexOf(Q[a.qid].type) - PAPER_TYPES.indexOf(Q[b.qid].type));
  const p = { id: `PZ-${todayStr().replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`, sid, subject, title, items, status: '待作答', created: todayStr(), assignment: assignmentId || null, photos: 0, pages: Math.max(1, Math.ceil(items.length / 6)) };
  S.papers.unshift(p); return p;
}
function correctAns(q) {
  switch (q.type) {
    case 'single': return q.answer;
    case 'fill': return q.blanks.map(b => b.ans[0]);
    case 'applied': return q.rubric.map(r => r.key).join('\n');
  }
}
function wrongAns(q) {
  const a = correctAns(q);
  switch (q.type) {
    case 'single': return (a + 1) % q.options.length;
    case 'fill': return a.map((x, i) => i === 0 ? (/\d$/.test(x) ? x.slice(0, -1) + ((Number(x.slice(-1)) + 1) % 10) : /^[a-z]/i.test(x) ? x.slice(0, -1) : x.slice(0, -1) + '口') : x);
    case 'applied': return q.rubric.map((r, i) => i === 0 && /^\d+$/.test(r.key) ? String(Number(r.key) + 10) : r.key).join('\n');
  }
}
// 识别 AI 读出作答；单选和低可信度的交验证 AI 核对（§7.2、§8.4）
function recognize(p) {
  const demo = p.items.findIndex(it => Q[it.qid].type === 'single');
  p.items.forEach((it, i) => {
    const q = Q[it.qid]; const r = rng(p.id + i)(); const ok = r < .72;
    it.given = 0; it.conf = r > .86 ? 0.55 + (r - .86) : 0.9 + (r % .09);
    it.ans = ok ? correctAns(q) : wrongAns(q); it.recog = ansText(it); it.verify = null;
    if (q.type === 'single' || it.conf < S.config.judgeConf) {
      if (i === demo) { it.ans = wrongAns(q); it.recog = ansText(it); it.conf = 0.61; }
      if (q.type === 'single' && it.conf < S.config.judgeConf && (i % 2 === 0 || i === demo)) { const before = it.recog; it.ans = correctAns(q); it.verify = { r: '更正', before, msg: '括号内字母下半部笔画较淡，对照照片应为 ' + 'ABCD'[it.ans] }; it.conf = 0.9; it.recog = ansText(it); S.corrections.unshift({ role: 'ocr', at: nowStr(), target: `${student(p.sid).nick} · 纸质试卷 ${p.id} 第 ${i + 1} 题`, before: `识别为 ${before}`, after: `更正为 ${it.recog}`, judge: '' }); }
      else it.verify = it.conf < S.config.judgeConf ? { r: '没把握', msg: '验证 AI 也看不清，交老师确认' } : { r: '同意' };
    }
    if (q.type === 'applied') it.ai = aiJudge(q, it.ans);
    it.correct = grade(it); it.state = it.conf < S.config.judgeConf || it.ai?.toTeacher ? '待老师确认' : '已批改'; it.page = Math.floor(i / 6) + 1;
  });
}
function settlePaperItem(p, it) {
  const sid = p.sid;
  if (it.correct) credit(sid, it, S.config.examWeight); else { touch(sid, it); addMistake(sid, it, '纸质考核'); }
}
function finishPaper(p) {
  S.session = { deltas: [] };
  p.items.filter(it => it.state === '已批改').forEach(it => settlePaperItem(p, it));
  const deltas = S.session.deltas; S.session = null;
  p.status = p.items.some(it => it.state !== '已批改') ? '部分待确认' : '已批改';
  p.graded = todayStr(); p.deltas = deltas;
  const ok = p.items.filter(it => it.correct).length;
  S.records.unshift({ id: 'r' + Date.now(), sid: p.sid, stage: student(p.sid).stage, type: '考核', paper: p.id, subject: p.subject, at: todayStr(), total: p.items.length, correct: ok, dur: 0 });
  if (p.assignment) { const a = S.assignments.find(x => x.id === p.assignment); if (a) a.done[p.sid] = `${ok}/${p.items.length}`; }
}
function qrSvg(text, size = 64) {
  const r = rng(text); let cells = '';
  const n = 21; const c = size / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    const on = finder ? (x % 14 === 0 || x % 14 === 6 || y % 14 === 0 || y % 14 === 6 || (x % 14 > 1 && x % 14 < 5 && y % 14 > 1 && y % 14 < 5)) : r() < .5;
    if (on) cells += `<rect x="${(x * c).toFixed(2)}" y="${(y * c).toFixed(2)}" width="${c.toFixed(2)}" height="${c.toFixed(2)}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="#000">${cells}</svg>`;
}
// 3.0 版式：单选题号前印（　　），学生写字母；填空每空横线下印 ①②；应用题印“解：”“答：”
function paperQHtml(it, n, withAns) {
  const q = Q[it.qid];
  const line = (w, k) => `<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;margin:0 3px"><span style="display:inline-block;min-width:${w}px;border-bottom:1px solid #000">&nbsp;</span><span style="font-size:10px;line-height:1">${k}</span></span>`;
  const stem = String(q.stem).replace(/\n/g, '<br>');
  let h = `<div style="margin:0 0 16px;page-break-inside:avoid">`;
  if (q.type === 'single') h += `<div><span style="letter-spacing:2px">（　　）</span><b>${n}.</b> ${stem}</div><div style="margin:4px 0 0 4.5em">${q.options.map((o, i) => `<span style="display:inline-block;margin:2px 26px 2px 0">${'ABCD'[i]}. ${q.judge ? o : o}</span>`).join('')}</div>`;
  if (q.type === 'fill') h += `<div><b>${n}.</b> ${stem}</div>${q.blanks.map((b, i) => `<div style="margin:6px 0 0 18px">${esc(b.pre || '')} ${line(150, q.blanks.length > 1 ? CIRCLED[i] : '')} ${esc(b.suf || '')}</div>`).join('')}`;
  if (q.type === 'applied') h += `<div><b>${n}.</b> ${stem}（写出过程）</div><div style="margin:6px 0 0 18px;height:92px;border:1px dashed #999;padding:4px 8px">解：</div><div style="margin:6px 0 0 18px;height:30px;border-bottom:1px solid #000">答：</div>`;
  if (withAns) h += `<div style="margin:6px 0 0 18px;color:#c00">答案：${esc(q.answerText)}${q.rubric ? '　评分要点：' + q.rubric.map((r, i) => `${i + 1}) ${esc(r.step)} ${esc(r.key)}（${r.score} 分）`).join('；') : ''}　解析：${esc(q.explain)}</div>`;
  return h + '</div>';
}
// A4 连续排版，页眉信息只在开头出现一次（沿用 2.2）
function paperDoc(p, withAns) {
  const st = student(p.sid); const secs = [['single', '一、单选题（请在括号内写出正确选项的字母）'], ['fill', '二、填空题'], ['applied', '三、应用题']];
  let n = 0;
  return `<!doctype html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(p.title)}</title>
  <style>@page{size:A4;margin:16mm}body{font-family:"SimSun","Songti SC","Noto Serif CJK SC",serif;font-size:15px;line-height:1.8;color:#000}.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:10px}.sec{font-weight:bold;margin:12px 0 6px}</style></head><body>
  <div class="hd"><div><div style="font-size:20px;font-weight:bold">${esc(p.title)}${withAns ? '（答案）' : ''}</div><div style="font-size:13px">姓名：<span style="display:inline-block;width:90px;border-bottom:1px solid #000">${withAns ? esc(st.nick) : '&nbsp;'}</span>　　日期：${p.created}　　共 ${p.items.length} 题　　编号 ${p.id}</div></div>${qrSvg(p.id)}</div>
  ${withAns ? '' : '<div style="font-size:12px;margin-bottom:8px">答题说明：单选题请在题号前的括号内写出正确选项的字母（A、B、C、D）；填空题写在横线上；应用题写出过程。做完后拍照上传，右上角二维码要拍全，照片顺序不限。</div>'}
  ${secs.map(([t, title]) => { const its = p.items.filter(it => Q[it.qid].type === t); return its.length ? `<div class="sec">${title}</div>` + its.map(it => paperQHtml(it, ++n, withAns)).join('') : ''; }).join('')}</body></html>`;
}

// ================= 语音播放（2.1） =================
// 只有收到 onstart 才显示“正在播放”；没有英语发音、浏览器不响应或出错时改用服务器语音
const AUDIO_PREF_KEY = 'kl21-audio-pref';
const Voice = {
  cur: null, u: null, timer: null,
  supported: () => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
  pref: () => localStorage.getItem(AUDIO_PREF_KEY) || 'auto',
  inApp: () => /MicroMessenger|QQ\/|AlipayClient|DingTalk/i.test(navigator.userAgent),
  env() { const ua = navigator.userAgent; return /MicroMessenger/i.test(ua) ? '微信内置浏览器' : /QQ\//i.test(ua) ? 'QQ 内置浏览器' : /iPhone|iPad/i.test(ua) ? 'iPhone / iPad' : /Android/i.test(ua) ? '安卓手机' : '电脑浏览器'; },
  voices(lang = 'en') { return this.supported() ? speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().replace('_', '-').startsWith(lang)) : []; },
  pick(lang) { const vs = this.voices(lang.slice(0, 2)); const same = vs.filter(v => v.lang.replace('_', '-') === lang); return same.find(v => v.localService) || same[0] || vs[0] || null; },
  ui(text, state, msg) {
    document.querySelectorAll('[data-act="speak"]').forEach(b => { if (b.dataset.v === text) { b.classList.remove('loading', 'playing', 'fail'); if (['loading', 'playing', 'fail'].includes(state)) b.classList.add(state); } });
    const spans = [...document.querySelectorAll('.speak-status')].filter(s => s.dataset.for === text);
    spans.forEach(s => { s.textContent = msg || s.dataset.idle || ''; s.className = `speak-status small ${state === 'fail' ? 'bad' : state === 'playing' ? 'on' : 'muted'}`; });
    if (!spans.length && state === 'fail') toast(msg, 'error');
  },
  play(text, lang = 'en-US') {
    this.stop(); this.cur = text;
    if (this.pref() === 'server') return this.server(text, '这台设备已设置为使用服务器语音');
    if (!this.supported()) return this.server(text, '这个浏览器不支持朗读');
    if (this.inApp() && this.pref() === 'auto') return this.server(text, `${this.env()}里的朗读常常没有声音`);
    this.ui(text, 'loading', '准备中…');
    const go = () => {
      const v = this.pick(lang); if (!v) return this.server(text, '这个浏览器没有英语发音');
      const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.voice = v; u.rate = .85; u.volume = 1; this.u = u;
      let started = false;
      u.onstart = () => { started = true; clearTimeout(this.timer); this.ui(text, 'playing', '🔊 正在播放'); };
      u.onend = () => { if (this.cur === text) this.ui(text, 'idle', '播放完了，可以再听'); };
      u.onerror = e => { clearTimeout(this.timer); if (['interrupted', 'canceled'].includes(e.error)) return; this.server(text, `浏览器朗读出错（${e.error}）`); };
      speechSynthesis.speak(u); if (speechSynthesis.paused) speechSynthesis.resume();
      this.timer = setTimeout(() => { if (!started) { speechSynthesis.cancel(); this.server(text, '浏览器朗读没有响应'); } }, 1800);
    };
    if (speechSynthesis.getVoices().length) setTimeout(go, 60);
    else { let done = false; const once = () => { if (!done) { done = true; go(); } }; speechSynthesis.addEventListener('voiceschanged', once, { once: true }); setTimeout(once, 900); }
  },
  stop() { clearTimeout(this.timer); if (this.supported()) speechSynthesis.cancel(); if (this.cur) this.ui(this.cur, 'idle', ''); },
  server(text, why) {
    if (!S.config.audioServer) return this.ui(text, 'fail', `❌ 没有播放出来：${why}。请换用手机自带浏览器或让大人帮忙读`);
    this.ui(text, 'loading', `${why}，改用服务器语音…`);
    setTimeout(() => { if (this.cur === text) this.ui(text, 'fail', `${why}。正式版会在这里播放服务器生成的录音（原型没有服务器，无法模拟）`); }, 700);
  },
};
if (Voice.supported()) speechSynthesis.addEventListener?.('voiceschanged', () => { if (parseHash().parts[1] === 'settings') render(); });
const speakBtn = (text, opts = {}) => `<button class="speak ${opts.big ? 'big-speak' : ''}" type="button" data-act="speak" data-v="${esc(text)}" aria-label="朗读">🔊</button>${opts.status ? `<span class="speak-status small muted" data-for="${esc(text)}" data-idle="${esc(opts.status)}">${esc(opts.status)}</span>` : ''}`;

// ================= 弹窗与提示 =================
function modal(html, wide) { document.getElementById('modal-root').innerHTML = `<div class="modal-mask" data-act="maskClose"><div class="modal ${wide ? 'wide' : ''}">${html}</div></div>`; }
function closeModal() { document.getElementById('modal-root').innerHTML = ''; }
function toast(msg, type = '') { const t = document.createElement('div'); t.className = `toast ${type}`; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
const val = id => document.getElementById(id)?.value ?? '';
const checked = id => !!document.getElementById(id)?.checked;

// ================= 路由 =================
function go(h) { if (location.hash === h) render(); else location.hash = h; }
function parseHash() {
  const h = location.hash.slice(1) || '/'; const [path, qs] = h.split('?');
  return { parts: path.split('/').filter(Boolean), q: new URLSearchParams(qs || '') };
}
function setQ(key, value) {
  const { parts, q } = parseHash(); if (value === '' || value == null) q.delete(key); else q.set(key, value);
  go('#/' + parts.join('/') + (q.toString() ? '?' + q : ''));
}
function render() {
  const { parts, q } = parseHash();
  const app = document.getElementById('app');
  let html = '';
  if (parts[0] === 's' && me()) { const th = themeOf(me()) === 'teen' ? 'kid teen' : 'kid'; document.body.className = th; app.className = 'app-root ' + th; html = studentPage(parts[1] || 'home', parts[2], q); }
  else if (parts[0] === 't') { document.body.className = ''; app.className = 'app-root'; html = teacherPage(parts[1] || 'overview', parts[2], q); }
  else { document.body.className = 'kid'; app.className = 'app-root kid'; html = entryPage(); }
  app.innerHTML = html + `<div class="proto-badge" data-act="goEntry">原型 · 切换角色</div>`;
  save();
  tick();
}

// ================= 入口 =================
function entryPage() {
  const offset = S.dayOffset ? `（已模拟往后 ${S.dayOffset} 天）` : '';
  const card = s => `<div class="card" data-act="loginS" data-v="${s.id}">
    <div class="row"><span class="big-avatar">${s.avatar}</span><div><b style="font-size:19px">${esc(s.nick)}</b><div class="muted small">${esc(s.username)} · 密码 1234 · ${stageName(s.stage)}</div></div></div>
    <p class="small muted" style="margin-bottom:0">${esc(s.desc || '教师新增的学生')}</p></div>`;
  return `<main class="entry">
  <h1>📚 学习系统 3.0 原型</h1>
  <div class="proto-note">这是 3.0 开发前的<b>可点击原型</b>，在 2.1 原型基础上修改：2.x 原有的页面和功能（学习地图、考核、错题、单词本、报告、成就、设置、课本数据、教材版本、掌握情况、任务布置等）全部保留，<b>只改了 3.0 需求涉及的部分</b>。数据只保存在当前浏览器里；所有 AI 的工作（联网获取、出题、判题、识别、评估、验证）都是模拟结果，相当于“开发代理模式”。2.x 正式版和原型都不受影响。教师和测试学生的密码都是 1234。</div>
  <h2>3.0 主要变化，建议这样体验</h2>
  <div class="card"><ol class="paths">${[
    ['知识点关系', '老师 → 知识点 → 三年级数学 → 切换“关系图”“合并表”；在合并表中点格子切换 ✓ / ✗；在列表中点「秒的认识」一行的“关系”，把「计算经过的时间」加为前置（会形成环，被拦下）', '#/t/kps?subject=math&stage=P3&view=graph'],
    ['联网获取知识点', '知识点 →“联网获取教材知识点”（三年级数学）→ 看差异预览和 AI 建议的关系 → 勾选入库', '#/t/kps?subject=math&stage=P3'],
    ['出题规则', '出题规则 → 下载模板 → 导入一份缺章节的规则看校验结果 → 试运行', '#/t/rules'],
    ['AI 生成习题', '题库 →“AI 生成习题”→ 选「长方形和正方形的周长」+「多位数乘一位数」（可合并），再试「倍的认识」+「认识几分之一」（不可合并）→ 生成', '#/t/bank?subject=math&stage=P3'],
    ['题目与转换', '题库 →“题目列表”按题型、来源筛选；看判断题转成的单选、分步题转成的应用题及其评分要点；看一个变式组', '#/t/bank?subject=math&stage=P3&tab=list'],
    ['AI 配置', '五个角色的主 / 备选 / 验证；开发代理模式开关；AI 任务队列；AI 更正记录', '#/t/ai'],
    ['应用题判分', '学生「小禾」→ 学习 → 数学 →「三位数加减三位数」→ 选 ★2 → 做图书室那道题，故意把第一步算错（465 − 178 = 277），看“错在哪里”，点“申诉”；再到老师 → 判题复核', ''],
    ['学习评估', '老师 → 学生 → 小禾 → 学习策略 →“立即评估”，看比例和难度怎么调整、超限部分怎么截断；锁定一个知识点。学生首页的“今日任务”按学习策略出题', '#/t/student/s1?tab=strategy'],
    ['纸质试卷', '老师 → 考核与任务 → 布置“纸质考核”→ 导出 PDF 看新版式（单选在括号里写字母）；小满已有一份识别批改过的试卷，点“查看批改”看验证 AI 的更正', '#/t/exams'],
    ['先学后学', '小禾的学习地图上，「计算经过的时间」显示“建议先学「秒的认识」”；阿远（初三物理）的「欧姆定律的计算」显示“建议先学「串联和并联电路」”', ''],
  ].map(([t, d, h]) => `<li><b>${t}</b>：${d}${h ? ` <a data-act="loginT" data-v="${h}">去看 →</a>` : ''}</li>`).join('')}</ol></div>
  <h2>学生端（3 个测试账号）</h2>
  <div class="who">${S.students.map(card).join('')}</div>
  <h2>教师端</h2>
  <div class="who"><div class="card" data-act="loginT"><div class="row"><span class="big-avatar">👩‍🏫</span><div><b style="font-size:19px">teacher</b><div class="muted small">教师（兼管理员）· 密码 1234</div></div></div>
  <p class="small muted" style="margin-bottom:0">管理学生和学习策略、知识点与关系、题库与出题规则、AI 配置、判题复核、考核和系统配置</p></div></div>
  <h2>原型工具</h2>
  <div class="card"><div class="row"><span>模拟日期：<b>${todayStr()}</b> ${offset}</span>
  <button data-act="nextDay">模拟到第二天</button><button class="danger" data-act="reset">重置原型数据</button></div>
  <p class="small muted">“模拟到第二天”用于体验错题间隔复习、单词“不同的两天各答对一次”等跨天规则。</p></div>
  </main>`;
}

// ================= 学生端 =================
const themeOf = s => (S.config.allowThemeSwitch && s.theme) || S.config.themeByStage[s.stage] || 'kid';
const isTeen = () => me() && themeOf(me()) === 'teen';
const AVATARS = { kid: ['🐣', '🐼', '🦊', '🐯', '🐰', '🐨', '🦄', '🐸'], teen: ['🚀', '🎧', '📐', '🌙', '⚡', '🔷', '🎯', '🌿'] };
function studentNav(page) {
  const s = me();
  const items = [['home', '🏠', '首页'], ['kp', '🗺️', '学习'], ['exam', '📝', '考核'], ['mistakes', '📕', '错题'], ...(hasWordbook(s.stage) ? [['words', '🔤', '单词本']] : []), ['report', '📊', '报告'], ['ach', '🏆', '成就']];
  const active = { practice: 'kp', paper: 'exam', kpd: 'kp', read: 'kp', run: S.session?.mode === 'exam' ? 'exam' : 'kp', result: 'kp', cards: UI.ct?.nav || 'kp' }[page] || page;
  return `<div class="topnav"><span class="brand"><span class="brand-icon">${isTeen() ? '📘' : '🌟'}</span> ${isTeen() ? '学习空间' : '学习乐园'} 3.0</span>
  <nav>${items.map(([p, ic, t]) => `<a class="${active === p ? 'active' : ''}" href="#/s/${p}">${ic} ${t}</a>`).join('')}</nav>
  <div class="me"><a class="avatar-link" href="#/s/settings"><span class="avatar-bubble">${s.avatar}</span><span class="hide-sm">${esc(s.nick)}</span></a></div></div>`;
}
function studentPage(page, arg, q) {
  const views = { home: sHome, paper: sPaper, kp: sKp, practice: sKp, kpd: sKpDetail, run: sRun, result: sResult, exam: sExam, mistakes: sMistakes, words: sWords, cards: sCards, read: sRead, report: sReport, ach: sAch, settings: sSettings };
  const body = (views[page] || sHome)(arg, q);
  const timer = (page === 'run' && S.session?.startedAt) || (page === 'cards' && UI.ct?.startedAt) ? `<div class="timer" id="timer">⏱ 用时 00:00</div>` : '';
  return studentNav(page) + timer + `<main>${body}</main>`;
}
function memDueHtml(s) {
  const due = openSubjects(s.stage).flatMap(x => skps(s.id, s.stage, x.id)).filter(k => k.type === '记忆' && memCfg(k)).map(k => [k, memCount(s.id, k)]).filter(([, c]) => c.started && c.due);
  if (!due.length) return '';
  return `<div class="stat"><div class="label">📌 今天要背的</div><div class="num">${due.reduce((a, [, c]) => a + c.due, 0)}</div><div class="small">${due.slice(0, 2).map(([k, c]) => `<a href="#/s/kpd/${k.id}">${esc(k.name)}（${c.due}）</a>`).join('<br>')}</div></div>`;
}
function sHome() {
  const s = me(); const subs = openSubjects(s.stage);
  const dm = dueMistakes(s.id).length; const dw = hasWordbook(s.stage) ? dueWords(s.id).length : 0;
  const mine = subs.flatMap(x => skps(s.id, s.stage, x.id)).filter(isComb);
  const learning = mine.filter(k => statusOf(s.id, k).lv === 1).slice(0, 2);
  const fresh = learning.length ? learning : mine.filter(k => statusOf(s.id, k).lv === 0).slice(0, 2);
  const tasks = S.assignments.filter(a => a.sids.includes(s.id) && !a.done[s.id]);
  const isNew = !Object.keys(S.mastery[s.id] || {}).length;
  return (isTeen() ? `<div class="teen-hello"><span class="big-avatar">${s.avatar}</span><div><b>${esc(s.nick)}，你好</b><div class="small" style="opacity:.85">${stageName(s.stage)} · ${isNew ? '从第一个知识点开始吧' : `已掌握 ${S.kps.filter(k => k.stage === s.stage && statusOf(s.id, k).lv >= 2).length} 个知识点，继续保持`}</div></div></div>`
  : `<div class="row" style="margin:10px 0 16px"><span class="big-avatar" style="animation:bounce 2.4s infinite">${s.avatar}</span>
  <div class="bubble">${esc(s.nick)}，你好！你现在是 <b>${stageName(s.stage)}</b>。${isNew ? '从第一个知识点开始，点亮你的第一颗星吧！' : '今天也一起加油吧！'}</div></div>`) + `
  ${S.session && S.session.sid === s.id ? `<div class="card"><div class="row between"><div>📌 你有一个没完成的<b>${S.session.mode === 'exam' ? '考核' : S.session.mode === 'review' ? '错题复习' : '练习'}</b>：${esc(S.session.title)}（${S.session.items.filter(i => i.done || hasAnswer(i)).length}/${S.session.items.length}）</div><a class="btn primary" href="#/s/run">继续</a></div></div>` : ''}
  ${S.papers.filter(p => p.sid === s.id && p.status === '待作答').map(p => `<div class="card"><div class="row between"><div>📄 纸质考核：<b>${esc(p.title)}</b><span class="muted small">（做完后拍照上传）</span></div><a class="btn primary" href="#/s/paper/${p.id}">上传照片</a></div></div>`).join('')}
  ${tasks.filter(a => a.kind !== '纸质考核').map(a => `<div class="card"><div class="row between"><div>📮 老师布置的${a.kind}：<b>${esc(a.title)}</b>${a.due ? `<span class="muted small">（${md(a.due)} 前完成）</span>` : ''}</div><button class="primary" data-act="doAssign" data-v="${a.id}">开始</button></div></div>`).join('')}
  ${todayCard(s)}
  <h2>今日推荐</h2>
  <div class="grid">
    <div class="stat"><div class="label">📕 到期错题</div><div class="num">${dm}</div>${dm ? `<button class="small" data-act="reviewDue">去复习</button>` : '<span class="small muted">没有到期的错题</span>'}</div>
    ${hasWordbook(s.stage) ? `<div class="stat"><div class="label">🔤 今天要背的单词</div><div class="num">${dw}</div>${dw ? `<a class="btn small" href="#/s/words">去背单词</a>` : '<span class="small muted">今天的单词背完啦</span>'}</div>` : ''}
    ${memDueHtml(s)}
    ${fresh.map(k => `<div class="stat"><div class="label">${subj(k.subject).icon} 推荐练习</div><div style="font-weight:700;margin:6px 0">${esc(k.name)}</div><a class="btn small" href="#/s/kpd/${k.id}">去练习</a></div>`).join('')}
  </div>
  <h2>我的学科（${stageName(s.stage)}）</h2>
  <div class="subject-cards">${subs.map(x => { const p = subjectProgress(s.id, s.stage, x.id); return `<a class="card subject-card" href="#/s/kp?subject=${x.id}" style="color:inherit">
    <div class="row between"><span class="ic">${x.icon}</span><span class="tag">⭐ ${p.stars}</span></div><h3>${x.name}</h3>
    <div class="progress"><div style="width:${p.p}%"></div></div><div class="small muted" style="margin-top:6px">${p.total ? `掌握进度 ${p.p}% · 已掌握 ${p.mastered}/${p.total} 个知识点` : '这个阶段的知识点还没有生成'}</div></a>`; }).join('') || '<div class="empty">当前阶段还没有开设学科</div>'}</div>`;
}
// ---- 2.1 学生端知识点：小学“知识岛探险”，初中“成长路线”
const ST_ICON = ['🥚', '🌱', '🌿', '🌳', '👑'];
const ST_KID = ['还没开始', '正在学', '学会了', '很熟练', '精通'];
const TYPE_MINI = { 记忆: '📌', 技能: '🛠️', 理解应用: '💡', 开放: '📖' };
const TYPE_VERB = { 记忆: '背一背', 技能: '算一算', 理解应用: '想一想', 开放: '读一读' };
const TRAIL_X = [26, 52, 76, 50, 24, 48];
const TRAIL_ROW = 140;
function kpMini(sid, k) {
  if (k.type === '记忆') { const c = memCount(sid, k); return `背会 ${c.done}/${c.total}`; }
  if (k.type === '开放') return `读了 ${peekReads(sid, k).length} 篇`;
  return starsHtml(starsOf(sid, k), maxLevel(k));
}
function nextKp(sid, list) { return list.find(k => statusOf(sid, k).lv === 1 && !needsReview(sid, k) && !missingMust(sid, k.id).length) || list.find(k => statusOf(sid, k).lv === 0 && !missingMust(sid, k.id).length); }
function nodeAct(k, opts) {
  if (opts.readonly) return '';
  if (opts.select) return isComb(k) ? `data-act="toggleSelNode" data-v="${k.id}"` : '';
  return `data-act="openKp" data-v="${k.id}"`;
}
function kidWorld(sid, list, opts = {}) {
  const units = [...new Set(list.map(k => k.unit))]; const nx = opts.readonly || opts.select ? null : nextKp(sid, list);
  return units.map((u, ui) => {
    const ks = list.filter(k => k.unit === u); const H = ks.length * TRAIL_ROW + 10;
    const pts = ks.map((_, i) => [TRAIL_X[(i + ui) % TRAIL_X.length], i * TRAIL_ROW + 40]);
    const d = pts.map(([x, y], i) => i ? `C ${pts[i - 1][0]} ${pts[i - 1][1] + TRAIL_ROW / 2}, ${x} ${y - TRAIL_ROW / 2}, ${x} ${y}` : `M ${x} ${y}`).join(' ');
    const lit = ks.filter(k => statusOf(sid, k).lv >= 2).length;
    return `<section class="island i${ui % 4}"><div class="island-head"><span class="flag">${['🏝️', '🌋', '🏰', '🎡'][ui % 4]}</span><b>${esc(u)}</b><span class="island-prog">${lit === ks.length ? '🎉 全部学会' : `学会 ${lit}/${ks.length}`}</span></div>
    <div class="trail" style="height:${H}px"><svg viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" vector-effect="non-scaling-stroke"/></svg>
    ${ks.map((k, i) => { const st = statusOf(sid, k); const sel = opts.select && (UI.sel || []).includes(k.id); const dim = opts.select && !isComb(k);
      return `<div class="stop s${st.lv} ${sel ? 'sel' : ''} ${dim ? 'dim' : ''} ${opts.readonly ? 'ro' : ''}" style="left:${pts[i][0]}%;top:${pts[i][1] - 36}px" ${nodeAct(k, opts)} title="${esc(k.name)}">
      ${nx === k ? '<div class="mascot">🦊<span>下一站！</span></div>' : ''}
      <div class="node"><span class="node-ic">${sel ? '✅' : ST_ICON[st.lv]}</span><span class="node-type" title="${TYPE_TAG[k.type]}">${TYPE_MINI[k.type]}</span>${needsReview(sid, k) ? '<span class="node-alarm" title="需要复习">⏰</span>' : ''}</div>
      <div class="stop-name">${esc(k.name)}</div><div class="stop-meta">${kpMini(sid, k)}</div>${!opts.readonly && missingMust(sid, k.id).length ? `<div class="first-tip">💡 建议先学「${esc(missingMust(sid, k.id).map(x => kpById(x)?.name).join('、'))}」</div>` : ''}</div>`; }).join('')}</div></section>`;
  }).join('');
}
function teenRoute(sid, list, opts = {}) {
  const units = [...new Set(list.map(k => k.unit))]; const nx = opts.readonly || opts.select ? null : nextKp(sid, list);
  return `<div class="route">${units.map(u => {
    const ks = list.filter(k => k.unit === u); const lit = ks.filter(k => statusOf(sid, k).lv >= 2).length;
    return `<section class="chapter ${lit === ks.length ? 'done' : ''}"><div class="chapter-head"><b>${esc(u)}</b><span class="small muted">${lit}/${ks.length} 已掌握</span></div><div class="pills">
    ${ks.map(k => { const st = statusOf(sid, k); const p = progressOf(sid, k); const sel = opts.select && (UI.sel || []).includes(k.id); const dim = opts.select && !isComb(k);
      return `<div class="pill s${st.lv} ${sel ? 'sel' : ''} ${dim ? 'dim' : ''} ${opts.readonly ? 'ro' : ''} ${nx === k ? 'next' : ''}" ${nodeAct(k, opts)}>
      <span class="ring" style="--p:${p ?? (peekReads(sid, k).length ? 100 : 0)}"><i>${sel ? '✓' : TYPE_MINI[k.type]}</i></span>
      <span class="pill-text"><b>${esc(k.name)}</b><small>${st.t}${isComb(k) ? ` · ${starsOf(sid, k)}/${maxLevel(k)}★` : k.type === '记忆' ? ` · ${kpMini(sid, k)}` : ` · ${kpMini(sid, k)}`}${needsReview(sid, k) ? ' · <em>需复习</em>' : ''}${!opts.readonly && missingMust(sid, k.id).length ? ` · <em class="first">建议先学「${esc(missingMust(sid, k.id).map(x => kpById(x)?.name).join('、'))}」</em>` : ''}</small></span>${nx === k ? '<span class="next-tag">下一步</span>' : ''}</div>`; }).join('')}</div></section>`;
  }).join('')}</div>`;
}
function kpWorld(sid, list, opts) { return isTeen() ? teenRoute(sid, list, opts) : kidWorld(sid, list, opts); }
function kpSummary(sid, stage, sub, list) {
  const p = subjectProgress(sid, stage, sub); const rv = list.filter(k => needsReview(sid, k)).length;
  if (isTeen()) return `<div class="teen-summary"><div class="big-ring" style="--p:${p.p}"><b>${p.p}%</b></div><div><b>${subj(sub).name} · ${stageName(stage)}</b><div class="small muted">教材：${esc(bookName(bookOf(sid, sub, stage)))}</div>
    <div class="row" style="margin-top:6px"><span class="tag">★ ${p.stars}</span><span class="tag ok">已掌握 ${p.mastered}/${p.total}</span>${rv ? `<span class="tag bad">需复习 ${rv}</span>` : ''}</div></div></div>`;
  return `<div class="treasure"><span>⭐ 收集了 <b>${p.stars}</b> 颗星</span><span>🌳 学会 <b>${p.mastered}</b>/${p.total} 个</span>${rv ? `<span>⏰ <b>${rv}</b> 个要复习</span>` : ''}<span class="book-chip">📗 ${esc(bookName(bookOf(sid, sub, stage)))}</span></div>`;
}
const kpLegend = () => isTeen() ? '<p class="small muted legend">圆环是掌握进度。📌 背诵默写 · 🛠️ 计算技能 · 💡 理解应用 · 📖 阅读表达。★ 依次是：基础、变式、组合 2 个、组合 3 个、综合应用。</p>'
  : '<p class="small muted legend">🥚 还没开始 → 🌱 正在学 → 🌿 学会了 → 🌳 很熟练 → 👑 精通　｜　📌 背一背　🛠️ 算一算　💡 想一想　📖 读一读　｜　⭐ 越多，题目越有挑战</p>';
function subjTabs(subs, sub) { return `<div class="tabs subj-tabs">${subs.map(x => `<a class="${x.id === sub ? 'on' : ''}" data-act="setq" data-key="subject" data-v="${x.id}"><span>${x.icon}</span> ${x.name}</a>`).join('')}</div>`; }
function sKp(_, q) {
  const s = me(); const view = q.get('stage') || s.stage; const subs = openSubjects(view);
  const sub = subs.find(x => x.id === q.get('subject')) ? q.get('subject') : subs[0]?.id;
  const filter = q.get('f') || 'all'; const readonly = view !== s.stage; const teen = isTeen();
  if (readonly) UI.multi = false;
  UI.sel ||= []; UI.sel = UI.sel.filter(id => kpById(id)?.subject === sub && kpById(id)?.stage === view);
  let list = sub ? skps(s.id, view, sub) : []; const all = list;
  const counts = { all: list.length, 0: 0, 1: 0, 2: 0, review: 0 };
  list.forEach(k => { const lv = statusOf(s.id, k).lv; counts[Math.min(lv, 2)]++; if (needsReview(s.id, k)) counts.review++; });
  if (filter !== 'all') list = list.filter(k => filter === 'review' ? needsReview(s.id, k) : Math.min(statusOf(s.id, k).lv, 2) === Number(filter));
  const fNames = teen ? [['all', '全部'], ['0', '未开始'], ['1', '学习中'], ['2', '已掌握'], ['review', '需复习']] : [['all', '🌈 全部'], ['0', '🥚 还没开始'], ['1', '🌱 正在学'], ['2', '🌳 学会了'], ['review', '⏰ 要复习']];
  const stageOpts = STAGES.map(([c, n]) => `<option value="${c}" ${c === view ? 'selected' : ''}>${n}${c === s.stage ? '（当前）' : ''}${hasRecords(s.id, c) && c !== s.stage ? '（有记录）' : ''}</option>`).join('');
  return `<div class="row between"><h1>${teen ? '学习 · 成长路线' : '🗺️ 知识岛探险'}</h1><div class="row">${readonly || !all.length ? '' : `<button class="${UI.multi ? 'primary' : ''}" data-act="toggleMulti">${UI.multi ? '✓ 选好了点下面的“交错练习”' : teen ? '多选 · 交错练习' : '🔀 选几个混着练'}</button>`}<label class="inline small">查看 <select data-chg="setq" data-key="stage">${stageOpts}</select></label></div></div>
  ${readonly ? `<div class="hint-box">你正在看「${stageName(view)}」的学习记录（只能看，不能练）。改回这个阶段后，这些记录会继续有效。</div>`
    : `<p class="muted small" style="margin:0 0 6px">${UI.multi ? '勾选几个 🛠️ / 💡 知识点，题目会交错出现（每题只考一个知识点），练的是“分辨这道题该用哪个方法”。想做把几个知识点串起来的组合题，请点进知识点选 ★3 以上。' : teen ? '点一个知识点进入练习、背诵或阅读。' : '点一个站点就能开始练习、背诵或阅读！'}</p>`}
  ${subjTabs(subs, sub)}
  ${!subs.length ? '<div class="empty">这个阶段没有开设学科</div>' : !all.length ? `<div class="empty">${teen ? '' : '🏝️<br>'}「${esc(bookName(bookOf(s.id, sub, view)))}」${stageName(view)}${subj(sub).name}的知识点还没有准备好<br><span class="small">（原型准备了二、三、四年级和初二、初三的知识点；三年级英语有 PEP 新旧两个版本）</span></div>` : `
  ${kpSummary(s.id, view, sub, all)}
  <div class="tabs filter-chips">${fNames.map(([f, t]) => `<a class="${filter === f ? 'on' : ''}" data-act="setq" data-key="f" data-v="${f}">${t} <small>${counts[f]}</small></a>`).join('')}</div>
  ${list.length ? kpWorld(s.id, list, { readonly, select: !!UI.multi }) : `<div class="empty">${filter === 'review' ? '没有需要复习的，真棒！' : '这里还没有知识点'}</div>`}
  ${kpLegend()}`}
  ${UI.multi && UI.sel.length ? `<div class="sel-bar"><span>已选 <b>${UI.sel.length}</b> 个知识点</span><div class="row"><select id="mixLevel">${[1, 2].map(L => `<option value="${L}">★${L} ${levelName(L)}</option>`).join('')}</select>
  <select id="mixCount"><option>5</option><option>10</option><option>20</option></select><button class="link" data-act="clearSel">清空</button><button class="primary" data-act="startMix" ${UI.sel.length < 2 ? 'disabled title="至少选 2 个"' : ''}>交错练习</button></div></div>` : ''}`;
}
const hasRecords = (sid, stage) => S.kps.some(k => k.stage === stage && ((S.mastery[sid] || {})[k.id] || (S.mem[sid] || {})[k.id] || peekReads(sid, k).length));
function kpHeader(k) {
  const s = me(); const st = statusOf(s.id, k); const p = progressOf(s.id, k);
  const example = isComb(k) ? (isReal(k) ? bankFor(k, 1)[0] : QUESTIONS.find(x => x.subject === k.subject && x.band === band(k.stage))) : null;
  return `<a href="#/s/kp?subject=${k.subject}">← 返回</a>
  <div class="card" style="margin-top:10px"><div class="row between"><div><span class="tag">${subj(k.subject).icon} ${subj(k.subject).name} · ${stageName(k.stage)} · ${esc(k.unit)}</span> <span class="tag gray">${TYPE_TAG[k.type]}</span> <span class="tag gray">📗 ${esc(bookName(k.book))}</span><h1 style="margin:8px 0">${esc(k.name)}</h1></div>
  <div style="text-align:right">${isComb(k) ? starsHtml(starsOf(s.id, k), maxLevel(k)) : ''}<div><span class="tag ${st.cls}">${st.t}</span>${needsReview(s.id, k) ? ' <span class="tag bad">需要复习</span>' : ''}</div></div></div>
  <p>${esc(k.desc)}</p>${example ? `<div class="small muted">例题：${example.stem.replace(/<br>/g, ' ')} ${(example.blanks || []).map(b => `${esc(b.pre || '')} ____ ${esc(b.suf || '')}`).join(' ')}</div>` : ''}
  ${p === null ? '' : `<div style="margin-top:12px" class="row"><div class="progress" style="flex:1"><div style="width:${p}%"></div></div><b>${p}%</b></div>`}</div>`;
}
function levelState(sid, k, L) {
  const ml = maxLevel(k); const cap = comboCap(k.subject, k.stage); const m = peekM(sid, k.id);
  if (L > ml) return { dis: true, why: L > cap + 1 ? `${BAND_NAMES[bandIdx(k.stage)]}${subj(k.subject).name}一题最多综合 ${cap} 个知识点` : '还没有可以和它组合的知识点' };
  if (S.config.requirePrev && L > 1 && m.c[L - 2] < T(L - 1)) return { dis: true, why: '先点亮上一颗星' };
  if (isReal(k)) {
    const pool = bankFor(k, L); if (!pool.length) return { dis: true, why: '题库暂无（正式版会自动补充）' };
    if (L >= 3) { const ok = pool.filter(q => !gateMissing(sid, q.kps).length); if (!ok.length) { const miss = [...new Set(pool.flatMap(q => gateMissing(sid, q.kps)))]; return { dis: true, gate: miss, why: `先点亮 ★1：${miss.map(id => kpById(id).name).join('、')}` }; } }
  }
  return { dis: false, why: `首次答对 ${m.c[L - 1]}/${T(L)}` };
}
function sKpDetail(id) {
  const s = me(); const k = kpById(id); if (!k) return '<div class="empty">知识点不存在</div>';
  if (k.type === '记忆') return memDetail(k);
  if (k.type === '开放') return openDetail(k);
  const m = peekM(s.id, k.id); const rec = recLevel(s.id, k);
  const states = [1, 2, 3, 4, 5].map(L => levelState(s.id, k, L));
  if (UI.levelFor !== id || states[UI.level - 1]?.dis) { UI.level = states[rec - 1].dis ? (states.findIndex(x => !x.dis) + 1 || 1) : rec; UI.levelFor = id; }
  const partners = partnersOf(k); const gates = [...new Set(states.flatMap(x => x.gate || []))];
  return kpHeader(k) + orderCard(s.id, k) + `<h2>选择难度</h2>
  <div class="levels">${[1, 2, 3, 4, 5].map(L => { const st = states[L - 1]; const done = m.c[L - 1] >= T(L); return `<button class="level ${UI.level === L ? 'sel' : ''} ${L >= 3 ? 'combo' : ''}" ${st.dis ? 'disabled' : ''} data-act="pickLevel" data-v="${L}">
    ${L === rec && !st.dis ? '<span class="rec tag warn">推荐</span>' : done ? '<span class="rec tag ok">已点亮</span>' : ''}<div class="lv">${'⭐'.repeat(L)}</div><div class="small"><b>${levelName(L)}</b></div><div class="small muted">${levelDesc(L)}</div>
    <div class="small ${st.gate ? 'gate' : 'muted'}" style="margin-top:6px">${st.gate ? '🔒 ' : ''}${esc(st.why)}</div></button>`; }).join('')}</div>
  ${gates.length ? `<div class="hint-box">组合题要用到的每个知识点，都要先点亮 ★1 基础。${gates.map(g => `<a class="btn small" href="#/s/kpd/${g}">去练「${esc(kpById(g).name)}」</a>`).join(' ')}</div>` : ''}
  <div class="row"><label class="inline">题量 <select id="pCount"><option ${S.config.practiceCount === 5 ? 'selected' : ''}>5</option><option>10</option><option>20</option></select></label>
  <button class="primary big" data-act="genPractice" data-v="${k.id}" ${states[UI.level - 1]?.dis ? 'disabled' : ''}>✨ 生成习题</button></div>
  ${partners.length && maxLevel(k) >= 3 ? `<div class="card combo-card"><b>🧩 它可以和这些知识点组合</b><div class="small muted">★3 以上的题会把它们串在一起，每一步考一个知识点</div>${partners.map(p => { const pk = kpById(p.id); const ok = peekM(s.id, p.id).c[0] >= T(1) || !isComb(pk); return `<div class="delta"><span>${ok ? '✅' : '🔒'}</span><b>${esc(pk.name)}</b><span class="small muted">${esc(p.how)}</span>${pk.stage !== k.stage ? `<span class="tag gray">${stageName(pk.stage)}</span>` : ''}</div>`; }).join('')}</div>` : ''}
  <div class="proto-note">3.0 题型只有单选、填空、应用题；应用题由判题 AI 判分并指出错在哪一步。难度等级：★1 基础、★2 变式（同一个知识点换个问法）、★3 组合 2 个知识点、★4 组合 3 个、★5 综合应用。只有<b>第一次作答就答对、没有看提示</b>的题才计数，每级答对 ${T(1)} 道点亮一颗星。组合题答对，题里每个技能型 / 理解应用型知识点都计数；答错时只记在<b>答错的那一步</b>对应的知识点上。</div>`;
}
function memDetail(k) {
  const s = me(); const cfg = memCfg(k); const D = S.config.wordDays;
  if (!cfg) return kpHeader(k) + '<div class="empty">这个知识点的课本数据还没有导入，请老师在“课本数据”中导入并核对</div>';
  if (S.datasets.find(d => d.kpId === k.id)?.status === '待核对') return kpHeader(k) + `<div class="empty">📚 课本数据「${esc(cfg.data)}」还在等老师核对<br><span class="small">核对完才能背诵，避免背到错的内容</span></div>`;
  const st = peekMem(s.id, k); const c = memCount(s.id, k);
  const dots = n => `<span class="dots">${Array.from({ length: D }, (_, i) => `<i class="${n > i ? 'on' : ''}"></i>`).join('')}</span>`;
  return kpHeader(k) + `<div class="row"><button class="primary big" data-act="startMem" data-v="${k.id}" ${c.due ? '' : 'disabled'}>📌 开始背诵（${Math.min(c.due, 10)} 条）</button>${c.due ? '' : '<span class="muted">今天要背的都背完了</span>'}</div>
  <div class="proto-note">这是<b>记忆型</b>知识点，内容来自课本数据「${esc(cfg.data)}」，不由 AI 编写。每一条都要通过“${esc(cfg.read)}”和“${esc(cfg.write)}”两类测试，每类在<b>不同的 ${D} 天</b>各答对一次才算掌握；答错进度清零，第二天再复习。</div>
  <div class="card table-wrap"><table><tr><th>内容</th><th>${esc(cfg.read)}</th><th>${esc(cfg.write)}</th><th>状态</th></tr>${cfg.items.map((it, i) => { const x = st[i] || { r: [], w: [] }; return `<tr><td>${esc(it[0])} → <b>${esc(ansList(it)[0])}</b>${cfg.en ? ` <button class="link" data-act="speak" data-v="${esc(ansList(it)[0])}">🔊</button>` : ''}</td><td>${dots(x.r.length)}</td><td>${dots(x.w.length)}</td>
  <td>${x.m ? '<span class="tag ok">已掌握</span>' : x.next && x.next > todayStr() ? `<span class="tag gray">${md(x.next)} 复习</span>` : (x.r.length || x.w.length) ? '<span class="tag warn">今天</span>' : '<span class="tag gray">未学</span>'}</td></tr>`; }).join('')}</table></div>`;
}
function openDetail(k) {
  const s = me(); const reads = peekReads(s.id, k);
  return kpHeader(k) + `<div class="row"><button class="primary big" data-act="startRead" data-v="${k.id}">📖 开始阅读</button></div>
  <div class="proto-note">这是<b>阅读表达型</b>知识点：以一篇文章为单位练习，包含选择题和简答题。简答题没有唯一答案，写完后对照参考答案和要点自己评一评，老师也会评价。这类知识点<b>不按答对题数算掌握度</b>，完成 ${S.config.openDone} 篇以上显示为“基本掌握”。</div>
  <h2>完成记录</h2><div class="card table-wrap"><table><tr><th>日期</th><th>文章</th><th>选择题</th><th>自评</th><th>老师评价</th></tr>${reads.map(r => `<tr><td>${r.at}</td><td>${esc(r.title)}</td><td>${r.obj}</td><td>${esc(r.self)}</td><td>${r.eval ? `<span class="tag ok">${esc(r.eval)}</span> ${esc(r.comment || '')}` : '<span class="muted">—</span>'}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">还没有完成记录</td></tr>'}</table></div>`;
}
function sRead() {
  const r = UI.rd; if (!r) return '<div class="empty"><a href="#/s/kp">返回练习</a></div>';
  const p = r.p; const k = kpById(r.kpId);
  return `<a href="#/s/kpd/${k.id}">← ${esc(k.name)}</a><h1>📖 ${esc(p.title)}</h1><div class="card" style="font-size:19px;line-height:2">${p.text.map(t => `<p style="text-indent:2em;margin:0">${esc(t)}</p>`).join('')}</div>
  ${p.qs.map((q, i) => `<div class="card"><b>${i + 1}. ${esc(q.stem)}</b><div class="q-options" style="margin-top:10px">${q.options.map((o, j) => `<button class="q-opt ${r.ans[i] === j ? 'selected' : ''} ${r.ans[i] != null && j === q.answer ? 'correct' : ''} ${r.ans[i] === j && j !== q.answer ? 'wrong' : ''}" data-act="rdPick" data-q="${i}" data-v="${j}" ${r.ans[i] != null ? 'disabled' : ''}><span class="key">${'ABCD'[j]}</span>${esc(o)}</button>`).join('')}</div>${r.ans[i] != null ? `<div class="small muted" style="margin-top:8px">${esc(q.explain)}</div>` : ''}</div>`).join('')}
  <div class="card"><b>${p.qs.length + 1}. ${esc(p.open.stem)}</b><textarea id="rdText" rows="4" style="font-family:inherit;font-size:17px;margin-top:10px" ${r.shown ? 'disabled' : ''} placeholder="用自己的话写一写">${esc(r.text)}</textarea>
  ${r.shown ? `<div class="hint-box">参考答案：${esc(p.open.ref)}</div><div>答题要点：${p.open.keys.map(kw => { const hit = kw.words.some(w => r.text.includes(w)); return `<span class="tag ${hit ? 'ok' : 'gray'}">${hit ? '✓' : '○'} ${esc(kw.label)}</span>`; }).join(' ')}</div>
  <p class="small muted">✓ 表示你的答案里出现了相关的词，只供参考。请对照参考答案，自己评一评：</p><div class="row">${['都答到了', '答到一部分', '没答到'].map(t => `<button data-act="rdSelf" data-v="${t}">${t}</button>`).join('')}</div>`
    : `<div style="margin-top:10px"><button class="primary" data-act="rdShow">写好了，看参考答案</button></div>`}</div>`;
}
function renderQ(item, locked, reveal, showKp) {
  const q = Q[item.qid]; const a = item.ans; const dis = locked ? 'disabled' : '';
  const marks = item.marks || {}; const mk = i => marks[i] === true ? ' part-ok' : marks[i] === false ? ' part-bad' : '';
  const kpTag = kp => showKp && kp !== undefined ? `<span class="tag ${kp ? 'gray' : 'warn'}">${kp ? '考：' + esc(kpById(kp)?.name) : '把前面的结果用起来'}</span>` : '';
  let h = q.speak ? `<div class="row">${speakBtn(q.speak, { status: '点击收听（可以听多次）' })}</div>` : '';
  h += `<div class="q-stem">${String(q.stem).replace(/\n/g, '<br>')}</div>`;
  const optCls = (i, sel, ans) => `${sel ? 'selected' : ''} ${reveal && i === ans ? 'correct' : ''} ${reveal && sel && i !== ans ? 'wrong' : ''}`;
  switch (q.type) {
    case 'single':
      h += `<div class="q-options ${q.judge ? 'inline' : ''}">${q.options.map((o, i) => `<button class="q-opt ${q.judge ? 'center' : ''} ${optCls(i, a === i, q.answer)}" data-act="pick" data-v="${i}" ${dis}><span class="key">${'ABCD'[i]}</span>${o}</button>`).join('')}</div>`; break;
    case 'fill':
      h += q.blanks.map((b, i) => `<div class="blank-row${mk(i)}">${q.blanks.length > 1 && !q.balance ? `<b>${CIRCLED[i]}</b>` : ''}${esc(b.pre || '')}<input class="q-input" data-blank="${i}" value="${esc((a || [])[i] || '')}" ${dis} autocomplete="off" autocapitalize="off" spellcheck="false" ${q.balance || q.orderMode ? 'inputmode="numeric"' : ''}>${esc(b.suf || '')}${kpTag(b.kp)}</div>`).join('');
      if (q.balance) h += '<div class="small muted">系数是 1 也要填 1。系统会检查等号两边每种原子的个数是否相等。</div>';
      if (q.orderMode) h += '<div class="small muted">按顺序写出序号，例如 2314。</div>';
      if (q.blanks.some(b => b.chem)) h += '<div class="small muted">化学式里的数字直接写在后面，系统会自动识别为下标，如 H2O → H₂O</div>';
      break;
    case 'applied':
      h += `<textarea class="ap-input" data-applied="1" rows="5" ${dis || item.judging ? 'disabled' : ''} placeholder="写出每一步的算式和答句，例如：&#10;125 × 4 = …&#10;答：……">${esc(a || '')}</textarea>
      <div class="small muted">写出过程和答案，由判题 AI 判断并告诉你错在哪一步。${locked ? '' : '也可以拍照上传过程（由识别 AI 读出文字）。'}</div>`;
      if (item.judging) h += '<div class="judging">⏳ 正在判断…（判题 AI 正在看你的每一步）</div>';
      break;
  }
  return h;
}
// 应用题判分结果（学生看到：对错、错在哪、怎么改；不提供和 AI 对话的入口）
function aiBox(item, final) {
  const q = Q[item.qid]; const r = item.ai; if (!r) return '';
  if (r.toTeacher) return `<div class="hint-box">这道题 AI 老师没把握，已经交给老师批改，批改后会告诉你。</div>`;
  const cls = { 对: 'ok-box', 部分对: 'hint-box', 错: 'error-box' }[r.verdict];
  return `<div class="${cls}"><b>${{ 对: '全对！', 部分对: '部分对', 错: '还不对' }[r.verdict]}</b>　得分 ${r.score} / ${r.full}</div>
  <div class="steps">${r.steps.map((st, i) => `<div class="step ${st.ok ? 'part-ok' : 'part-bad'}"><b>${st.ok ? '✅' : '❌'} 第 ${i + 1} 步：</b>${esc(st.step)}${st.carry ? ' <span class="small">（按你上一步的结果算是对的）</span>' : ''}${st.kp && !st.ok ? ` <span class="tag gray">考：${esc(kpById(st.kp)?.name)}</span>` : ''}</div>`).join('')}</div>
  ${r.where ? `<div class="where"><b>🔍 错在哪里：</b>${esc(r.where)}</div>` : ''}
  ${final && r.verdict !== '对' ? `<div class="small"><b>正确做法：</b>${esc(q.explain)}</div>` : ''}
  ${r.verify ? `<div class="small muted" style="margin-top:6px">✔ 另一个 AI 已经核对过这个判断（${esc(r.verify.r)}）</div>` : ''}`;
}
const appealBtn = it => it.appealed ? '<div class="small muted" style="margin-top:8px">📮 已申诉，等老师处理</div>' : '<div style="margin-top:8px"><button class="small" data-act="appealOpen">我觉得判错了，申诉</button></div>';
function sRun() {
  const s = S.session; if (!s || s.sid !== S.currentSid) return '<div class="empty">没有进行中的练习。<br><a href="#/s/kp">去练习</a></div>';
  const isExam = s.mode === 'exam';
  if (!s.startedAt) {
    const kpNames = [...new Set(s.items.flatMap(i => i.kps))].map(id => kpById(id)?.name);
    return `<div class="card" style="text-align:center;padding:30px 18px"><div style="font-size:56px">${isExam ? '📝' : s.mode === 'review' ? '📕' : '✏️'}</div><h1>${esc(s.title)}</h1>
    <p>本次共 <b>${s.items.length}</b> 题${isExam ? '。考核时<b>不显示</b>题目对应的知识点，交卷后统一批改。' : '。每题提交后马上知道对错，答错可以看提示再试。'}</p>
    ${!isExam ? `<p class="small muted">知识点：${kpNames.slice(0, 6).map(esc).join('、')}${kpNames.length > 6 ? ' 等' : ''}</p>` : ''}
    <div class="proto-note">${s.real ? '三年级题库：2.x 的题已按 3.0 规则转成单选、填空、应用题，另有 AI 生成和老师导入的新题。同一变式组的题一次只出一道。应用题由判题 AI 判分并指出错在哪一步（原型为规则模拟）。' : '原型中这个年级的题目是 2.0 的示例题（已转成 3.0 题型），和所标的知识点不一定对应；想体验应用题判分，请用三年级的「小禾」。'}${s.limited ? ' 题目有限，本次题量少于设置的题量。' : ''}</div>
    <p class="small muted">点“开始”后才显示题目并开始计时。</p><button class="primary big" data-act="beginRun">开始</button></div>`;
  }
  const it = s.items[s.idx]; const q = Q[it.qid];
  const kpTags = `<div class="row">${it.level >= 3 ? `<span class="tag warn">🧩 组合题</span>` : it.level === 2 ? '<span class="tag warn">🔄 变式题</span>' : ''}${it.kps.map((id, i) => `<span class="tag ${i ? 'gray' : ''}">${i ? '＋' : '知识点：'}${esc(kpById(id)?.name)}</span>`).join('')}<span class="stars">${'⭐'.repeat(it.level)}</span></div>`;
  const head = `<div class="q-head"><b>${isExam ? '考核' : s.mode === 'review' ? '错题复习' : '练习'} · 第 ${s.idx + 1}/${s.items.length} 题</b><span class="tag gray">${subj(q.subject).icon} ${subj(q.subject).name}</span></div>
  <div class="progress" style="margin-bottom:12px"><div style="width:${pct(s.idx + (isExam ? 0 : it.done ? 1 : 0), s.items.length)}%"></div></div>`;
  if (isExam) {
    return head + `<div class="card">${renderQ(it, false, false)}</div>
    <div class="row between"><button data-act="nav" data-v="${s.idx - 1}" ${s.idx === 0 ? 'disabled' : ''}>← 上一题</button>${s.idx < s.items.length - 1 ? `<button class="primary" data-act="nav" data-v="${s.idx + 1}">下一题 →</button>` : `<button class="primary" data-act="examSubmit">交卷</button>`}</div>
    <div class="qnums">${s.items.map((x, i) => `<button class="${hasAnswer(x) ? 'done' : ''} ${i === s.idx ? 'cur' : ''}" data-act="nav" data-v="${i}">${i + 1}</button>`).join('')}</div>
    <div class="row between"><span class="small muted">答案会自动保存，刷新或关掉页面也不会丢。</span><button data-act="examSubmit">交卷</button></div>`;
  }
  let fb = '';
  if (it.hint && !it.done) fb += `<div class="hint-box">${esc(q.hints[Math.min(it.hint, 2) - 1])}</div>`;
  if (it.fb === 'ok') fb = `<div class="ok-box">🎉 答对啦！${it.first ? '' : (it.usedHint || it.tries) ? '（这次用了提示或订正，不计入掌握度）' : ''}${s.mode === 'review' ? '（错题复习不计入掌握度）' : ''}</div>`;
  if (it.fb === 'reveal') fb = `<div class="error-box">正确答案：${esc(q.answerText)}</div><div class="card" style="background:#fffaf2"><b>解析：</b>${esc(q.explain)}</div>`;
  if (it.fb === 'h1' || it.fb === 'h2') fb = q.type === 'applied' ? aiBox(it, false) + `<div class="hint-box">改一改再提交：${esc(q.hints[it.fb === 'h1' ? 0 : 1])}</div>` : `<div class="hint-box">不对哦${it.diagMsg ? `：${esc(it.diagMsg)}。` : '，再想想：'}${esc(q.hints[it.fb === 'h1' ? 0 : 1])}</div>`;
  if (q.type === 'applied' && (it.fb === 'ok' || it.fb === 'reveal' || it.fb === 'teacher')) fb = aiBox(it, true) + (it.fb === 'reveal' ? `<div class="error-box">参考答案：${esc(q.answerText)}</div>` : '');
  if (it.fb === 'reveal' && q.type === 'fill' && s.mode === 'practice') fb += appealBtn(it);
  if (q.type === 'applied' && it.ai && it.ai.verdict !== '对' && !it.ai.toTeacher && s.mode === 'practice') fb += appealBtn(it);
  return head + (s.mode === 'review' ? '' : kpTags) + `<div class="card" style="margin-top:10px">${renderQ(it, it.done, it.fb === 'reveal', true)}${fb}</div>
  <div class="row between">${it.done ? '<span></span>' : `<div class="row"><button data-act="hint" ${it.hint >= 2 ? 'disabled' : ''}>🦉 给我一点提示</button><button class="link" data-act="reportQ">这道题有问题？</button></div>`}
  ${it.done ? `<button class="primary big" data-act="nextQ">${s.idx < s.items.length - 1 ? '下一题 →' : '查看结果'}</button>` : it.judging ? '' : `<button class="primary big" data-act="submitQ">提交</button>`}</div>`;
}
function sResult() {
  const r = S.lastResult; if (!r) return '<div class="empty">还没有结果</div>';
  const rate = pct(r.correct, r.total); const stars = rate >= 90 ? 3 : rate >= 60 ? 2 : 1;
  const agg = {};
  for (const d of r.deltas) { const k = d.kpId + '|' + d.L; agg[k] ||= { ...d, notes: new Set() }; agg[k].before = Math.min(agg[k].before, d.before); agg[k].after = Math.max(agg[k].after, d.after); if (d.note) agg[k].notes.add(d.note); }
  const deltas = Object.values(agg);
  const confetti = rate >= 80 && !isTeen() ? Array.from({ length: 24 }, (_, i) => `<span style="position:fixed;top:0;left:${Math.random() * 100}vw;font-size:22px;animation:fall ${2 + Math.random() * 2}s linear ${Math.random()}s forwards;z-index:70;pointer-events:none">${['🎉', '⭐', '🎈', '✨'][i % 4]}</span>`).join('') : '';
  const weakCount = {}; (r.weak || []).forEach(id => weakCount[id] = (weakCount[id] || 0) + 1);
  const weakHtml = Object.keys(weakCount).length ? `<h2>🔍 错在哪里</h2><div class="card"><p class="small muted" style="margin-top:0">根据答错的那一步、那一空或选错的选项找出来的，先把这些知识点的基础题练熟，再做组合题。</p>${Object.entries(weakCount).map(([id, n]) => `<div class="delta"><b>${esc(weakName(id))}</b><span class="tag bad">${n} 次</span>${id !== COMBINE && kpById(id) ? `<a class="btn small" href="#/s/kpd/${id}">去练 ★1</a>` : '<span class="small muted">每一步都会，但还不会把它们连起来，多做几道组合题</span>'}</div>`).join('')}</div>` : '';
  return confetti + `<div class="card" style="text-align:center"><div class="result-stars">${'⭐'.repeat(stars)}${'<span style="opacity:.2">⭐</span>'.repeat(3 - stars)}</div>
  <h1>${esc(r.title)}</h1><p style="font-size:20px">${r.mode === 'exam' ? '答对' : '一次答对'} <b>${r.correct}</b> / ${r.total} 题 · 用时 ${fmtDur(r.dur)}</p></div>${weakHtml}
  ${r.mode !== 'review' ? `<h2>掌握度变化</h2><div class="card">${deltas.length ? deltas.map(d => { const k = kpById(d.kpId); const lit = d.after >= T(d.L) && d.before < T(d.L);
    return `<div class="delta"><span>${'⭐'.repeat(d.L)}</span><b>${esc(k?.name)}</b><span>${d.before}/${T(d.L)} → <span class="${d.after > d.before ? 'up' : ''}">${d.after}/${T(d.L)}</span></span>${lit ? '<span class="tag ok">点亮第 ' + d.L + ' 颗星！</span>' : ''}${[...d.notes].map(n => `<span class="small muted">${esc(n)}</span>`).join('')}</div>`; }).join('') : '<div class="muted">这次没有计入掌握度的题（只有第一次作答就答对、没看提示的题才计数）。</div>'}</div>` : ''}
  ${r.mode === 'exam' ? `<h2>逐题批改（现在可以看到每题考的知识点）</h2>${r.items.map((it, i) => { const q = Q[it.qid]; return `<div class="card"><div class="row between"><b>第 ${i + 1} 题 ${it.pending ? '⏳' : it.correct ? '✅' : '❌'}</b><div class="row">${it.kps.map(id => `<span class="tag">${esc(kpById(id)?.name)}</span>`).join('')}<span class="stars">${'⭐'.repeat(it.level)}</span></div></div>
    <div style="margin:8px 0">${String(q.stem).replace(/\n/g, '<br>')}</div><div class="small">你的答案：${esc(ansText(it))}</div>${it.ai ? `<div class="small">判题 AI：${it.ai.toTeacher ? '没把握，交老师批改，批改后显示结果' : `${it.ai.verdict}（${it.ai.score}/${it.ai.full}）`}</div>` : ''}${it.correct || it.pending ? '' : `${diagText(it) ? `<div class="small" style="color:var(--bad)">错在：${esc(diagText(it))}</div>` : ''}<div class="small" style="color:var(--ok)">正确答案：${esc(q.answerText)}</div><div class="small muted">${esc(q.explain)}</div>`}</div>`; }).join('')}` : ''}
  <div class="row"><a class="btn primary" href="#/s/kp">继续学习</a><a class="btn" href="#/s/mistakes">查看错题</a></div>`;
}
function paperSection(s) {
  const ps = S.papers.filter(p => p.sid === s.id);
  return `<h2>📄 纸质考核</h2><div class="card"><div class="row between"><span class="small muted">在纸上做完老师打印的试卷后，把每一页拍照上传，系统会自动识别和批改。</span><button data-act="uploadAny">📷 上传纸质试卷</button></div>
  ${ps.length ? `<table style="margin-top:8px"><tr><th>试卷</th><th>编号</th><th>状态</th><th></th></tr>${ps.map(p => `<tr><td>${esc(p.title)}</td><td class="small">${p.id}</td><td><span class="tag ${p.status === '已批改' ? 'ok' : p.status === '待作答' ? 'gray' : 'warn'}">${p.status}</span>${p.status !== '待作答' ? ` ${p.items.filter(i => i.correct).length}/${p.items.length}` : ''}</td><td><a class="btn small ${p.status === '待作答' ? 'primary' : ''}" href="#/s/paper/${p.id}">${p.status === '待作答' ? '上传照片' : '查看批改'}</a></td></tr>`).join('')}</table>` : '<p class="muted small">老师还没有布置纸质考核</p>'}</div>`;
}
function sPaper(id) {
  const p = S.papers.find(x => x.id === id && x.sid === S.currentSid); if (!p) return '<div class="empty">找不到这份试卷</div>';
  if (p.status === '待作答') {
    const ph = UI.photos || [];
    return `<a href="#/s/exam">← 考核</a><h1>📷 上传答题照片</h1><div class="card"><b>${esc(p.title)}</b><div class="small muted">编号 ${p.id} · 共 ${p.items.length} 题 · ${p.pages} 页</div></div>
    ${UI.recog ? `<div class="card"><div id="taskBox" class="loading-steps"></div></div>` : `<div class="card"><div class="row"><label class="btn primary" style="cursor:pointer">📷 拍照 / 选择图片<input type="file" accept="image/*" capture="environment" multiple data-chg="photos" style="display:none"></label><span class="small muted">四个角和右上角二维码要拍全，光线充足；照片顺序、张数不限，按纸上印的题号对应。</span></div>
    <div class="row" style="margin-top:12px">${ph.map((u, i) => `<div style="text-align:center"><img src="${u.url}" style="width:110px;height:150px;object-fit:cover;border-radius:12px;border:3px solid #f0e0c6;transform:rotate(${u.rot}deg)"><div class="small">第 ${i + 1} 页</div><div class="row" style="justify-content:center;gap:2px"><button class="link small" data-act="phMove" data-v="${i}|-1">←</button><button class="link small" data-act="phRot" data-v="${i}">⟳</button><button class="link small" data-act="phDel" data-v="${i}">✕</button><button class="link small" data-act="phMove" data-v="${i}|1">→</button></div></div>`).join('') || '<div class="muted">还没有选择照片</div>'}</div>

    <div style="margin-top:12px"><button class="primary big" data-act="recogPaper" data-v="${p.id}" ${ph.length ? '' : 'disabled'}>开始识别批改</button></div></div>`}
    <div class="proto-note">原型中不会真的识别照片，识别结果是模拟的。正式版：上传前系统先遮住页眉姓名区域；识别 AI 读出单选括号里的字母、填空每空的内容和应用题的过程；单选和低可信度的题再交验证 AI 对照照片核对，不一致的由验证 AI 更正；应用题交判题 AI 判分；仍没把握的交老师确认。</div>`;
  }
  const ok = p.items.filter(i => i.correct).length;
  return `<a href="#/s/exam">← 考核</a><div class="card" style="text-align:center"><h1>📄 ${esc(p.title)}</h1><p style="font-size:20px">答对 <b>${ok}</b> / ${p.items.length} 题</p>
  ${p.items.some(i => i.state !== '已批改') ? `<div class="hint-box">有 ${p.items.filter(i => i.state !== '已批改').length} 道题等老师确认后才计入成绩和掌握度。</div>` : ''}</div>
  ${p.items.map((it, i) => { const q = Q[it.qid]; return `<div class="card"><div class="row between"><b>第 ${i + 1} 题 ${it.state === '已批改' ? (it.correct ? '✅' : '❌') : '⏳'}</b><div class="row">${it.kps.map(id => `<span class="tag">${esc(kpById(id)?.name)}</span>`).join('')}<span class="tag gray">第 ${it.page} 页</span></div></div>
  <div style="margin:8px 0">${String(q.stem).replace(/\n/g, '<br>')}</div>
  ${it.ai && !it.ai.toTeacher ? `<div class="small">判题 AI：${it.ai.verdict}（${it.ai.score}/${it.ai.full}）${it.ai.where ? '　错在：' + esc(it.ai.where) : ''}</div>` : ''}
  <div class="row"><span class="small">系统识别你写的是：<b>${esc(it.recog)}</b></span><span class="tag ${it.conf < .8 ? 'warn' : 'gray'}">可信度 ${Math.round(it.conf * 100)}%</span>${it.verify?.r === '更正' ? `<span class="tag warn" title="${esc(it.verify.msg)}">验证 AI 已更正识别结果</span>` : ''}${it.state === '待老师确认' ? '<span class="tag warn">待老师确认</span>' : ''}${it.fix ? `<span class="tag warn">你修正为：${esc(it.fix)}（待老师确认）</span>` : ''}</div>
  ${it.state === '已批改' && !it.correct ? `<div class="small" style="color:var(--ok)">正确答案：${esc(q.answerText)}</div><div class="small muted">${esc(q.explain)}</div>` : ''}
  ${it.fix || it.state === '待老师确认' ? '' : `<button class="link small" data-act="recogFix" data-v="${p.id}|${i}">识别错了？</button>`}</div>`; }).join('')}`;
}
function sExam() {
  const s = me(); const subs = openSubjects(s.stage);
  const hist = S.records.filter(r => r.sid === s.id && r.type === '考核');
  const tasks = S.assignments.filter(a => a.sids.includes(s.id) && a.kind === '考核');
  return `<h1>📝 考核</h1><p class="muted">考核由系统从题库随机抽题，不同知识点混在一起，答题时<b>不显示</b>题目考的是哪个知识点，交卷后统一批改。</p>
  <div class="card"><h3 style="margin-top:0">开始一次考核</h3><div class="tabs">${[['all', '🌈 综合'], ...subs.map(x => [x.id, `${x.icon} ${x.name}`])].map(([id, t]) => `<a class="${(UI.examSub || 'all') === id ? 'on' : ''}" data-act="examSub" data-v="${id}">${t}</a>`).join('')}</div>
  <p class="small muted">范围：${S.config.examScope === 'started' ? '你已经开始学的知识点' : '当前阶段全部知识点'} · 题量 ${S.config.examCount} 题 · 约 ${S.config.examUpRatio}% 的题比你当前等级高一级${S.config.examLimit ? ` · 限时 ${S.config.examLimit} 分钟` : ' · 不限时'}</p>
  <button class="primary big" data-act="startExam">开始考核</button></div>
  ${paperSection(s)}
  ${tasks.length ? `<h2>老师布置的考核</h2>${tasks.map(a => `<div class="card row between"><div><b>${esc(a.title)}</b><div class="small muted">${a.count} 题${a.due ? ` · ${md(a.due)} 前完成` : ''}</div></div>${a.done[s.id] ? `<span class="tag ok">已完成 ${a.done[s.id]}</span>` : `<button class="primary" data-act="doAssign" data-v="${a.id}">开始</button>`}</div>`).join('')}` : ''}
  <h2>考核记录</h2><div class="card table-wrap"><table><tr><th>日期</th><th>阶段</th><th>学科</th><th>成绩</th><th>用时</th></tr>
  ${hist.map(r => `<tr><td>${r.at}</td><td>${stageName(r.stage)}</td><td>${r.subject === 'mixed' ? '综合' : subj(r.subject).name}</td><td>${r.correct}/${r.total}</td><td>${fmtDur(r.dur)}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">还没有考核记录</td></tr>'}</table></div>`;
}
function sMistakes(_, q) {
  const s = me(); const fs = q.get('status') || 'active'; const fsub = q.get('subject') || '';
  let list = S.mistakes.filter(m => m.sid === s.id);
  if (fs === 'active') list = list.filter(m => m.status !== '已掌握'); else if (fs !== 'all') list = list.filter(m => m.status === fs);
  if (fsub) list = list.filter(m => Q[m.qid].subject === fsub);
  const due = dueMistakes(s.id);
  return `<h1>📕 错题集</h1><div class="row between"><div class="tabs" style="margin:0">${[['active', '未掌握'], ['待复习', '待复习'], ['复习中', '复习中'], ['已掌握', '已掌握'], ['all', '全部']].map(([v, t]) => `<a class="${fs === v ? 'on' : ''}" data-act="setq" data-key="status" data-v="${v}">${t}</a>`).join('')}</div>
  <select data-chg="setq" data-key="subject"><option value="">全部学科</option>${S.subjects.map(x => `<option value="${x.id}" ${fsub === x.id ? 'selected' : ''}>${x.name}</option>`).join('')}</select></div>
  <div class="card row between" style="margin-top:12px"><span>今天到期的错题 <b>${due.length}</b> 道</span><button class="primary" data-act="reviewDue" ${due.length ? '' : 'disabled'}>复习到期错题</button></div>
  <p class="small muted">复习规则：答错 1 天后复习，之后 2 天、5 天；连续答对 3 次算掌握。错题复习答对不计入掌握度；“同类新题练习”用同知识点的其他题，答对可以计入。</p>
  ${list.map(m => { const q = Q[m.qid]; return `<div class="card"><div class="row between"><div class="row">${m.kps.map(id => `<span class="tag">${esc(kpById(id)?.name)}</span>`).join('')}<span class="tag gray">${m.from}</span></div><span class="tag ${m.status === '已掌握' ? 'ok' : m.status === '复习中' ? 'warn' : 'bad'}">${m.status}${m.status === '复习中' ? ` ${m.streak}/3` : ''}</span></div>
    <div style="margin:10px 0">${q.stem}</div><div class="small">当时的答案：<span style="color:var(--bad)">${esc(m.ans)}</span></div>
    <div class="row between" style="margin-top:8px"><span class="small muted">${m.at} 答错 · 下次复习 ${m.status === '已掌握' ? '30 天后抽查' : m.next}</span><div class="row"><button class="small" data-act="reviewOne" data-v="${m.id}">立即复习</button><button class="small" data-act="variant" data-v="${m.id}">同类新题练习</button></div></div></div>`; }).join('') || '<div class="empty">🎉 这里没有错题</div>'}`;
}
function sWords(_, q) {
  const s = me(); const tab = q.get('tab') || 'active'; const act = activeWords(s.id); const done = wordsOf(s.id).filter(w => w.mastered); const due = dueWords(s.id);
  const dots = (arr) => `<span class="dots">${[0, 1].map(i => `<i class="${arr.length > i ? 'on' : ''}"></i>`).join('')}</span>`;
  return `<h1>🔤 单词本</h1>
  <div class="grid"><div class="stat"><div class="label">未掌握</div><div class="num">${act.length}</div></div><div class="stat"><div class="label">今天要背</div><div class="num">${due.length}</div></div><div class="stat"><div class="label">已掌握</div><div class="num">${done.length}</div></div></div>
  <div class="card row between" style="margin-top:14px"><div class="row"><button class="primary big" data-act="startWords" ${due.length ? '' : 'disabled'}>开始背单词（${Math.min(due.length, 10)} 个）</button><button data-act="addWords">＋ 添加单词</button></div>
  <button class="small" data-act="nextDay">原型：模拟到第二天</button></div>
  <div class="proto-note">移出规则：每个单词要通过<b>认读</b>（看英文选中文）和<b>拼写</b>（看中文或听发音写英文）两类测试，每类都要在<b>不同的两天</b>各答对一次，才会移出未掌握单词表。任何一次答错，进度清零重新来。已掌握的单词 ${S.config.reviewDays} 天后会抽查。<br>单词来源：手动导入、英语题答错自动加入、阅读中标记生词、单元词汇、老师添加。</div>
  <div class="tabs"><a class="${tab === 'active' ? 'on' : ''}" data-act="setq" data-key="tab" data-v="active">未掌握 ${act.length}</a><a class="${tab === 'done' ? 'on' : ''}" data-act="setq" data-key="tab" data-v="done">已掌握 ${done.length}</a></div>
  <div class="card table-wrap"><table><tr><th>单词</th><th>释义</th>${tab === 'active' ? '<th>认读</th><th>拼写</th><th>下次复习</th>' : '<th>掌握日期</th>'}<th>来源</th>${S.config.wordAllowDelete && tab === 'active' ? '<th></th>' : ''}</tr>
  ${(tab === 'active' ? act : done).map(w => `<tr><td><b>${esc(w.word)}</b> <button class="link" data-act="speak" data-v="${esc(w.word)}">🔊</button></td><td>${esc(w.meaning)}</td>${tab === 'active' ? `<td>${dots(w.read)}</td><td>${dots(w.spell)}</td><td>${w.next <= todayStr() ? '<span class="tag warn">今天</span>' : md(w.next)}</td>` : `<td>${w.mastered}</td>`}<td><span class="tag gray">${esc(w.src)}</span>${w.times > 1 ? ` <span class="small muted">×${w.times}</span>` : ''}</td>${S.config.wordAllowDelete && tab === 'active' ? `<td><button class="small" data-act="delWord" data-v="${w.id}">删除</button></td>` : ''}</tr>`).join('') || '<tr><td colspan="6" class="muted">没有单词</td></tr>'}</table></div>`;
}
function sCards() {
  const c = UI.ct; if (!c) return '<div class="empty"><a href="#/s/home">返回首页</a></div>';
  if (c.idx >= c.items.length) {
    const ok = c.items.filter(i => i.correct).length;
    return `<div class="card" style="text-align:center"><div style="font-size:56px">🎉</div><h1>背完啦！</h1><p>答对 ${ok}/${c.items.length}</p>
    ${c.removed.length ? `<div class="ok-box">${esc(c.removedText)}${c.removed.map(esc).join('、')}</div>` : '<p class="muted">还没有达到掌握条件的，明天继续加油！（要在不同的日子答对才算）</p>'}
    <a class="btn primary" href="${c.back}">返回</a></div>`;
  }
  const it = c.items[c.idx];
  const big = it.listen ? `${speakBtn(it.speak, { big: true })}<div><span class="speak-status small muted" data-for="${esc(it.speak)}" data-idle="点喇叭听发音">点喇叭听发音</span></div>` : `${esc(it.big)}${it.speak ? ` ${speakBtn(it.speak)}` : ''}`;
  const body = it.opts
    ? `<div class="q-options">${it.opts.map((o, i) => `<button class="q-opt ${it.ans === i ? 'selected' : ''} ${it.done && it.answer.includes(o) ? 'correct' : ''} ${it.done && it.ans === i && !it.answer.includes(o) ? 'wrong' : ''}" data-act="ctPick" data-v="${i}" ${it.done ? 'disabled' : ''}><span class="key">${'ABCD'[i]}</span>${esc(o)}</button>`).join('')}</div>`
    : `<div style="text-align:center"><input class="q-input" id="ctInput" value="${esc(it.ans || '')}" ${it.done ? 'disabled' : ''} autocomplete="off" autocapitalize="off" spellcheck="false" style="text-align:center"></div>${it.done && !it.correct ? `<div class="error-box" style="text-align:center">正确答案：${esc(it.answer[0])}</div>` : ''}`;
  return `<div class="q-head"><b>${esc(c.title)} · ${c.idx + 1}/${c.items.length}</b><span class="tag">${it.kind === 'read' ? '认读' : '回忆'}</span></div>
  <div class="card"><div class="muted">${esc(it.label)}</div><div class="word-big">${big}</div>${body}
  ${it.done ? (it.correct ? `<div class="ok-box">答对啦！${esc(it.note || '')}</div>` : '<div class="hint-box">答错了，这一条的进度清零，明天再复习。</div>') : ''}</div>
  <div class="row" style="justify-content:flex-end">${it.done ? `<button class="primary big" data-act="ctNext">下一个 →</button>` : `<button class="primary big" data-act="ctSubmit">提交</button>`}</div>`;
}
function dayCredit(arr, D, label) {
  const t = todayStr();
  if (arr.includes(t)) return '（今天已经答对过这一类，要在不同的日子再答对才算）';
  arr.push(t); return `（${label} ${Math.min(arr.length, D)}/${D}）`;
}
function buildMemCards(sid, k) {
  const cfg = memCfg(k); const st = memState(sid, k); const t = todayStr(); const D = S.config.wordDays;
  const idx = cfg.items.map((_, i) => i).filter(i => !st[i].m && (!st[i].next || st[i].next <= t));
  return shuffle(idx).slice(0, 10).map(i => {
    const x = st[i]; const item = cfg.items[i]; const cue = item[0]; const ans = ansList(item);
    const needR = x.r.length < D && !x.r.includes(t), needW = x.w.length < D && !x.w.includes(t);
    const kind = needR && (!needW || Math.random() < .5) ? 'read' : 'write';
    const apply = ok => {
      if (!ok) { x.r = []; x.w = []; x.next = addDays(1); if (cfg.en) addWord(sid, ans[0], '答错加入', cue); return {}; }
      const note = dayCredit(kind === 'read' ? x.r : x.w, D, kind === 'read' ? cfg.read : cfg.write); x.next = addDays(1);
      if (x.r.length >= D && x.w.length >= D) { x.m = t; return { note: note + ' 🎉 这一条掌握了！', removed: `${cue} → ${ans[0]}` }; }
      return { note };
    };
    const others = cfg.items.filter((_, j) => j !== i);
    if (kind === 'read') {
      const opts = cfg.rev ? shuffle([cue, ...shuffle(others.map(o => o[0])).slice(0, 3)]) : shuffle([ans[0], ...shuffle(others.map(o => ansList(o)[0])).slice(0, 3)]);
      return { kind, label: cfg.read, big: cfg.rev ? ans[0] : cue, speak: cfg.en ? ans[0] : null, opts, answer: cfg.rev ? [cue] : ans, apply };
    }
    const listen = cfg.en && Math.random() < .4;
    return { kind, label: listen ? '听发音，写出单词' : cfg.write, big: cue, listen, speak: listen ? ans[0] : null, opts: null, answer: ans, cs: !!cfg.cs, apply };
  });
}
function buildWordCards(sid) {
  const D = S.config.wordDays; const t = todayStr();
  return shuffle(dueWords(sid)).slice(0, 10).map(w => {
    const needR = w.read.length < D && !w.read.includes(t), needS = w.spell.length < D && !w.spell.includes(t);
    const kind = needR && (!needS || Math.random() < .5) ? 'read' : 'write';
    const apply = ok => {
      if (!ok) { w.read = []; w.spell = []; w.next = addDays(1); return {}; }
      const note = dayCredit(kind === 'read' ? w.read : w.spell, D, kind === 'read' ? '认读' : '拼写'); w.next = addDays(1);
      if (w.read.length >= D && w.spell.length >= D) { w.mastered = t; return { note: note + ' 🎉 已掌握，移出未掌握单词表！', removed: w.word }; }
      return { note };
    };
    if (kind === 'read') return { kind, label: '认读：这个单词是什么意思？', big: w.word, speak: w.word, opts: shuffle([w.meaning, ...shuffle([...new Set(Object.values(DICT))].filter(m => m !== w.meaning)).slice(0, 3)]), answer: [w.meaning], apply };
    const listen = Math.random() < .4;
    return { kind, label: listen ? '听写：听发音，写出单词' : '拼写：看中文，写出英文单词', big: w.meaning, listen, speak: listen ? w.word : null, opts: null, answer: [w.word], apply };
  });
}
function sReport(_, q) {
  const s = me(); const days = Number(q.get('d') || 7); const from = addDays(-days + 1);
  const recs = S.records.filter(r => r.sid === s.id && r.at >= from);
  const total = recs.reduce((a, r) => a + r.total, 0), correct = recs.reduce((a, r) => a + r.correct, 0), dur = recs.reduce((a, r) => a + r.dur, 0);
  const byDay = Array.from({ length: days }, (_, i) => { const d = addDays(-days + 1 + i); return { d, n: recs.filter(r => r.at === d).reduce((a, r) => a + Math.round(r.dur / 60), 0) }; });
  const max = Math.max(10, ...byDay.map(x => x.n));
  const ms = S.mistakes.filter(m => m.sid === s.id);
  return `<h1>📊 学习报告</h1><div class="tabs">${[7, 30].map(d => `<a class="${days === d ? 'on' : ''}" data-act="setq" data-key="d" data-v="${d}">最近 ${d} 天</a>`).join('')}</div>
  <div class="grid"><div class="stat"><div class="label">学习天数</div><div class="num">${new Set(recs.map(r => r.at)).size}</div></div><div class="stat"><div class="label">学习用时</div><div class="num">${Math.round(dur / 60)}<span class="small"> 分钟</span></div></div>
  <div class="stat"><div class="label">完成题量</div><div class="num">${total}</div></div><div class="stat"><div class="label">首次正确率</div><div class="num">${pct(correct, total)}%</div></div></div>
  <h2>每天学习时间（分钟）</h2><div class="card"><div class="bars" style="margin-bottom:20px">${byDay.map(x => `<div class="bar" style="height:${pct(x.n, max)}%"><b>${x.n || ''}</b><span>${days === 7 || x.d.endsWith('1') || x.d.endsWith('5') ? md(x.d) : ''}</span></div>`).join('')}</div></div>
  <h2>四种正确率（分开统计）</h2><div class="card table-wrap"><table><tr><th>口径</th><th>正确率</th><th>说明</th></tr>
  <tr><td>首次答题正确率</td><td>${pct(correct, total)}%</td><td class="small muted">第一次作答就答对</td></tr><tr><td>订正后正确率</td><td>${Math.min(100, pct(correct, total) + 12)}%</td><td class="small muted">看提示再试后答对</td></tr>
  <tr><td>错题复习正确率</td><td>${ms.length ? pct(ms.filter(m => m.streak > 0).length, ms.length) : 0}%</td><td class="small muted">错题复习时答对</td></tr><tr><td>变式题正确率</td><td>${pct(correct, total) ? Math.max(0, pct(correct, total) - 8) : 0}%</td><td class="small muted">同类新题</td></tr></table></div>
  <h2>各学科掌握进度（${stageName(s.stage)}）</h2><div class="card">${openSubjects(s.stage).map(x => { const p = subjectProgress(s.id, s.stage, x.id); return `<div class="row" style="margin:8px 0"><span style="width:70px">${x.icon} ${x.name}</span><div class="progress" style="flex:1"><div style="width:${p.p}%"></div></div><span style="width:110px" class="small">${p.p}% · ⭐${p.stars}</span></div>`; }).join('')}</div>`;
}
function sAch() {
  const s = me(); const recs = S.records.filter(r => r.sid === s.id); const kps = S.kps.filter(k => peekM(s.id, k.id).last);
  const list = [
    ['🌱', '第一次练习', recs.length > 0], ['⭐', '点亮第一颗星', kps.some(k => starsOf(s.id, k) > 0)], ['🌟', '一个知识点 3 颗星', kps.some(k => starsOf(s.id, k) >= 3)], ['👑', '第一个精通的知识点', kps.some(k => statusOf(s.id, k).lv === 4)],
    ['🏝️', '一个单元全部掌握', (() => { const units = {}; S.kps.filter(k => k.stage === s.stage).forEach(k => { const u = k.subject + k.unit; units[u] ??= true; if (statusOf(s.id, k).lv < 2) units[u] = false; }); return Object.values(units).some(Boolean); })()],
    ['📝', '完成第一次考核', recs.some(r => r.type === '考核')], ['💯', '考核满分', recs.some(r => r.type === '考核' && r.correct === r.total)], ['📚', '完成 100 道题', recs.reduce((a, r) => a + r.total, 0) >= 100],
    ['🔥', '连续学习 3 天', recs.length >= 6], ['📕', '攻克 3 道错题', S.mistakes.filter(m => m.sid === s.id && m.status === '已掌握').length >= 3], ['🔤', '掌握 10 个单词', wordsOf(s.id).filter(w => w.mastered).length >= 10], ['🚀', '升入新阶段', S.stageHistory.some(h => h.sid === s.id)],
  ];
  return `<h1>🏆 成就</h1><p class="muted">已获得 ${list.filter(x => x[2]).length}/${list.length}。成就只增不减，也不和别人比较。</p><div class="ach">${list.map(([ic, t, ok]) => `<div class="card item ${ok ? '' : 'off'}"><div class="ic">${ic}</div><b>${t}</b><div class="small muted">${ok ? '已获得' : '未获得'}</div></div>`).join('')}</div>`;
}
function soundCard() {
  const sup = Voice.supported(); const en = Voice.voices('en'); const pref = Voice.pref(); const test = 'Hello! Nice to meet you.';
  return `<div class="card"><h3 style="margin-top:0">🔊 声音检测</h3>
  <table class="small"><tr><td>设备</td><td>${Voice.env()}</td></tr><tr><td>浏览器朗读</td><td>${sup ? '支持' : '<span style="color:var(--bad)">不支持</span>'}</td></tr>
  <tr><td>英语发音</td><td>${sup ? (en.length ? `${en.length} 个（${esc(en.slice(0, 3).map(v => v.name).join('、'))}${en.length > 3 ? ' 等' : ''}）` : '<span style="color:var(--bad)">没有找到英语发音</span>') : '—'}</td></tr>
  <tr><td>播放方式</td><td><select data-chg="audioPref"><option value="auto" ${pref === 'auto' ? 'selected' : ''}>自动（先用浏览器朗读，不行就用服务器语音）</option><option value="server" ${pref === 'server' ? 'selected' : ''}>总是用服务器语音</option></select></td></tr></table>
  <div class="row" style="margin-top:10px">${speakBtn(test, { status: '点喇叭试听一句英语' })}</div>
  <div class="row" style="margin-top:8px"><span>听到声音了吗？</span><button class="small" data-act="heardYes">听到了</button><button class="small" data-act="heardNo">没听到</button></div>
  <p class="small muted">没声音时请先检查：手机音量、iPhone 侧面的静音键、是否连着蓝牙耳机。在微信里打开时，系统会自动使用服务器语音。选“没听到”后，这台设备以后都用服务器语音。</p></div>`;
}
function sSettings() {
  const s = me(); const hist = S.stageHistory.filter(h => h.sid === s.id);
  return `<h1>⚙️ 我的设置</h1>
  <div class="card"><h3 style="margin-top:0">当前阶段</h3><div class="row"><select id="newStage" ${S.config.allowStageChange ? '' : 'disabled'}>${STAGES.map(([c, n]) => `<option value="${c}" ${c === s.stage ? 'selected' : ''}>${n}</option>`).join('')}</select>
  <button class="primary" data-act="changeStage" ${S.config.allowStageChange ? '' : 'disabled'}>修改</button></div>
  <p class="small muted">${S.config.allowStageChange ? '修改后，知识点、练习、考核都会切换到新阶段。旧阶段的记录全部保留，可以在“知识点”页切换查看；改回原来的阶段后，记录继续有效。' : '老师已关闭自行修改阶段，需要修改请找老师。'}</p>
  ${hist.length ? `<table><tr><th>时间</th><th>从</th><th>改为</th><th>操作人</th></tr>${hist.map(h => `<tr><td>${h.at}</td><td>${stageName(h.from)}</td><td>${stageName(h.to)}</td><td>${h.by === 'teacher' ? '老师' : '自己'}</td></tr>`).join('')}</table>` : ''}</div>
  <div class="card"><h3 style="margin-top:0">昵称和头像</h3><div class="row"><input id="nick" value="${esc(s.nick)}" maxlength="12"><div class="row">${AVATARS[themeOf(s)].map(a => `<button class="${a === s.avatar ? 'primary' : ''}" data-act="avatar" data-v="${a}">${a}</button>`).join('')}</div><button data-act="saveNick">保存</button></div></div>
  ${S.config.allowThemeSwitch ? `<div class="card"><h3 style="margin-top:0">界面风格</h3><div class="row">${[['', `跟随阶段（${S.config.themeByStage[s.stage] === 'teen' ? '青春' : '童趣'}）`], ['kid', '🌟 童趣'], ['teen', '📘 青春']].map(([v, t]) => `<button class="${(s.theme || '') === v ? 'primary' : ''}" data-act="setTheme" data-v="${v}">${t}</button>`).join('')}</div></div>` : ''}
  <div class="card"><h3 style="margin-top:0">我的教材</h3><div class="row">${openSubjects(s.stage).map(x => `<span class="tag gray">${x.icon} ${x.name}：${esc(bookName(bookOf(s.id, x.id)))}</span>`).join('')}</div><p class="small muted">教材版本由老师设置，和学校发的课本一致。如果不对，请告诉老师。</p></div>
  ${soundCard()}
  <div class="card"><h3 style="margin-top:0">修改密码</h3><div class="row"><input type="password" placeholder="旧密码"><input type="password" placeholder="新密码（至少 4 位）"><button data-act="fakePwd">保存</button></div></div>
  <button data-act="goEntry">退出登录</button>`;
}

// ================= 教师端 =================
function teacherPage(page, arg, q) {
  const nav = [['overview', '总览'], ['students', '学生'], ['mastery', '掌握情况'], ['kps', '知识点'], ['data', '课本数据'], ['bank', '题库'], ['rules', '出题规则'], ['review', '判题复核'], ['exams', '考核与任务'], ['tasks', '后台任务'], ['subjects', '学科'], ['ai', 'AI 配置'], ['config', '系统配置'], ['logs', '操作日志']];
  const active = { student: 'students', bankkp: 'bank' }[page] || page;
  const views = { overview: tOverview, data: tData, students: tStudents, student: tStudent, mastery: tMastery, kps: tKps, bank: tBank, bankkp: tBankKp, rules: tRules, review: tReview, ai: tAi, exams: tExams, tasks: tTasks, subjects: tSubjects, config: tConfig, logs: tLogs };
  const pend = pendingReview();
  return `<div class="topnav"><span class="brand">📚 学习系统 3.0 · 教师端</span><nav>${nav.map(([p, t]) => `<a class="${active === p ? 'active' : ''}" href="#/t/${p}">${t}${p === 'review' && pend ? ` <span class="tag bad">${pend}</span>` : ''}</a>`).join('')}</nav><div class="me"><span class="muted small">teacher</span></div></div>
  ${S.devMode ? '<div class="dev-bar">🧪 开发代理模式：所有 AI 的工作由开发方离线完成，可能有延迟（原型中为即时模拟）。<a href="#/t/ai">AI 配置</a></div>' : ''}
  <main class="wide" style="max-width:1200px">${(views[page] || tOverview)(arg, q)}</main>`;
}
const qStage = q => q.get('stage') || 'P3';
const filterBar = (q, opts = {}) => {
  const sub = q.get('subject') || 'math'; const stage = qStage(q); const book = q.get('book') || ''; const bs = booksFor(sub, stage);
  return `<div class="row" style="margin-bottom:12px"><select data-chg="setq" data-key="subject">${S.subjects.map(x => `<option value="${x.id}" ${x.id === sub ? 'selected' : ''}>${x.icon} ${x.name}</option>`).join('')}</select>
  <select data-chg="setq" data-key="stage">${STAGES.map(([c, n]) => `<option value="${c}" ${c === stage ? 'selected' : ''}>${n}${subj(sub).stages.includes(c) ? '' : '（未开设）'}</option>`).join('')}</select>
  <select data-chg="setq" data-key="book"><option value="">全部教材版本</option>${bs.map(b => `<option value="${b.id}" ${b.id === book ? 'selected' : ''}>📗 ${esc(b.name)}</option>`).join('')}</select>${opts.extra || ''}</div>`;
};
function bankLow(k) { return k.bank.map((n, i) => i < maxLevel(k) && n < S.config.bankTarget[i]); }
function tOverview() {
  const pending = S.kps.filter(k => k.status === '待审核'); const low = S.kps.filter(k => k.status === '启用' && isComb(k) && k.bank[0] < S.config.bankTarget[0]);
  const qTotal = S.kps.reduce((a, k) => a + k.bank.reduce((x, y) => x + y, 0), 0);
  return `<h1>总览</h1><div class="grid">
  <div class="stat"><div class="label">学生</div><div class="num">${S.students.length}</div></div>
  <div class="stat"><div class="label">本周活跃</div><div class="num">${new Set(S.records.filter(r => r.at >= addDays(-6)).map(r => r.sid)).size}</div></div>
  <div class="stat"><div class="label">知识点（启用/待审核）</div><div class="num">${S.kps.filter(k => k.status === '启用').length}<span class="small muted"> / ${pending.length}</span></div></div>
  <div class="stat"><div class="label">题库题目</div><div class="num">${qTotal}</div></div>
  <div class="stat"><div class="label">1 级题库不足的知识点</div><div class="num" style="color:var(--warn)">${low.length}</div></div>
  <div class="stat"><div class="label">今日 AI 用量</div><div class="num">${(S.aiUsedToday / 1000).toFixed(1)}k</div><div class="small muted">预算 ${S.config.dailyBudget / 1000}k Token</div></div></div>
  <h2>需要处理</h2><div class="card">
  ${pending.length ? `<div class="row between delta"><span>📋 ${pending.length} 个知识点待审核</span><a href="#/t/kps?status=待审核">去审核</a></div>` : ''}
  ${S.datasets.filter(d => d.status === '待核对').map(d => `<div class="row between delta"><span>📚 课本数据「${esc(d.name)}」待核对${d.issues ? `（${d.issues.length} 处与字典不一致）` : ''}</span><a href="#/t/data">去核对</a></div>`).join('')}
  ${low.length ? `<div class="row between delta"><span>📦 ${low.length} 个知识点 1 级题库不足 ${S.config.bankTarget[0]} 道</span><a href="#/t/bank">去补充</a></div>` : ''}
  ${S.students.flatMap(st => Object.entries(S.reads[st.id] || {}).flatMap(([kid, rs]) => rs.map((r, i) => ({ st, kid, r, i })))).filter(x => !x.r.eval).map(x => `<div class="row between delta"><span>📖 ${esc(x.st.nick)} 完成阅读「${esc(x.r.title)}」，自评“${esc(x.r.self)}”，等待老师评价</span><a href="#/t/student/${x.st.id}?stage=${kpById(x.kid).stage}&subject=chinese">去评价</a></div>`).join('')}
  ${S.papers.filter(p => p.items.some(i => i.state === '待老师确认' || (i.fix && !i.fixDone))).map(p => `<div class="row between delta"><span>📄 ${esc(student(p.sid)?.nick)} 的纸质试卷「${esc(p.title)}」有 ${p.items.filter(i => i.state === '待老师确认' || (i.fix && !i.fixDone)).length} 道题识别需要确认</span><a href="#/t/exams">去确认</a></div>`).join('')}
  ${pendingReview() ? `<div class="row between delta"><span>✅ ${pendingReview()} 条应用题判分待确认 / 学生申诉</span><a href="#/t/review">去复核</a></div>` : ''}
  ${S.prereqs.filter(r => r.state === 'pending').length + S.combos.filter(c => c.state === 'pending').length ? `<div class="row between delta"><span>🧩 ${S.prereqs.filter(r => r.state === 'pending').length + S.combos.filter(c => c.state === 'pending').length} 条 AI 建议的知识点关系待确认</span><a href="#/t/kps?view=graph">去确认</a></div>` : ''}
  ${S.jobs.filter(j => j.state !== '已完成').length ? `<div class="row between delta"><span>🤖 AI 任务队列中有 ${S.jobs.filter(j => j.state !== '已完成').length} 个请求等待开发方完成（开发代理模式）</span><a href="#/t/ai">查看</a></div>` : ''}
  ${S.feedback.map(f => `<div class="row between delta"><span>🙋 ${esc(student(f.sid)?.nick)} 反馈题目有问题：“${esc(f.text)}”</span><a data-act="qView" data-v="${f.qid}">查看题目</a></div>`).join('')}
  <div class="row between delta"><span>⚠️ 1 道题首次错误率 86%（作答 14 次），可能有问题</span><a href="#/t/bank">查看</a></div></div>
  <h2>学生概况</h2><div class="card table-wrap"><table><tr><th>学生</th><th>当前阶段</th>${S.subjects.map(x => `<th>${x.name}</th>`).join('')}<th>到期错题</th><th>未掌握单词</th><th>最近学习</th></tr>
  ${S.students.map(s => `<tr><td><a href="#/t/student/${s.id}">${s.avatar} ${esc(s.nick)}</a></td><td>${stageName(s.stage)}</td>${S.subjects.map(x => x.stages.includes(s.stage) && x.enabled ? `<td>${subjectProgress(s.id, s.stage, x.id).p}%</td>` : '<td class="muted">—</td>').join('')}
  <td>${dueMistakes(s.id).length}</td><td>${activeWords(s.id).length}</td><td>${S.records.find(r => r.sid === s.id)?.at || '—'}</td></tr>`).join('')}</table></div>`;
}
const gradesWithStudents = () => STAGES.filter(([c]) => S.students.some(s => s.stage === c));
function gradeChips(cur, key = 'grade', act = 'setq') {
  return `<div class="tabs">${[['', `全部 ${S.students.length}`], ...gradesWithStudents().map(([c, n]) => [c, `${n} ${S.students.filter(s => s.stage === c).length}`])].map(([c, t]) => `<a class="${cur === c ? 'on' : ''}" data-act="${act}" data-key="${key}" data-v="${c}">${t}</a>`).join('')}</div>`;
}
function bookChips(s) {
  return openSubjects(s.stage).map(x => { const b = bookOf(s.id, x.id); const def = b === defaultBook(x.id, s.stage); return b ? `<span class="tag ${def ? 'gray' : 'warn'}" title="${def ? '本年级默认版本' : '与默认版本不同'}">${x.name}·${esc(bookName(b))}</span>` : ''; }).join(' ');
}
function tStudents(_, q) {
  const tab = q.get('tab') || 'list';
  const head = `<div class="row between"><h1>学生管理</h1><div class="row"><button data-act="tAddStudent" class="primary">＋ 新增学生</button><button data-act="tImportStudents">批量导入</button></div></div>
  <div class="tabs"><a class="${tab === 'list' ? 'on' : ''}" data-act="setq" data-key="tab" data-v="list">👥 学生列表</a><a class="${tab === 'books' ? 'on' : ''}" data-act="setq" data-key="tab" data-v="books">📗 教材版本</a></div>`;
  if (tab === 'books') return head + tBooks();
  const g = q.get('grade') || '';
  const groups = gradesWithStudents().filter(([c]) => !g || c === g);
  return head + `<div class="card row between"><span>允许学生自己修改当前阶段：<b>${S.config.allowStageChange ? '允许' : '不允许'}</b></span><button class="small" data-act="toggleStageChange">${S.config.allowStageChange ? '关闭' : '开启'}</button></div>
  ${gradeChips(g)}
  ${groups.map(([c, n]) => { const list = S.students.filter(s => s.stage === c); return `<div class="card table-wrap"><div class="row between"><h3 style="margin:0">${n} <span class="small muted">${list.length} 人</span></h3><button class="small" data-act="tBookGrade" data-v="${c}">📗 设置本年级教材</button></div>
  <table style="margin-top:8px"><tr><th>学生</th><th>用户名</th><th>教材版本</th><th>状态</th><th>知识点（已掌握/学习中）</th><th>最近学习</th><th>操作</th></tr>
  ${list.map(s => { const ks = openSubjects(s.stage).flatMap(x => skps(s.id, s.stage, x.id)); return `<tr><td>${s.avatar} ${esc(s.nick)}</td><td>${esc(s.username)}</td><td style="max-width:320px">${bookChips(s)}</td><td><span class="tag ${s.status === '正常' ? 'ok' : 'gray'}">${s.status}</span></td>
  <td>${ks.filter(k => statusOf(s.id, k).lv >= 2).length} / ${ks.filter(k => statusOf(s.id, k).lv === 1).length}</td><td>${S.records.find(r => r.sid === s.id)?.at || '—'}</td>
  <td><div class="row"><a class="btn small" href="#/t/student/${s.id}">详情</a><a class="btn small" href="#/t/student/${s.id}?tab=strategy">学习策略</a><button class="small" data-act="tStage" data-v="${s.id}">改阶段</button><button class="small" data-act="tBook" data-v="${s.id}">教材</button><button class="small" data-act="tPwd" data-v="${s.id}">重置密码</button><button class="small" data-act="tToggle" data-v="${s.id}">${s.status === '正常' ? '停用' : '启用'}</button><button class="small danger" data-act="tDel" data-v="${s.id}">删除</button></div></td></tr>`; }).join('')}</table></div>`; }).join('')}
  <p class="small muted">橙色的教材标签表示和本年级默认版本不同。同一个年级的学生可以用不同的教材版本，知识点、题库、课本数据都按各自的版本显示。</p>`;
}
function tBooks() {
  const stagesText = st => { const p = st.filter(x => x[0] === 'P').map(x => x[1]), j = st.filter(x => x[0] === 'J').map(x => x[1]); return [p.length ? `小学 ${p[0]}${p.length > 1 ? '–' + p[p.length - 1] : ''} 年级` : '', j.length ? `初中 ${j[0]}${j.length > 1 ? '–' + j[j.length - 1] : ''} 年级` : ''].filter(Boolean).join('，'); };
  return `<div class="proto-note">教材版本从 2.0 的“学科”页移到这里：版本跟着学生走，同一年级的学生可以用不同版本。知识点、课本数据和题库都标注所属版本；“乘法口诀”这类各版本都一样的内容可以标为“各版本通用”，不用重复准备。</div>
  ${S.subjects.map(x => { const bs = S.books.filter(b => b.subject === x.id); return `<div class="card table-wrap"><div class="row between"><h3 style="margin:0">${x.icon} ${x.name}</h3><button class="small" data-act="tAddBook" data-v="${x.id}">＋ 新增版本</button></div>
  <table style="margin-top:8px"><tr><th>版本</th><th>适用年级</th><th>已有知识点</th><th>使用的学生</th><th>新学生默认</th></tr>
  ${bs.map(b => { const users = S.students.filter(s => openSubjects(s.stage).some(o => o.id === x.id) && bookOf(s.id, x.id) === b.id); const n = S.kps.filter(k => k.book === b.id).length; const d = S.bookDefault[x.id] || [];
  return `<tr><td><b>${esc(b.name)}</b></td><td class="small">${stagesText(b.stages)}</td><td>${n || '<span class="muted">0（需要联网搜索生成或导入）</span>'}</td><td class="small">${users.map(s => `${s.avatar} ${esc(s.nick)}`).join('、') || '<span class="muted">—</span>'}</td>
  <td>${['P', 'J'].map((bd, i) => b.stages.some(st => st[0] === bd) ? (d[i] === b.id ? `<span class="tag ok">${bd === 'P' ? '小学' : '初中'}默认</span>` : `<button class="link small" data-act="tSetDefault" data-v="${x.id}|${i}|${b.id}">设为${bd === 'P' ? '小学' : '初中'}默认</button>`) : '').join(' ')}</td></tr>`; }).join('')}</table></div>`; }).join('')}`;
}
function tStudent(id, q) {
  const s = student(id); if (!s) return '<div class="empty">学生不存在</div>';
  const stage = q.get('stage') || s.stage; const subs = openSubjects(stage); const sub = subs.find(x => x.id === q.get('subject')) ? q.get('subject') : subs[0]?.id;
  const list = sub ? skps(id, stage, sub) : [];
  const hist = S.stageHistory.filter(h => h.sid === id); const recs = S.records.filter(r => r.sid === id).slice(0, 10);
  return `<a href="#/t/students">← 学生列表</a><div class="row between"><h1>${s.avatar} ${esc(s.nick)} <span class="muted small">${esc(s.username)} · 当前 ${stageName(s.stage)}</span></h1>
  <span class="row" style="gap:6px">${bookChips(s)}<button class="small" data-act="tBook" data-v="${s.id}">修改教材</button></span>
  <label class="inline">查看阶段 <select data-chg="setq" data-key="stage">${STAGES.map(([c, n]) => `<option value="${c}" ${c === stage ? 'selected' : ''}>${n}${c === s.stage ? '（当前）' : hasRecords(id, c) ? '（有记录）' : ''}</option>`).join('')}</select></label></div>
  <div class="tabs"><a class="${q.get('tab') === 'strategy' ? 'on' : ''}" data-act="setq" data-key="tab" data-v="strategy">📈 学习策略</a>${subs.map(x => `<a class="${x.id === sub && q.get('tab') !== 'strategy' ? 'on' : ''}" data-act="stuSub" data-v="${x.id}">${x.icon} ${x.name} ${subjectProgress(id, stage, x.id).p}%</a>`).join('')}</div>
  ${q.get('tab') === 'strategy' ? strategyCard(id) : `<div class="card table-wrap"><table><tr><th>单元</th><th>知识点</th>${[1, 2, 3, 4, 5].map(L => `<th>★${L}</th>`).join('')}<th>进度</th><th>状态</th><th>最近练习</th><th></th></tr>
  ${list.map(k => { const m = peekM(id, k.id); const st = statusOf(id, k);
  if (k.type === '记忆') { const c = memCount(id, k); return `<tr><td class="small muted">${esc(k.unit)}</td><td>${esc(k.name)} <span class="tag gray">${TYPE_TAG[k.type]}</span></td><td colspan="5">已掌握条目 ${c.done}/${c.total}${c.started ? `，今天待复习 ${c.due}` : ''}</td><td>${progressOf(id, k)}%</td><td><span class="tag ${st.cls}">${st.t}</span>${needsReview(id, k) ? ' <span class="tag bad">需复习</span>' : ''}</td><td>${c.last || '—'}</td><td></td></tr>`; }
  if (k.type === '开放') { const rs = peekReads(id, k); return `<tr><td class="small muted">${esc(k.unit)}</td><td>${esc(k.name)} <span class="tag gray">${TYPE_TAG[k.type]}</span></td><td colspan="5" class="small">${rs.map((r, i) => `${esc(r.title)}（选择 ${r.obj}，自评“${esc(r.self)}”）${r.eval ? ` <span class="tag ok">${esc(r.eval)}</span>` : ` <button class="link small" data-act="tEval" data-v="${id}|${k.id}|${i}">评价</button>`}`).join('<br>') || '<span class="muted">未完成</span>'}</td><td>—</td><td><span class="tag ${st.cls}">${st.t}</span></td><td>${rs[0]?.at || '—'}</td><td></td></tr>`; }
  return `<tr><td class="small muted">${esc(k.unit)}</td><td>${esc(k.name)} <span class="tag gray">${TYPE_TAG[k.type]}</span></td>${m.c.map((c, i) => `<td class="${i >= maxLevel(k) ? 'muted' : c >= T(i + 1) ? '' : ''}" style="${c >= T(i + 1) ? 'color:var(--ok);font-weight:700' : ''}">${i >= maxLevel(k) ? '—' : `${c}/${T(i + 1)}`}</td>`).join('')}
  <td>${progressOf(id, k)}%</td><td><span class="tag ${st.cls}">${st.t}</span>${needsReview(id, k) ? ' <span class="tag bad">需复习</span>' : ''}${missingMust(id, k.id).length ? ` <span class="tag warn" title="“必须”前置没有基本掌握，不进入推荐">建议先学「${esc(missingMust(id, k.id).map(x => kpById(x)?.name).join('、'))}」</span>` : ''}</td><td>${m.last || '—'}</td><td><button class="small" data-act="tAdjust" data-v="${id}|${k.id}">调整</button></td></tr>`; }).join('') || '<tr><td colspan="11" class="muted">该阶段该学科没有知识点</td></tr>'}</table></div>`}
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr))">
  <div class="card"><h3 style="margin-top:0">阶段修改历史</h3><table>${hist.map(h => `<tr><td>${h.at}</td><td>${stageName(h.from)} → ${stageName(h.to)}</td><td>${h.by === 'teacher' ? '老师' : '学生'}</td></tr>`).join('') || '<tr><td class="muted">没有修改记录</td></tr>'}</table></div>
  <div class="card"><h3 style="margin-top:0">最近练习与考核</h3><table>${recs.map(r => `<tr><td>${r.at}</td><td>${r.type}</td><td>${r.subject === 'mixed' ? '综合' : subj(r.subject).name}</td><td>${stageName(r.stage)}</td><td>${r.correct}/${r.total}</td><td><button class="link small" data-act="replay">回放</button></td></tr>`).join('') || '<tr><td class="muted">没有记录</td></tr>'}</table></div>
  <div class="card"><h3 style="margin-top:0">错题（未掌握 ${S.mistakes.filter(m => m.sid === id && m.status !== '已掌握').length}）</h3>${S.mistakes.filter(m => m.sid === id).slice(0, 5).map(m => `<div class="small delta"><span class="tag ${m.status === '已掌握' ? 'ok' : 'bad'}">${m.status}</span>${m.weak?.length ? `<span class="tag bad" title="根据答错的那一步 / 那一空 / 选错的选项确定">错在：${m.weak.map(w => esc(weakName(w))).join('、')}</span>` : m.kps.length > 1 ? `<span class="tag warn" title="2.0 的旧错题没有逐步标注，根据该生在各知识点 ★1 题上的表现推测">可能出错：${esc(kpById(guessWeak(id, m.kps))?.name)}</span>` : ''}${esc(Q[m.qid].stem.replace(/<br>/g, ' ').slice(0, 30))}…</div>`).join('') || '<span class="muted">没有错题</span>'}</div>
  ${S.subjects.some(x => x.wordbook && x.stages.includes(s.stage)) ? `<div class="card"><div class="row between"><h3 style="margin:0">单词本（未掌握 ${activeWords(id).length}）</h3><button class="small" data-act="tAddWords" data-v="${id}">添加单词</button></div>
  <div style="margin-top:8px">${activeWords(id).map(w => `<span class="tag gray" style="margin:3px">${esc(w.word)} <a data-act="tRemoveWord" data-v="${id}|${w.id}" title="移出" style="cursor:pointer">✕</a></span>`).join('') || '<span class="muted">空</span>'}</div></div>` : ''}</div>`;
}
function guessWeak(sid, kps) { return kps.slice().sort((a, b) => peekM(sid, a).c[0] - peekM(sid, b).c[0])[0]; }
function tMastery(_, q) {
  const sub = q.get('subject') || 'math'; const stage = qStage(q); const fbook = q.get('book') || ''; const list = kpsOf(stage, sub, false, fbook);
  const color = p => p === 0 ? '#f1f3f7' : `hsl(${20 + p * 1.1}, 75%, ${88 - p * .3}%)`;
  return `<div class="row between"><h1>掌握情况总表</h1><button data-act="exportHeat" data-v="${sub}|${stage}">导出 Excel（CSV）</button></div>${filterBar(q)}
  <div class="card table-wrap">${list.length ? `<table class="heat"><tr><th>学生</th>${list.map(k => `<th class="kp" title="${esc(k.name)}">${esc(k.name)}</th>`).join('')}<th>平均</th></tr>
  ${S.students.map(s => `<tr><td style="text-align:left;white-space:nowrap"><a href="#/t/student/${s.id}?stage=${stage}&subject=${sub}">${s.avatar} ${esc(s.nick)}</a>${s.stage === stage ? ' <span class="tag">当前</span>' : ''}</td>${list.map(k => { if (k.book && bookOf(s.id, sub, stage) !== k.book) return `<td class="cell muted" title="该生使用「${esc(bookName(bookOf(s.id, sub, stage)))}」，不学这个知识点">·</td>`; if (k.type === '开放') { const n = peekReads(s.id, k).length; return `<td class="cell" style="background:${n ? '#e9efff' : '#f1f3f7'}" title="${esc(k.name)}：完成 ${n} 篇">${n ? n + ' 篇' : ''}</td>`; } const p = progressOf(s.id, k); return `<td class="cell" style="background:${color(p)}" title="${esc(k.name)}：${p}%">${p ? p + '%' : ''}<div style="font-size:10px">${k.type === '记忆' ? (p ? '📌' : '') : '★'.repeat(starsOf(s.id, k))}</div></td>`; }).join('')}<td><b>${subjectProgress(s.id, stage, sub).p}%</b></td></tr>`).join('')}</table>` : '<div class="empty">该阶段该学科没有知识点</div>'}</div>
  <p class="small muted">颜色越深表示掌握进度越高；★ 为已点亮的难度等级；📌 为记忆型（按条目计算）；阅读表达型显示完成篇数；“·”表示该生用的是其他教材版本，不学这个知识点。</p>`;
}
function tKps(_, q) {
  const sub = q.get('subject') || 'math'; const stage = qStage(q); const fbook = q.get('book') || ''; const status = q.get('status') || '';
  const ftype = q.get('type') || '';
  let list = kpsOf(stage, sub, true, fbook); if (status) list = list.filter(k => k.status === status); if (ftype) list = list.filter(k => k.type === ftype);
  UI.kpSel ||= []; const view = q.get('view') || 'list';
  const pendRel = S.prereqs.filter(r => r.state === 'pending' && kpById(r.b)?.subject === sub && kpById(r.b)?.stage === stage).length + S.combos.filter(c => c.state === 'pending' && kpById(c.a)?.subject === sub && kpById(c.a)?.stage === stage).length;
  const head = `<div class="row between"><h1>知识点管理</h1><div class="row"><button class="primary" data-act="tSearchKp">🌐 联网获取教材知识点</button><button data-act="tImportKp">⬆️ 上传知识点</button><button data-act="aiRelOpen" data-v="${sub}|${stage}">🤖 AI 建议关系</button><button data-act="tEditKp">＋ 新增</button><button data-act="tExportKp" data-v="${sub}|${stage}">导出</button></div></div>`;
  const tabs = `<div class="tabs">${[['list', '📋 列表'], ['graph', '🔀 关系图'], ['combo', '🧮 合并表']].map(([v, n]) => `<a class="${v === view ? 'on' : ''}" data-act="setq" data-key="view" data-v="${v}">${n}</a>`).join('')}${pendRel ? `<span class="tag warn" style="align-self:center">${pendRel} 条关系待确认</span>` : ''}</div>`;
  if (view !== 'list') { const live = kpsOf(stage, sub, true, fbook).filter(k => k.status !== '停用' && k.type !== '开放'); return head + filterBar(q) + tabs + (live.length ? (view === 'graph' ? kpGraph(live) : kpMatrix(live)) : '<div class="empty">该阶段该学科还没有知识点</div>'); }
  return head + tabs + `
${filterBar(q, { extra: `<select data-chg="setq" data-key="status"><option value="">全部状态</option>${['启用', '待审核', '停用'].map(x => `<option ${x === status ? 'selected' : ''}>${x}</option>`).join('')}</select><select data-chg="setq" data-key="type"><option value="">全部类型</option>${TYPES.map(t => `<option value="${t}" ${t === ftype ? 'selected' : ''}>${TYPE_TAG[t]}</option>`).join('')}</select><span class="muted small">学期：上学期</span>` })}
  ${!subj(sub).stages.includes(stage) ? `<div class="hint-box">${subj(sub).name}在${stageName(stage)}未开设，可在“学科”页修改开设阶段。</div>` : ''}
  <div class="card table-wrap">${list.length ? `<table><tr><th><input type="checkbox" data-act="kpSelAll" style="min-height:0"></th><th>排序</th><th>单元</th><th>知识点</th><th>教材版本</th><th>类型</th><th>难度</th><th>状态</th><th>内容</th><th title="前置 / 后学 / 可合并">关系</th><th>来源</th><th>操作</th></tr>
  ${list.map((k, i) => `<tr><td><input type="checkbox" data-act="kpSel" data-v="${k.id}" ${UI.kpSel.includes(k.id) ? 'checked' : ''} style="min-height:0"></td><td><button class="link small" data-act="kpMove" data-v="${k.id}|-1" ${i ? '' : 'disabled'}>↑</button><button class="link small" data-act="kpMove" data-v="${k.id}|1" ${i < list.length - 1 ? '' : 'disabled'}>↓</button></td>
  <td class="small">${esc(k.unit)}</td><td>${esc(k.name)}<div class="small muted">${esc(k.desc)}</div></td><td class="small">${esc(bookName(k.book))}</td><td><span class="tag gray">${TYPE_TAG[k.type]}</span>${isComb(k) ? `<div class="small muted">${qtypesOf(k).map(t => QTYPE_NAME[t].slice(0, -1)).join('·')}</div>` : ''}${k.needFig ? '<br><span class="tag warn">需配图</span>' : ''}</td><td>${['', '基础', '中等', '较难'][k.diff]}</td><td><span class="tag ${k.status === '启用' ? 'ok' : k.status === '待审核' ? 'warn' : 'gray'}">${k.status}</span></td>
  <td class="bank-cell ${isComb(k) && k.bank[0] < S.config.bankTarget[0] ? 'low' : ''}">${contentCell(k)}</td><td>${k.type === '开放' ? '<span class="muted small">不参与合并</span>' : `<button class="small" data-act="relOpen" data-v="${k.id}" title="前置 / 后学 / 可合并">${prereqsOf(k.id).length} / ${nextsOf(k.id).length} / ${partnersOf(k).length}${[...prereqsOf(k.id), ...nextsOf(k.id)].some(r => r.state === 'pending') || S.combos.some(c => (c.a === k.id || c.b === k.id) && c.state === 'pending') ? ' <span class="tag warn">待确认</span>' : ''}</button>`}</td><td class="small">${esc(k.source)}</td>
  <td><div class="row">${k.status === '待审核' ? `<button class="small primary" data-act="kpApprove" data-v="${k.id}">通过</button>` : ''}<button class="small" data-act="tEditKp" data-v="${k.id}">编辑</button><button class="small" data-act="kpMerge" data-v="${k.id}">合并</button><button class="small" data-act="kpToggle" data-v="${k.id}">${k.status === '停用' ? '启用' : '停用'}</button><button class="small danger" data-act="kpDel" data-v="${k.id}">删除</button></div></td></tr>`).join('')}</table>` : `<div class="empty">该阶段该学科还没有知识点<br><br><button class="primary" data-act="tSearchKp">🌐 联网获取教材知识点</button></div>`}</div>
  ${UI.kpSel.length ? `<div class="sel-bar"><span>已选 ${UI.kpSel.length} 个</span><div class="row"><button data-act="kpBatch" data-v="启用">批量审核通过</button><button data-act="kpBatch" data-v="停用">批量停用</button><button data-act="kpBatchDiff">批量改难度</button><button data-act="kpBatchType">批量改类型</button></div></div>` : ''}`;
}
function contentCell(k) {
  if (k.type === '记忆') { const c = memCfg(k); return c ? `条目 ${c.items.length}` : '<span class="bank-cell low">未关联课本数据</span>'; }
  if (k.type === '开放') return '文章 2 篇';
  return `1 级 ${k.bank[0]}/${S.config.bankTarget[0]}`;
}
function tData() {
  return `<div class="row between"><h1>课本数据</h1><div class="row"><button class="primary" data-act="dataSearch">🔍 联网整理初稿</button><button data-act="dataImport">导入表格</button></div></div>
  <div class="proto-note">必须准确的内容（生字词表、拼音、古诗文原文、英语词表、乘法口诀、元素符号等）作为课本数据管理，<b>不由 AI 编写</b>。可以导入现成表格，或由大模型联网整理初稿；初稿的拼音会用字典数据自动核对，不一致的逐条列出，教师核对后才能启用。记忆型知识点关联这些数据后，由程序出题。</div>
  <div class="card table-wrap"><table><tr><th>数据集</th><th>条目数</th><th>来源</th><th>关联知识点</th><th>状态</th><th></th></tr>
  ${S.datasets.map(d => { const k = d.kpId && kpById(d.kpId); return `<tr><td>${esc(d.name)}</td><td>${d.count}</td><td class="small">${esc(d.src)}</td><td class="small">${k ? `${subj(k.subject).name} · ${stageName(k.stage)} · ${esc(k.name)}` : '<span class="muted">—</span>'}</td>
  <td><span class="tag ${d.status === '已核对' ? 'ok' : 'warn'}">${d.status}</span></td><td>${d.status === '待核对' ? `<button class="small primary" data-act="dataCheck" data-v="${d.id}">核对</button>` : k ? `<button class="small" data-act="dataView" data-v="${d.id}">查看</button>` : ''}</td></tr>`; }).join('')}</table></div>`;
}
function tBank(_, q) {
  const sub = q.get('subject') || 'math'; const stage = qStage(q); const fbook = q.get('book') || ''; const list = kpsOf(stage, sub, false, fbook);
  const tgt = S.config.bankTarget; const tab = q.get('tab') || 'kp';
  const head = `<div class="row between"><h1>题库管理</h1><div class="row"><button class="primary" data-act="genOpen" data-v="${sub}|${stage}">🤖 AI 生成习题</button><button data-act="tFill" data-v="${sub}|${stage}">⚡ 一键补足本页</button><button data-act="tUpload">⬆️ 导入习题</button><button data-act="tTemplate">下载模板</button></div></div>
  ${filterBar(q)}<div class="tabs">${[['kp', '📦 按知识点'], ['list', '📝 题目列表']].map(([v, n]) => `<a class="${v === tab ? 'on' : ''}" data-act="setq" data-key="tab" data-v="${v}">${n}</a>`).join('')}</div>`;
  if (tab === 'list') return head + bankList(q);
  return head + `
  <div class="proto-note">3.0：题型只有<b>单选、填空、应用题</b>；新题只来自 <b>AI 生成</b>（出题 AI 按启用的<a href="#/t/rules">出题规则</a>出题 → 程序检查 → 验证 AI → 入库）和<b>老师导入</b>。已去掉联网搜索参考题；程序生成器不再出新题，只用来复算计算题答案。2.2.1 的题全部保留并转成三种题型（在“题目列表”中按来源“2.x 保留”查看）。<br>本页只管理技能型和理解应用型的题库；记忆型用课本数据，阅读表达型用文章。综合等级上限：${BAND_NAMES[bandIdx(stage)]}${subj(sub).name}最多 ${comboCap(sub, stage)} 个知识点。每个知识点每级目标题量默认 ${tgt[0]} 道。</div>
  <div class="card table-wrap">${list.length ? `<table><tr><th>单元</th><th>知识点</th>${[1, 2, 3, 4, 5].map(L => `<th>★${L} 现有/目标</th>`).join('')}<th>未人工审核</th><th></th></tr>
  ${list.map(k => { const low = bankLow(k); const r = rng('u' + k.id);
  if (!isComb(k)) return `<tr><td class="small muted">${esc(k.unit)}</td><td>${esc(k.name)} <span class="tag gray">${TYPE_TAG[k.type]}</span></td><td colspan="6" class="small muted">${k.type === '记忆' ? `内容来自课本数据「${esc(memCfg(k)?.data || '未关联')}」，由程序出题，不需要题库 · <a href="#/t/data">课本数据</a>` : '以文章为单位：现有文章 2 篇（教师上传 1、AI 生成并审核 1） · <button class="link small" data-act="addPassage">添加文章</button>'}</td></tr>`;
  return `<tr><td class="small muted">${esc(k.unit)}</td><td><a href="#/t/bankkp/${k.id}">${esc(k.name)}</a>${k.needFig ? ' <span class="tag warn" title="AI 只补充文字题，带图题请上传">需配图</span>' : ''}</td>
  ${k.bank.map((n, i) => i >= maxLevel(k) ? '<td class="muted">—</td>' : `<td class="bank-cell ${n === 0 ? 'zero' : low[i] ? 'low' : ''}">${n}/${tgt[i]}</td>`).join('')}<td>${Math.floor(r() * 4)}</td>
  <td><button class="small" data-act="tFill" data-v="${sub}|${stage}|${k.id}" ${low.some(Boolean) ? '' : 'disabled'}>补充</button></td></tr>`; }).join('')}</table>` : '<div class="empty">该阶段该学科没有知识点，请先到“知识点”页生成</div>'}</div>`;
}
function tBankKp(id, q) {
  const k = kpById(id); if (!k) return '<div class="empty">知识点不存在</div>';
  const pool = isReal(k) ? [1, 2, 3, 4, 5].flatMap(L => bankFor(k, L)) : QUESTIONS.filter(x => x.subject === k.subject && x.band === band(k.stage));
  const onlyUn = q.get('un') === '1';
  const meta = pool.map(x => { const r = rng(x.id + id); const src = x.source; return { q: x, src, reviewed: !x.unreviewed && (isReal(k) || r() < .6), L: x.level || (x.type === 'applied' ? 2 : 1), used: Math.floor(r() * 40), rate: 45 + Math.floor(r() * 50), off: (S.qOff || {})[x.id], fb: S.feedback.filter(f => f.qid === x.id).length }; }).filter(m => !onlyUn || !m.reviewed);
  return `<a href="#/t/bank?subject=${k.subject}&stage=${k.stage}">← 题库</a><div class="row between"><h1>${esc(k.name)} <span class="small muted">${subj(k.subject).name} · ${stageName(k.stage)}</span></h1>
  <div class="row"><button data-act="tFill" data-v="${k.subject}|${k.stage}|${k.id}">⚡ 补充</button><button data-act="tUpload">上传</button></div></div>
  <div class="row"><label class="inline"><input type="checkbox" data-act="setq" data-key="un" data-v="${onlyUn ? '' : '1'}" ${onlyUn ? 'checked' : ''} style="min-height:0"> 只看未人工审核</label><span class="small muted">${isReal(k) ? '三年级题库：2.x 的题已转为 3.0 题型（标出原题型），另有 AI 生成（标出规则版本、验证记录）和老师导入的题' : '原型中显示的是该学科的示例题（已转为 3.0 题型）'}</span></div>
  ${meta.map(m => `<div class="card"><div class="row between"><div class="row"><span class="tag">${'⭐'.repeat(m.L)}</span>${qTypeTag(m.q)}${srcTag(m.q)}${verifyTag(m.q)}<span class="tag gray" title="变式组：同一次练习只出一道">${m.q.vg} · ${esc(m.q.vk)}</span>${m.reviewed ? '<span class="tag ok">已人工审核</span>' : '<span class="tag warn">未人工审核</span>'}${m.off ? '<span class="tag bad">已停用</span>' : ''}${m.fb ? `<span class="tag bad">学生反馈 ${m.fb}</span>` : ''}</div>
  <span class="small muted">使用 ${m.used} 次 · 首次正确率 ${m.rate}%</span></div><div style="margin:10px 0">${String(m.q.stem).replace(/\n/g, '<br>')}</div>${m.q.type === 'single' ? `<div class="small">${m.q.options.map((o, i) => `${'ABCD'[i]}. ${esc(o)}`).join('　')}</div>` : ''}${qMatrix(m.q)}<div class="small">答案：${esc(m.q.answerText)}</div><div class="small muted">解析：${esc(m.q.explain)}</div>
  <div class="row" style="margin-top:8px"><button class="small" data-act="tPreviewQ" data-v="${m.q.id}">学生视角预览</button><button class="small" data-act="tEditQ" data-v="${m.q.id}">编辑</button><button class="small" data-act="qView" data-v="${m.q.id}">详情</button>${m.reviewed ? '' : `<button class="small primary" data-act="qOk" data-v="${m.q.id}">标记已审核</button>`}<button class="small" data-act="offQ" data-v="${m.q.id}">${m.off ? '启用' : '停用'}</button></div></div>`).join('') || '<div class="empty">没有题目</div>'}`;
}
function qMatrix(q) {
  if (!q.kps) return '';
  const parts = q.type === 'applied' ? q.rubric.map((r, i) => [`评分要点 ${i + 1}「${r.step}」→ ${r.key}（${r.score} 分）`, r.kp]) : q.type === 'fill' && q.blanks.some(b => b.kp) ? q.blanks.map((b, i) => [`${b.pre || '第 ' + (i + 1)} 空`, b.kp]) : [];
  const covered = new Set([...parts.map(x => x[1]), ...Object.values(q.diag || {}).map(d => d.kp)].filter(Boolean)); const miss = q.kps.filter(id => !covered.has(id));
  const diag = q.diag ? Object.entries(q.diag).map(([o, d]) => `${'ABCD'[o]}：${typeof d === 'string' ? d : `${d.t}（→ ${kpById(d.kp)?.name}）`}`) : [];
  return `<div class="qmatrix small"><div><b>考查知识点：</b>${q.kps.map(id => `<span class="tag">${esc(kpById(id)?.name)}</span>`).join(' ')}</div>
  ${q.conv ? `<div><b>2.x 转换：</b>${esc(q.conv)}</div>` : ''}
  ${parts.length ? `<div><b>${q.type === 'applied' ? '评分要点' : '逐空标注'}：</b>${parts.map(([l, kp]) => `${esc(l)} → ${kp ? esc(kpById(kp)?.name) : '<i>组合步骤</i>'}`).join('；')}</div>` : ''}${diag.length ? `<div><b>错误选项诊断：</b>${diag.map(esc).join('；')}</div>` : ''}
  ${q.kps.length > 1 ? (miss.length ? `<div style="color:var(--bad)">⚠ 校验未通过：${miss.map(id => esc(kpById(id)?.name)).join('、')} 没有对应的步骤、空或诊断选项，不能入库</div>` : '<div style="color:var(--ok)">✓ 校验通过：每个标注的知识点都有对应的评分要点、空或诊断选项</div>') : ''}</div>`;
}
function paperCell(p) {
  const st = student(p.sid); const pend = p.items.filter(i => i.state === '待老师确认' || (i.fix && !i.fixDone)).length;
  return `${st?.avatar} ${esc(st?.nick)}：<span class="tag ${p.status === '已批改' ? 'ok' : p.status === '待作答' ? 'gray' : 'warn'}">${p.status}${p.status !== '待作答' ? ' ' + p.items.filter(i => i.correct).length + '/' + p.items.length : ''}</span>
  <button class="small" data-act="exportPdf" data-v="${p.id}">导出 PDF</button><button class="small" data-act="exportWord" data-v="${p.id}">导出 Word</button><button class="small" data-act="exportKey" data-v="${p.id}">答案</button>${p.status !== '待作答' ? `<button class="small ${pend ? 'primary' : ''}" data-act="tPaperReview" data-v="${p.id}">${pend ? `确认 ${pend} 题` : '查看批改'}</button>` : ''}`;
}
function assignKpPicker(sub, sids) {
  const sts = sids.map(student); const stages = [...new Set(sts.map(s => s.stage))];
  if (!sts.length) return '<span class="muted small">先选择学生</span>';
  if (stages.length > 1) return `<div class="hint-box" style="margin:0">选了 ${stages.length} 个年级（${stages.map(stageName).join('、')}），不能指定知识点：系统按每个学生自己的年级和教材版本，从${subj(sub).name}已开始学的知识点中抽题。</div>`;
  const stage = stages[0]; if (!subj(sub).stages.includes(stage)) return `<span class="muted small">${subj(sub).name}在${stageName(stage)}未开设</span>`;
  const byBook = {}; sts.forEach(s => { const b = bookOf(s.id, sub, stage) || ''; (byBook[b] ||= []).push(s); });
  const books = Object.keys(byBook);
  return books.map(b => { const ks = kpsOf(stage, sub, false, b).filter(k => !books.length || k.book === b || !k.book);
    return `<div class="kp-group"><div class="small"><b>📗 ${esc(bookName(b))}</b> <span class="muted">适用：${byBook[b].map(s => esc(s.nick)).join('、')}</span></div>${ks.map(k => `<label><input type="checkbox" class="asKp" value="${k.id}" style="min-height:0">${esc(k.name)} <span class="small muted">${TYPE_TAG[k.type].split(' ')[0]}</span></label>`).join('') || '<span class="muted small">这个版本还没有知识点</span>'}</div>`; }).join('')
    + (books.length > 1 ? '<p class="small muted" style="margin:6px 0 0">所选学生用的教材版本不同：勾选的知识点只布置给使用该版本的学生；某个学生没有勾到任何知识点时，从他自己版本的全部知识点中抽题。</p>' : '');
}
function tExams() {
  const c = S.config; const sub = UI.asSub || 'english'; const g = UI.asGrade ?? 'P3';
  UI.asSids ||= S.students.filter(s => s.stage === 'P3').map(s => s.id);
  const groups = gradesWithStudents().filter(([st]) => !g || st === g);
  const shownAs = S.assignments.filter(a => !g || a.sids.some(id => student(id)?.stage === g));
  return `<h1>考核与任务</h1><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(360px,1fr))">
  <div class="card"><h3 style="margin-top:0">布置考核 / 练习</h3>
  <label>类型</label><select id="asKind"><option>考核</option><option>纸质考核</option><option>练习</option></select><p class="small muted" style="margin:4px 0 0">纸质考核：每个学生生成一份试卷（题目可不同），导出 PDF / Word 打印，学生拍照上传后自动批改。3.0 版式：单选题号前印“（　　）”，学生<b>写选项字母</b>；填空横线下印 ①②；应用题印“解：”“答：”。听力题不会出现在纸质试卷中。</p>
  <label>学生（按年级筛选）</label><div class="tabs" style="margin:4px 0 8px">${[['', '全部年级'], ...gradesWithStudents()].map(([st, n]) => `<a class="${g === st ? 'on' : ''}" data-act="asGrade" data-v="${st}">${n}</a>`).join('')}</div>
  <div class="chk-list" style="max-height:260px">${groups.map(([st, n]) => { const list = S.students.filter(s => s.stage === st); const all = list.every(s => UI.asSids.includes(s.id));
    return `<div class="grade-group"><label class="grade-head"><input type="checkbox" data-act="asAllGrade" data-v="${st}" ${all ? 'checked' : ''} style="min-height:0"><b>${n}</b><span class="small muted">全选 ${list.length} 人</span></label>
    ${list.map(s => `<label style="padding-left:18px"><input type="checkbox" class="asSid" value="${s.id}" ${UI.asSids.includes(s.id) ? 'checked' : ''} data-act="asSid" style="min-height:0">${s.avatar} ${esc(s.nick)} ${openSubjects(s.stage).some(x => x.id === sub) ? `<span class="tag gray">${esc(bookName(bookOf(s.id, sub)))}</span>` : `<span class="tag gray">未开设${subj(sub).name}</span>`}</label>`).join('')}</div>`; }).join('')}</div>
  <p class="small muted" style="margin:4px 0 0">已选 ${UI.asSids.length} 人${UI.asSids.length ? '：' + UI.asSids.map(id => esc(student(id).nick)).join('、') : ''}</p>
  <label>学科</label><select data-chg="asSub">${S.subjects.map(x => `<option value="${x.id}" ${x.id === sub ? 'selected' : ''}>${x.name}</option>`).join('')}</select>
  <label>知识点（不选则从全部知识点抽取）</label><div class="chk-list">${assignKpPicker(sub, UI.asSids)}</div>
  <div class="row"><div><label>题量</label><input id="asCount" type="number" value="5" min="1" style="width:90px"></div><div><label>截止日期</label><input id="asDue" type="date" value="${addDays(3)}"></div></div>
  <div style="margin-top:12px"><button class="primary" data-act="assign">布置</button></div></div>
  <div class="card"><h3 style="margin-top:0">系统抽题考核规则</h3>
  <label>题量</label><input id="cfgExamCount" type="number" value="${c.examCount}" min="1" max="50">
  <label>抽题范围</label><select id="cfgExamScope"><option value="started" ${c.examScope === 'started' ? 'selected' : ''}>学生已经开始学的知识点</option><option value="all" ${c.examScope === 'all' ? 'selected' : ''}>当前阶段全部知识点</option></select>
  <label>高一级题目的比例（%）</label><input id="cfgExamUp" type="number" value="${c.examUpRatio}" min="0" max="100">
  <label>同一知识点最多抽几题</label><input id="cfgExamPer" type="number" value="${c.examPerKp}" min="1" max="10">
  <label>限时（分钟，0 为不限时）</label><input id="cfgExamLimit" type="number" value="${c.examLimit}" min="0">
  <label>考核答对计入掌握度的题数</label><select id="cfgExamWeight"><option value="1" ${c.examWeight === 1 ? 'selected' : ''}>1（与练习相同）</option><option value="2" ${c.examWeight === 2 ? 'selected' : ''}>2（鼓励考核）</option></select>
  <div style="margin-top:12px"><button class="primary" data-act="saveExamCfg">保存规则</button></div></div></div>
  <div class="row between"><h2>已布置</h2><span class="small muted">${g ? `只显示${stageName(g)}的任务，` : ''}共 ${shownAs.length} 个</span></div><div class="card table-wrap"><table><tr><th>时间</th><th>类型</th><th>内容</th><th>学生与完成情况</th><th>截止</th></tr>
  ${shownAs.map(a => `<tr><td>${a.at}</td><td>${a.kind}</td><td>${esc(a.title)}</td><td>${a.kind === '纸质考核' ? S.papers.filter(p => p.assignment === a.id).map(p => paperCell(p)).join('<br>') : a.sids.map(id => `${student(id)?.nick}：${a.done[id] ? `<span class="tag ok">${a.done[id]}</span>` : '<span class="tag gray">未完成</span>'}`).join('　')}</td><td>${a.due || '—'}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">还没有布置任务</td></tr>'}</table></div>
  ${S.papers.filter(p => !p.assignment).length ? `<h2>其它纸质试卷</h2><div class="card">${S.papers.filter(p => !p.assignment).map(p => `<div class="delta">${esc(p.title)} · ${paperCell(p)}</div>`).join('')}</div>` : ''}`;
}
function tTasks() {
  return `<h1>后台任务</h1><p class="muted">联网获取知识点、AI 补充题库、纸质试卷识别等耗时操作在后台分批执行（AI 请求明细见 <a href="#/t/ai">AI 配置 → AI 任务队列</a>），可以离开页面，完成后在这里查看结果。</p>
  <div class="card table-wrap"><table><tr><th>时间</th><th>类型</th><th>范围</th><th>状态</th><th>Token</th><th>结果</th></tr>
  ${S.tasks.map(t => `<tr><td>${t.at}</td><td>${t.type}</td><td>${esc(t.scope)}</td><td>${t.status === '进行中' ? `<div class="progress" style="width:100px"><div style="width:${t.progress}%"></div></div>` : `<span class="tag ${t.status === '已完成' ? 'ok' : 'bad'}">${t.status}</span>`}</td><td>${t.tokens.toLocaleString()}</td><td class="small">${esc(t.result)}</td></tr>`).join('')}</table></div>`;
}
function tSubjects() {
  return `<div class="row between"><h1>学科配置</h1><button data-act="addSubject">＋ 新增学科</button></div>
  <div class="card table-wrap"><table><tr><th>学科</th><th>启用</th>${STAGES.map(([c, n]) => `<th title="${n}">${n.replace('小学', '').replace('初中', '初').replace('年级', '')}</th>`).join('')}<th>单词本</th></tr>
  ${S.subjects.map(x => `<tr><td>${x.icon} ${esc(x.name)}</td><td><input type="checkbox" data-act="subToggle" data-v="${x.id}" ${x.enabled ? 'checked' : ''} style="min-height:0"></td>${ALL_STAGES.map(c => `<td><input type="checkbox" data-act="subStage" data-v="${x.id}|${c}" ${x.stages.includes(c) ? 'checked' : ''} style="min-height:0"></td>`).join('')}
  <td><input type="checkbox" data-act="subWord" data-v="${x.id}" ${x.wordbook ? 'checked' : ''} style="min-height:0"></td></tr>`).join('')}</table></div>
  <p class="small muted">勾选的阶段才会在该阶段学生端显示此学科。默认：英语三年级起、物理八年级起、化学九年级起。<br>2.1：<b>教材版本不再在这里设置</b>，已移到 <a href="#/t/students?tab=books">学生 → 教材版本</a>，可以给每个学生分别选择。</p>`;
}
function tConfig() {
  const c = S.config; const lv = (name, arr) => `<div class="lv-inputs">${arr.map((v, i) => `<div><div class="small muted">★${i + 1}</div><input type="number" min="1" id="${name}${i}" value="${v}"></div>`).join('')}</div>`;
  const yn = (id, v) => `<select id="${id}"><option value="1" ${v ? 'selected' : ''}>是</option><option value="0" ${v ? '' : 'selected'}>否</option></select>`;
  return `<h1>系统配置</h1>
  <div class="card"><h3 style="margin-top:0">掌握度</h3><label>每个难度等级点亮星星需要首次答对的题数（达到后再答对不再增加）</label>${lv('th', c.threshold)}
  <div class="form-grid"><div><label>必须点亮上一颗星才能练下一级</label>${yn('cRequirePrev', c.requirePrev)}</div><div><label>多少天没练显示“需要复习”</label><input id="cReview" type="number" value="${c.reviewDays}"></div></div></div>
  <div class="card"><h3 style="margin-top:0">综合难度上限（一道题最多综合几个知识点）</h3><div class="table-wrap"><table><tr><th>学科</th>${BAND_NAMES.map(b => `<th>${b}</th>`).join('')}</tr>
  ${S.subjects.filter(x => c.comboCap[x.id]).map(x => `<tr><td>${x.name}</td>${c.comboCap[x.id].map((v, i) => `<td><input type="number" min="1" max="5" id="cc-${x.id}-${i}" value="${v}" style="width:64px"></td>`).join('')}</tr>`).join('')}</table></div>
  <p class="small muted">只对技能型和理解应用型知识点有效。英语、语文的综合能力主要通过“一篇短文带多道小题”（完形填空、阅读理解）体现，所以小题的上限较低。</p>
  <div class="form-grid"><div><label>阅读表达型完成几篇显示为“基本掌握”</label><input id="cOpenDone" type="number" min="1" value="${c.openDone}"></div></div></div>
  <div class="card"><h3 style="margin-top:0">题库</h3><label>每个知识点每级的目标题量</label>${lv('bt', c.bankTarget)}
  <div class="form-grid"><div><label>知识点审核通过后自动补充 1 级题库</label>${yn('cAutoL1', c.autoBankL1)}</div><div><label>2–5 级在学生用到时自动补充</label>${yn('cOnDemand', c.onDemandHigher)}</div><div><label>通过自动检查的 AI 题直接启用（标记未人工审核）</label>${yn('cAiDirect', c.aiDirectEnable)}</div></div></div>
  <div class="card"><h3 style="margin-top:0">学生端界面风格</h3><div class="form-grid">${STAGES.map(([st, n]) => `<div><label>${n}</label><select id="th-${st}"><option value="kid" ${c.themeByStage[st] === 'kid' ? 'selected' : ''}>🌟 童趣</option><option value="teen" ${c.themeByStage[st] === 'teen' ? 'selected' : ''}>📘 青春</option></select></div>`).join('')}<div><label>允许学生自己切换风格</label>${yn('cTheme', c.allowThemeSwitch)}</div></div></div>
  <div class="card"><h3 style="margin-top:0">练习与学生权限</h3><div class="form-grid"><div><label>练习默认题量</label><select id="cPCount">${[5, 10, 20].map(n => `<option ${n === c.practiceCount ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div><label>允许学生自己修改阶段</label>${yn('cStage', c.allowStageChange)}</div></div></div>
  <div class="card"><h3 style="margin-top:0">记忆型条目与单词本</h3><div class="form-grid"><div><label>记忆条目和单词：认读、回忆各需在几个不同的日子答对</label><input id="cWordDays" type="number" value="${c.wordDays}" min="1"></div><div><label>允许学生自己删除未掌握单词</label>${yn('cWordDel', c.wordAllowDelete)}</div></div></div>
  <div class="card"><h3 style="margin-top:0">AI 配置</h3><p class="small">出题、判题、识别、知识点整理、学习评估五个 AI 角色的主 / 备选 / 验证配置、开发代理模式、用量和 AI 更正记录已移到 <a href="#/t/ai">AI 配置</a> 页。联网搜索参考题已去掉。</p>
  <div class="form-grid"><div><label>判题 / 识别可信度低于多少交老师确认</label><input id="cJudgeConf" type="number" step="0.05" min="0" max="1" value="${c.judgeConf}"></div><div><label>每日 Token 预算</label><input id="cDay" type="number" value="${c.dailyBudget}"></div><div><label>每月 Token 预算</label><input id="cMonth" type="number" value="${c.monthlyBudget}"></div></div></div>
  <div class="card"><h3 style="margin-top:0">学习评估与自适应出题</h3><div class="form-grid"><div><label>目标正确率（%）</label><div class="row"><input id="cAcc0" type="number" value="${c.targetAcc[0]}" style="width:70px">～<input id="cAcc1" type="number" value="${c.targetAcc[1]}" style="width:70px"></div></div>
  <div><label>每日书面量上限（分钟）：小学 / 初中</label><div class="row"><input id="cMinP" type="number" value="${c.dayMin.P}" style="width:70px"><input id="cMinJ" type="number" value="${c.dayMin.J}" style="width:70px"></div></div><div><label>平均每题用时（秒）：小学 / 初中</label><div class="row"><input id="cSecP" type="number" value="${c.secPerQ.P}" style="width:70px"><input id="cSecJ" type="number" value="${c.secPerQ.J}" style="width:70px"></div></div><div><label>多知识点题要先点亮各知识点 ★1</label>${yn('cGate', c.comboGate)}</div></div>
  <p class="small muted">评估 AI 只给建议，系统按限制执行：单个知识点出题比例 5%～40%，难度每次最多升降一级，每种题型至少 10%，每日题量不超过上限（按平均每题用时折算）。没有配置评估 AI 时用规则算法。</p></div>
  <button class="primary big" data-act="saveCfg">保存配置</button>`;
}
function tLogs() {
  return `<h1>操作日志</h1><div class="card table-wrap"><table><tr><th>时间</th><th>操作人</th><th>操作</th></tr>${S.logs.map(l => `<tr><td>${l.at}</td><td>${l.who}</td><td>${esc(l.action)}</td></tr>`).join('')}</table></div>`;
}

// ================= 后台任务模拟 =================
function runFakeTask(task, steps, onDone) {
  S.tasks.unshift(task); let i = 0;
  const box = () => document.getElementById('taskBox');
  const timer = setInterval(() => {
    task.progress = Math.min(100, Math.round(++i * 100 / steps.length));
    if (box()) box().innerHTML = steps.slice(0, i).map((s, j) => `<div>${j < i - 1 || i === steps.length ? '✅' : '⏳'} ${s}</div>`).join('') + `<div class="progress" style="margin-top:8px"><div style="width:${task.progress}%"></div></div>`;
    if (i >= steps.length) { clearInterval(timer); task.status = '已完成'; onDone(); save(); }
  }, 650);
}

// ================= 事件 =================
const A = {
  goEntry() { go('#/'); },
  maskClose() { closeModal(); },
  close() { closeModal(); },
  loginS(d) { S.currentSid = d.v; UI = {}; go('#/s/home'); },
  loginT(d) { UI = {}; go(d?.v || '#/t/overview'); },
  reset() { if (confirm('确定重置所有原型数据？')) { localStorage.removeItem(KEY); load(); UI = {}; go('#/'); toast('已重置'); } },
  nextDay() { S.dayOffset = (S.dayOffset || 0) + 1; render(); toast(`模拟日期：${todayStr()}`); },
  setq(d, el) { if (el.type === 'checkbox') setQ(d.key, el.checked ? '1' : ''); else setQ(d.key, d.v); },
  speak(d) { Voice.play(d.v, 'en-US'); },
  heardYes() { toast('太好了，声音正常', 'ok'); },
  heardNo() { localStorage.setItem(AUDIO_PREF_KEY, 'server'); render(); toast('这台设备以后都用服务器语音', 'ok'); },
  openKp(d) { go('#/s/kpd/' + d.v); },
  pickLevel(d) { UI.level = Number(d.v); render(); },
  genPractice(d) { startPractice([d.v], UI.level || 1, Number(val('pCount'))); if (!S.session.items.length) { S.session = null; return toast('这一级还没有可以用的题'); } go('#/s/run'); },
  toggleSelNode(d) { UI.sel ||= []; UI.sel = UI.sel.includes(d.v) ? UI.sel.filter(x => x !== d.v) : [...UI.sel, d.v]; render(); },
  toggleMulti() { UI.multi = !UI.multi; UI.sel = []; render(); },
  clearSel() { UI.sel = []; render(); },
  startMix() { startPractice(UI.sel, Number(val('mixLevel')), Number(val('mixCount'))); UI.sel = []; UI.multi = false; if (!S.session.items.length) { S.session = null; return toast('这些知识点还没有可以用的题'); } go('#/s/run'); },
  beginRun() { S.session.startedAt = Date.now(); render(); },
  pick(d) { const it = cur(); if (it.done) return; it.ans = Number(d.v); render(); },
  pickA(d) { const it = cur(); it.ans = { ...(it.ans || {}), a: Number(d.v) }; render(); },
  pickR(d) { const it = cur(); it.ans = { ...(it.ans || {}), r: Number(d.v) }; render(); },
  stepPick(d) { const it = cur(); it.ans ||= []; it.ans[Number(d.s)] = Number(d.v); render(); },
  tok(d) { const it = cur(); it.ans = [...(it.ans || []), Number(d.v)]; render(); },
  untok(d) { const it = cur(); it.ans = it.ans.filter((_, i) => i !== Number(d.v)); render(); },
  hint() { const it = cur(); it.usedHint = true; it.hint = Math.min(2, it.hint + 1); render(); },
  async submitQ() {
    const s = S.session; const it = cur(); if (!hasAnswer(it)) return toast('先作答再提交哦');
    const q = Q[it.qid];
    if (q.type === 'applied') {
      it.judging = true; render(); await sleep(1300); it.judging = false;
      it.ai = aiJudge(q, it.ans); S.usage.judge[0]++;
      if (it.ai.toTeacher) { it.done = true; it.fb = 'teacher'; it.first = false; touch(s.sid, it); if (s.mode === 'practice') queueReview(s.sid, q, it, '应用题 · 低可信度'); if (S.session === s) render(); return; }
    }
    const ok = grade(it);
    if (it.tries === 0 && !it.usedHint && s.mode !== 'review') recordRecent(s.sid, it, ok);
    it.marks = Object.fromEntries(diagOf(it).parts.map(p => [p.i, p.ok])); it.diagMsg = ok ? '' : diagText(it);
    if (ok) {
      it.done = true; it.fb = 'ok'; it.first = it.tries === 0 && !it.usedHint;
      if (s.mode === 'practice') { if (it.first) credit(s.sid, it, 1); else touch(s.sid, it); }
      if (s.mode === 'review') reviewResult(it, it.tries === 0);
    } else {
      if (it.tries === 0) { it.first = false; if (s.mode === 'practice') { addMistake(s.sid, it, '练习'); touch(s.sid, it); } if (s.mode === 'review') reviewResult(it, false); }
      it.tries++;
      if (it.tries >= 3) { it.done = true; it.fb = 'reveal'; } else it.fb = it.tries === 1 ? 'h1' : 'h2';
    }
    if (S.session === s) render();
  },
  nextQ() { const s = S.session; if (s.idx < s.items.length - 1) { s.idx++; render(); window.scrollTo(0, 0); } else finishSession(); },
  nav(d) { S.session.idx = Number(d.v); render(); window.scrollTo(0, 0); },
  examSubmit() {
    const s = S.session; const left = s.items.filter(x => !hasAnswer(x)).length;
    modal(`<h3>确定交卷吗？</h3><p>${left ? `还有 <b>${left}</b> 题没有作答，没作答的算错。` : '所有题目都已作答。'}交卷后不能再修改。</p><div class="row" style="justify-content:flex-end"><button data-act="close">再检查一下</button><button class="primary" data-act="examConfirm">交卷</button></div>`);
  },
  examConfirm() { closeModal(); finishSession(); },
  examSub(d) { UI.examSub = d.v; render(); },
  startExam() { startExam({ subject: UI.examSub || 'all' }); if (!S.session.items.length) { S.session = null; return toast('这个范围里还没有可以抽的题'); } go('#/s/run'); },
  doAssign(d) {
    const a = S.assignments.find(x => x.id === d.v);
    if (a.kind === '纸质考核') { const p = S.papers.find(x => x.assignment === a.id && x.sid === S.currentSid); return go('#/s/paper/' + p.id); }
    if (a.kind === '考核') { const mineKps = a.kps.filter(id => skps(S.currentSid, me().stage, a.subject).some(k => k.id === id)); startExam({ subject: a.subject, kps: mineKps, count: a.count, title: a.title, assignment: a.id }); }
    else { const s = me(); const kps = a.kps.filter(id => skps(s.id, s.stage, a.subject).some(k => k.id === id)); if (!kps.length) kps.push(...skps(s.id, s.stage, a.subject).filter(isComb).slice(0, 3).map(k => k.id)); startPractice(kps, 1, a.count); S.session.title = a.title; a.done[s.id] = '已开始'; }
    go('#/s/run');
  },
  reviewDue() { const ids = dueMistakes(S.currentSid).map(m => m.id); if (!ids.length) return; startReview(ids); go('#/s/run'); },
  reviewOne(d) { startReview([d.v]); go('#/s/run'); },
  variant(d) {
    const m = S.mistakes.find(x => x.id === d.v); const vg = Q[m.qid].vg; const sid = S.currentSid;
    const same = QUESTIONS.filter(q => q.vg === vg && q.id !== m.qid && qUsable(q) && !gateMissing(sid, q.kps || []).length);
    if (same.length) { S.session = { mode: 'practice', sid, subject: Q[m.qid].subject, title: `同类新题练习（同一变式组）：${kpById(m.kps[0])?.name}`, items: shuffle(same).slice(0, 3).map(q => mkItem(q, q.kps || m.kps, q.level || m.level, 'practice', sid)), idx: 0, startedAt: null, deltas: [], kpIds: m.kps, real: true }; return go('#/s/run'); }
    startPractice([m.kps[0]], 1, 3); S.session.title = `同类新题练习：${kpById(m.kps[0]).name}`; go('#/s/run');
  },
  reportQ() { modal(`<h3>这道题有问题？</h3><textarea id="fbText" rows="3" placeholder="比如：答案好像不对 / 题目看不懂"></textarea><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">取消</button><button class="primary" data-act="sendFb">发送给老师</button></div>`); },
  sendFb() { S.feedback.unshift({ qid: cur().qid, sid: S.currentSid, at: todayStr(), text: val('fbText') || '（未填写）' }); closeModal(); toast('已告诉老师，谢谢你！', 'ok'); save(); },
  changeStage() {
    const s = me(); const to = val('newStage'); if (to === s.stage) return toast('和当前阶段相同');
    modal(`<h3>把阶段改为「${stageName(to)}」？</h3><p>改完后，知识点、练习、考核都会切换到新阶段。</p><p>「${stageName(s.stage)}」的所有记录都会保留，可以在“知识点”页切换查看；以后改回来，记录依然有效。</p>
    ${hasRecords(s.id, to) ? `<div class="ok-box">你在「${stageName(to)}」有以前的学习记录，改过去后会继续使用。</div>` : ''}<div class="row" style="justify-content:flex-end"><button data-act="close">取消</button><button class="primary" data-act="confirmStage" data-v="${to}">确定修改</button></div>`);
  },
  confirmStage(d) { const s = me(); S.stageHistory.push({ sid: s.id, at: todayStr(), from: s.stage, to: d.v, by: s.username }); s.stage = d.v; closeModal(); toast(`已改为${stageName(d.v)}`, 'ok'); go('#/s/home'); },
  avatar(d) { me().avatar = d.v; render(); },
  setTheme(d) { me().theme = d.v || null; render(); },
  saveNick() { me().nick = val('nick').trim() || me().nick; render(); toast('已保存', 'ok'); },
  fakePwd() { toast('原型：密码修改不生效'); },
  addWords(d) {
    const sid = d?.v || S.currentSid;
    modal(`<h3>添加单词</h3><p class="small muted">一行一个，格式“单词 中文”，中文可以不填，系统会自动补全释义。也可以选择 Excel / CSV 文件导入。</p>
    <textarea id="wordText" rows="7" placeholder="library 图书馆&#10;delicious&#10;thirsty 口渴的"></textarea><div style="margin-top:8px"><input type="file" accept=".csv,.txt,.xlsx" data-chg="wordFile"></div>
    <div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">取消</button><button class="primary" data-act="saveWords" data-v="${sid}">添加</button></div>`);
  },
  saveWords(d) {
    const src = d.v === S.currentSid && parseHash().parts[0] === 's' ? '手动导入' : '老师添加';
    let n = 0, dup = 0;
    val('wordText').split('\n').map(l => l.trim()).filter(Boolean).forEach(l => { const m = l.match(/^([A-Za-z][A-Za-z\s'\-]*?)\s*([^A-Za-z].*)?$/); if (!m) return; if (addWord(d.v, m[1], src, m[2]?.trim())) n++; else dup++; });
    closeModal(); if (src === '老师添加') log(`给 ${student(d.v).nick} 添加单词 ${n} 个`); render(); toast(`添加 ${n} 个单词${dup ? `，${dup} 个已在单词本中` : ''}`, 'ok');
  },
  delWord(d) { S.words[S.currentSid] = wordsOf(S.currentSid).filter(w => w.id !== d.v); render(); },
  startWords() { UI.ct = { title: '背单词', items: buildWordCards(S.currentSid), idx: 0, removed: [], removedText: '这些单词已经掌握，移出了未掌握单词表：', startedAt: Date.now(), back: '#/s/words', nav: 'words' }; go('#/s/cards'); },
  startMem(d) { const k = kpById(d.v); UI.ct = { title: k.name, items: buildMemCards(S.currentSid, k), idx: 0, removed: [], removedText: '这些内容已经掌握：', startedAt: Date.now(), back: '#/s/kpd/' + k.id, nav: 'kp' }; go('#/s/cards'); },
  ctPick(d) { UI.ct.items[UI.ct.idx].ans = Number(d.v); render(); },
  ctSubmit() {
    const c = UI.ct; const it = c.items[c.idx];
    if (!it.opts) it.ans = val('ctInput');
    if (it.ans == null || it.ans === '') return toast('先作答哦');
    const given = it.opts ? it.opts[it.ans] : it.ans;
    const exact = x => String(x).replace(/[\uff01-\uff5e]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)).replace(/\s/g, '');
    it.correct = it.answer.some(a => it.cs ? exact(a) === exact(given) : norm(a) === norm(given));
    it.done = true; const r = it.apply(it.correct) || {}; it.note = r.note || ''; if (r.removed) c.removed.push(r.removed);
    render();
  },
  ctNext() { UI.ct.idx++; render(); },
  startRead(d) { const k = kpById(d.v); UI.rd = { kpId: k.id, p: PASSAGES[band(k.stage)], ans: {}, text: '', shown: false }; go('#/s/read'); },
  rdPick(d) { UI.rd.ans[Number(d.q)] = Number(d.v); render(); },
  rdShow() { const t = val('rdText').trim(); if (!t) return toast('先写一写你的答案'); UI.rd.text = t; UI.rd.shown = true; render(); },
  rdSelf(d) {
    const r = UI.rd; const k = kpById(r.kpId); const ok = r.p.qs.filter((q, i) => r.ans[i] === q.answer).length;
    readsOf(S.currentSid, k).unshift({ at: todayStr(), title: r.p.title, obj: `${ok}/${r.p.qs.length}`, self: d.v, text: r.text, eval: null });
    UI.rd = null; toast('完成一篇！老师会看到你的答案', 'ok'); go('#/s/kpd/' + k.id);
  },
  // ---- 教师
  toggleStageChange() { S.config.allowStageChange = !S.config.allowStageChange; log(`${S.config.allowStageChange ? '开启' : '关闭'}学生自行修改阶段`); render(); },
  tAddStudent() {
    modal(`<h3>新增学生</h3><label>用户名</label><input id="nsU" placeholder="字母和数字"><label>昵称</label><input id="nsN"><label>初始阶段</label><select id="nsS">${STAGES.map(([c, n]) => `<option value="${c}" ${c === 'P3' ? 'selected' : ''}>${n}</option>`).join('')}</select><label>初始密码（至少 4 位）</label><input id="nsP" value="1234"><p class="small muted">教材版本自动使用该年级的默认版本，创建后可在列表中点“教材”修改。</p>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button data-act="close">取消</button><button class="primary" data-act="saveStudent">创建</button></div>`);
  },
  saveStudent() {
    const u = val('nsU').trim(); if (!/^[a-zA-Z0-9_]{3,20}$/.test(u)) return toast('用户名需为 3–20 位字母、数字或下划线', 'error');
    if (S.students.some(s => s.username === u)) return toast('用户名已存在', 'error'); if (val('nsP').length < 4) return toast('密码至少 4 位', 'error');
    const id = 's' + Date.now(); S.students.push({ id, username: u, nick: val('nsN').trim() || u, avatar: '🐰', stage: val('nsS'), status: '正常', books: {} }); S.mastery[id] = {}; S.words[id] = [];
    log(`新增学生 ${u}`); closeModal(); render(); toast('已创建', 'ok');
  },
  tImportStudents() { modal(`<h3>批量导入学生</h3><p class="small muted">每行：用户名,昵称,阶段代码(P1–P6/J1–J3),初始密码</p><textarea id="impS" rows="6" placeholder="stu01,小明,P3,1234"></textarea><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">取消</button><button class="primary" data-act="doImportStudents">导入</button></div>`); },
  doImportStudents() {
    let n = 0; const errs = [];
    val('impS').split('\n').map(l => l.trim()).filter(Boolean).forEach((l, i) => { const [u, nick, st, p] = l.split(/[,，]/).map(x => x?.trim()); if (!/^[a-zA-Z0-9_]{3,20}$/.test(u || '') || !ALL_STAGES.includes(st) || (p || '').length < 4 || S.students.some(s => s.username === u)) { errs.push(i + 1); return; } const id = 's' + Date.now() + i; S.students.push({ id, username: u, nick: nick || u, avatar: '🐰', stage: st, status: '正常', books: {} }); S.mastery[id] = {}; S.words[id] = []; n++; });
    log(`批量导入学生 ${n} 个`); closeModal(); render(); toast(`导入 ${n} 个${errs.length ? `，第 ${errs.join('、')} 行有误已跳过` : ''}`, errs.length ? '' : 'ok');
  },
  tStage(d) { const s = student(d.v); modal(`<h3>修改 ${esc(s.nick)} 的阶段</h3><select id="tsS">${STAGES.map(([c, n]) => `<option value="${c}" ${c === s.stage ? 'selected' : ''}>${n}</option>`).join('')}</select><p class="small muted">旧阶段记录保留，改回后继续有效。教材版本按新年级的默认版本，之后可在“教材”中修改。</p><div class="row" style="justify-content:flex-end"><button data-act="close">取消</button><button class="primary" data-act="tStageOk" data-v="${s.id}">保存</button></div>`); },
  tStageOk(d) { const s = student(d.v); const to = val('tsS'); if (to !== s.stage) { S.stageHistory.push({ sid: s.id, at: todayStr(), from: s.stage, to, by: 'teacher' }); log(`修改 ${s.username} 阶段：${stageName(s.stage)} → ${stageName(to)}`); s.stage = to; } closeModal(); render(); },
  tBook(d) {
    const s = student(d.v); const subs = openSubjects(s.stage).filter(x => booksFor(x.id, s.stage).length);
    modal(`<h3>${esc(s.nick)} 的教材版本（${stageName(s.stage)}）</h3>${subs.map(x => `<label>${x.icon} ${x.name}</label><select id="bk-${x.id}">${booksFor(x.id, s.stage).map(b => `<option value="${b.id}" ${bookOf(s.id, x.id) === b.id ? 'selected' : ''}>${esc(b.name)}${b.id === defaultBook(x.id, s.stage) ? '（本年级默认）' : ''} · ${kpsOf(s.stage, x.id, false, b.id).length} 个知识点</option>`).join('')}</select>`).join('')}
    <p class="small muted">换版本后，学生的知识点、练习、考核和背诵内容都按新版本显示。旧版本的学习记录保留，换回来继续有效；各版本通用的知识点，记录直接沿用。</p>
    <div class="row" style="justify-content:flex-end"><button data-act="close">取消</button><button class="primary" data-act="tBookOk" data-v="${s.id}">保存</button></div>`);
  },
  tBookOk(d) { const s = student(d.v); s.books ||= {}; const ch = []; for (const x of openSubjects(s.stage)) { const v = val('bk-' + x.id); if (v && v !== bookOf(s.id, x.id)) { ch.push(`${x.name}：${bookName(bookOf(s.id, x.id))} → ${bookName(v)}`); s.books[x.id] = v; } } if (ch.length) log(`修改 ${s.username} 的教材版本：${ch.join('；')}`); closeModal(); render(); toast(ch.length ? '已保存' : '没有变化', 'ok'); },
  tBookGrade(d) {
    const stage = d.v; const list = S.students.filter(s => s.stage === stage); const subs = openSubjects(stage).filter(x => booksFor(x.id, stage).length > 1);
    modal(`<h3>设置${stageName(stage)}的教材版本</h3>${subs.length ? subs.map(x => `<label>${x.icon} ${x.name}</label><select id="bg-${x.id}"><option value="">不修改</option>${booksFor(x.id, stage).map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select>`).join('') : '<p class="muted">这个年级的学科都只有一个版本。</p>'}
    <label>应用到这些学生</label><div class="chk-list">${list.map(s => `<label><input type="checkbox" class="bgSid" value="${s.id}" checked style="min-height:0">${s.avatar} ${esc(s.nick)} <span class="small muted">${bookChips(s)}</span></label>`).join('')}</div>
    <label class="inline" style="margin-top:8px"><input type="checkbox" id="bgDefault" style="min-height:0"> 同时设为新学生的默认版本</label>
    <div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">取消</button><button class="primary" data-act="tBookGradeOk" data-v="${stage}" ${subs.length ? '' : 'disabled'}>应用</button></div>`);
  },
  tBookGradeOk(d) {
    const sids = [...document.querySelectorAll('.bgSid:checked')].map(x => x.value); let n = 0;
    for (const x of openSubjects(d.v)) { const v = val('bg-' + x.id); if (!v) continue; sids.forEach(id => { const s = student(id); s.books ||= {}; s.books[x.id] = v; n++; }); if (checked('bgDefault')) S.bookDefault[x.id][band(d.v) === 'J' ? 1 : 0] = v; }
    log(`批量设置${stageName(d.v)}教材版本（${sids.length} 个学生）`); closeModal(); render(); toast(n ? `已应用到 ${sids.length} 个学生` : '没有选择要修改的版本', 'ok');
  },
  tAddBook(d) { modal(`<h3>新增${subj(d.v).name}教材版本</h3><label>版本名称</label><input id="nbName" placeholder="例如：苏教版" style="width:100%"><label>适用年级</label><div class="row">${STAGES.map(([c, n]) => `<label class="inline small"><input type="checkbox" class="nbSt" value="${c}" style="min-height:0" ${subj(d.v).stages.includes(c) ? 'checked' : ''}>${n.replace('小学', '').replace('初中', '初').replace('年级', '')}</label>`).join('')}</div><p class="small muted">新版本创建后没有知识点，需要在“知识点”页选择这个版本联网搜索生成或导入。</p><div class="row" style="justify-content:flex-end"><button data-act="close">取消</button><button class="primary" data-act="tAddBookOk" data-v="${d.v}">添加</button></div>`); },
  tAddBookOk(d) { const name = val('nbName').trim(); if (!name) return toast('请填写名称', 'error'); const stages = [...document.querySelectorAll('.nbSt:checked')].map(x => x.value); S.books.push({ id: 'bk' + Date.now(), subject: d.v, name, stages }); log(`新增${subj(d.v).name}教材版本「${name}」`); closeModal(); render(); },
  tSetDefault(d) { const [sub, i, id] = d.v.split('|'); S.bookDefault[sub][Number(i)] = id; log(`${subj(sub).name}${i === '0' ? '小学' : '初中'}新学生默认教材改为「${bookName(id)}」`); render(); },
  tPwd(d) { const s = student(d.v); modal(`<h3>重置 ${esc(s.nick)} 的密码</h3><input id="npw" value="1234"><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">取消</button><button class="primary" data-act="tPwdOk" data-v="${s.id}">重置</button></div>`); },
  tPwdOk(d) { if (val('npw').length < 4) return toast('至少 4 位', 'error'); log(`重置 ${student(d.v).username} 的密码`); closeModal(); toast('已重置', 'ok'); render(); },
  tToggle(d) { const s = student(d.v); s.status = s.status === '正常' ? '已停用' : '正常'; log(`${s.status === '正常' ? '启用' : '停用'}学生 ${s.username}`); render(); },
  tDel(d) {
    const s = student(d.v); const n = S.records.filter(r => r.sid === s.id).length;
    modal(`<h3>删除学生 ${esc(s.nick)}</h3><div class="error-box">将同时删除：${n} 条练习/考核记录、${Object.keys(S.mastery[s.id] || {}).length} 个知识点掌握记录、${S.mistakes.filter(m => m.sid === s.id).length} 道错题、${wordsOf(s.id).length} 个单词。删除后不能恢复。</div><p class="small">如只是暂时不用，建议“停用”。请输入用户名 <b>${esc(s.username)}</b> 确认：</p><input id="delU">
    <div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">取消</button><button class="danger" data-act="tDelOk" data-v="${s.id}">删除</button></div>`);
  },
  tDelOk(d) { const s = student(d.v); if (val('delU') !== s.username) return toast('用户名不一致', 'error'); S.students = S.students.filter(x => x.id !== s.id); S.records = S.records.filter(r => r.sid !== s.id); S.mistakes = S.mistakes.filter(m => m.sid !== s.id); delete S.mastery[s.id]; delete S.words[s.id]; if (S.currentSid === s.id) S.currentSid = null; log(`删除学生 ${s.username}`); closeModal(); render(); toast('已删除'); },
  tAdjust(d) {
    const [sid, kid] = d.v.split('|'); const m = peekM(sid, kid); const k = kpById(kid);
    modal(`<h3>调整掌握度</h3><p>${esc(student(sid).nick)} · ${esc(k.name)}</p><div class="lv-inputs">${m.c.map((c, i) => `<div><div class="small muted">★${i + 1}（上限 ${T(i + 1)}）</div><input type="number" id="adj${i}" min="0" max="${T(i + 1)}" value="${c}" ${i >= maxLevel(k) ? 'disabled' : ''}></div>`).join('')}</div>
    <label>原因（必填，会记录到日志）</label><input id="adjWhy" placeholder="例如：已在课外班学会"><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">取消</button><button class="primary" data-act="tAdjustOk" data-v="${d.v}">保存</button></div>`);
  },
  tAdjustOk(d) { const [sid, kid] = d.v.split('|'); const why = val('adjWhy').trim(); if (!why) return toast('请填写原因', 'error'); const m = getM(sid, kid); m.c = m.c.map((c, i) => Math.max(0, Math.min(T(i + 1), Number(val('adj' + i) || c)))); m.last ||= todayStr(); log(`调整 ${student(sid).username}「${kpById(kid).name}」掌握度为 ${m.c.join('/')}，原因：${why}`); closeModal(); render(); toast('已保存', 'ok'); },
  tAddWords(d) { A.addWords(d); },
  tRemoveWord(d) { const [sid, wid] = d.v.split('|'); const w = wordsOf(sid).find(x => x.id === wid); w.mastered = todayStr(); log(`将 ${student(sid).username} 的单词 ${w.word} 手动移出未掌握表`); render(); },
  replay() { toast('原型：正式版可逐题回放当时的作答和用时'); },
  exportHeat(d) {
    const [sub, stage] = d.v.split('|'); const list = kpsOf(stage, sub);
    const rows = [['学生', ...list.map(k => k.name), '平均'], ...S.students.map(s => [s.nick, ...list.map(k => progressOf(s.id, k) + '%'), subjectProgress(s.id, stage, sub).p + '%'])];
    download(`掌握情况-${subj(sub).name}-${stageName(stage)}.csv`, rows);
  },
  tSearchKp() {
    const { q } = parseHash(); const sub = q.get('subject') || 'math'; const stage = qStage(q); const fbook = q.get('book') || '';
    modal(`<h3>🌐 联网获取教材知识点</h3><div class="form-grid"><div><label>学科</label><select id="skSub">${S.subjects.map(x => `<option value="${x.id}" ${x.id === sub ? 'selected' : ''}>${x.name}</option>`).join('')}</select></div>
    <div><label>阶段</label><select id="skStage">${STAGES.map(([c, n]) => `<option value="${c}" ${c === stage ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div><label>学期</label><select id="skTerm"><option>上学期</option><option>下学期</option></select></div><div><label>教材版本</label><select id="skBook">${S.books.filter(b => b.subject === sub).map(b => `<option value="${b.id}" ${b.id === (fbook || defaultBook(sub, stage)) ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}<option value="">各版本通用</option></select></div></div>
    <p class="small muted">由“知识点整理 AI”（${esc(profName(S.roles.kp.main || S.roles.gen.main))}${S.roles.kp.main ? '' : '，未单独配置，使用出题 AI'}）联网查找课程标准、教材目录和单元知识清单，整理成知识点，<b>同时给出建议的先学后学关系和可合并关系</b>。已有该册知识点时只显示差异。结果先预览，入库后为“待审核”，关系为“待确认”。预计消耗约 6,000 Token。${prof(S.roles.kp.main || S.roles.gen.main)?.web ? '' : '<br><b>所配置的 AI 不支持联网</b>，将按 AI 自身知识整理，结果标“未经联网”。'}</p>
    <div id="taskBox" class="loading-steps"></div><div class="row" style="justify-content:flex-end;margin-top:12px"><button data-act="close">取消</button><button class="primary" data-act="doSearchKp" id="skBtn">开始搜索</button></div>`, true);
  },
  doSearchKp() {
    const sub = val('skSub'), stage = val('skStage'), term = val('skTerm'), book = val('skBook'); document.getElementById('skBtn').disabled = true;
    if (FETCH_SIM[`${sub}-${stage}`]) { UI.fetchKey = `${sub}-${stage}`; return fetchRun(); }
    const task = { id: 't' + Date.now(), type: '联网获取知识点', scope: `${stageName(stage)} · ${subj(sub).name} · ${bookName(book)} · ${term}`, status: '进行中', progress: 0, tokens: 0, result: '', at: nowStr() };
    const web = S.config.webSearch;
    runFakeTask(task, web ? ['调用大模型联网搜索：课程标准、所选教材版本的目录、单元知识清单', '阅读 6 个网页，提取与本阶段相关的段落', '整理为结构化知识点并标注难度', '与已有知识点比对，标出可能重复的'] : ['联网搜索已关闭，AI 直接按教材版本生成', '整理为结构化知识点并标注难度', '与已有知识点比对'], () => {
      task.tokens = 5800 + Math.floor(Math.random() * 1200); S.aiUsedToday += task.tokens;
      const exist = kpsOf(stage, sub, true);
      const cands = (SEARCH_CANDIDATES[`${sub}-${stage}`] || exist.map(k => [k.unit, k.name, k.diff]).concat([['补充', `${subj(sub).name}综合运用（示例）`, 2]]) || []).map(([u, n, df]) => ({ u, n, df, dup: exist.some(k => k.name === n) }));
      const list = cands.length ? cands : Array.from({ length: 6 }, (_, i) => ({ u: `第${i + 1}单元`, n: `${stageName(stage)}${subj(sub).name}示例知识点 ${i + 1}`, df: 1 + (i % 3), dup: false }));
      UI.cands = { sub, stage, term, web, list, book };
      task.result = `搜索到 ${list.length} 个候选知识点（等待教师确认）`;
      document.getElementById('modal-root').querySelector('.modal').innerHTML = `<h3>确认知识点（${stageName(stage)} · ${subj(sub).name} · ${esc(bookName(book))} · ${term}）</h3>
      <p class="small muted">来源：${web ? '联网搜索（6 个网页）' : 'AI 直接生成（未经联网搜索）'}。勾选要入库的知识点，可以直接修改名称、难度和类型。记忆型知识点入库后需要在“课本数据”中关联数据。</p>
      <div class="table-wrap"><table><tr><th></th><th>单元</th><th>知识点</th><th>难度</th><th>类型（AI 建议）</th><th></th></tr>${list.map((c, i) => `<tr><td><input type="checkbox" id="cd${i}" ${c.dup ? '' : 'checked'} style="min-height:0"></td><td><input id="cu${i}" value="${esc(c.u)}" style="width:150px"></td><td><input id="cn${i}" value="${esc(c.n)}" style="width:240px"></td>
      <td><select id="cf${i}">${[1, 2, 3].map(x => `<option value="${x}" ${x === c.df ? 'selected' : ''}>${['', '基础', '中等', '较难'][x]}</option>`).join('')}</select></td><td><select id="cy${i}">${TYPES.map(t => `<option value="${t}" ${t === defaultType(sub, c.n) ? 'selected' : ''}>${TYPE_TAG[t]}</option>`).join('')}</select></td><td>${c.dup ? '<span class="tag warn">可能重复</span>' : ''}</td></tr>`).join('')}</table></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button data-act="close">取消</button><button class="primary" data-act="saveCands">确认入库</button></div>`;
    });
  },
  saveCands() {
    const c = UI.cands; let n = 0; const base = kpsOf(c.stage, c.sub, true).length;
    c.list.forEach((x, i) => { if (!checked('cd' + i)) return; const name = val('cn' + i).trim(); if (!name) return; n++; S.kps.push({ id: `${c.sub}-${c.stage}-x${Date.now()}${i}`, subject: c.sub, stage: c.stage, term: c.term.slice(0, 1), unit: val('cu' + i), name, book: c.book || null, diff: Number(val('cf' + i)), type: val('cy' + i), needFig: false, desc: `学会“${name}”，能独立、正确地完成相关题目。`, prereq: '', status: '待审核', bank: [0, 0, 0, 0, 0], source: c.web ? `联网获取 · ${profName(S.roles.kp.main || S.roles.gen.main)} · ${nowStr()}` : 'AI 整理（未经联网）', order: base + i }); });
    if (n && S.config.autoBankL1) S.tasks.unshift({ id: 't' + Date.now(), type: '补充题库', scope: `${stageName(c.stage)} · ${subj(c.sub).name} · 1 级（审核通过后自动）`, status: '已完成', progress: 100, tokens: n * 3000, result: `为 ${n} 个知识点各补充 ${S.config.bankTarget[0]} 道 1 级题`, at: nowStr() });
    log(`联网获取知识点：${stageName(c.stage)}${subj(c.sub).name}，入库 ${n} 个（待审核）`); closeModal(); setQ('subject', c.sub); setQ('stage', c.stage); toast(`已入库 ${n} 个知识点（待审核，审核通过后自动补 1 级题库）`, 'ok');
  },
  tEditKp(d) {
    const k = d.v ? kpById(d.v) : null; const { q } = parseHash();
    modal(`<h3>${k ? '编辑' : '新增'}知识点</h3><div class="form-grid"><div><label>学科</label><select id="ekSub" ${k ? 'disabled' : ''}>${S.subjects.map(x => `<option value="${x.id}" ${x.id === (k?.subject || q.get('subject') || 'math') ? 'selected' : ''}>${x.name}</option>`).join('')}</select></div>
    <div><label>阶段</label><select id="ekStage" ${k ? 'disabled' : ''}>${STAGES.map(([c, n]) => `<option value="${c}" ${c === (k?.stage || qStage(q)) ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div><label>学期</label><select id="ekTerm"><option ${k?.term !== '下' ? 'selected' : ''}>上</option><option ${k?.term === '下' ? 'selected' : ''}>下</option></select></div><div><label>教材版本</label><select id="ekBook">${S.books.filter(b => b.subject === (k?.subject || q.get('subject') || 'math')).map(b => `<option value="${b.id}" ${b.id === (k ? k.book : (q.get('book') || defaultBook(q.get('subject') || 'math', qStage(q)))) ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}<option value="" ${k && !k.book ? 'selected' : ''}>各版本通用</option></select></div></div>
    <label>单元 / 章节</label><input id="ekUnit" value="${esc(k?.unit || '')}" style="width:100%"><label>名称</label><input id="ekName" value="${esc(k?.name || '')}" style="width:100%"><label>说明（学生需要会什么）</label><input id="ekDesc" value="${esc(k?.desc || '')}" style="width:100%">
    <div class="form-grid"><div><label>知识点难度</label><select id="ekDiff">${[1, 2, 3].map(x => `<option value="${x}" ${x === (k?.diff || 1) ? 'selected' : ''}>${['', '基础', '中等', '较难'][x]}</option>`).join('')}</select></div><div><label>适用题型（出题 AI 按此出题）</label><div class="row">${['single', 'fill', 'applied'].map(t => `<label class="inline small"><input type="checkbox" class="ekQt" value="${t}" ${(k ? qtypesOf(k) : ['single', 'fill']).includes(t) ? 'checked' : ''} style="min-height:0">${QTYPE_NAME[t]}</label>`).join('')}</div></div>
    <div><label>类型</label><select id="ekType">${TYPES.map(t => `<option value="${t}" ${t === (k?.type || '理解应用') ? 'selected' : ''}>${TYPE_TAG[t]}</option>`).join('')}</select></div>
    <div><label>需要配图</label><label class="inline"><input type="checkbox" id="ekFig" ${k?.needFig ? 'checked' : ''} style="min-height:0"> 几何、光路、电路、实验装置等</label></div></div>
    <p class="small muted">记忆型：内容来自“课本数据”，由程序出题；技能型、理解应用型：使用题库，可综合；阅读表达型：以文章为单位，不按题数计分。<br>前置知识点（先学后学）和可合并知识点在列表的“关系”中管理，保存时检查不能成环。</p>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button data-act="close">取消</button><button class="primary" data-act="saveKp" data-v="${k?.id || ''}">保存</button></div>`, true);
  },
  saveKp(d) {
    const name = val('ekName').trim(); if (!name) return toast('请填写名称', 'error');
    let k = d.v ? kpById(d.v) : null;
    if (!k) { const sub = val('ekSub'), stage = val('ekStage'); k = { id: `${sub}-${stage}-n${Date.now()}`, subject: sub, stage, status: '启用', bank: [0, 0, 0, 0, 0], source: '教师录入', order: kpsOf(stage, sub, true).length, type: '理解应用', needFig: false }; S.kps.push(k); }
    Object.assign(k, { term: val('ekTerm'), book: val('ekBook') || null, unit: val('ekUnit'), name, desc: val('ekDesc'), diff: Number(val('ekDiff')), type: val('ekType'), needFig: checked('ekFig'), qtypes: [...document.querySelectorAll('.ekQt:checked')].map(x => x.value) });
    log(`${d.v ? '编辑' : '新增'}知识点「${name}」（保存历史版本）`); closeModal(); render(); toast('已保存', 'ok');
  },
  tCombos(d) { return A.relOpen(d); },
  tCombosOld(d) {
    const k = kpById(d.v); const rel = S.combos.filter(c => c.a === k.id || c.b === k.id); const linked = new Set(rel.flatMap(c => [c.a, c.b]));
    const si = ALL_STAGES.indexOf(k.stage);
    const cands = S.kps.filter(x => x.subject === k.subject && x.id !== k.id && !linked.has(x.id) && x.type !== '开放' && ALL_STAGES.indexOf(x.stage) <= si && ALL_STAGES.indexOf(x.stage) >= si - 2 && (!x.book || !k.book || x.book === k.book || x.stage !== k.stage));
    const nq = id => QUESTIONS.filter(q => q.kps?.includes(k.id) && q.kps.includes(id)).length;
    modal(`<h3>🧩 组合关系：${esc(k.name)}</h3>
    <p class="small muted">组合关系决定 ★3 以上的题怎么出：只有这里列出的知识点才会和它出在同一道题里，并且要写清楚“怎么组合”。程序生成器按关系把两个生成器串起来；AI 出题时必须按关系写出每一步对应哪个知识点，校验不通过的不入库。可以组合前两个年级学过的知识点（螺旋复习）；记忆型知识点只能作为“成分”，不计掌握度。</p>
    <table><tr><th>组合的知识点</th><th>怎么组合</th><th>组合题</th><th>来源</th><th></th></tr>${rel.map((c, i) => { const o = kpById(c.a === k.id ? c.b : c.a); return `<tr><td>${esc(o.name)}${o.stage !== k.stage ? ` <span class="tag gray">${stageName(o.stage)}</span>` : ''}${!isComb(o) ? ' <span class="tag gray">成分</span>' : ''}</td><td class="small">${esc(c.how)}</td><td>${nq(o.id)} 道</td><td><span class="tag ${c.src === '教师确认' ? 'ok' : 'warn'}">${c.src}</span></td><td>${c.src !== '教师确认' ? `<button class="small primary" data-act="tComboOk" data-v="${k.id}|${S.combos.indexOf(c)}">确认</button>` : ''}<button class="small" data-act="tComboDel" data-v="${k.id}|${S.combos.indexOf(c)}">删除</button></td></tr>`; }).join('') || '<tr><td colspan="5" class="muted">还没有组合关系，这个知识点只能出 ★1 基础和 ★2 变式题</td></tr>'}</table>
    <h3>添加</h3><div class="row"><select id="cbTo">${cands.map(x => `<option value="${x.id}">${x.stage !== k.stage ? `[${stageName(x.stage)}] ` : ''}${esc(x.name)}</option>`).join('')}</select><input id="cbHow" placeholder="怎么组合，例如：先换算单位再计算" style="flex:1;min-width:200px"><button data-act="tComboAdd" data-v="${k.id}">添加</button></div>
    <div class="row" style="justify-content:space-between;margin-top:14px"><button data-act="tComboAi" data-v="${k.id}">🤖 AI 建议组合（约 800 Token）</button><button class="primary" data-act="close">完成</button></div>`, true);
  },
  tComboAdd(d) { const to = val('cbTo'); const how = val('cbHow').trim(); if (!to) return; if (!how) return toast('请写一句“怎么组合”', 'error'); S.combos.push({ a: d.v, b: to, how, src: '教师确认' }); log(`新增组合关系：「${kpById(d.v).name}」+「${kpById(to).name}」`); A.tCombos(d); render(); },
  tComboDel(d) { const [id, i] = d.v.split('|'); const c = S.combos[Number(i)]; S.combos.splice(Number(i), 1); log(`删除组合关系：「${kpById(c.a).name}」+「${kpById(c.b).name}」`); A.tCombos({ v: id }); render(); },
  tComboOk(d) { const [id, i] = d.v.split('|'); S.combos[Number(i)].src = '教师确认'; A.tCombos({ v: id }); render(); },
  tComboAi(d) {
    const k = kpById(d.v); const linked = new Set(S.combos.filter(c => c.a === k.id || c.b === k.id).flatMap(c => [c.a, c.b]));
    const sug = kpsOf(k.stage, k.subject, false, k.book).filter(x => x.id !== k.id && isComb(x) && !linked.has(x.id)).slice(0, 2);
    if (!sug.length) return toast('没有新的建议');
    sug.forEach(x => S.combos.push({ a: k.id, b: x.id, how: `（AI 建议）在「${k.name}」的情境中用到「${x.name}」`, src: 'AI 建议 · 待确认' }));
    S.aiUsedToday += 800; log(`AI 建议组合关系：${k.name}（${sug.length} 条，待确认）`); A.tCombos(d); render(); toast(`AI 建议了 ${sug.length} 条，确认后才会用于出题`, 'ok');
  },
  kpApprove(d) { const k = kpById(d.v); k.status = '启用'; log(`审核通过知识点「${k.name}」`); if (S.config.autoBankL1 && isComb(k) && !k.bank[0]) { k.bank[0] = S.config.bankTarget[0]; S.jobs.unshift({ id: 'j' + Date.now(), role: 'gen', at: nowStr(), desc: `补 1 级题库：${k.name} × ${S.config.bankTarget[0]}（审核通过后自动）`, state: S.devMode ? '等待开发方' : '已完成' }); } render(); },
  kpToggle(d) { const k = kpById(d.v); if (k.status !== '停用' && (prereqsOf(k.id).length || nextsOf(k.id).length)) return A.kpStopOpen(d); k.status = k.status === '停用' ? '启用' : '停用'; log(`${k.status === '停用' ? '停用' : '启用'}知识点「${k.name}」`); render(); },
  kpDel(d) {
    const k = kpById(d.v); const n = S.students.filter(s => (S.mastery[s.id] || {})[k.id]).length;
    if (n) return modal(`<h3>不能删除</h3><p>「${esc(k.name)}」已有 ${n} 个学生的学习记录，只能停用。停用后学生端不再显示，记录保留。</p><div class="row" style="justify-content:flex-end"><button data-act="close">知道了</button><button class="primary" data-act="kpToggleClose" data-v="${k.id}">停用</button></div>`);
    modal(`<h3>删除知识点</h3><p>「${esc(k.name)}」及其 ${k.bank.reduce((a, b) => a + b, 0)} 道题将被删除。</p><div class="row" style="justify-content:flex-end"><button data-act="close">取消</button><button class="danger" data-act="kpDelOk" data-v="${k.id}">删除</button></div>`);
  },
  kpToggleClose(d) { closeModal(); A.kpToggle(d); },
  kpDelOk(d) { const k = kpById(d.v); S.kps = S.kps.filter(x => x.id !== d.v); log(`删除知识点「${k.name}」`); closeModal(); render(); },
  kpMove(d) { const [id, dir] = d.v.split('|'); const k = kpById(id); const list = kpsOf(k.stage, k.subject, true); const i = list.indexOf(k); const o = list[i + Number(dir)]; if (!o) return; list.forEach((x, j) => x.order = j); [k.order, o.order] = [o.order, k.order]; render(); },
  kpMerge(d) { const k = kpById(d.v); modal(`<h3>合并知识点</h3><p>把「${esc(k.name)}」合并到：</p><select id="mergeTo">${kpsOf(k.stage, k.subject, true).filter(x => x.id !== k.id).map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select><p class="small muted">题目和学生学习记录都并入目标知识点，「${esc(k.name)}」将被删除。</p><div class="row" style="justify-content:flex-end"><button data-act="close">取消</button><button class="primary" data-act="kpMergeOk" data-v="${k.id}">合并</button></div>`); },
  kpMergeOk(d) {
    const from = kpById(d.v), to = kpById(val('mergeTo'));
    to.bank = to.bank.map((n, i) => n + from.bank[i]);
    for (const sid of Object.keys(S.mastery)) { const a = S.mastery[sid][from.id]; if (!a) continue; const b = getM(sid, to.id); b.c = b.c.map((c, i) => Math.min(T(i + 1), c + a.c[i])); b.last = [a.last, b.last].filter(Boolean).sort().pop() || null; delete S.mastery[sid][from.id]; }
    S.mistakes.forEach(m => m.kps = [...new Set(m.kps.map(x => x === from.id ? to.id : x))]);
    S.kps = S.kps.filter(x => x.id !== from.id); log(`合并知识点「${from.name}」→「${to.name}」`); closeModal(); render(); toast('已合并', 'ok');
  },
  kpSel(d, el) { UI.kpSel ||= []; if (el.checked) UI.kpSel.push(d.v); else UI.kpSel = UI.kpSel.filter(x => x !== d.v); render(); },
  kpSelAll(d, el) { const { q } = parseHash(); UI.kpSel = el.checked ? kpsOf(qStage(q), q.get('subject') || 'math', true, q.get('book') || '').map(k => k.id) : []; render(); },
  kpBatch(d) { UI.kpSel.forEach(id => kpById(id).status = d.v); log(`批量${d.v === '启用' ? '审核通过' : '停用'}知识点 ${UI.kpSel.length} 个`); UI.kpSel = []; render(); },
  kpBatchDiff() { modal(`<h3>批量改难度</h3><select id="bd">${[1, 2, 3].map(x => `<option value="${x}">${['', '基础', '中等', '较难'][x]}</option>`).join('')}</select><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">取消</button><button class="primary" data-act="kpBatchDiffOk">保存</button></div>`); },
  kpBatchDiffOk() { UI.kpSel.forEach(id => kpById(id).diff = Number(val('bd'))); log(`批量修改知识点难度 ${UI.kpSel.length} 个`); UI.kpSel = []; closeModal(); render(); },
  tImportKp() { modal(`<h3>⬆️ 上传知识点</h3><p class="small muted">支持 Excel / CSV / Markdown，模板中可以带“前置知识点”“可合并知识点”两列；也可以拍教材目录页上传，由识别 AI 读成文字后再整理。上传后先预览，入库后为“待审核”，关系为“待确认”。</p><div class="row"><button data-act="kpTpl">下载模板</button><input type="file" accept=".xlsx,.csv,.md,.jpg,.png" data-chg="kpFile"></div><div id="fileResult"></div><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">关闭</button></div>`); },
  tExportKp(d) { const [sub, stage] = d.v.split('|'); download(`知识点-${subj(sub).name}-${stageName(stage)}.csv`, [['学科', '阶段', '学期', '单元', '名称', '说明', '难度', '状态'], ...kpsOf(stage, sub, true).map(k => [subj(sub).name, stageName(stage), k.term, k.unit, k.name, k.desc, ['', '基础', '中等', '较难'][k.diff], k.status])]); },
  tFill(d) {
    const [sub, stage, one] = d.v.split('|'); const list = (one ? [kpById(one)] : kpsOf(stage, sub)).filter(isComb); const figs = list.filter(k => k.needFig).length;
    const tgt = S.config.bankTarget; const miss = [0, 0, 0, 0, 0];
    list.forEach(k => k.bank.forEach((n, i) => { if (i < maxLevel(k)) miss[i] += Math.max(0, tgt[i] - n); }));
    const prog = sub === 'math' || sub === 'chemistry';
    UI.fill = { sub, stage, ids: list.map(k => k.id) };
    modal(`<h3>⚡ 一键补充题库</h3><p>${one ? `知识点「${esc(list[0].name)}」` : `${stageName(stage)} · ${subj(sub).name} · ${list.length} 个知识点`}</p>
    <table><tr><th>等级</th>${miss.map((_, i) => `<th>★${i + 1}</th>`).join('')}</tr><tr><td>缺少</td>${miss.map(n => `<td class="${n ? 'bank-cell low' : ''}">${n}</td>`).join('')}</tr></table>
    <label class="inline" style="margin-top:10px"><input type="checkbox" id="fillHigh" ${one ? 'checked' : ''} style="min-height:0"> 同时补充 2–5 级（默认在学生用到时才生成，节省 Token）</label>
    ${figs ? `<div class="hint-box">其中 ${figs} 个知识点需要配图：AI 只补充不需要图的文字题，带图的题请上传。</div>` : ''}<p class="small muted">流程：出题 AI（${esc(profName(S.roles.gen.main))}）按「${esc(ruleFor(sub)?.name || '通用出题规则')} v${esc(ruleFor(sub)?.version || '1.0')}」出题，按知识点的适用题型分配单选 / 填空 / 应用题 → 程序检查（格式、每个知识点都有落点${prog ? '、计算题答案程序复算' : ''}、查重）→ 验证 AI（${esc(profName(S.roles.gen.verify))}）→ 入库。${S.devMode ? '开发代理模式下请求进入 AI 任务队列，由开发方完成。' : ''}<br>预计 Token：1 级约 <b>${(miss[0] * 420).toLocaleString()}</b>，含 2–5 级约 <b>${(miss.reduce((a, b) => a + b, 0) * 460).toLocaleString()}</b>。</p>
    <div id="taskBox" class="loading-steps"></div><div class="row" style="justify-content:flex-end;margin-top:12px"><button data-act="close">关闭</button><button class="primary" id="fillBtn" data-act="doFill">开始补充</button></div>`, true);
  },
  doFill() {
    const f = UI.fill; const high = checked('fillHigh'); document.getElementById('fillBtn').disabled = true;
    const tgt = S.config.bankTarget; let added = 0;
    const task = { id: 't' + Date.now(), type: '补充题库', scope: `${stageName(f.stage)} · ${subj(f.sub).name} · ${high ? '1–5 级' : '1 级'}`, status: '进行中', progress: 0, tokens: 0, result: '', at: nowStr() };
    const prog = f.sub === 'math' || f.sub === 'chemistry';
    runFakeTask(task, ['出题 AI 按出题规则生成（每次 10 道，含变式）', '程序检查：格式、答案、选项、每个知识点都有落点、去重', ...(prog ? ['程序复算计算类答案'] : []), '验证 AI 检查；更正过的题再过一次程序检查', '写入题库'], () => {
      f.ids.forEach(id => { const k = kpById(id); k.bank = k.bank.map((n, i) => { if (i >= maxLevel(k) || (i > 0 && !high)) return n; const add = Math.max(0, tgt[i] - n); added += add; return n + add; }); });
      const bad = Math.round(added * .04), review = Math.round(added * .08);
      task.tokens = Math.round(added * (prog ? 140 : 400)); S.aiUsedToday += task.tokens;
      const fix = Math.round(added * .07); S.usage.gen[0]++; S.usage.gen[1] += task.tokens; S.usage.gen[3] += fix;
      task.result = `新增 ${added} 道（AI 生成，单选 / 填空 / 应用题按适用题型分配），验证 AI 更正 ${fix} 道，丢弃 ${bad} 道并重新生成，${review} 道需人工审核`;
      document.getElementById('taskBox').insertAdjacentHTML('beforeend', `<div class="ok-box">${esc(task.result)}</div>`);
      log(`补充题库：${task.scope}，新增 ${added} 道`);
      setTimeout(render, 0);
    });
  },
  tUpload() { modal(`<h3>⬆️ 导入习题</h3><p class="small muted">支持 Excel / CSV / JSON / Markdown 模板，可附图片。题型只能是单选、填空、应用题（应用题必须有评分要点）。导入同样经过程序检查（格式、每个知识点都有落点、计算题复算、查重）。</p><label class="inline"><input type="checkbox" id="impVerify" checked style="min-height:0"> 导入后送验证 AI 检查</label><div style="margin-top:8px"><input type="file" accept=".xlsx,.csv,.json,.md,.zip" data-chg="qFile"></div><div id="fileResult"></div><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="tTemplate">下载模板</button><button data-act="close">关闭</button></div>`); },
  tTemplate() { download('题库导入模板.csv', [['知识点编号', '难度等级', '其他知识点编号(用;分隔)', '题型（单选/填空/应用题）', '题干', '选项A', '选项B', '选项C', '选项D', '正确答案', '可接受答案(用;分隔)', '评分要点（应用题必填：步骤|关键结果|知识点|分值，多步用;分隔）', '提示1', '提示2', '解析'], ['math-P3-7', '1', '', '填空', '36 × 4 = ①___', '', '', '', '', '144', '', '', '6 × 4 = 24，写 4 进 2', '3 × 4 = 12，再加 2', '36 × 4 = 144'], ['math-P3-8', '1', '', '单选', '正方形边长 8 厘米，周长是多少？', '16 厘米', '32 厘米', '64 厘米', '', 'B', '', '', '正方形周长 = 边长 × 4', '8 × 4 = 32', '8 × 4 = 32（厘米）'], ['math-P3-5', '2', '', '应用题', '图书室有书 465 本，借出 178 本，还剩多少本？', '', '', '', '', '287 本', '', '列式|465-178|math-P3-5|2;计算|287|math-P3-5|2;答句和单位|本||1', '求还剩多少用减法', '注意连续退位', '465 − 178 = 287（本）']]); },
  tPreviewQ(d) { const it = mkItem(Q[d.v], [], 1, 'exam'); modal(`<div class="kid" style="padding:4px">${renderQ(it, true, true)}</div><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">关闭</button></div>`, true); },
  tEditQ(d) { const q = Q[d.v]; modal(`<h3>编辑题目</h3><label>题干</label><textarea rows="3">${esc(q.stem)}</textarea><label>答案</label><input value="${esc(q.answerText)}" style="width:100%"><label>提示 1 / 提示 2</label><input value="${esc(q.hints[0])}" style="width:100%"><input value="${esc(q.hints[1])}" style="width:100%;margin-top:6px"><label>解析</label><textarea rows="2">${esc(q.explain)}</textarea><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">取消</button><button class="primary" data-act="fakeSaveQ">保存</button></div>`, true); },
  fakeSaveQ() { closeModal(); toast('原型：保存后题目标记为“已人工审核”，并保存历史版本', 'ok'); },
  okQ() { toast('已标记为人工审核', 'ok'); },
  qOk(d) { const q = Q[d.v]; q.unreviewed = false; if (q.status === '待审核') q.status = '启用'; persistQ(q); closeModal(); render(); toast('已审核', 'ok'); },
  offQ(d) { S.qOff ||= {}; S.qOff[d.v] = !S.qOff[d.v]; render(); },
  saveExamCfg() { Object.assign(S.config, { examCount: Number(val('cfgExamCount')), examScope: val('cfgExamScope'), examUpRatio: Number(val('cfgExamUp')), examPerKp: Number(val('cfgExamPer')), examLimit: Number(val('cfgExamLimit')), examWeight: Number(val('cfgExamWeight')) }); log('修改考核规则'); toast('已保存', 'ok'); render(); },
  asSid() { UI.asSids = [...document.querySelectorAll('.asSid:checked')].map(x => x.value); render(); },
  asGrade(d) { UI.asGrade = d.v; if (d.v) UI.asSids = S.students.filter(s => s.stage === d.v).map(s => s.id); render(); },
  asAllGrade(d, el) { const ids = S.students.filter(s => s.stage === d.v).map(s => s.id); UI.asSids = el.checked ? [...new Set([...(UI.asSids || []), ...ids])] : (UI.asSids || []).filter(id => !ids.includes(id)); render(); },
  assign() {
    const sub = UI.asSub || 'english'; const all = [...document.querySelectorAll('.asSid:checked')].map(x => x.value); const sids = all.filter(id => openSubjects(student(id).stage).some(x => x.id === sub));
    if (!sids.length) return toast(all.length ? `所选学生都没有开设${subj(sub).name}` : '请选择学生', 'error');
    const kps = [...document.querySelectorAll('.asKp:checked')].map(x => x.value); const kind = val('asKind');
    const title = `${subj(sub).name}${kind}：${kps.length ? kps.map(id => kpById(id).name).slice(0, 2).join('、') + (kps.length > 2 ? ' 等' : '') : '全部知识点'}`;
    const aid = 'a' + Date.now();
    S.assignments.unshift({ id: aid, kind, sids, subject: sub, kps, count: Number(val('asCount')), due: val('asDue'), title, done: {}, at: todayStr() });
    if (kind === '纸质考核') sids.forEach(sid => makePaper(sid, sub, kps.filter(id => skps(sid, student(sid).stage, sub).some(k => k.id === id)), Number(val('asCount')), title, aid));
    log(`布置${kind}「${title}」给 ${sids.map(id => student(id).nick).join('、')}`); render(); toast(`已布置给 ${sids.length} 个学生${all.length > sids.length ? `（${all.length - sids.length} 人未开设${subj(sub).name}，已跳过）` : ''}`, 'ok');
  },
  subToggle(d, el) { subj(d.v).enabled = el.checked; log(`${el.checked ? '启用' : '停用'}学科 ${subj(d.v).name}`); render(); },
  subStage(d, el) { const [id, c] = d.v.split('|'); const x = subj(id); x.stages = el.checked ? [...new Set([...x.stages, c])] : x.stages.filter(s => s !== c); log(`修改 ${x.name} 开设阶段`); render(); },
  subWord(d, el) { subj(d.v).wordbook = el.checked; render(); },
  addSubject() { modal(`<h3>新增学科</h3><label>名称</label><input id="nsubN"><label>图标</label><input id="nsubI" value="📘"><p class="small muted">教材版本在“学生 → 教材版本”中添加。</p><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">取消</button><button class="primary" data-act="addSubjectOk">添加</button></div>`); },
  addSubjectOk() { const n = val('nsubN').trim(); if (!n) return; const id = 'sub' + Date.now(); S.subjects.push({ id, name: n, icon: val('nsubI') || '📘', stages: [], enabled: true, wordbook: false }); S.bookDefault[id] = ['', '']; log(`新增学科 ${n}`); closeModal(); render(); },
  kpBatchType() { modal(`<h3>批量改类型</h3><select id="bty">${TYPES.map(t => `<option value="${t}">${TYPE_TAG[t]}</option>`).join('')}</select><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">取消</button><button class="primary" data-act="kpBatchTypeOk">保存</button></div>`); },
  kpBatchTypeOk() { UI.kpSel.forEach(id => kpById(id).type = val('bty')); log(`批量修改知识点类型 ${UI.kpSel.length} 个`); UI.kpSel = []; closeModal(); render(); },
  tEval(d) {
    const [sid, kid, i] = d.v.split('|'); const r = readsOf(sid, kpById(kid))[Number(i)];
    modal(`<h3>评价阅读：${esc(r.title)}</h3><p class="small muted">${esc(student(sid).nick)} · 选择题 ${r.obj} · 自评“${esc(r.self)}”</p><div class="card" style="background:#f6f8fc">${esc(r.text || '（示例记录，没有保存答案原文）')}</div>
    <label>评价</label><select id="evV"><option>优</option><option selected>良</option><option>需加强</option></select><label>评语</label><input id="evC" style="width:100%" placeholder="可不填">
    <div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">取消</button><button class="primary" data-act="tEvalOk" data-v="${d.v}">保存</button></div>`);
  },
  tEvalOk(d) { const [sid, kid, i] = d.v.split('|'); const r = readsOf(sid, kpById(kid))[Number(i)]; r.eval = val('evV'); r.comment = val('evC'); log(`评价 ${student(sid).username} 的阅读「${r.title}」：${r.eval}`); closeModal(); render(); toast('已评价', 'ok'); },
  addPassage() { modal(`<h3>添加阅读文章</h3><label>标题</label><input style="width:100%"><label>正文</label><textarea rows="5" style="font-family:inherit"></textarea><p class="small muted">可以上传文章后让 AI 出题（选择题 + 简答题 + 参考答案和要点），也可以让 AI 写一篇原创短文。课本课文受版权保护，不收录全文。所有文章需教师审核后启用。</p><div class="row" style="justify-content:flex-end"><button data-act="close">取消</button><button data-act="fakeSaveQ">AI 写短文</button><button class="primary" data-act="fakeSaveQ">保存并让 AI 出题</button></div>`, true); },
  dataSearch() { modal(`<h3>🔍 联网整理课本数据初稿</h3><div class="form-grid"><div><label>学科</label><select><option>语文</option><option>英语</option></select></div><div><label>阶段</label><select>${STAGES.map(([c, n]) => `<option>${n}</option>`).join('')}</select></div><div><label>数据</label><select><option>生字表（会写字）</option><option>词语表</option><option>英语单元词表</option></select></div></div>
    <p class="small muted">由大模型联网搜索课本附录整理初稿，再用字典数据逐字核对拼音。整理结果为“待核对”，教师确认后才能启用。</p><div class="row" style="justify-content:flex-end"><button data-act="close">取消</button><button class="primary" data-act="dataSearchOk">开始整理</button></div>`); },
  dataSearchOk() { closeModal(); S.datasets.unshift({ id: 'd' + Date.now(), name: '四年级上册词语表', count: 238, src: '联网整理 + 字典核对拼音', status: '待核对', issues: [['似的', '整理结果 sì de', '字典 shì de'], ['模样', '整理结果 mó yàng', '字典 mú yàng']] }); log('联网整理课本数据：四年级上册词语表'); render(); toast('已整理，等待核对（原型模拟）', 'ok'); },
  dataImport() { modal(`<h3>导入课本数据</h3><p class="small muted">支持 Excel / CSV。列：内容、答案（拼音 / 下一句 / 释义等）、单元。导入后同样用字典核对拼音。</p><input type="file" accept=".xlsx,.csv" data-chg="fakeFile"><div id="fileResult"></div><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">关闭</button></div>`); },
  dataCheck(d) {
    const ds = S.datasets.find(x => x.id === d.v);
    modal(`<h3>核对：${esc(ds.name)}</h3><p>共 ${ds.count} 条，其中 <b>${ds.issues.length}</b> 处与字典不一致，请逐条确认：</p><table><tr><th>内容</th><th>整理结果</th><th>字典</th><th>采用</th></tr>${ds.issues.map((x, i) => `<tr><td><b>${esc(x[0])}</b></td><td>${esc(x[1])}</td><td>${esc(x[2])}</td><td><select><option>按字典</option><option>按整理结果</option><option>手动修改</option></select></td></tr>`).join('')}</table>
    <p class="small muted">其余 ${ds.count - ds.issues.length} 条与字典一致。</p><div class="row" style="justify-content:flex-end"><button data-act="close">稍后</button><button class="primary" data-act="dataCheckOk" data-v="${ds.id}">确认并启用</button></div>`, true);
  },
  dataCheckOk(d) { const ds = S.datasets.find(x => x.id === d.v); ds.status = '已核对'; log(`核对并启用课本数据「${ds.name}」`); closeModal(); render(); toast('已启用', 'ok'); },
  dataView(d) { const ds = S.datasets.find(x => x.id === d.v); const c = MEMORY_ITEMS[ds.kpId]; modal(`<h3>${esc(ds.name)}</h3><table><tr><th>内容</th><th>答案</th></tr>${c.items.map(it => `<tr><td>${esc(it[0])}</td><td>${esc(ansList(it).join(' / '))}</td></tr>`).join('')}</table><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">关闭</button></div>`, true); },
  exportPdf(d) {
    const p = S.papers.find(x => x.id === d.v); const w = window.open('', '_blank');
    if (!w) return toast('浏览器拦截了弹出窗口，请允许后重试', 'error');
    w.document.write(paperDoc(p, false).replace('</body>', '<script>setTimeout(()=>print(),300)<\/script></body>')); w.document.close();
    log(`导出纸质试卷 PDF：${p.id}`); toast('已打开打印窗口，选择“另存为 PDF”或直接打印', 'ok');
  },
  exportWord(d) {
    const p = S.papers.find(x => x.id === d.v);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + paperDoc(p, false)], { type: 'application/msword' })); a.download = `${p.title}-${student(p.sid).nick}-${p.id}.doc`; a.click();
    log(`导出纸质试卷 Word：${p.id}`); toast('已下载 Word 文件', 'ok');
  },
  exportKey(d) { const p = S.papers.find(x => x.id === d.v); const w = window.open('', '_blank'); if (!w) return toast('浏览器拦截了弹出窗口', 'error'); w.document.write(paperDoc(p, true)); w.document.close(); },
  uploadAny() {
    const p = S.papers.find(x => x.sid === S.currentSid && x.status === '待作答');
    if (!p) return toast('没有待上传的纸质试卷');
    toast(`识别到试卷编号 ${p.id}（原型：自动对应你的第一份待作答试卷）`); go('#/s/paper/' + p.id);
  },
  phMove(d) { const [i, dir] = d.v.split('|').map(Number); const a = UI.photos; const j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; render(); },
  phRot(d) { UI.photos[Number(d.v)].rot = (UI.photos[Number(d.v)].rot + 90) % 360; render(); },
  phDel(d) { UI.photos.splice(Number(d.v), 1); render(); },
  recogPaper(d) {
    const p = S.papers.find(x => x.id === d.v); UI.recog = true; render();
    const task = { id: 't' + Date.now(), type: '纸质试卷识别', scope: `${student(p.sid).nick} · ${p.title}`, status: '进行中', progress: 0, tokens: 0, result: '', at: nowStr() };
    runFakeTask(task, ['检查照片质量（亮度、清晰度、倾斜）', '读取二维码：确认试卷编号，按纸上印的题号对应照片', '遮住页眉姓名区域（发给 AI 的照片不含姓名）', `识别 AI（${profName(S.roles.ocr.main)}）读出作答：单选读括号内字母`, `验证 AI（${profName(S.roles.ocr.verify)}）核对单选和低可信度的题`, '单选、填空系统判分；应用题交判题 AI', '仍没把握的题交给老师确认'], () => {
      p.photos = UI.photos.length; recognize(p); finishPaper(p);
      task.tokens = p.pages * 2600; S.aiUsedToday += task.tokens; task.result = `识别 ${p.items.length} 题，${p.items.filter(i => i.state !== '已批改').length} 题待老师确认`;
      UI.photos.forEach(u => URL.revokeObjectURL(u.url)); UI.photos = []; UI.recog = false; save(); render(); toast('批改完成！', 'ok');
    });
  },
  recogFix(d) { const [pid, i] = d.v.split('|'); const it = S.papers.find(x => x.id === pid).items[Number(i)]; modal(`<h3>识别错了？</h3><p class="small muted">系统识别为：${esc(it.recog)}</p><label>你实际写的是</label><input id="fixText" style="width:100%"><p class="small muted">老师会对照照片确认，确认后才改成绩。</p><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">取消</button><button class="primary" data-act="recogFixOk" data-v="${d.v}">提交</button></div>`); },
  recogFixOk(d) { const [pid, i] = d.v.split('|'); const p = S.papers.find(x => x.id === pid); const it = p.items[Number(i)]; const t = val('fixText').trim(); if (!t) return toast('请填写'); it.fix = t; it.fixDone = false; if (p.status === '已批改') p.status = '部分待确认'; closeModal(); render(); toast('已提交给老师', 'ok'); },
  tPaperReview(d) {
    const p = S.papers.find(x => x.id === d.v);
    modal(`<h3>纸质试卷批改：${esc(p.title)} · ${esc(student(p.sid).nick)}</h3><p class="small muted">编号 ${p.id} · 上传 ${p.photos} 张照片 · 识别 AI：${esc(profName(S.roles.ocr.main))}（备选 ${esc(profName(S.roles.ocr.backup))}）· 验证 AI：${esc(profName(S.roles.ocr.verify))}，验证“${esc(S.roles.ocr.ratio)}”，每个结果只验证一轮。正式版中每题旁显示照片上对应位置的截图。</p>
    <div class="photo"><div class="ph-mask">姓名区域已遮住</div><div class="ph-qr">▦</div><div class="ph-lines">${p.items.slice(0, 6).map((_, i) => `<i style="width:${60 + (i * 17) % 35}%"></i>`).join('')}</div><div class="small muted">发给识别 AI 的照片：页眉姓名区域已遮住，试卷由二维码对应学生</div></div>
    <div class="table-wrap"><table><tr><th>题</th><th>题型</th><th>识别结果</th><th>可信度</th><th>验证 AI</th><th>系统判定</th><th>状态</th><th>老师判定</th></tr>${p.items.map((it, i) => { const need = it.state === '待老师确认' || (it.fix && !it.fixDone); const q = Q[it.qid]; return `<tr class="${it.verify?.r === '更正' ? 'fixrow' : ''}"><td>${i + 1}</td><td>${qTypeTag(q)}</td><td>${esc(it.recog)}${it.fix ? `<div class="small" style="color:var(--warn)">学生修正：${esc(it.fix)}</div>` : ''}<div class="small muted">正确答案：${esc(q.answerText)}</div>${it.ai && !it.ai.toTeacher ? `<div class="small">判题 AI：${it.ai.verdict}（${it.ai.score}/${it.ai.full}）${it.ai.where ? ' ' + esc(it.ai.where) : ''}</div>` : ''}</td><td>${Math.round(it.conf * 100)}%</td>
    <td class="small">${!it.verify ? '<span class="muted">不需验证</span>' : it.verify.r === '更正' ? `<span class="tag warn">更正</span> ${esc(it.verify.before)} → ${esc(it.recog)}<div class="muted">${esc(it.verify.msg)}</div>` : it.verify.r === '没把握' ? `<span class="tag bad">没把握</span><div class="muted">${esc(it.verify.msg)}</div>` : '<span class="tag ok">同意</span>'}</td><td>${it.correct ? '✅' : '❌'}</td><td>${need ? '<span class="tag warn">待确认</span>' : '<span class="tag ok">已批改</span>'}</td>
    <td><button class="small" data-act="tJudge" data-v="${p.id}|${i}|1">判对</button><button class="small" data-act="tJudge" data-v="${p.id}|${i}|0">判错</button></td></tr>`; }).join('')}</table></div>
    <div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">关闭</button></div>`, true);
  },
  tJudge(d) {
    const [pid, i, v] = d.v.split('|'); const p = S.papers.find(x => x.id === pid); const it = p.items[Number(i)];
    const was = it.state === '已批改' && !it.fix; const ok = v === '1';
    if (!was || it.correct !== ok) {
      S.session = { deltas: [] };
      if (ok && (!was || !it.correct)) credit(p.sid, it, S.config.examWeight); else if (!ok && !was) { touch(p.sid, it); addMistake(p.sid, it, '纸质考核'); }
      S.session = null;
    }
    it.correct = ok; it.state = '已批改'; if (it.fix) it.fixDone = true;
    if (p.items.every(x => x.state === '已批改' && (!x.fix || x.fixDone))) p.status = '已批改';
    const rec = S.records.find(r => r.paper === p.id); if (rec) rec.correct = p.items.filter(x => x.correct).length;
    if (p.assignment) { const a = S.assignments.find(x => x.id === p.assignment); if (a) a.done[p.sid] = `${p.items.filter(x => x.correct).length}/${p.items.length}`; }
    log(`纸质试卷 ${p.id} 第 ${Number(i) + 1} 题改判为${ok ? '对' : '错'}`); save(); A.tPaperReview({ v: pid });
  },
  saveCfg() {
    const c = S.config; const yes = id => val(id) === '1';
    c.threshold = c.threshold.map((v, i) => Math.max(1, Number(val('th' + i)) || v)); c.bankTarget = c.bankTarget.map((v, i) => Math.max(1, Number(val('bt' + i)) || v));
    Object.assign(c, { requirePrev: yes('cRequirePrev'), reviewDays: Number(val('cReview')), autoBankL1: yes('cAutoL1'), onDemandHigher: yes('cOnDemand'), aiDirectEnable: yes('cAiDirect'), practiceCount: Number(val('cPCount')), allowStageChange: yes('cStage'), wordDays: Math.max(1, Number(val('cWordDays'))), wordAllowDelete: yes('cWordDel'), judgeConf: Number(val('cJudgeConf')) || 0.8, targetAcc: [Number(val('cAcc0')), Number(val('cAcc1'))], dayMin: { P: Number(val('cMinP')), J: Number(val('cMinJ')) }, secPerQ: { P: Number(val('cSecP')), J: Number(val('cSecJ')) }, comboGate: yes('cGate'), openDone: Math.max(1, Number(val('cOpenDone'))), dailyBudget: Number(val('cDay')), monthlyBudget: Number(val('cMonth')) });
    for (const st of ALL_STAGES) c.themeByStage[st] = val('th-' + st); c.allowThemeSwitch = yes('cTheme');
    for (const id of Object.keys(c.comboCap)) c.comboCap[id] = c.comboCap[id].map((v, i) => Math.max(1, Math.min(5, Number(val(`cc-${id}-${i}`)) || v)));
    for (const sid of Object.keys(S.mastery)) for (const m of Object.values(S.mastery[sid])) m.c = m.c.map((x, i) => Math.min(x, c.threshold[i]));
    log('修改系统配置'); render(); toast('已保存', 'ok');
  },
};
function reviewResult(it, ok) {
  const m = S.mistakes.find(x => x.id === it.mid); if (!m) return;
  if (ok) { m.streak++; if (m.streak >= 3) { m.status = '已掌握'; m.next = addDays(30); } else { m.status = '复习中'; m.next = addDays(m.streak === 1 ? 2 : 5); } }
  else { m.streak = 0; m.status = '待复习'; m.next = addDays(1); }
}
const cur = () => S.session.items[S.session.idx];
function download(name, rows) {
  const csv = '\ufeff' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const CHG = {
  photos(el) { UI.photos ||= []; for (const f of el.files) UI.photos.push({ url: URL.createObjectURL(f), rot: 0, name: f.name }); render(); },
  setq(el) { setQ(el.dataset.key, el.value); },
  audioPref(el) { localStorage.setItem(AUDIO_PREF_KEY, el.value); render(); },
  asSub(el) { UI.asSub = el.value; render(); },
  fakeFile(el) {
    const f = el.files[0]; if (!f) return;
    document.getElementById('fileResult').innerHTML = `<div class="card" style="margin-top:10px"><b>${esc(f.name)}</b> 检查结果（原型模拟）：<div class="ok-box">12 条通过检查，可以导入</div><div class="error-box">第 5 行：正确答案不在选项中<br>第 9 行：与已有题目重复（相似度 96%）</div><button class="primary" data-act="close">导入 12 条</button></div>`;
  },
  wordFile(el) { const f = el.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { document.getElementById('wordText').value = String(r.result).replace(/[,\t，]/g, ' '); }; r.readAsText(f); },
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  if (el.dataset.act === 'maskClose' && e.target !== el) return;
  const fn = A[el.dataset.act]; if (!fn) return;
  if (el.tagName !== 'INPUT') e.preventDefault();
  fn(el.dataset, el); save();
});
document.addEventListener('change', e => { const el = e.target; if (el.dataset.chg && CHG[el.dataset.chg]) { CHG[el.dataset.chg](el); save(); } });
document.addEventListener('input', e => {
  const el = e.target; const s = S.session; if (!s) return;
  const it = s.items[s.idx];
  if (el.dataset.applied != null) it.ans = el.value;
  else if (el.dataset.blank != null) { it.ans ||= []; it.ans[Number(el.dataset.blank)] = el.value; }
  else if (el.dataset.step != null) { it.ans ||= []; it.ans[Number(el.dataset.step)] = el.value; }
  else if (el.dataset.coef != null) { it.ans ||= []; it.ans[Number(el.dataset.coef)] = el.value; }
  else return;
  save();
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
  const btn = document.querySelector('[data-act="submitQ"],[data-act="ctSubmit"]'); if (btn) { e.preventDefault(); btn.click(); }
});
function tick() {
  const el = document.getElementById('timer'); if (!el) return;
  const start = parseHash().parts[1] === 'cards' ? UI.ct?.startedAt : S.session?.startedAt;
  if (start) el.textContent = `⏱ 用时 ${fmtDur(Math.floor((Date.now() - start) / 1000))}`;
}
setInterval(tick, 1000);
window.addEventListener('hashchange', () => { closeModal(); render(); });
