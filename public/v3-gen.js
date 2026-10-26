'use strict';
/* 学习系统 3.0 原型：教师端 · AI 生成习题（按规则文件）、题目列表、题目详情、导入习题 */

function simulateGen(ids, type, level, n, variants) {
  const k0 = kpById(ids[0]); const rule = ruleFor(k0.subject); const out = []; const vg = 'VG-N' + (S.qNew.length + 1);
  const nm = id => kpById(id).name;
  for (let i = 0; i < n; i++) {
    const id = `g${Date.now().toString(36)}${i}`;
    const base = { id, subject: k0.subject, stage: k0.stage, book: k0.book, kps: [...ids], level, type, hints: ['（模拟提示 1）', '（模拟提示 2）'], explain: '（模拟解析）', source: 'AI 生成', rule: rule ? `${rule.name} v${rule.version}` : '（无匹配规则）', ai: profName(S.roles.gen.main), vg, vk: variants ? (i === 0 ? '母题' : ['换数字', '换情境', '反过来问', '加干扰', '换题型'][(i - 1) % 5]) : '母题', v3: true, unreviewed: true };
    if (type === 'single') Object.assign(base, { stem: `【AI 模拟】关于「${nm(ids[0])}」${ids.length > 1 ? '与「' + ids.slice(1).map(nm).join('」「') + '」' : ''}的单选题：下面说法正确的是（　　）`, options: ['正确的说法', ...(ids.length > 1 ? ids.map(x => `错误选项（${nm(x)}这一步出错）`) : ['常见错误一', '常见错误二'])], answer: 0, diag: Object.fromEntries((ids.length > 1 ? ids : [ids[0], ids[0]]).map((x, j) => [j + 1, { t: ids.length > 1 ? `「${nm(x)}」这一步出错` : ['混淆了概念', '计算方法错误'][j], kp: x }])), answerText: 'A. 正确的说法' });
    if (type === 'fill') Object.assign(base, { stem: `【AI 模拟】关于${ids.map(x => `「${nm(x)}」`).join('、')}的填空题：`, blanks: ids.map((x, j) => ({ pre: `${CIRCLED[j]}（${nm(x)}）`, suf: '', ans: ['答案'], kp: ids.length > 1 ? x : undefined })), answerText: ids.map(() => '答案').join('；') });
    if (type === 'applied') Object.assign(base, { stem: `【AI 模拟】关于${ids.map(x => `「${nm(x)}」`).join('、')}的应用题（情境题干）`, answer: '（标准答案）', rubric: [...ids.map((x, j) => ({ step: `第 ${j + 1} 步（${nm(x)}）`, key: String(j + 1), kp: x, score: 2 })), { step: '答句和单位', key: '答', kp: null, score: 1 }], answerText: '（标准答案）' });
    const roll = i % 5;
    base.verify = roll === 3 ? { result: '更正', reason: '【模拟】原解析缺少第 2 步的计算过程，已补全；原第 ② 空答案多写了单位，已去掉。', before: '（更正前的解析和答案）' } : roll === 4 && n > 4 ? { result: '不能用', reason: '【模拟】题干条件不足，无法得出唯一答案' } : { result: '通过' };
    base.status = base.verify.result === '不能用' ? '丢弃' : '启用';
    if (['math', 'physics', 'chemistry'].includes(k0.subject)) base.prog = '程序复算一致';
    out.push(base);
  }
  return out;
}
function genForm() {
  const G = UI.gen; const list = kpsOf(G.stage, G.sub, false, G.book).filter(isComb);
  const chk = combineCheck(G.ids);
  const types = G.ids.length ? ['single', 'fill', 'applied'].filter(t => G.ids.every(id => qtypesOf(kpById(id)).includes(t))) : [];
  if (!types.includes(G.type)) G.type = types[0] || '';
  const levels = G.ids.length > 1 ? [G.ids.length + 1] : [1, 2]; if (!levels.includes(G.level)) G.level = levels[0];
  const rule = ruleFor(G.sub); const ok = G.ids.length && chk.ok && G.type && rule;
  const gate = G.ids.length > 1 && S.config.comboGate;
  return `<h3>🤖 AI 生成习题 · ${stageName(G.stage)} ${subj(G.sub).name}</h3>
  <label>选择知识点（可多选，第一个为主知识点）</label>
  <div class="chk-list">${list.map(k => `<label><input type="checkbox" data-chg="genKp" value="${k.id}" ${G.ids.includes(k.id) ? 'checked' : ''} style="min-height:0"> ${G.ids.includes(k.id) ? `<b>${G.ids.indexOf(k.id) + 1}.</b> ` : ''}${esc(k.name)} <span class="small muted">${esc(k.unit)}</span></label>`).join('')}</div>
  ${G.ids.length ? `<div class="${chk.ok ? 'ok-box' : 'error-box'}">${chk.ok ? '✓ ' : '✗ '}${esc(chk.msg)}</div>` : '<p class="small muted">选两个知识点时，系统按“合并表”检查能否出在同一道题里。</p>'}
  ${G.ids.length && !types.length ? '<div class="error-box">所选知识点没有共同的适用题型</div>' : ''}
  <div class="form-grid"><div><label>题型</label><select data-chg="genSet" data-k="type">${types.map(t => `<option value="${t}" ${t === G.type ? 'selected' : ''}>${QTYPE_NAME[t]}</option>`).join('')}</select></div>
  <div><label>难度</label><select data-chg="genSet" data-k="level">${levels.map(L => `<option value="${L}" ${L === G.level ? 'selected' : ''}>★${L} ${levelName(L)}</option>`).join('')}</select></div>
  <div><label>数量</label><select data-chg="genSet" data-k="n">${[3, 5, 8].map(n => `<option ${n === G.n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
  <div><label>&nbsp;</label><label class="inline"><input type="checkbox" data-chg="genVar" ${G.variants ? 'checked' : ''} style="min-height:0"> 生成为一个变式组（母题 + 变式）</label></div></div>
  <p class="small">出题规则：${rule ? `<b>${esc(rule.name)} v${esc(rule.version)}</b>（${esc(rule.scope)}）` : '<span class="tag bad">没有匹配的启用规则，不能生成</span>'}　出题 AI：${esc(profName(S.roles.gen.main))}${S.roles.gen.backup ? `（备选 ${esc(profName(S.roles.gen.backup))}）` : ''}　验证 AI：${esc(profName(S.roles.gen.verify))}</p>
  ${gate ? '<p class="small muted">学生要先点亮题中每个知识点的 ★1 才会抽到多知识点题。</p>' : ''}
  <div class="row" style="justify-content:flex-end;margin-top:12px"><button data-act="close">取消</button><button class="primary" data-act="genRun" ${ok ? '' : 'disabled'}>生成</button></div>`;
}
const genModal = () => { const m = document.querySelector('.modal'); if (m) m.innerHTML = genForm(); };
Object.assign(A, {
  genOpen(d) { const [sub, stage] = (d.v || 'math|P3').split('|'); const { q } = parseHash(); UI.gen = { sub, stage, book: q.get('book') || '', ids: [], type: '', level: 1, n: 5, variants: true }; modal(genForm(), true); },
  async genRun() {
    const G = UI.gen; const k0 = kpById(G.ids[0]); const rule = ruleFor(k0.subject); const hasV = !!S.roles.gen.verify;
    const out = simulateGen(G.ids, G.type, G.level, G.n, G.variants);
    if (!hasV) out.forEach(x => { x.verify = null; x.status = '启用'; });
    const nFix = out.filter(x => x.verify?.result === '更正').length, nDrop = out.filter(x => x.verify?.result === '不能用').length;
    const steps = [`出题 AI（${profName(S.roles.gen.main)}）按规则「${rule.name} v${rule.version}」生成 ${G.n} 道${S.devMode ? ' —— 开发代理：请求进入 AI 任务队列，由开发方完成' : ''}`,
      `程序检查：输出格式 ✓，每个知识点都有对应的${G.type === 'applied' ? '评分要点' : G.type === 'fill' ? '空' : '错误选项诊断'} ✓${out[0].prog ? '，计算题答案程序复算 ✓' : ''}`,
      hasV ? `验证 AI（${profName(S.roles.gen.verify)}）：通过 ${out.length - nFix - nDrop}，更正 ${nFix}，不能用 ${nDrop}` : '未配置验证 AI，跳过验证',
      hasV && nFix ? `更正后的 ${nFix} 道再过一次程序检查：通过（每个结果只验证一轮，不再交回出题 AI）` : '更正后检查：无需', '查重：与题库中题干相似度均低于 85% ✓'];
    const m = () => document.querySelector('.modal');
    for (let i = 0; i <= steps.length; i++) { if (!m()) return; m().innerHTML = `<h3>🤖 正在生成…</h3><div class="progress"><div style="width:${pct(i, steps.length)}%"></div></div><div class="loading-steps" style="margin-top:10px">${steps.map((s, j) => `<div>${j < i ? '✅' : j === i ? '⏳' : '⬜'} ${esc(s)}</div>`).join('')}</div>`; await sleep(450); }
    UI.genOut = out;
    m().innerHTML = `<h3>生成结果</h3><div class="loading-steps small">${steps.map(s => `<div>✅ ${esc(s)}</div>`).join('')}</div>
    ${hasV && S.roles.gen.main === S.roles.gen.verify ? '<div class="hint-box small">验证 AI 与主 AI 是同一个模型，验证效果会变差（可在 AI 配置中修改）。</div>' : ''}
    ${out.map(x => `<div class="card inner"><div class="row between"><b>${esc(x.vk)}</b><span>${x.verify ? verifyTag(x) : '<span class="tag gray">未验证</span>'}</span></div>${qFull(x, true)}${x.verify?.reason ? `<div class="${x.verify.result === '不能用' ? 'error-box' : 'hint-box'} small">${esc(x.verify.reason)}${x.verify.result === '不能用' ? '（丢弃，已记录）' : ''}</div>` : ''}</div>`).join('')}
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button data-act="close">放弃</button><button class="primary" data-act="genSave">入库 ${out.filter(x => x.status !== '丢弃').length} 道</button></div>`;
  },
  genSave() {
    const all = UI.genOut; const out = all.filter(x => x.status !== '丢弃');
    for (const x of out) { QUESTIONS.push(x); Q[x.id] = x; S.qNew.push(x); if (x.verify?.result === '更正') S.corrections.unshift({ role: 'gen', at: nowStr(), target: `${x.id}（${x.kps.map(id => kpById(id).name).join(' + ')}）`, before: x.verify.before, after: x.verify.reason, judge: '' }); }
    const k = kpById(all[0].kps[0]); k.bank[all[0].level - 1] += out.length;
    S.usage.gen[0]++; S.usage.gen[1] += 3200 * all.length; S.usage.gen[3] += out.filter(x => x.verify?.result === '更正').length; S.aiUsedToday += 3200 * all.length;
    S.jobs.unshift({ id: 'j' + Date.now(), role: 'gen', at: nowStr(), desc: `出题：${all[0].kps.map(id => kpById(id).name).join(' + ')} · ★${all[0].level} · ${QTYPE_NAME[all[0].type]} × ${all.length}（${all[0].rule}）`, state: '已完成' });
    log(`AI 生成习题 ${out.length} 道（${all[0].rule}）`); closeModal(); toast(`已入库 ${out.length} 道（未人工审核）`, 'ok');
    go(`#/t/bank?subject=${k.subject}&stage=${k.stage}&tab=list&src=${encodeURIComponent('AI 生成')}`);
  },
});
Object.assign(CHG, {
  genKp(el) { const G = UI.gen; G.ids = el.checked ? [...G.ids, el.value] : G.ids.filter(x => x !== el.value); genModal(); },
  genSet(el) { UI.gen[el.dataset.k] = el.dataset.k === 'type' ? el.value : Number(el.value); genModal(); },
  genVar(el) { UI.gen.variants = el.checked; },
  qFile(el) {
    const f = el.files[0]; if (!f) return;
    document.getElementById('fileResult').innerHTML = `<div class="card" style="margin-top:10px"><b>${esc(f.name)}</b> 检查结果（原型模拟）：<div class="ok-box">18 道通过检查</div>
    <div class="error-box">第 5 行（单选）：正确答案不在选项中<br>第 9 行（填空）：与已有题目重复（题干相似度 96%）<br>第 12 行（应用题）：缺少评分要点<br>第 14 行（应用题，2 个知识点）：「倍的认识与求几倍」没有对应的评分要点<br>第 15 行：题型“判断”不支持，请改为单选（A 对 / B 错）<br>第 17 行（填空）：程序复算 36 × 4 = 144，题中答案 134，不一致</div>
    ${checked('impVerify') ? '<p class="small muted">通过的 18 道将送验证 AI（开发代理），验证后入库，来源记为“老师导入”。</p>' : ''}<div class="row" style="justify-content:flex-end"><button class="primary" data-act="close">导入 18 道</button></div></div>`;
  },
});

// ================= 题目展示、题目列表 =================
function qFull(q, noExplain) {
  let h = `<div class="qv-stem">${esc(q.stem)}</div>`;
  if (q.type === 'single') h += `<div class="qv-opts">${q.options.map((o, i) => `<div class="qv-opt ${i === q.answer ? 'right' : ''}"><b>${'ABCD'[i]}.</b> ${o}${i === q.answer ? ' <span class="tag ok">正确答案</span>' : q.diag?.[i] ? ` <span class="small muted">错误诊断：${esc(typeof q.diag[i] === 'string' ? q.diag[i] : q.diag[i].t)}</span>` : ''}</div>`).join('')}</div>`;
  if (q.type === 'fill') h += `<table class="mini"><tr><th>空</th><th>可接受答案</th><th>对应知识点</th></tr>${q.blanks.map((b, i) => `<tr><td>${CIRCLED[i]} ${esc(b.pre || '')}</td><td>${b.ans.map(esc).join(' / ')}</td><td>${b.kp ? esc(kpById(b.kp)?.name) : '—'}</td></tr>`).join('')}</table>`;
  if (q.type === 'applied') h += `<div class="small"><b>标准答案：</b>${esc(q.answer)}</div><div class="small" style="margin-top:6px"><b>评分要点</b>（交给判题 AI，用于判断“错在哪一步”）</div>
    <table class="mini"><tr><th>#</th><th>这一步要做什么</th><th>关键结果</th><th>对应知识点</th><th>分值</th></tr>${q.rubric.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.step)}</td><td><code>${esc(r.key)}</code></td><td>${r.kp ? esc(kpById(r.kp)?.name) : '—'}</td><td>${r.score}</td></tr>`).join('')}</table>`;
  if (!noExplain) h += `<div class="small muted" style="margin-top:6px"><b>解析：</b>${esc(q.explain)}</div>`;
  return h;
}
function bankList(q) {
  const sub = q.get('subject') || 'math', stage = qStage(q), f = k => q.get(k) || '';
  const inScope = x => x.subject === sub && (x.stage ? x.stage === stage : x.band === band(stage));
  const all = QUESTIONS.filter(inScope);
  const list = all.filter(x => (!f('t') || x.type === f('t')) && (!f('src') || x.source === f('src')) && (!f('rule') || x.rule === f('rule')) && (!f('fix') || x.verify?.result === '更正') && (!f('vg') || x.vg === f('vg')) && (!f('orig') || x.origType === f('orig')));
  const sel = (key, opts, allTxt) => `<select data-chg="setq" data-key="${key}"><option value="">${allTxt}</option>${opts.map(([v, n]) => `<option value="${esc(v)}" ${f(key) === String(v) ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
  const cnt = (k, v) => all.filter(x => x[k] === v).length;
  return `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">${['single', 'fill', 'applied'].map(t => `<div class="stat"><div class="label">${QTYPE_NAME[t]}</div><div class="num">${cnt('type', t)}</div></div>`).join('')}${['AI 生成', '老师导入', '2.x 保留'].map(s => `<div class="stat"><div class="label">${s}</div><div class="num">${cnt('source', s)}</div></div>`).join('')}</div>
  <div class="row" style="margin:12px 0">${sel('t', Object.entries(QTYPE_NAME), '全部题型')}${sel('src', [['AI 生成', 'AI 生成'], ['老师导入', '老师导入'], ['2.x 保留', '2.x 保留']], '全部来源')}${sel('orig', [...new Set(all.map(x => x.origType).filter(Boolean))].map(x => [x, '2.x 原题型：' + x]), '全部原题型')}${sel('rule', [...new Set(all.map(x => x.rule).filter(Boolean))].map(r => [r, r]), '全部规则版本')}
  <label class="inline small"><input type="checkbox" data-chg="fixFilter" ${f('fix') ? 'checked' : ''} style="min-height:0"> 只看被验证 AI 更正的</label>${f('vg') ? `<span class="tag">变式组 ${esc(f('vg'))} <a data-act="setq" data-key="vg" data-v="" style="cursor:pointer">✕</a></span>` : ''}<span class="small muted">${list.length} 道</span></div>
  <div class="card table-wrap"><table><tr><th>编号</th><th>题干</th><th>题型</th><th>知识点</th><th>难度</th><th>来源</th><th>变式</th><th>验证</th><th>状态</th></tr>
  ${list.map(x => `<tr class="click" data-act="qView" data-v="${x.id}"><td class="small">${x.id}</td><td>${esc(String(x.stem).replace(/\n/g, ' ').slice(0, 32))}</td><td>${qTypeTag(x)}</td><td class="small">${(x.kps || []).map(id => esc(kpById(id)?.name)).join(' + ') || '<span class="muted">示例题</span>'}</td><td>★${x.level || 1}</td><td>${srcTag(x)}${x.rule ? `<div class="small muted">${esc(x.rule)}</div>` : ''}</td>
  <td class="small"><a data-act="setq" data-key="vg" data-v="${x.vg}" style="cursor:pointer">${esc(x.vk)}</a><div class="muted">${QUESTIONS.filter(y => y.vg === x.vg).length} 道一组</div></td><td>${verifyTag(x) || '<span class="muted small">—</span>'}</td><td>${(S.qOff || {})[x.id] ? '<span class="tag gray">停用</span>' : x.status === '待审核' ? '<span class="tag warn">待审核</span>' : '<span class="tag ok">启用</span>'}${x.unreviewed ? '<div class="small muted">未人工审核</div>' : ''}</td></tr>`).join('') || '<tr><td colspan="9" class="muted">没有符合条件的题目</td></tr>'}</table></div>`;
}
CHG.fixFilter = el => setQ('fix', el.checked ? '1' : '');
A.qView = d => {
  const q = Q[d.v]; if (!q) return; const group = QUESTIONS.filter(x => x.vg === q.vg);
  modal(`<div class="row between"><h3 style="margin:0">${q.id} · ${QTYPE_NAME[q.type]} ★${q.level || 1}</h3>${q.status === '待审核' ? '<span class="tag warn">待审核</span>' : ''}</div>
  <div class="row" style="margin:8px 0">${(q.kps || []).map((id, i) => `<span class="tag ${i ? 'gray' : ''}" title="${i ? '' : '主知识点'}">${esc(kpById(id)?.name)}</span>`).join('')}${qTypeTag(q)}${srcTag(q)}${verifyTag(q)}</div>
  <div class="card inner">${qFull(q)}</div>${q.kps ? qMatrix(q) : ''}
  <table class="mini" style="margin-top:10px"><tr><th>来源</th><td>${esc(q.source)}${q.rule ? ` · 规则 <b>${esc(q.rule)}</b>` : ''}${q.ai ? ` · ${esc(q.ai)}` : ''}${q.file ? ` · 文件 ${esc(q.file)}` : ''}</td></tr>
  ${q.conv ? `<tr><th>2.x 转换</th><td>${esc(q.conv)}<div class="small muted">已做过的练习、考核快照不改，回看时仍按原题型显示</div></td></tr>` : ''}
  ${q.prog ? `<tr><th>程序复算</th><td>${esc(q.prog)}</td></tr>` : ''}
  <tr><th>变式组</th><td>${esc(q.vg)} · 本题：${esc(q.vk)}<div class="small">${group.map(x => `<a data-act="qView" data-v="${x.id}" style="cursor:pointer">${x.id}</a>（${esc(x.vk)}）`).join('、')}</div><div class="small muted">同一次练习或考核中，同一变式组只出一道；学生做错后“同类新题”优先从同组选</div></td></tr>
  ${q.verify ? `<tr><th>验证记录</th><td>${verifyTag(q)}${q.verify.reason ? `<div class="small">${esc(q.verify.reason)}</div>` : ''}${q.verify.before ? `<div class="small muted">更正前：${esc(q.verify.before)}</div><div class="small" style="color:var(--ok)">更正后的题已再过一次程序检查：通过</div>` : ''}</td></tr>` : ''}
  ${q.note ? `<tr><th>备注</th><td class="small">${esc(q.note)}</td></tr>` : ''}<tr><th>实测难度</th><td class="small muted">作答 ≥ 10 次后显示首次正确率</td></tr></table>
  <div class="row" style="justify-content:flex-end;margin-top:12px">${q.status === '待审核' || q.unreviewed ? `<button data-act="qOk" data-v="${q.id}">审核通过</button>` : ''}<button data-act="tPreviewQ" data-v="${q.id}">学生视角预览</button><button class="primary" data-act="close">关闭</button></div>`, true);
};
