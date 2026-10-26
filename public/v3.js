'use strict';
/* 学习系统 3.0 原型：学习评估、应用题判分（模拟判题 AI）、申诉、学生端 3.0 卡片 */

const sleep = ms => new Promise(r => setTimeout(r, ms));
const prof = id => S.profiles.find(p => p.id === id);
const profName = id => id ? prof(id)?.name || id : '—';
const pendingReview = () => (S.review || []).filter(r => r.status !== '已处理').length;
const prereqsOf = id => S.prereqs.filter(r => r.b === id);
const nextsOf = id => S.prereqs.filter(r => r.a === id);
const comboOf = (a, b) => S.combos.find(c => (c.a === a && c.b === b) || (c.a === b && c.b === a));
const qtypesOf = k => k.qtypes || (k.type === '记忆' ? ['single', 'fill'] : ['math', 'physics', 'chemistry'].includes(k.subject) && k.type === '理解应用' ? ['single', 'fill', 'applied'] : ['single', 'fill']);
const ruleFor = sub => { const on = S.rules.filter(r => r.status === '启用'); return on.find(r => r.scope.startsWith(subj(sub).name)) || on.find(r => r.scope.startsWith('全部')) || null; };

// ================= 状态初始化与题目持久化 =================
function seedV3(st) {
  st.devMode = true;
  st.profiles = JSON.parse(JSON.stringify(AI_PROFILES_SEED));
  st.roles = {
    kp: { main: 'dev', backup: '', verify: '', ratio: '' },
    gen: { main: 'dev', backup: '', verify: 'dev', ratio: '全部' },
    judge: { main: 'dev', backup: '', verify: 'dev', ratio: '错 / 部分对 / 低可信度' },
    ocr: { main: 'dev', backup: 'mu', verify: 'dev', ratio: '低可信度和单选' },
    eval: { main: 'dev', backup: '', verify: '', ratio: '' },
  };
  st.rules = JSON.parse(JSON.stringify(RULE_SEED));
  st.recent = JSON.parse(JSON.stringify(RECENT_SEED));
  st.strategy = {}; st.qPatch = {}; st.qNew = [];
  st.review = [
    { id: 'rv1', sid: 's1', qid: 'a6', kind: '应用题 · 低可信度', at: '2026-10-19 15:12', answer: '7点45分+25分=8点10分\n迟到了 10 分', ai: { verdict: '对', score: 5, full: 5, conf: 0.72, where: '' }, verify: '验证 AI 同意（可信度 0.70）', status: '待老师确认', reason: '“8点10分”的写法与评分要点 8:10 不一致，判题 AI 可信度 0.72 低于 0.8，确认前不计掌握度' },
    { id: 'rv2', sid: 's1', qid: 't2', kind: '填空 · 学生申诉', at: '2026-10-19 15:40', answer: '① 3000，② 5吨', ans: ['3000', '5吨'], status: '待处理', reason: '学生说明：“我写的是 5 吨，意思一样”。系统比对：第 ② 空可接受答案只有“5”' },
  ];
  st.corrections = [
    { role: 'gen', at: '2026-10-19 10:02', target: 'a2（计算经过的时间 + 秒的换算）', before: '休息 10 分钟；“秒的认识”没有对应步骤', after: '改为休息 600 秒，补充“换算成分”评分要点', judge: '' },
    { role: 'gen', at: '2026-10-19 10:05', target: 'a4（长方形和正方形的周长）', before: '答案 A（40）', after: '答案 B（30），补充 A 选项错误诊断', judge: '更正正确' },
    { role: 'judge', at: '2026-10-19 14:31', target: '小禾 · a8 图书室故事书', before: '错（0/5）：没写过程', after: '部分对（3/5）：最终答案 523 本正确，缺少第 1 步', judge: '' },
  ];
  st.jobs = [
    { id: 'j1', role: 'gen', at: '2026-10-20 16:20', desc: '出题：认识几分之一和几分之几 · ★2 · 填空 × 5（小学数学出题规则 v1.2）', state: '等待开发方' },
    { id: 'j2', role: 'eval', at: '2026-10-20 16:31', desc: '评估：S-0003（初三 · 物理 4 个知识点）', state: '等待开发方' },
  ];
  st.usage = { kp: [3, 21400, 0, 0], gen: [42, 186000, 1, 13], judge: [57, 64200, 0, 6], ocr: [9, 38800, 2, 3], eval: [12, 15300, 0, 0] };
}
function applyQPatches() {
  for (const q of S.qNew || []) if (!Q[q.id]) { QUESTIONS.push(q); Q[q.id] = q; }
  for (const [id, p] of Object.entries(S.qPatch || {})) if (Q[id]) Object.assign(Q[id], JSON.parse(JSON.stringify(p)));
}
function persistQ(q) { if ((S.qNew || []).some(x => x.id === q.id)) { S.qNew = S.qNew.map(x => x.id === q.id ? q : x); return; } S.qPatch[q.id] = { status: q.status, unreviewed: q.unreviewed, blanks: q.blanks }; }

// ================= 掌握情况与学习评估（§9） =================
const recentOf = (sid, id) => (S.recent?.[sid] || {})[id] || '';
const rateOf = (sid, id) => { const r = recentOf(sid, id); return r ? [...r].filter(x => x === '1').length / r.length : null; };
const basic = (sid, id) => peekM(sid, id).c[0] >= T(1);
const missingMust = (sid, id) => prereqsOf(id).filter(r => r.kind === 'must' && r.state === 'ok' && kpById(r.a)?.status === '启用' && isComb(kpById(r.a)) && !basic(sid, r.a)).map(r => r.a);
function recordRecent(sid, item, ok) {
  S.recent ||= {}; S.recent[sid] ||= {};
  const weak = ok ? [] : diagOf(item).weak;
  for (const id of item.kps) { const k = kpById(id); if (!k || !isComb(k)) continue; const good = ok || (weak.length && !weak.includes(id)); S.recent[sid][id] = ((S.recent[sid][id] || '') + (good ? '1' : '0')).slice(-10); }
}
const evalKps = sid => { const s = student(sid); return openSubjects(s.stage).flatMap(x => skps(sid, s.stage, x.id)).filter(isComb); };
const dayCap = sid => { const b = band(student(sid).stage); return Math.floor(S.config.dayMin[b] * 60 / S.config.secPerQ[b]); };

function ruleStrategy(sid, prev, clipped) {
  const items = {}; const locks = prev?.items || {}; const ks = evalKps(sid); const [lo, hi] = S.config.targetAcc;
  for (const k of ks) {
    const L = locks[k.id]; const rate = rateOf(sid, k.id); const cur = recLevel(sid, k); const ml = maxLevel(k);
    let level = cur, w, why; const mm = missingMust(sid, k.id);
    if (mm.length) { w = 0; why = `“必须”前置未基本掌握：${mm.map(x => kpById(x).name).join('、')}，暂不推荐`; }
    else if (rate == null) { const last = peekM(sid, k.id).last; if (last && dayDiff(last, todayStr()) > 30 && basic(sid, k.id)) { w = 5; why = '超过 30 天没练，少量复习'; } else { w = 10; why = '前置已满足，开始学习'; } }
    else if (rate <= 0.5) { w = 25; level = Math.max(1, cur - 1); why = `最近正确率 ${Math.round(rate * 100)}%，加练并降一级`; }
    else if (rate * 100 < lo - 15) { w = 18; level = Math.max(1, cur - 1); why = `最近正确率 ${Math.round(rate * 100)}%，降一级巩固`; }
    else if (rate * 100 >= hi && statusOf(sid, k).lv >= 3) { w = 5; why = '已熟练，少量复习'; }
    else if (rate * 100 >= hi) { w = 12; level = Math.min(ml, cur + 1); why = `最近正确率 ${Math.round(rate * 100)}%，高于目标区间，${level > cur ? '升一级' : '保持（已是可用的最高等级）'}`; }
    else { w = 15; why = `最近正确率 ${Math.round(rate * 100)}%，在目标区间 ${lo}%～${hi}% 附近，保持`; }
    items[k.id] = L?.lock ? { ...L } : { ratio: w, level, why, lock: false };
  }
  for (const k of ks) { const r = rateOf(sid, k.id); if (r != null && r <= 0.5) for (const p of prereqsOf(k.id)) if (p.kind === 'must' && items[p.a] && !items[p.a].lock && items[p.a].ratio < 10) { items[p.a].ratio = 10; items[p.a].why += `；「${k.name}」较弱，复习它的前置`; } }
  normalize(items, clipped);
  const ap = ks.filter(k => QUESTIONS.some(q => q.type === 'applied' && q.kps?.includes(k.id)) && rateOf(sid, k.id) != null);
  const apRate = ap.length ? ap.reduce((a, k) => a + rateOf(sid, k.id), 0) / ap.length : 1;
  return { src: '规则算法', at: nowStr(), items, mix: apRate < 0.6 ? { single: 35, fill: 35, applied: 30 } : { single: 40, fill: 40, applied: 20 }, perDay: Math.min(20, dayCap(sid)), note: '按规则算法计算（需求 §9.4）：正确率 ≥ 85% 升一级、≤ 60% 降一级；≤ 50% 的加练并复习“必须”前置；其余平均分配。', clipped: clipped || [] };
}
// 每个学科的出题比例分别合计 100%；单个知识点 5%～40%（可推荐的太少时放宽上限）
function normalize(items, clipped) {
  const bySub = {};
  for (const id of Object.keys(items)) (bySub[kpById(id)?.subject || '?'] ||= []).push(id);
  for (const ids of Object.values(bySub)) normalizeGroup(items, ids, clipped);
}
function normalizeGroup(items, ids, clipped) {
  const fixed = ids.filter(id => items[id].lock || items[id].ratio === 0 || items[id]._fix);
  const live = ids.filter(id => items[id].ratio > 0 && !items[id].lock);
  const lockSum = ids.filter(id => items[id].lock).reduce((s, id) => s + items[id].ratio, 0);
  const cap = live.length ? Math.max(40, Math.ceil((100 - lockSum) / live.length)) : 40;
  for (let round = 0; round < 6; round++) {
    const free = ids.filter(id => !fixed.includes(id));
    const fixedSum = fixed.reduce((s, id) => s + items[id].ratio, 0);
    const freeSum = free.reduce((s, id) => s + items[id].ratio, 0) || 1;
    for (const id of free) items[id].ratio = items[id].ratio * (100 - fixedSum) / freeSum;
    let changed = false;
    for (const id of free) { const v = items[id].ratio; const c = Math.min(cap, Math.max(5, v)); if (Math.abs(c - v) > 0.01) { items[id].ratio = c; fixed.push(id); changed = true; if (clipped && v > cap + 0.5) clipped.push(`「${kpById(id).name}」比例 ${Math.round(v)}% 超过上限，截为 ${cap}%`); } }
    if (!changed) break;
  }
  for (const id of ids) { items[id].ratio = Math.round(items[id].ratio); delete items[id]._fix; }
  const adj = live.sort((a, b) => (items[a].ratio >= cap) - (items[b].ratio >= cap) || items[b].ratio - items[a].ratio);
  let diff = live.length ? 100 - ids.reduce((s, id) => s + items[id].ratio, 0) : 0;
  for (const id of adj) { if (!diff) break; const v = items[id].ratio; const nv = Math.min(cap, Math.max(5, v + diff)); diff -= nv - v; items[id].ratio = nv; }
}
// 评估 AI（模拟）：故意给出超出限制的建议，演示系统截断（§9.3）
function aiStrategy(sid) {
  const prev = S.strategy[sid]; const st = ruleStrategy(sid, prev); st.src = `评估 AI（${profName(S.roles.eval.main)}）`; st.clipped = [];
  const scored = evalKps(sid).filter(k => !st.items[k.id].lock && st.items[k.id].ratio > 0).map(k => ({ k, r: rateOf(sid, k.id) })).filter(x => x.r != null).sort((a, b) => a.r - b.r);
  const weak = scored[0], strong = scored[scored.length - 1];
  if (weak) { const it = st.items[weak.k.id]; it.why = `评估 AI：错误集中在“${weak.k.name}”，建议大幅加练`; st.clipped.push(`「${weak.k.name}」AI 建议比例 55%，超过单个知识点上限 40%，执行 40%`); it.ratio = 40; it._fix = true;
    for (const x of evalKps(sid)) if (x.subject === weak.k.subject && x.id !== weak.k.id && !st.items[x.id].lock && st.items[x.id].ratio) st.items[x.id].ratio *= 0.8; }
  if (strong && strong !== weak) {
    const k = strong.k; const cur = prev?.items?.[k.id]?.level || recLevel(sid, k); const want = cur + 2; const cap = Math.min(maxLevel(k), cur + 1);
    st.items[k.id].level = cap; st.items[k.id].why = `评估 AI：连续答对，建议提高难度到 ★${want}`;
    st.clipped.push(`「${k.name}」AI 建议难度 ★${cur} → ★${want}，每次最多升一级${cap < cur + 1 ? '，且不能超过可用的最高等级 ★' + maxLevel(k) : ''}，执行 ★${cap}`);
  }
  normalize(st.items, st.clipped);
  const cap = dayCap(sid); const want = cap + 10;
  st.clipped.push(`AI 建议每日 ${want} 题，超过每日题量上限（约 ${S.config.dayMin[band(student(sid).stage)]} 分钟，折合 ${cap} 题），执行 ${cap} 题`); st.perDay = cap;
  st.note = weak ? `“${weak.k.name}”最近正确率 ${Math.round(weak.r * 100)}%，低于目标区间 ${S.config.targetAcc.join('%～')}%，是当前最需要加强的知识点；${strong && strong !== weak ? `“${strong.k.name}”已稳定，可以提高难度。` : ''}${st.mix.applied > 20 ? '应用题正确率偏低，提高应用题比例。' : ''}` : '作答数据不足，暂按规则算法。';
  return st;
}
function evaluate(sid, why) {
  if (!S.roles.eval.main) return { ...ruleStrategy(sid, S.strategy[sid]), at: nowStr(), why };
  S.usage.eval[0]++; return { ...aiStrategy(sid), why };
}

// ================= 应用题判分（模拟判题 AI，§6.3） =================
const normA = s => String(s ?? '').replace(/[\uff01-\uff5e]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[xX*]/g, '×').replace(/[：]/g, ':').replace(/−/g, '-').replace(/\s/g, '').toLowerCase();
const numsIn = s => String(s ?? '').split(/\s+/).flatMap(part => normA(part).match(/\d+(?:\.\d+)?(?::\d+)?/g) || []);
const isNum = k => /^\d+(?:\.\d+)?$/.test(k);
function hasKeyA(text, key) {
  const t = normA(text); const k = normA(key);
  if (/^[\d.:]+$/.test(k)) return numsIn(text).some(n => n === k || (!k.includes(':') && !n.includes(':') && Number(n) === Number(k)));
  return t.includes(k);
}
function aiJudge(q, text) {
  const steps = q.rubric.map(r => ({ ...r, ok: hasKeyA(text, r.key) }));
  const full = q.rubric.reduce((s, r) => s + r.score, 0);
  const ns = numsIn(text); const known = new Set([...numsIn(q.stem), ...q.rubric.flatMap(r => numsIn(r.key))]);
  const strange = ns.filter(n => !known.has(n));
  const conf = ns.length ? 0.9 : 0.5;
  const firstBad = steps.find(s => !s.ok && isNum(normA(s.key)));
  if (firstBad && strange.length && isNum(strange[0])) {
    const d = Number(firstBad.key) - Number(strange[0]);
    for (const s of steps.slice(steps.indexOf(firstBad) + 1)) if (!s.ok && isNum(normA(s.key)) && strange.some(n => Math.abs(Number(n) - (Number(s.key) - d)) < 1e-9)) { s.ok = true; s.carry = true; }
  }
  const score = steps.reduce((s, r) => s + (r.ok ? r.score : 0), 0);
  const verdict = score === full ? '对' : score > 0 ? '部分对' : '错';
  let where = '';
  if (firstBad) {
    const i = steps.indexOf(firstBad) + 1;
    where = strange.length ? `第 ${i} 步「${firstBad.step}」：你写的是 ${strange[0]}，应该得到 ${firstBad.key}。` : `第 ${i} 步「${firstBad.step}」没有写出来（应得到 ${firstBad.key}）。`;
    if (steps.some(s => s.carry)) where += ' 后面的步骤按你前一步的结果算是对的，不重复扣分。';
  } else if (score < full) { const b = steps.find(s => !s.ok); where = `第 ${steps.indexOf(b) + 1} 步「${b.step}」没有做到（应有：${b.key}）。`; }
  const r = { verdict, score, full, steps, where, conf, verify: null, toTeacher: false };
  if (verdict !== '对' || conf < S.config.judgeConf) {
    if (conf < S.config.judgeConf) { r.verify = { r: '没把握', msg: '学生答案中没有可识别的算式或数字，验证 AI 可信度 0.55，交老师确认' }; r.toTeacher = true; }
    else r.verify = { r: '同意', msg: '核对评分要点，指出的错误位置正确' };
  }
  return r;
}
function queueReview(sid, q, it, kind) {
  S.review.unshift({ id: 'rv' + Date.now(), sid, qid: q.id, kind, at: nowStr(), answer: it.ans, ai: { verdict: it.ai.verdict, score: it.ai.score, full: it.ai.full, conf: 0.55, where: it.ai.where }, verify: `验证 AI ${it.ai.verify.r}：${it.ai.verify.msg}`, status: '待老师确认', reason: `判题 AI 可信度低于 ${S.config.judgeConf}，确认前不计掌握度`, pendingMastery: true, kps: it.kps, level: it.level, fromStudent: true });
}
// 老师确认 / 改判后计入掌握度
function settleCredit(r, ok) {
  const prev = S.session; S.session = { deltas: [] }; const it = { qid: r.qid, kps: r.kps || Q[r.qid].kps, level: r.level || Q[r.qid].level || 1, ans: r.ans || r.answer };
  if (r.pendingMastery) { if (ok) credit(r.sid, it, 1); else { touch(r.sid, it); addMistake(r.sid, it, '练习'); } r.pendingMastery = false; }
  else if (ok) { const m = S.mistakes.find(x => x.sid === r.sid && x.qid === r.qid && x.status !== '已掌握'); if (m) { m.status = '已掌握'; m.next = addDays(30); } }
  S.session = prev;
}

// ================= 学生端：申诉、今日任务、学习顺序 =================
Object.assign(A, {
  appealOpen() { modal(`<h3>📮 申诉</h3><p class="small muted">说说你为什么觉得自己是对的，老师会看你的答案并回复你。</p><textarea id="apWhy" rows="3" style="font-family:inherit;font-size:16px" placeholder="例如：我的第二步是按第一步的结果算的"></textarea><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">取消</button><button class="primary" data-act="appealOk">提交给老师</button></div>`); },
  appealOk() {
    const why = val('apWhy').trim(); if (!why) return toast('写一下理由吧');
    const it = cur(); const q = Q[it.qid]; it.appealed = true;
    S.review.unshift(q.type === 'applied'
      ? { id: 'rv' + Date.now(), sid: S.currentSid, qid: q.id, kind: '应用题 · 学生申诉', at: nowStr(), answer: it.ans, ai: { verdict: it.ai.verdict, score: it.ai.score, full: it.ai.full, conf: it.ai.conf, where: it.ai.where }, verify: it.ai.verify ? `验证 AI ${it.ai.verify.r}：${it.ai.verify.msg}` : '未验证', status: '待处理', reason: `学生说明：“${why}”`, kps: it.kps, level: it.level, fromStudent: true }
      : { id: 'rv' + Date.now(), sid: S.currentSid, qid: q.id, kind: '填空 · 学生申诉', at: nowStr(), answer: ansText(it), ans: it.ans, status: '待处理', reason: `学生说明：“${why}”`, kps: it.kps, level: it.level, fromStudent: true });
    closeModal(); toast('已提交，老师处理后会告诉你', 'ok'); render();
  },
  startToday() {
    const sid = S.currentSid; const st = S.strategy[sid];
    const ks = todayKps(sid).map(k => k.id);
    if (!ks.length) return toast('暂时没有推荐的知识点');
    startPractice(ks, 1, Math.min(10, st.perDay));
    S.session.items.forEach(it => { const L = st.items[it.kps[0]]?.level; if (L && L > it.level) { const k = kpById(it.kps[0]); const p = pickFor(k, Math.min(L, maxLevel(k)), new Set(S.session.items.map(x => x.qid)), sid); if (p) Object.assign(it, mkItem(p.q, p.kps, Math.min(L, maxLevel(k)), 'practice', sid)); } });
    S.session.title = '今日任务（按学习策略出题）';
    if (!S.session.items.length) { S.session = null; return toast('这些知识点还没有可以用的题'); }
    go('#/s/run');
  },
  stuSub(d) { const { q } = parseHash(); q.delete('tab'); q.set('subject', d.v); go('#/' + parseHash().parts.join('/') + '?' + q); },
});
// 比例按学科分别合计 100%，所以每个学科取比例最高的一个；有作答记录的学科优先
function todayKps(sid) {
  const st = S.strategy[sid]; const ks = evalKps(sid).filter(k => st.items[k.id]?.ratio > 0);
  const subs = [...new Set(ks.map(k => k.subject))].sort((a, b) => ks.filter(k => k.subject === b && recentOf(sid, k.id)).length - ks.filter(k => k.subject === a && recentOf(sid, k.id)).length);
  return subs.map(sub => ks.filter(k => k.subject === sub).sort((a, b) => st.items[b.id].ratio - st.items[a.id].ratio)[0]).slice(0, 3);
}
function todayCard(s) {
  const st = S.strategy[s.id]; if (!st) return '';
  const top = todayKps(s.id);
  const first = evalKps(s.id).filter(k => missingMust(s.id, k.id).length && statusOf(s.id, k).lv < 2).slice(0, 3);
  const mine = S.review.filter(r => r.sid === s.id && r.fromStudent);
  return `<div class="card"><div class="row between"><div><h3 style="margin:0">📅 今日任务</h3><div class="small muted">${top.length ? `主要练：${top.map(k => esc(k.name)).join('、')}` : '暂时没有推荐'}</div></div><button class="primary big" data-act="startToday" ${top.length ? '' : 'disabled'}>开始</button></div></div>
  ${first.length ? `<div class="card"><h3 style="margin-top:0">💡 建议先学</h3>${first.map(k => { const m = missingMust(s.id, k.id); return `<div class="delta">「${esc(k.name)}」要用到「${m.map(x => esc(kpById(x).name)).join('、')}」，建议先学它 <a class="btn small" href="#/s/kpd/${m[0]}">去练</a></div>`; }).join('')}</div>` : ''}
  ${mine.length ? `<div class="card"><h3 style="margin-top:0">📮 我的申诉和待批改</h3>${mine.slice(0, 4).map(r => `<div class="delta"><span>${esc(String(Q[r.qid].stem).slice(0, 26))}…</span><span class="tag ${r.status === '已处理' ? 'ok' : 'warn'}">${r.status === '已处理' ? '老师已处理：' + esc(r.result) : r.kind.includes('申诉') ? '等老师处理' : '老师批改后显示结果'}</span></div>`).join('')}</div>` : ''}`;
}
function orderCard(sid, k) {
  const pre = prereqsOf(k.id).filter(r => r.state === 'ok'); const nx = nextsOf(k.id).filter(r => r.state === 'ok'); const mm = missingMust(sid, k.id);
  if (!pre.length && !nx.length) return '';
  return `<div class="card"><b>🧭 学习顺序</b>
  ${mm.length ? `<div class="hint-box">建议先学 ${mm.map(x => `<a href="#/s/kpd/${x}">「${esc(kpById(x).name)}」</a>`).join('、')}，学会了再学这个会更轻松。你也可以直接练。</div>` : ''}
  ${pre.length ? `<div class="small" style="margin-top:6px">先学：${pre.map(r => `<a href="#/s/kpd/${r.a}">${basic(sid, r.a) ? '✅' : '⭕'} ${esc(kpById(r.a)?.name)}</a>`).join('　')}</div>` : ''}
  ${nx.length ? `<div class="small" style="margin-top:4px">学会后可以学：${nx.map(r => `<a href="#/s/kpd/${r.b}">${esc(kpById(r.b)?.name)}</a>`).join('　')}</div>` : ''}</div>`;
}

// ================= 公共标签 =================
const qTypeTag = q => `<span class="tag ${{ single: '', fill: 'ok', applied: 'warn' }[q.type]}">${QTYPE_NAME[q.type]}</span>${q.origType && q.source === '2.x 保留' && q.origType !== QTYPE_NAME[q.type].slice(0, -1) ? `<span class="tag gray" title="${esc(q.conv || '')}">原：${q.origType}</span>` : ''}`;
const srcTag = q => `<span class="tag ${{ 'AI 生成': '', 老师导入: 'ok', '2.x 保留': 'gray' }[q.source] ?? 'gray'}">${esc(q.source)}</span>`;
function verifyTag(q) {
  const r = q.verify?.result; if (!r) return '';
  return `<span class="tag ${{ 通过: 'ok', 更正: 'warn', 不能用: 'bad' }[r]}">${r === '更正' ? '已被验证 AI 更正' : '验证' + r}</span>`;
}
