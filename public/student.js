'use strict';
/* 学习系统 3.0 原型：学生端 */

const SP = {};
const teen = () => me().stage[0] === 'J';
const subjectsOf = sid => [...new Set(stuKps(sid).map(k => k.subject))];
function studentPage(page, arg, q) {
  const s = me(); const active = { run: 'practice' }[page] || page;
  const items = [['home', '🏠', '首页'], ['learn', '🗺️', '学习'], ['practice', '✏️', '练习']];
  return `<div class="topnav"><span class="brand"><span class="brand-icon">${teen() ? '📘' : '🌟'}</span> ${teen() ? '学习空间' : '学习乐园'} 3.0</span>
  <nav>${items.map(([p, ic, t]) => `<a class="${active === p ? 'active' : ''}" href="#/s/${p}">${ic} ${t}</a>`).join('')}</nav>
  <div class="me"><span class="avatar-link"><span class="avatar-bubble">${s.avatar}</span><span class="hide-sm">${esc(s.nick)}</span></span></div></div>
  <main>${(SP[page] || SP.home)(arg, q)}</main>`;
}

// ================= 掌握度记录 =================
function recordAnswer(sid, id, level, ok) {
  S.mastery[sid] ||= {}; const m = S.mastery[sid][id] ||= [0, 0, ''];
  if (ok) { if (level <= 1 || m[0] < T) m[0] = Math.min(T, m[0] + 1); else m[1] = Math.min(T, m[1] + 1); }
  m[2] = (m[2] + (ok ? '1' : '0')).slice(-10);
}
// ================= 抽题 =================
const unlocked = (sid, q) => q.kps.length < 2 || q.kps.every(id => mOf(sid, id)[0] >= T);
function pickQs(sid, subject, opts = {}) {
  const st = S.strategy[sid]; const stage = stu(sid).stage;
  let pool = S.qs.filter(q => q.status === '启用' && kp(q.kps[0])?.stage === stage && (!subject || kp(q.kps[0]).subject === subject) && (!opts.type || q.type === opts.type) && (!opts.kp || q.kps.includes(opts.kp)) && unlocked(sid, q));
  if (opts.byStrategy) pool = pool.filter(q => (st.items[q.kps[0]]?.ratio ?? 0) > 0).sort((a, b) => (st.items[b.kps[0]].ratio - st.items[a.kps[0]].ratio) || (Math.abs(a.level - st.items[a.kps[0]].level) - Math.abs(b.level - st.items[b.kps[0]].level)));
  const seen = new Set(); const out = [];
  for (const q of pool) { if (seen.has(q.vg)) continue; seen.add(q.vg); out.push(q); if (out.length >= (opts.n || 5)) break; }
  return out;
}
function startSession(title, qs) {
  if (!qs.length) return toast('暂时没有可以练的题', 'error');
  UI.sess = { sid: S.sid, title, idx: 0, items: qs.map(q => ({ qid: q.id, ans: null, res: null })) };
  go('#/s/run');
}

// ================= 首页 =================
SP.home = () => {
  const s = me(); const st = S.strategy[s.id];
  const top = stuKps(s.id).filter(k => st.items[k.id]?.ratio > 0).sort((a, b) => st.items[b.id].ratio - st.items[a.id].ratio).slice(0, 3);
  const first = stuKps(s.id).filter(k => missingMust(s.id, k.id).length);
  const mine = S.review.filter(r => r.sid === s.id && r.status !== '已处理' && r.fromStudent);
  const doneR = S.review.filter(r => r.sid === s.id && r.status === '已处理' && r.fromStudent);
  return `${teen() ? `<div class="teen-hello"><span class="big-avatar">${s.avatar}</span><div><b>${esc(s.nick)}，你好</b><div class="small" style="opacity:.85">${STAGE_NAME[s.stage]} · 今天也保持节奏</div></div></div>`
    : `<div class="row" style="margin:10px 0 16px"><span class="big-avatar" style="animation:bounce 2.4s infinite">${s.avatar}</span><div class="bubble">${esc(s.nick)}，你好！今天也一起加油吧！</div></div>`}
  <div class="card"><div class="row between"><div><h3 style="margin:0">📅 今日任务</h3><div class="small muted">${st.perDay} 道题，主要练：${top.map(k => esc(k.name)).join('、')}</div></div><button class="primary big" data-act="startToday">开始</button></div></div>
  ${first.length ? `<div class="card"><h3 style="margin-top:0">💡 建议先学</h3>${first.map(k => `<div class="delta">「${esc(k.name)}」要用到「${missingMust(s.id, k.id).map(kpName).join('、')}」，<b>建议先学</b>它 <button class="small" data-act="startKp" data-v="${missingMust(s.id, k.id)[0]}">去练</button></div>`).join('')}</div>` : ''}
  ${mine.length || doneR.length ? `<div class="card"><h3 style="margin-top:0">📮 我的申诉</h3>${[...mine, ...doneR].map(r => `<div class="delta">${esc(short(q$(r.qid).stem, 24))} <span class="tag ${r.status === '已处理' ? 'ok' : 'warn'}">${r.status === '已处理' ? '老师已处理：' + esc(r.result) : '等老师处理'}</span></div>`).join('')}</div>` : ''}
  <h2>我的学科</h2><div class="subject-cards">${subjectsOf(s.id).map(su => `<a class="card subject-card" href="#/s/practice?subject=${su}" style="color:inherit"><span class="ic">${SUBJECTS[su].icon}</span><h3>${SUBJECTS[su].name}</h3><div class="small muted">${stuKps(s.id).filter(k => k.subject === su && stateOf(s.id, k.id).cls === 'ok').length} / ${stuKps(s.id).filter(k => k.subject === su).length} 个知识点已掌握</div></a>`).join('')}</div>`;
};
A.startToday = () => startSession('今日任务', pickQs(S.sid, null, { byStrategy: true, n: 5 }));
A.startKp = d => startSession(kpName(d.v), pickQs(S.sid, null, { kp: d.v, n: 5 }));

// ================= 学习（按学习顺序） =================
SP.learn = (_, q) => {
  const s = me(); const subs = subjectsOf(s.id); const su = q.get('subject') || subs[0];
  const list = stuKps(s.id).filter(k => k.subject === su); const lv = layers(list);
  const sorted = [...list].sort((a, b) => lv[a.id] - lv[b.id] || a.order - b.order);
  return `<h1>学习</h1><div class="tabs subj-tabs">${subs.map(x => `<a class="${x === su ? 'on' : ''}" data-act="setq" data-key="subject" data-v="${x}">${SUBJECTS[x].icon} ${SUBJECTS[x].name}</a>`).join('')}</div>
  <p class="small muted">按学习顺序排列：前面的知识点学会了，再学后面的会更轻松。</p>
  ${sorted.map(k => { const stt = stateOf(s.id, k.id); const mm = missingMust(s.id, k.id); const pre = prereqsOf(k.id).filter(r => r.state === 'ok');
    return `<div class="kp-row" data-act="startKp" data-v="${k.id}"><span style="font-size:24px">${stt.cls === 'ok' ? '✅' : stt.cls === 'warn' ? '🌱' : '⭕'}</span><div><div class="name">${esc(k.name)}</div><div class="meta"><span class="tag ${stt.cls}">${stt.n}</span>${pre.length ? `<span class="small muted">先学：${pre.map(r => esc(kpName(r.a))).join('、')}</span>` : ''}${mm.length ? `<span class="tag warn">建议先学「${mm.map(kpName).join('、')}」</span>` : ''}</div></div><button class="small">练习</button></div>`; }).join('')}`;
};

// ================= 练习 =================
SP.practice = (_, q) => {
  const s = me(); const subs = subjectsOf(s.id); const su = q.get('subject') || subs[0];
  const cnt = t => pickQs(s.id, su, { type: t, n: 99 }).length;
  return `<h1>练习</h1><div class="tabs subj-tabs">${subs.map(x => `<a class="${x === su ? 'on' : ''}" data-act="setq" data-key="subject" data-v="${x}">${SUBJECTS[x].icon} ${SUBJECTS[x].name}</a>`).join('')}</div>
  <div class="card"><div class="row between"><div><b>🎯 智能练习</b><div class="small muted">按你的学习情况选 5 道题</div></div><button class="primary" data-act="startSub" data-v="${su}">开始</button></div></div>
  <div class="subject-cards">${['single', 'fill', 'applied'].map(t => `<div class="card"><h3 style="margin-top:0">${{ single: '🔘', fill: '✍️', applied: '🧮' }[t]} ${TYPE_NAME[t]}</h3><div class="small muted">${{ single: '点 A / B / C / D 选一个', fill: '每个空填一个答案', applied: '写出过程和答案，由 AI 老师判断，会告诉你错在哪一步' }[t]}</div><div class="row between" style="margin-top:10px"><span class="small muted">${cnt(t)} 道</span><button data-act="startType" data-v="${t}" data-s="${su}" ${cnt(t) ? '' : 'disabled'}>练这种题</button></div></div>`).join('')}</div>`;
};
A.startSub = d => startSession(`${SUBJECTS[d.v].name} · 智能练习`, pickQs(S.sid, d.v, { byStrategy: true, n: 5 }));
A.startType = d => startSession(`${SUBJECTS[d.s].name} · ${TYPE_NAME[d.v]}`, pickQs(S.sid, d.s, { type: d.v, n: 5 }));

SP.run = () => {
  const ss = UI.sess; if (!ss || ss.sid !== S.sid) return '<div class="empty">没有进行中的练习。<a href="#/s/practice">去练习</a></div>';
  if (ss.idx >= ss.items.length) return runSummary();
  const it = ss.items[ss.idx]; const q = q$(it.qid); const r = it.res;
  let body = '';
  if (q.type === 'single') body = `<div class="q-options">${q.options.map(o => { const cls = r ? (o.id === q.answer ? 'correct' : o.id === it.ans ? 'wrong' : '') : o.id === it.ans ? 'selected' : ''; return `<button class="q-opt ${cls}" data-act="pick" data-v="${o.id}" ${r ? 'disabled' : ''}><span class="key">${o.id}</span> ${esc(o.text)}</button>`; }).join('')}</div>`;
  if (q.type === 'fill') body = q.blanks.map((acc, i) => `<div class="blank-row ${r ? (r.parts[i] ? 'part-ok' : 'part-bad') : ''}"><b>${'①②③④⑤'[i]}</b><input class="q-input" id="bl${i}" value="${esc(it.ans?.[i] || '')}" ${r ? 'disabled' : ''} autocomplete="off">${r && !r.parts[i] ? `<span class="small">正确答案：${esc(acc[0])}</span>` : ''}</div>`).join('');
  if (q.type === 'applied') body = `<textarea id="apAns" class="ap-input" rows="6" placeholder="写出每一步的算式和答句，例如：\n465 − 178 = …\n答：……" ${r || it.judging ? 'disabled' : ''}>${esc(it.ans || '')}</textarea><div class="small muted">也可以拍照上传过程（由识别 AI 读出文字）</div>`;
  const stemTxt = esc(q.stem);
  return `<div class="q-head"><b>${esc(ss.title)}</b><span class="muted">${ss.idx + 1} / ${ss.items.length} · ${TYPE_NAME[q.type]} ${'⭐'.repeat(q.level)}</span></div>
  <div class="progress"><div style="width:${pct(ss.idx, ss.items.length)}%"></div></div>
  <div class="card" style="margin-top:12px"><div class="q-stem">${stemTxt}</div>${body}
  ${it.judging ? '<div class="judging">⏳ 正在判断…（判题 AI 正在看你的每一步）</div>' : ''}
  ${r ? resultBox(q, it) : ''}
  <div class="row" style="justify-content:flex-end;margin-top:14px">${r ? `<button class="primary big" data-act="nextQ">${ss.idx + 1 < ss.items.length ? '下一题' : '完成'}</button>` : it.judging ? '' : `<button class="primary big" data-act="submitQ">提交</button>`}</div></div>`;
};
function resultBox(q, it) {
  const r = it.res;
  if (q.type !== 'applied') {
    const ok = r.ok;
    return `<div class="${ok ? 'ok-box' : 'error-box'}">${ok ? '答对了！' : q.type === 'fill' ? `对了 ${r.parts.filter(Boolean).length} / ${r.parts.length} 个空` : `正确答案是 ${q.answer}`}${r.diag ? `<div class="small">你选的 ${esc(it.ans)}：${esc(r.diag)}</div>` : ''}</div>
    <div class="small muted">${esc(q.explain)}</div>${!ok && q.type === 'fill' ? appealBtn(it) : ''}`;
  }
  const cls = { 对: 'ok-box', 部分对: 'hint-box', 错: 'error-box' }[r.verdict];
  return `<div class="${cls}"><b>${r.toTeacher ? '老师确认后显示结果' : { 对: '全对！', 部分对: '部分对', 错: '还不对' }[r.verdict]}</b>${r.toTeacher ? '' : `　得分 ${r.score} / ${r.full}`}</div>
  ${r.toTeacher ? '<p class="small">这道题 AI 老师没把握，已经交给老师批改，批改后会告诉你。</p>' : `
  <div class="steps">${r.steps.map((s, i) => `<div class="step ${s.ok ? 'part-ok' : 'part-bad'}"><b>${s.ok ? '✅' : '❌'} 第 ${i + 1} 步：</b>${esc(s.step)}${s.carry ? ' <span class="small">（按你上一步的结果算是对的）</span>' : ''}</div>`).join('')}</div>
  ${r.where ? `<div class="where"><b>🔍 错在哪里：</b>${esc(r.where)}</div>` : ''}
  ${r.verdict !== '对' ? `<div class="small"><b>正确做法：</b>${esc(q.explain)}</div>` : ''}
  ${r.verify ? `<div class="small muted" style="margin-top:6px">✔ 另一个 AI 已经核对过这个判断（${esc(r.verify.r)}）</div>` : ''}
  ${r.verdict !== '对' ? appealBtn(it) : ''}`}`;
}
const appealBtn = it => it.appealed ? '<div class="small muted" style="margin-top:8px">📮 已申诉，等老师处理</div>' : '<div style="margin-top:8px"><button class="small" data-act="appealOpen">我觉得判错了，申诉</button></div>';
A.pick = d => { UI.sess.items[UI.sess.idx].ans = d.v; render(); };
A.submitQ = async () => {
  const ss = UI.sess; const it = ss.items[ss.idx]; const q = q$(it.qid);
  if (q.type === 'single') { if (!it.ans) return toast('先选一个答案'); it.res = gradeObjective(q, it.ans); creditObjective(q, it); return render(); }
  if (q.type === 'fill') { it.ans = q.blanks.map((_, i) => val('bl' + i).trim()); if (it.ans.every(x => !x)) return toast('先填写答案'); it.res = gradeObjective(q, it.ans); creditObjective(q, it); return render(); }
  it.ans = val('apAns'); if (!it.ans.trim()) return toast('先写出你的过程和答案');
  it.judging = true; render(); await sleep(1400);
  it.judging = false; it.res = gradeApplied(q, it.ans); S.usage.judge[0]++;
  if (it.res.toTeacher) S.review.unshift({ id: newId('rv'), sid: S.sid, qid: q.id, kind: '应用题 · 低可信度', at: nowStr(), answer: it.ans, ai: { verdict: it.res.verdict, score: it.res.score, conf: 0.55, where: it.res.where }, verify: `验证 AI ${it.res.verify.r}：${it.res.verify.msg}`, status: '待老师确认', reason: '判题 AI 可信度低于 0.8，确认前不计掌握度', grade: it.res, pendingMastery: true, fromStudent: true });
  else creditApplied(q, it.res);
  if (UI.sess === ss && parseHash().parts[1] === 'run') render();
};
function creditObjective(q, it) {
  if (q.type === 'fill' && q.blankKp) q.blankKp.forEach((id, i) => recordAnswer(S.sid, id, q.level, it.res.parts[i]));
  else for (const id of q.kps) recordAnswer(S.sid, id, q.level, it.res.ok);
}
function creditApplied(q, r) {
  for (const id of q.kps) { if (r.kpsWrong.includes(id)) recordAnswer(S.sid, id, q.level, false); else if (r.verdict === '对') recordAnswer(S.sid, id, q.level, true); }
}
A.appealOpen = () => modal(`<h3>📮 申诉</h3><p class="small muted">说说你为什么觉得自己是对的，老师会看你的答案并回复你。</p><textarea id="apWhy" rows="3" style="font-family:inherit;font-size:16px" placeholder="例如：我的第二步是按第一步的结果算的"></textarea>${btnRow('<button data-act="close">取消</button><button class="primary" data-act="appealOk">提交给老师</button>')}`);
A.appealOk = () => {
  const why = val('apWhy').trim(); if (!why) return toast('写一下理由吧');
  const it = UI.sess.items[UI.sess.idx]; const q = q$(it.qid); it.appealed = true;
  const r = it.res;
  S.review.unshift(q.type === 'applied'
    ? { id: newId('rv'), sid: S.sid, qid: q.id, kind: '应用题 · 学生申诉', at: nowStr(), answer: it.ans, ai: { verdict: r.verdict, score: r.score, conf: r.conf, where: r.where }, verify: r.verify ? `验证 AI ${r.verify.r}：${r.verify.msg}` : '未验证', status: '待处理', reason: `学生说明：“${why}”`, grade: r, fromStudent: true }
    : { id: newId('rv'), sid: S.sid, qid: q.id, kind: '填空 · 学生申诉', at: nowStr(), answer: it.ans.map((x, i) => '①②③④⑤'[i] + x).join('  '), ans: it.ans, ai: null, verify: '', status: '待处理', reason: `学生说明：“${why}”`, fromStudent: true });
  closeModal(); toast('已提交，老师处理后会告诉你', 'ok'); render();
};
A.nextQ = () => { const ss = UI.sess; ss.idx++; if (ss.idx >= ss.items.length) finishSession(); render(); window.scrollTo(0, 0); };
function finishSession() {
  const sid = S.sid; const prev = S.strategy[sid];
  S.strategy[sid] = S.roles.eval.main ? aiStrategy(sid) : ruleStrategy(sid, prev);
}
function runSummary() {
  const ss = UI.sess; const ok = ss.items.filter(it => it.res && (it.res.ok || it.res.verdict === '对')).length;
  return `<div class="card" style="text-align:center"><div class="result-stars">${'⭐'.repeat(Math.max(1, Math.round(ok / ss.items.length * 3)))}</div><h2>完成啦！</h2><p>答对 ${ok} / ${ss.items.length} 题</p>
  <p class="small muted">系统已根据这次练习更新你的学习计划。</p><div class="row" style="justify-content:center"><a class="btn" href="#/s/home">回首页</a><a class="btn primary" href="#/s/practice">再练一组</a></div></div>`;
}
