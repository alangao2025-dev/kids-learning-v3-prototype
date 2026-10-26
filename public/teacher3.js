'use strict';
/* 学习系统 3.0 原型：教师端 · 学生与学习策略、纸质试卷 */

// ================= 学生 =================
TP.students = () => `<h1>学生</h1><div class="card table-wrap"><table><tr><th>学生</th><th>年级</th><th>账号</th><th>学习策略</th><th>最近评估</th><th></th></tr>
  ${S.students.map(s => { const st = S.strategy[s.id]; return `<tr class="click" data-act="go" data-v="#/t/stu/${s.id}"><td>${s.avatar} <b>${esc(s.nick)}</b></td><td>${STAGE_NAME[s.stage]}</td><td>${s.user}</td><td><span class="tag ${st.src.startsWith('评估') ? '' : 'gray'}">${esc(st.src)}</span></td><td class="small">${st.at}</td><td><a>学习策略 →</a></td></tr>`; }).join('')}</table></div>`;

const ratioBar = (v, locked) => `<div class="rbar"><div style="width:${Math.min(100, v * 2.5)}%" class="${locked ? 'lk' : ''}"></div></div><b>${v}%</b>`;
TP.stu = id => {
  const s = stu(id); const st = S.strategy[id]; const ks = stuKps(id);
  const evalAi = S.roles.eval.main;
  return `<div class="row"><a href="#/t/students">← 学生</a></div>
  <div class="row between"><h1>${s.avatar} ${esc(s.nick)} <span class="muted small">${STAGE_NAME[s.stage]} · ${s.user}</span></h1></div>
  <div class="card"><div class="row between"><h3 style="margin:0">📈 学习策略</h3><div class="row">
    <button class="primary" data-act="evalNow" data-v="${id}">立即评估</button><button data-act="evalRule" data-v="${id}">用规则算法重算</button></div></div>
    <div class="row" style="margin:8px 0"><span class="tag ${st.src.startsWith('评估') ? '' : 'gray'}">${esc(st.src)}</span><span class="small muted">${st.at} 更新 · 评估 AI：${evalAi ? esc(profName(evalAi)) : '未配置（使用规则算法）'}</span></div>
    <div class="hint-box small"><b>给老师的说明</b>（只给老师看）：${esc(st.note)}</div>
    ${st.clipped?.length ? `<div class="clip small"><b>系统截断记录</b>（评估 AI 输出超出限制的部分）：<ul>${st.clipped.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
    <div class="form-grid">
      <div><label>每日题量</label><b>${st.perDay} 题</b> <span class="small muted">（上限：${s.stage[0] === 'P' ? '小学约 40 分钟，折合 25 题' : '初中约 60 分钟，折合 30 题'}）</span></div>
      <div><label>题型比例</label>单选 ${st.mix.single}% · 填空 ${st.mix.fill}% · 应用题 ${st.mix.applied}%</div>
      <div><label>目标正确率</label><input value="75" style="width:60px">% ～ <input value="85" style="width:60px">%</div>
    </div>
    <div class="table-wrap" style="margin-top:12px"><table><tr><th>知识点</th><th>掌握</th><th>最近 10 次</th><th>出题比例</th><th>目标难度</th><th>说明</th><th>锁定</th></tr>
    ${ks.map(k => { const it = st.items[k.id]; if (!it) return ''; const m = mOf(id, k.id); const stt = stateOf(id, k.id); const r = rateOf(id, k.id); const mm = missingMust(id, k.id);
      return `<tr class="${it.lock ? 'locked' : ''}"><td><b>${esc(k.name)}</b><div class="small muted">${SUBJECTS[k.subject].name}</div></td><td><span class="tag ${stt.cls}">${stt.n}</span><div class="small muted">★1 ${m[0]}/5 · ★2 ${m[1]}/5</div></td>
      <td><span class="dots">${[...(m[2] || '')].map(x => `<i class="${x === '1' ? 'on' : 'off'}"></i>`).join('')}</span><div class="small muted">${r == null ? '未作答' : Math.round(r * 100) + '%'}</div></td>
      <td>${it.lock ? `<input type="number" min="0" max="40" value="${it.ratio}" data-chg="lockRatio" data-s="${id}" data-k="${k.id}" style="width:64px">%` : it.ratio ? ratioBar(it.ratio) : '<span class="tag gray">不推荐</span>'}</td>
      <td>${it.lock ? `<select data-chg="lockLevel" data-s="${id}" data-k="${k.id}">${[1, 2, 3].filter(L => L <= maxLevelOf(k.id)).map(L => `<option ${L === it.level ? 'selected' : ''}>${L}</option>`).join('')}</select>` : `★${it.level}`}</td>
      <td class="small">${esc(it.why)}${mm.length ? `<div class="tag warn">学生端显示：建议先学「${mm.map(kpName).join('、')}」</div>` : ''}</td>
      <td><label class="inline"><input type="checkbox" data-chg="lockKp" data-s="${id}" data-k="${k.id}" ${it.lock ? 'checked' : ''}> 🔒</label></td></tr>`; }).join('')}</table></div>
    <p class="small muted">出题比例按学科分别合计 100%。系统限制：单个知识点 5%～40%；目标难度每次最多升降一级且不超过可用的最高等级；每种题型至少 10%；每日题量不超过年级上限。锁定的项评估时不修改。学生端只看到今日推荐的题和“建议先学”，不显示比例数字。老师布置的指定练习和考核不受学习策略影响。</p>
  </div>`;
};
CHG.lockKp = el => { const st = S.strategy[el.dataset.s]; st.items[el.dataset.k].lock = el.checked; render(); toast(el.checked ? '已锁定，评估时不会修改' : '已解锁'); };
CHG.lockRatio = el => { const st = S.strategy[el.dataset.s]; st.items[el.dataset.k].ratio = Math.max(0, Math.min(40, Number(el.value) || 0)); normalize(st.items); render(); };
CHG.lockLevel = el => { S.strategy[el.dataset.s].items[el.dataset.k].level = Number(el.value); render(); };
function strategyDiff(sid, before, after) {
  return `<table class="mini"><tr><th>知识点</th><th>出题比例</th><th>目标难度</th><th>说明</th></tr>${stuKps(sid).map(k => {
    const b = before.items[k.id], a = after.items[k.id]; if (!a) return '';
    const dr = a.ratio - (b?.ratio ?? 0); const dl = a.level - (b?.level ?? a.level);
    return `<tr class="${a.lock ? 'locked' : ''}"><td>${esc(k.name)}${a.lock ? ' 🔒' : ''}</td><td class="nw">${b?.ratio ?? '—'}% → <b>${a.ratio}%</b> ${dr ? `<span class="${dr > 0 ? 'up' : 'down'}">${dr > 0 ? '+' : ''}${dr}</span>` : ''}</td><td class="nw">★${b?.level ?? '—'} → <b>★${a.level}</b> ${dl ? `<span class="${dl > 0 ? 'up' : 'down'}">${dl > 0 ? '↑' : '↓'}</span>` : ''}</td><td class="small">${esc(a.why)}</td></tr>`;
  }).join('')}</table>`;
}
A.evalNow = async d => {
  const sid = d.v; const before = clone(S.strategy[sid]); const useAi = !!S.roles.eval.main;
  const steps = useAi ? [`收集作答数据：${stuKps(sid).length} 个知识点最近 20 次的对错和用时（学生用内部编号代替姓名）`, `评估 AI（${profName(S.roles.eval.main)}）给出建议参数`, '系统检查限制：比例 5%～40%、难度每次最多升降一级、每日题量上限、锁定项不改', '保存学习策略']
    : ['收集作答数据', '未配置评估 AI，按规则算法计算（§9.4）', '保存学习策略'];
  modal('<h3>📈 正在评估…</h3>', true);
  for (let i = 0; i <= steps.length; i++) { setModal(`<h3>📈 正在评估 ${esc(stu(sid).nick)}…</h3><div class="loading-steps">${steps.map((s, j) => `<div>${j < i ? '✅' : j === i ? '⏳' : '⬜'} ${esc(s)}</div>`).join('')}</div>`); await sleep(550); }
  const after = useAi ? aiStrategy(sid) : ruleStrategy(sid, before);
  S.strategy[sid] = after; S.usage.eval[0]++;
  setModal(`<h3>评估完成 · ${esc(after.src)}</h3><div class="hint-box small">${esc(after.note)}</div>
  ${after.clipped.length ? `<div class="clip small"><b>超出限制，已由系统截断：</b><ul>${after.clipped.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : '<div class="ok-box small">输出都在限制范围内</div>'}
  ${strategyDiff(sid, before, after)}
  <p class="small">每日题量：${before.perDay} → <b>${after.perDay}</b>　题型比例：单选 ${after.mix.single}% · 填空 ${after.mix.fill}% · 应用题 ${after.mix.applied}%</p>
  ${btnRow('<button class="primary" data-act="closeRender">好的</button>')}`);
};
A.evalRule = d => { const before = S.strategy[d.v]; S.strategy[d.v] = ruleStrategy(d.v, before); render(); toast('已按规则算法重算（锁定项保留）', 'ok'); };
A.closeRender = () => { closeModal(); render(); };

// ================= 纸质试卷 =================
const paperStatus = s => `<span class="tag ${{ 已识别: 'ok', 待上传: 'warn' }[s] || 'gray'}">${s}</span>`;
TP.paper = () => `<div class="row between"><h1>纸质试卷</h1><button class="primary" data-act="paperNewOpen">＋ 新建纸质试卷</button></div>
  <div class="proto-note">3.0 版式：单选题题号前印“（　　）”，学生在括号里<b>写选项字母</b>，不再印方框（M5 实测：打勾漏识别约一半，手写字母全部读对）；填空每空横线下印 ①②；应用题印“解：”“答：”。识别前系统<b>遮住页眉姓名区域</b>，试卷由二维码对应学生。</div>
  <div class="card table-wrap"><table><tr><th>编号</th><th>学生</th><th>试卷</th><th>题数</th><th>时间</th><th>状态</th><th></th></tr>
  ${S.papers.map(p => `<tr><td><b>${p.code}</b></td><td>${stu(p.sid).avatar} ${esc(stu(p.sid).nick)}</td><td>${esc(p.title)}</td><td>${p.qids.length}</td><td class="small">${p.at}</td><td>${paperStatus(p.status)}</td>
  <td class="row" style="gap:4px"><button class="small" data-act="paperPreview" data-v="${p.id}">预览试卷</button>${p.status === '已识别' ? `<button class="small primary" data-act="paperResult" data-v="${p.id}">识别结果</button>` : `<button class="small" data-act="paperUpload" data-v="${p.id}">模拟上传照片</button>`}</td></tr>`).join('')}</table></div>`;
A.paperNewOpen = () => modal(`<h3>新建纸质试卷</h3><label>学生</label><select id="pnS">${S.students.map(s => `<option value="${s.id}">${esc(s.nick)}（${STAGE_NAME[s.stage]}）</option>`).join('')}</select>
  <p class="small muted">按学习策略抽题：单选 2 道、填空 2 道、应用题 1 道；同一变式组只出一道。</p>${btnRow('<button data-act="close">取消</button><button class="primary" data-act="paperNew">生成</button>')}`);
A.paperNew = () => {
  const sid = val('pnS'); const pool = pickQs(sid, null, { n: 99 });
  const take = (t, n) => pool.filter(q => q.type === t).slice(0, n).map(q => q.id);
  const qids = [...take('single', 2), ...take('fill', 2), ...take('applied', 1)];
  const no = S.papers.filter(p => p.sid === sid).length + 13;
  S.papers.unshift({ id: newId('pp'), code: `${stu(sid).stage}-${String(no).padStart(3, '0')}`, sid, title: `${STAGE_NAME[stu(sid).stage]} · 学习策略组卷`, at: nowStr(), status: '待上传', qids, items: [] });
  closeModal(); render(); toast('已生成，可预览打印', 'ok');
};
function paperDoc(p) {
  const qs = p.qids.map(q$); let n = 0;
  const sec = (t, title, f) => { const list = qs.filter(q => q.type === t); return list.length ? `<div class="psec">${title}</div>${list.map(q => f(q, ++n)).join('')}` : ''; };
  const blank = s => esc(s).replace(/([①②③④⑤])_{2,}/g, '<span class="pblank"><span></span><sub>$1</sub></span>');
  return `<div class="paper"><div class="phead"><div class="pqr">▦▦<br>▦▦</div><div style="flex:1"><b>${esc(p.title)}</b><div class="small">${p.code} · 共 ${qs.length} 题</div></div><div class="pname">姓名：<span></span><div class="small muted">识别前自动遮住</div></div></div>
  ${sec('single', '一、单选题（请在括号内写出正确选项的字母）', (q, i) => `<div class="pq"><span class="paren">（　　）</span>${i}. ${esc(q.stem)}<div class="popts">${q.options.map(o => `<span>${o.id}. ${esc(o.text)}</span>`).join('')}</div></div>`)}
  ${sec('fill', '二、填空题', (q, i) => `<div class="pq">${i}. ${blank(q.stem)}</div>`)}
  ${sec('applied', '三、应用题（写出过程）', (q, i) => `<div class="pq">${i}. ${esc(q.stem)}<div class="parea">解：</div><div class="parea short">答：</div></div>`)}</div>`;
}
A.paperPreview = d => { const p = S.papers.find(x => x.id === d.v); modal(`<h3>试卷预览 · ${p.code}</h3>${paperDoc(p)}${btnRow(`<button data-act="paperPrint" data-v="${p.id}">打印</button><button class="primary" data-act="close">关闭</button>`)}`, true); };
A.paperPrint = d => {
  const w = window.open('', '_blank'); if (!w) return toast('浏览器拦截了新窗口', 'error');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${S.papers.find(x => x.id === d.v).code}</title><link rel="stylesheet" href="style.css"></head><body style="background:#fff">${paperDoc(S.papers.find(x => x.id === d.v))}<script>setTimeout(()=>print(),300)<\/script></body></html>`); w.document.close();
};
const SIM_READ = {
  q1: { read: 'B', conf: 0.93 }, q7: { read: 'C', conf: 0.58, verify: { r: '没把握', msg: '括号内字母有涂改，验证 AI 可信度 0.6，交老师确认' } }, q4: { read: ['84'], conf: 0.96 }, q27: { read: ['3000', '5'], conf: 0.9 },
  q6: { read: '465 − 178 = 287（本）\n287 + 236 = 523（本）\n答：现在有故事书 523 本。', conf: 0.86 },
};
A.paperUpload = async d => {
  const p = S.papers.find(x => x.id === d.v);
  const steps = ['按二维码对应学生和试卷', '遮住页眉姓名区域', `识别 AI（${profName(S.roles.ocr.main)}）读出作答：单选读括号内字母，填空读每空，应用题读全部文字`, `验证 AI（${profName(S.roles.ocr.verify)}）核对：低可信度和单选`, '判分：单选、填空系统比对；应用题交判题 AI'];
  modal('', true);
  for (let i = 0; i <= steps.length; i++) { setModal(`<h3>📷 正在识别 ${p.code}…</h3><div class="loading-steps">${steps.map((s, j) => `<div>${j < i ? '✅' : j === i ? '⏳' : '⬜'} ${esc(s)}</div>`).join('')}</div>`); await sleep(500); }
  p.items = p.qids.map(id => clone(SIM_READ[id] || { read: q$(id).type === 'single' ? q$(id).answer : q$(id).type === 'fill' ? q$(id).blanks.map(b => b[0]) : q$(id).answer, conf: 0.9 }));
  p.status = '已识别'; S.usage.ocr[0]++; render(); A.paperResult({ v: p.id });
};
function paperGrade(q, ans) {
  if (q.type === 'applied') { const g = gradeApplied(q, ans); return `${g.verdict}（${g.score}/${g.full}）${g.where ? `<div class="small muted">${esc(g.where)}</div>` : ''}`; }
  const g = gradeObjective(q, ans); return g.ok ? '✅ 对' : q.type === 'fill' ? `❌ ${g.parts.filter(Boolean).length}/${g.parts.length} 空` : `❌ 错${g.diag ? `<div class="small muted">${esc(g.diag)}</div>` : ''}`;
}
A.paperResult = d => {
  const p = S.papers.find(x => x.id === d.v);
  const show = a => Array.isArray(a) ? a.map((x, i) => `${'①②③'[i]} ${esc(x)}`).join('　') : esc(a).replace(/\n/g, '<br>');
  modal(`<h3>识别结果 · ${p.code} · ${esc(stu(p.sid).nick)}</h3>
  <div class="photo"><div class="ph-mask">姓名区域已遮住</div><div class="ph-qr">▦</div><div class="ph-lines">${p.qids.map((_, i) => `<i style="width:${60 + (i * 17) % 35}%"></i>`).join('')}</div><div class="small muted">照片 1 / 1（发送给识别 AI 前已遮住姓名区域）</div></div>
  <table class="mini"><tr><th>题</th><th>题型</th><th>识别 AI 读出</th><th>可信度</th><th>验证 AI</th><th>最终作答</th><th>判分</th></tr>
  ${p.qids.map((id, i) => { const q = q$(id); const it = p.items[i]; const v = it.verify || (q.type === 'single' || it.conf < 0.8 ? { r: '同意' } : null);
    const final = v?.r === '更正' ? v.to : it.read;
    return `<tr class="${v?.r === '更正' ? 'fixrow' : ''}"><td>${i + 1}</td><td>${typeTag(q.type)}</td><td>${show(it.read)}</td><td>${it.conf < 0.8 ? `<span class="tag warn">${it.conf}</span>` : it.conf}</td>
    <td>${!v ? '<span class="small muted">不需验证</span>' : v.r === '更正' ? `<span class="tag warn">更正为 ${esc(v.to)}</span><div class="small">${esc(v.msg)}</div>` : v.r === '没把握' ? `<span class="tag bad">交老师确认</span><div class="small">${esc(v.msg)}</div><button class="small" data-act="paperConfirm" data-v="${p.id}|${i}">老师确认为 ${esc(it.read)}</button>` : v.r === '老师确认' ? '<span class="tag ok">老师已确认</span>' : '<span class="tag ok">同意</span>'}</td>
    <td>${show(final)}</td><td>${v?.r === '没把握' ? '<span class="muted small">确认后判分</span>' : paperGrade(q, final)}</td></tr>`; }).join('')}</table>
  <p class="small muted">识别 AI：${esc(profName(S.roles.ocr.main))}（备选 ${esc(profName(S.roles.ocr.backup))}）；验证 AI：${esc(profName(S.roles.ocr.verify))}，验证比例“${esc(S.roles.ocr.ratio)}”。每个结果只验证一轮。</p>
  ${btnRow('<button class="primary" data-act="close">关闭</button>')}`, true);
};
A.paperConfirm = d => { const [pid, i] = d.v.split('|'); const p = S.papers.find(x => x.id === pid); p.items[+i].verify = { r: '老师确认' }; A.paperResult({ v: pid }); };
