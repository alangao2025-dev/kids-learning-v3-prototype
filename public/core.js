'use strict';
/* 学习系统 3.0 原型：状态、规则与模拟 AI（纯前端，数据存 localStorage） */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (a, b) => b ? Math.round(a * 100 / b) : 0;
const clone = x => JSON.parse(JSON.stringify(x));
const nowStr = () => { const d = new Date(); return `10-24 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const KEY = 'kl-v3-prototype-1';
let S;
const UI = {};

function seed() {
  const st = {
    who: null, sid: null,
    kps: KP_SEED.map(([id, subject, stage, unit, name, type, qtypes], i) => ({ id, subject, stage, unit, name, type, qtypes, status: '启用', order: i, source: id.startsWith('m') || id.startsWith('p') ? '联网获取 · 人教版教材目录 · 教师确认' : '老师上传 · PEP 2024 单元清单.xlsx' })),
    prereqs: PREREQ_SEED.map(([a, b, kind, state, src]) => ({ a, b, kind, state, src })),
    combos: COMBO_SEED.map(([a, b, v, how, state]) => ({ a, b, v, how, state })),
    qs: clone(Q_SEED).map(q => ({ status: '启用', used: 0, ...q })),
    rules: clone(RULE_SEED),
    profiles: clone(AI_PROFILES_SEED),
    roles: {
      kp: { main: 'dev', backup: '', verify: '', ratio: '' },
      gen: { main: 'dev', backup: '', verify: 'dev', ratio: '全部' },
      judge: { main: 'dev', backup: '', verify: 'dev', ratio: '错 / 部分对 / 低可信度' },
      ocr: { main: 'dev', backup: 'mu', verify: 'dev', ratio: '低可信度和单选' },
      eval: { main: 'dev', backup: '', verify: '', ratio: '' },
    },
    students: clone(STUDENTS_SEED),
    mastery: clone(MASTERY_SEED),
    strategy: {},
    review: [
      { id: 'rv1', sid: 's1', qid: 'q20', kind: '应用题 · 低可信度', at: '10-24 15:12', answer: '7点45分+25分=8点10分\n迟到了 10 分', ai: { verdict: '对', score: 5, conf: 0.72, where: '' }, verify: '验证 AI 同意（可信度 0.70）', status: '待老师确认', reason: '“8点10分”的写法与评分要点 8:10 不一致，判题 AI 可信度 0.72 低于 0.8' },
      { id: 'rv2', sid: 's1', qid: 'q27', kind: '填空 · 学生申诉', at: '10-24 15:40', answer: '①3000  ②5吨', ans: ['3000', '5吨'], ai: null, verify: '', status: '待处理', reason: '学生说明：“我写的是 5 吨，意思一样”。系统比对：第 ② 空可接受答案只有“5”' },
    ],
    corrections: [
      { role: 'gen', at: '10-24 10:02', target: 'q14（计算经过的时间 + 秒的换算）', before: '休息 10 分钟；m1 没有对应步骤', after: '改为休息 600 秒，补充“换算成分”评分要点', judge: '' },
      { role: 'gen', at: '10-24 10:05', target: 'q17（长方形和正方形的周长）', before: '答案 A（40）', after: '答案 B（30），补充 A 选项错误诊断', judge: '更正正确' },
      { role: 'judge', at: '10-24 14:31', target: '小禾 · q6 图书室故事书', before: '错（0/5）：没写过程', after: '部分对（3/5）：最终答案 523 本正确，缺少第 1 步', judge: '' },
      { role: 'ocr', at: '10-24 15:05', target: '阿远 · 纸质试卷 J3-007 第 3 题', before: '识别为 D（可信度 0.61）', after: '更正为 B（括号内字母下半部笔画较淡）', judge: '更正正确' },
    ],
    jobs: [
      { id: 'j1', role: 'gen', at: '10-24 16:20', desc: '出题：认识几分之一和几分之几 · ★2 · 填空 × 5（小学数学出题规则 v1.2）', state: '等待开发方' },
      { id: 'j2', role: 'eval', at: '10-24 16:31', desc: '评估：阿远（初三物理 4 个知识点）', state: '等待开发方' },
    ],
    usage: { kp: [3, 21400, 0, 0], gen: [42, 186000, 1, 13], judge: [57, 64200, 0, 6], ocr: [9, 38800, 2, 3], eval: [12, 15300, 0, 0] },
    devMode: true,
    papers: [
      { id: 'pp1', code: 'J3-007', sid: 's2', title: '初三物理 · 电学小测', at: '10-24 14:50', status: '已识别', qids: ['q12', 'q9', 'q24', 'q23'],
        items: [
          { read: ['0.3'], conf: 0.97 },
          { read: 'R = U / I = 4 V / 0.2 A = 20 Ω', conf: 0.88 },
          { read: 'D', conf: 0.61, verify: { r: '更正', to: 'B', msg: '括号内字母下半部笔画较淡，对照照片应为 B' } },
          { read: 'I = U / R = 6 / 10 = 0.6 A\nP = UI = 6 × 0.6 = 3.6 W', conf: 0.9 },
        ] },
      { id: 'pp2', code: 'P3-012', sid: 's1', title: '三年级数学 · 第 4 周', at: '10-24 16:05', status: '待上传', qids: ['q1', 'q7', 'q4', 'q27', 'q6'], items: [] },
    ],
    nextId: 100,
  };
  for (const s of st.students) st.strategy[s.id] = null;
  return st;
}
function load() { try { S = JSON.parse(localStorage.getItem(KEY)); } catch { S = null; } if (!S) { S = seed(); } for (const s of S.students) if (!S.strategy[s.id]) S.strategy[s.id] = ruleStrategy(s.id); save(); }
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
function resetAll() { S = seed(); for (const s of S.students) S.strategy[s.id] = ruleStrategy(s.id); save(); }
const newId = p => `${p}${S.nextId++}`;

// ================= 查询 =================
const kp = id => S.kps.find(k => k.id === id);
const kpName = id => kp(id)?.name || id;
const stu = id => S.students.find(s => s.id === id);
const me = () => stu(S.sid);
const GROUPS = [['P3', 'math', '三年级 · 数学'], ['P3', 'english', '三年级 · 英语'], ['J3', 'physics', '初三 · 物理']];
const kpsOf = (stage, subject) => S.kps.filter(k => k.stage === stage && k.subject === subject).sort((a, b) => a.order - b.order);
const stuKps = sid => S.kps.filter(k => k.stage === stu(sid).stage && k.status === '启用');
const prof = id => S.profiles.find(p => p.id === id);
const profName = id => id ? prof(id)?.name || id : '—';
const qsOfKp = id => S.qs.filter(q => q.kps.includes(id));
const prereqsOf = id => S.prereqs.filter(r => r.b === id);
const nextsOf = id => S.prereqs.filter(r => r.a === id);
const comboOf = (a, b) => S.combos.find(c => (c.a === a && c.b === b) || (c.a === b && c.b === a));
const combosOf = id => S.combos.filter(c => c.a === id || c.b === id);
const other = (c, id) => c.a === id ? c.b : c.a;
const qBoth = (a, b) => S.qs.filter(q => q.kps.includes(a) && q.kps.includes(b)).length;

// ================= 关系规则 =================
function wouldCycle(a, b) {
  // 添加 a→b 后，若从 b 能走到 a 则成环；返回环路径
  const adj = {};
  for (const r of S.prereqs) (adj[r.a] ||= []).push(r.b);
  const path = []; const seen = new Set();
  const dfs = x => { if (x === a) { path.push(x); return true; } if (seen.has(x)) return false; seen.add(x); for (const y of adj[x] || []) if (dfs(y)) { path.push(x); return true; } return false; };
  return dfs(b) ? [a, ...path.reverse()] : null;
}
function combineCheck(ids) {
  if (ids.length < 2) return { ok: true, msg: '单个知识点：出 ★1 基础 / ★2 变式题' };
  if (ids.length > 3) return { ok: false, msg: '超过三年级数学的综合上限（一题最多 3 个知识点）' };
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const c = comboOf(ids[i], ids[j]);
    if (c?.v === 'no') return { ok: false, msg: `「${kpName(ids[i])}」和「${kpName(ids[j])}」设为不可合并：${c.how}` };
  }
  const seen = new Set([ids[0]]); let grow = true;
  while (grow) { grow = false; for (const c of S.combos) if (c.v === 'yes' && c.state === 'ok' && ids.includes(c.a) && ids.includes(c.b) && (seen.has(c.a) !== seen.has(c.b))) { seen.add(c.a); seen.add(c.b); grow = true; } }
  if (seen.size < ids.length) return { ok: false, msg: `没有把这些知识点连起来的“可合并”关系（未设置等同不可合并）：${ids.filter(x => !seen.has(x)).map(kpName).join('、')}` };
  const hows = S.combos.filter(c => c.v === 'yes' && ids.includes(c.a) && ids.includes(c.b)).map(c => c.how);
  return { ok: true, msg: `可以合并，出 ★${ids.length + 1} 题。出题 AI 将按：${hows.join('；')}` };
}
function layers(list) {
  const ids = new Set(list.map(k => k.id)); const memo = {};
  const lv = id => memo[id] ??= Math.max(0, ...S.prereqs.filter(r => r.b === id && ids.has(r.a)).map(r => lv(r.a) + 1));
  return Object.fromEntries(list.map(k => [k.id, lv(k.id)]));
}

// ================= 掌握度与评估 =================
const T = 5;
const mOf = (sid, id) => S.mastery[sid]?.[id] || [0, 0, ''];
const rateOf = (sid, id) => { const r = mOf(sid, id)[2]; return r ? [...r].filter(x => x === '1').length / r.length : null; };
function stateOf(sid, id) {
  const [c1, c2, r] = mOf(sid, id);
  if (!r) return { n: '未开始', cls: 'gray' };
  if (c1 >= T && c2 >= T) return { n: '熟练', cls: 'ok' };
  if (c1 >= T) return { n: '基本掌握', cls: 'ok' };
  return { n: '学习中', cls: 'warn' };
}
const basic = (sid, id) => mOf(sid, id)[0] >= T;
const missingMust = (sid, id) => prereqsOf(id).filter(r => r.kind === 'must' && r.state === 'ok' && !basic(sid, r.a)).map(r => r.a);
const maxLevelOf = id => combosOf(id).some(c => c.v === 'yes' && c.state === 'ok') ? 3 : 2;
function curLevel(sid, id) { const [c1, c2] = mOf(sid, id); return c1 < T ? 1 : c2 < T ? 2 : Math.min(3, maxLevelOf(id)); }

function ruleStrategy(sid, prev) {
  const items = {}; const locks = prev?.items || {};
  const ks = stuKps(sid);
  for (const k of ks) {
    const L = locks[k.id];
    const rate = rateOf(sid, k.id); const cur = curLevel(sid, k.id);
    let level = cur, w, why;
    if (missingMust(sid, k.id).length) { w = 0; why = `“必须”前置未基本掌握：${missingMust(sid, k.id).map(kpName).join('、')}`; }
    else if (rate == null) { w = 10; why = '新知识点，前置已满足，开始学习'; }
    else if (rate <= 0.5) { w = 25; level = Math.max(1, cur - 1); why = `最近正确率 ${Math.round(rate * 100)}%，加练并降一级`; }
    else if (rate <= 0.6) { w = 18; level = Math.max(1, cur - 1); why = `最近正确率 ${Math.round(rate * 100)}%，降一级巩固`; }
    else if (rate >= 0.85 && mOf(sid, k.id)[0] >= T && mOf(sid, k.id)[1] >= T) { w = 5; why = '已熟练，少量复习'; }
    else if (rate >= 0.85) { w = 12; level = Math.min(maxLevelOf(k.id), cur + (mOf(sid, k.id)[0] >= T ? 1 : 0)); why = `最近正确率 ${Math.round(rate * 100)}%，${level > cur ? '升一级' : '保持'}`; }
    else { w = 15; why = `最近正确率 ${Math.round(rate * 100)}%，在目标区间附近，保持`; }
    items[k.id] = L?.lock ? { ...L } : { ratio: w, level, why, lock: false };
  }
  // 弱项的“必须”前置加入复习
  for (const k of ks) { const r = rateOf(sid, k.id); if (r != null && r <= 0.5) for (const p of prereqsOf(k.id)) if (p.kind === 'must' && items[p.a] && !items[p.a].lock && items[p.a].ratio < 10) { items[p.a].ratio = 10; items[p.a].why += `；「${k.name}」较弱，复习它的前置`; } }
  normalize(items);
  const appliedRates = S.qs.filter(q => q.type === 'applied' && q.kps.some(id => items[id])).length ? 20 : 0;
  return { src: '规则算法', at: nowStr(), items, mix: { single: 40, fill: 40, applied: appliedRates }, perDay: stu(sid).stage[0] === 'P' ? 20 : 25, note: '按规则算法计算（§9.4）。', clipped: [] };
}
// 每个学科的比例分别合计 100%
function normalize(items, clipped) {
  const bySub = {};
  for (const id of Object.keys(items)) (bySub[kp(id)?.subject || '?'] ||= []).push(id);
  for (const ids of Object.values(bySub)) normalizeGroup(items, ids, clipped);
}
function normalizeGroup(items, ids, clipped) {
  const fixed = ids.filter(id => items[id].lock || items[id].ratio === 0 || items[id]._fix);
  const live = ids.filter(id => items[id].ratio > 0 && !items[id].lock);
  const lockSum = ids.filter(id => items[id].lock).reduce((s, id) => s + items[id].ratio, 0);
  // 可推荐的知识点太少、40% 上限凑不满 100% 时放宽上限
  const cap = live.length ? Math.max(40, Math.ceil((100 - lockSum) / live.length)) : 40;
  for (let round = 0; round < 6; round++) {
    const free = ids.filter(id => !fixed.includes(id));
    const fixedSum = fixed.reduce((s, id) => s + items[id].ratio, 0);
    const freeSum = free.reduce((s, id) => s + items[id].ratio, 0) || 1;
    for (const id of free) items[id].ratio = items[id].ratio * (100 - fixedSum) / freeSum;
    let changed = false;
    for (const id of free) { const v = items[id].ratio; const c = Math.min(cap, Math.max(5, v)); if (Math.abs(c - v) > 0.01) { items[id].ratio = c; fixed.push(id); changed = true; if (clipped && v > cap + 0.5) clipped.push(`「${kpName(id)}」比例 ${Math.round(v)}% 超过上限，截为 ${cap}%`); } }
    if (!changed) break;
  }
  for (const id of ids) { items[id].ratio = Math.round(items[id].ratio); delete items[id]._fix; }
  const adj = live.sort((a, b) => (items[a].ratio >= cap) - (items[b].ratio >= cap) || items[b].ratio - items[a].ratio);
  let diff = 100 - ids.reduce((s, id) => s + items[id].ratio, 0);
  for (const id of adj) { if (!diff) break; const v = items[id].ratio; const nv = Math.min(cap, Math.max(5, v + diff)); diff -= nv - v; items[id].ratio = nv; }
}
function aiStrategy(sid) {
  const prev = S.strategy[sid];
  const st = ruleStrategy(sid, prev); st.src = '评估 AI（开发代理）'; st.clipped = [];
  const ks = stuKps(sid).filter(k => !st.items[k.id].lock && st.items[k.id].ratio > 0);
  const scored = ks.map(k => ({ k, r: rateOf(sid, k.id) })).filter(x => x.r != null).sort((a, b) => a.r - b.r);
  const weak = scored[0], strong = scored[scored.length - 1];
  const raw = {};
  if (weak) { raw[weak.k.id] = 55; st.items[weak.k.id].why = `评估 AI：错误集中在“${weak.k.name}”的计算步骤，建议大幅加练`; }
  if (strong && strong !== weak) {
    const cur = curLevel(sid, strong.k.id); const want = cur + 2; const cap = Math.min(maxLevelOf(strong.k.id), cur + 1);
    st.items[strong.k.id].level = cap; st.items[strong.k.id].why = `评估 AI：连续答对，建议提高难度到 ★${want}`;
    st.clipped.push(`「${strong.k.name}」AI 建议难度 ★${cur} → ★${want}，每次最多升一级${cap < cur + 1 ? '且受可用最高等级限制' : ''}，执行 ★${cap}`);
  }
  for (const [id, v] of Object.entries(raw)) { if (v > 40) { st.clipped.push(`「${kpName(id)}」AI 建议比例 ${v}%，超过单个知识点上限 40%，执行 40%`); st.items[id].ratio = 40; st.items[id]._fix = true; } else st.items[id].ratio = v; }
  for (const id of Object.keys(st.items)) if (!raw[id] && !st.items[id].lock && st.items[id].ratio) st.items[id].ratio = st.items[id].ratio * 0.8;
  normalize(st.items, st.clipped);
  const ap = scored.filter(x => S.qs.some(q => q.type === 'applied' && q.kps.includes(x.k.id)));
  if (ap.length && ap.reduce((s, x) => s + x.r, 0) / ap.length < 0.75) { st.mix = { single: 35, fill: 35, applied: 30 }; }
  const want = stu(sid).stage[0] === 'P' ? 35 : 30; const cap = stu(sid).stage[0] === 'P' ? 25 : 30;
  if (want > cap) st.clipped.push(`AI 建议每日 ${want} 题，超过该年级每日题量上限（约 40 分钟，折合 ${cap} 题），执行 ${cap} 题`);
  st.perDay = Math.min(want, cap);
  st.note = weak ? `“${weak.k.name}”最近正确率 ${Math.round(weak.r * 100)}%，低于目标区间 75%～85%，是当前最需要加强的知识点；${strong && strong !== weak ? `“${strong.k.name}”已稳定，可以提高难度。` : ''}应用题正确率偏低时提高应用题比例。` : '作答数据不足，暂按规则算法。';
  return st;
}

// ================= 判分 =================
const normTxt = s => String(s ?? '').replace(/[\uff01-\uff5e]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/\u3000/g, ' ').replace(/[：]/g, ':').trim().toLowerCase();
function gradeObjective(q, ans) {
  if (q.type === 'single') { const ok = ans === q.answer; return { ok, score: ok ? 1 : 0, diag: ok ? '' : q.options.find(x => x.id === ans)?.diag || '' }; }
  const parts = q.blanks.map((acc, i) => acc.some(a => normTxt(a) === normTxt(ans?.[i]) || (!isNaN(parseFloat(a)) && Number(normTxt(ans?.[i])) === Number(a) && normTxt(ans?.[i]) !== '')));
  const okN = parts.filter(Boolean).length;
  return { ok: okN === parts.length, score: okN / parts.length, parts };
}
const nums = s => (normTxt(s).match(/\d+(?:\.\d+)?(?::\d+)?/g) || []);
function hasKey(text, key) {
  const t = normTxt(text).replace(/\s/g, '');
  if (/^[\d.:]+$/.test(key)) return nums(text).some(n => n === key || (key.includes(':') ? false : Number(n) === Number(key)));
  if (key === 'U/I') return /u\/i|u÷i|r=u/.test(t);
  return t.includes(normTxt(key));
}
function gradeApplied(q, text) {
  const steps = q.rubric.map(r => ({ ...r, ok: hasKey(text, r.key) }));
  const full = q.rubric.reduce((s, r) => s + r.score, 0);
  const ns = nums(text); const stemNums = new Set(nums(q.stem)); const keys = new Set(q.rubric.map(r => r.key));
  const strange = ns.filter(n => !stemNums.has(n) && !keys.has(n));
  const conf = ns.length ? 0.9 : 0.5;
  const isNum = k => /^\d+(?:\.\d+)?$/.test(k);
  const firstBad = steps.find(s => !s.ok && /^[\d.:]+$/.test(s.key));
  // 带错判对：后一步与“前一步的错误结果”差值一致时，视为按自己的结果做对
  if (firstBad && strange.length && isNum(firstBad.key) && isNum(strange[0])) {
    const d = Number(firstBad.key) - Number(strange[0]);
    for (const s of steps.slice(steps.indexOf(firstBad) + 1)) if (!s.ok && isNum(s.key) && strange.some(n => Math.abs(Number(n) - (Number(s.key) - d)) < 1e-9)) { s.ok = true; s.carry = true; }
  }
  const score = steps.reduce((s, r) => s + (r.ok ? r.score : 0), 0);
  let where = '';
  if (firstBad) {
    const i = steps.indexOf(firstBad) + 1;
    where = strange.length ? `第 ${i} 步「${firstBad.step}」：你写的是 ${strange[0]}，应该得到 ${firstBad.key}。` : `第 ${i} 步「${firstBad.step}」没有写出来（应得到 ${firstBad.key}）。`;
    if (steps.some(s => s.carry)) where += ' 后面的步骤按你前一步的结果算是对的，不重复扣分。';
  } else if (score < full) where = `「${steps.find(s => !s.ok).step}」没有做到。`;
  const verdict = score === full ? '对' : score > 0 ? '部分对' : '错';
  const result = { verdict, score, full, steps, where, conf, kpsWrong: [...new Set(steps.filter(s => !s.ok && s.kp).map(s => s.kp))] };
  // 验证 AI：只验证“错 / 部分对”和低可信度
  result.verify = null;
  if (verdict !== '对' || conf < 0.8) {
    const last = q.rubric.filter(r => /^[\d.:]+$/.test(r.key)).slice(-1)[0];
    const onlyFinal = last && hasKey(text, last.key) && steps.filter(s => /^[\d.:]+$/.test(s.key) && !s.ok).length > 0 && !strange.length;
    if (onlyFinal && verdict === '部分对') {
      result.verify = { r: '同意', msg: '最终结果正确但缺少中间过程，判“部分对”合理。' };
    } else if (conf < 0.8) {
      result.verify = { r: '没把握', msg: '学生答案中没有可识别的算式或数字，验证 AI 可信度 0.55，交老师确认。' };
      result.toTeacher = true;
    } else result.verify = { r: '同意', msg: '核对评分要点，指出的错误位置正确。' };
  }
  return result;
}

// ================= 模拟出题 =================
const QTPL = {
  single: k => ({ stem: `【AI 模拟】关于「${k.name}」的单选题：下面说法正确的是（    ）`, options: [o('A', '正确的说法'), o('B', '常见错误一', '模拟诊断：混淆了概念'), o('C', '常见错误二', '模拟诊断：计算方法错误')], answer: 'A', explain: '（模拟解析）' }),
  fill: k => ({ stem: `【AI 模拟】关于「${k.name}」的填空题：①____`, blanks: [['答案']], explain: '（模拟解析）' }),
  applied: k => ({ stem: `【AI 模拟】关于「${k.name}」的应用题（情境题干）`, answer: '（标准答案）', rubric: [{ step: '第一步', key: '1', kp: k.id, score: 2 }, { step: '第二步', key: '2', kp: k.id, score: 2 }, { step: '答句和单位', key: '答', kp: null, score: 1 }], explain: '（模拟解析）' }),
};
function ruleFor(subject) {
  const on = S.rules.filter(r => r.status === '启用');
  return on.find(r => r.scope.startsWith(SUBJECTS[subject].name)) || on.find(r => r.scope.startsWith('全部')) || null;
}
function simulateGen(ids, type, level, n, variants) {
  const k0 = kp(ids[0]); const rule = ruleFor(k0.subject); const out = [];
  const vg = `vg-new-${S.nextId}`;
  for (let i = 0; i < n; i++) {
    const t = QTPL[type](k0);
    if (type === 'applied' && ids.length > 1) t.rubric = ids.map((id, j) => ({ step: `第 ${j + 1} 步（${kpName(id)}）`, key: String(j + 1), kp: id, score: 2 })).concat([{ step: '答句和单位', key: '答', kp: null, score: 1 }]);
    if (type === 'fill' && ids.length > 1) { t.stem = `【AI 模拟】${ids.map((id, j) => `${'①②③'[j]}____（${kpName(id)}）`).join('，')}`; t.blanks = ids.map(() => ['答案']); t.blankKp = ids; }
    if (type === 'single' && ids.length > 1) t.options = [o('A', '正确答案'), ...ids.map((id, j) => o('BCD'[j], `错误选项`, `模拟诊断：「${kpName(id)}」这一步出错`))];
    const roll = i % 5;
    const verify = roll === 3 ? { result: '更正', reason: '【模拟】原解析缺少第 2 步的计算过程，已补全；原第 ② 空答案多写了单位，已去掉。', before: '（更正前的解析和答案）' } : roll === 4 && n > 4 ? { result: '不能用', reason: '【模拟】题干条件不足，无法得出唯一答案' } : { result: '通过' };
    out.push({ id: newId('q'), kps: [...ids], type, level, ...t, source: 'AI 生成', rule: rule ? `${rule.name} v${rule.version}` : '（无匹配规则）', ai: profName(S.roles.gen.main), vg: variants ? vg : `vg-new-${S.nextId}`, vk: variants ? (i === 0 ? '母题' : ['换数字', '换情境', '反过来问', '加干扰', '换题型'][(i - 1) % 5]) : '母题', verify, status: verify.result === '不能用' ? '丢弃' : '启用', prog: ['math', 'physics'].includes(k0.subject) ? '程序复算一致' : '' });
  }
  return out;
}
