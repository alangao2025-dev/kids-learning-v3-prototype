'use strict';
/* 学习系统 3.0 原型：教师端 · 题库、出题规则、AI 配置、判题复核 */

// ================= 题库 =================
TP.bank = (_, q) => {
  const f = k => q.get(k) || '';
  const g = f('g'); const [stage, subject] = g !== '' ? GROUPS[+g] : [];
  let list = S.qs.filter(x => {
    const k0 = kp(x.kps[0]);
    return (g === '' || (k0.stage === stage && k0.subject === subject)) && (!f('t') || x.type === f('t')) && (!f('src') || x.source === f('src'))
      && (!f('vg') || x.vg === f('vg')) && (!f('rule') || x.rule === f('rule')) && (!f('fix') || x.verify?.result === '更正') && (!f('kp') || x.kps.includes(f('kp')));
  });
  const rules = [...new Set(S.qs.map(x => x.rule).filter(Boolean))];
  const sel = (key, opts, all) => `<select data-chg="setq" data-key="${key}"><option value="">${all}</option>${opts.map(([v, n]) => `<option value="${esc(v)}" ${f(key) === String(v) ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
  const by = (arr, key) => arr.reduce((m, x) => (m[x[key]] = (m[x[key]] || 0) + 1, m), {});
  const bt = by(S.qs, 'type'), bs = by(S.qs, 'source');
  return `<div class="row between"><h1>题库</h1><div class="row"><button class="primary" data-act="genOpen">🤖 AI 生成习题</button><button data-act="importQOpen">⬆️ 导入习题</button><button data-act="fillUp">一键补足</button></div></div>
  <div class="grid">${['single', 'fill', 'applied'].map(t => `<div class="stat"><div class="label">${TYPE_NAME[t]}</div><div class="num">${bt[t] || 0}</div></div>`).join('')}
  ${['AI 生成', '老师导入', '2.x 保留'].map(s => `<div class="stat"><div class="label">来源：${s}</div><div class="num">${bs[s] || 0}</div></div>`).join('')}</div>
  <details class="card" style="margin-top:14px"><summary><b>2.2.1 题库转换说明</b>（线上 5380 道全部保留，原型只录入 12 道样例）</summary>
    <table class="mini" style="margin-top:8px"><tr><th>2.2 题型</th><th>数量</th><th>3.0 题型</th><th>转换方式</th><th>样例</th></tr>
    ${[['单选', 2670, 'single', '不变', 'q1'], ['判断', 445, 'single', '选项改为“A 对 / B 错”', 'q2'], ['比较', 44, 'single', '选项改为“A ＞ / B ＜ / C ＝”', 'q3'], ['两段式', 5, 'single', '合成一道单选，选项为“答案 + 理由”的组合', ''], ['填数', 1537, 'fill', '一空；数值判分规则不变', 'q4'], ['多空填空', 528, 'fill', '不变', 'q11'], ['排序', 7, 'fill', '“按顺序写出序号”，一空', ''], ['配平', 46, 'fill', '每个化学计量数一空，仍检查原子守恒', ''], ['分步解答', 98, 'applied', '原来的每一步转为评分要点', 'q6']].map(([a, n, t, how, ex]) => `<tr><td>${a}</td><td>${n}</td><td>${TYPE_NAME[t]}</td><td class="small">${how}</td><td>${ex ? `<button class="small link" data-act="qView" data-v="${ex}">${ex}</button>` : ''}</td></tr>`).join('')}</table>
    <p class="small muted">转换由程序完成，转换前备份；已做过的练习、考核快照不改，回看时按原题型显示。联网搜索参考题已去掉；程序生成器不再出新题，只用于计算题答案复算。</p></details>
  <div class="row filter-bar">${sel('g', GROUPS.map(([, , n], i) => [i, n]), '全部学科')}${sel('t', Object.entries(TYPE_NAME), '全部题型')}${sel('src', [['AI 生成', 'AI 生成'], ['老师导入', '老师导入'], ['2.x 保留', '2.x 保留']], '全部来源')}${sel('rule', rules.map(r => [r, r]), '全部规则版本')}
  <label class="inline"><input type="checkbox" data-chg="fixFilter" ${f('fix') ? 'checked' : ''}> 只看被验证 AI 更正的</label>
  ${f('vg') ? `<span class="tag">变式组 ${esc(f('vg'))} <a data-act="setq" data-key="vg" data-v="">✕</a></span>` : ''}${f('kp') ? `<span class="tag">知识点：${esc(kpName(f('kp')))} <a data-act="setq" data-key="kp" data-v="">✕</a></span>` : ''}
  <span class="muted small">${list.length} 道</span></div>
  <div class="card table-wrap"><table><tr><th>编号</th><th>题干</th><th>题型</th><th>知识点</th><th>难度</th><th>来源</th><th>变式</th><th>验证</th><th>状态</th></tr>
  ${list.map(x => `<tr class="click" data-act="qView" data-v="${x.id}"><td>${x.id}</td><td>${esc(short(x.stem, 34))}</td><td>${typeTag(x.type)}</td><td>${kpTags(x.kps)}</td><td>${lvTag(x.level)}</td><td>${srcTag(x)}${x.rule ? `<div class="small muted">${esc(x.rule)}</div>` : ''}</td>
  <td class="small"><a data-act="setq" data-key="vg" data-v="${x.vg}">${esc(x.vk)}</a><div class="muted">${S.qs.filter(y => y.vg === x.vg).length} 道一组</div></td><td>${verifyTag(x)}</td><td>${statusTag(x.status)}${x.unreviewed ? '<div class="small muted">未人工审核</div>' : ''}</td></tr>`).join('') || '<tr><td colspan="9" class="empty">没有符合条件的题目</td></tr>'}</table></div>`;
};
CHG.fixFilter = el => setQ('fix', el.checked ? '1' : '');
A.qView = d => {
  const q = q$(d.v); const group = S.qs.filter(x => x.vg === q.vg);
  modal(`<div class="row between"><h3 style="margin:0">${q.id} · ${TYPE_NAME[q.type]} ${lvTag(q.level)}</h3>${statusTag(q.status)}</div>
  <div class="row" style="margin:8px 0">${kpTags(q.kps)} ${srcTag(q)} ${verifyTag(q)}</div>
  <div class="card inner">${qFull(q)}</div>
  ${q.kps.length > 1 ? `<div class="small"><b>每个知识点在题中的落点：</b>${kpCoverage(q).map(c => `${esc(kpName(c.id))} → ${c.where || '<span class="tag bad">没有对应</span>'}`).join('；')}</div>` : ''}
  <table class="mini" style="margin-top:10px">
    <tr><th>来源</th><td>${esc(q.source)}${q.rule ? ` · 规则 <b>${esc(q.rule)}</b>` : ''}${q.ai ? ` · ${esc(q.ai)}` : ''}${q.file ? ` · 文件 ${esc(q.file)}` : ''}</td></tr>
    ${q.origType ? `<tr><th>2.2 原题型</th><td>${esc(q.origType)}</td></tr>` : ''}
    ${q.prog ? `<tr><th>程序复算</th><td>${esc(q.prog)}</td></tr>` : ''}
    <tr><th>变式组</th><td>${esc(q.vg)} · 本题：${esc(q.vk)}<div class="small">${group.map(x => `<a data-act="qView" data-v="${x.id}">${x.id}</a>（${esc(x.vk)}）`).join('、')}</div><div class="small muted">同一次练习或考核中，同一变式组只出一道</div></td></tr>
    ${q.verify ? `<tr><th>验证记录</th><td>${verifyTag(q)}${q.verify.reason ? `<div class="small">${esc(q.verify.reason)}</div>` : ''}${q.verify.before ? `<div class="small muted">更正前：${esc(q.verify.before)}</div><div class="small ok-text">更正后的题已再过一次程序检查：通过</div>` : ''}</td></tr>` : ''}
    ${q.note ? `<tr><th>备注</th><td class="small">${esc(q.note)}</td></tr>` : ''}
    <tr><th>实测难度</th><td class="small muted">作答 ≥ 10 次后显示首次正确率（原型无数据）</td></tr>
  </table>
  ${btnRow(`${q.status === '待审核' || q.unreviewed ? `<button data-act="qOk" data-v="${q.id}">审核通过</button>` : ''}${q.status === '启用' ? `<button data-act="qStop" data-v="${q.id}">停用</button>` : ''}<button class="primary" data-act="close">关闭</button>`)}`, true);
};
A.qOk = d => { const q = q$(d.v); q.status = '启用'; q.unreviewed = false; closeModal(); render(); toast('已审核', 'ok'); };
A.qStop = d => { q$(d.v).status = '停用'; closeModal(); render(); };
A.fillUp = () => modal(`<h3>一键补足</h3><p>按每个知识点“每级每题型目标 5 道”计算缺口：</p><table class="mini"><tr><th>学科</th><th>缺口</th><th>预计 Token</th></tr>${GROUPS.map(([st, su, n]) => { const gap = kpsOf(st, su).filter(k => k.status === '启用').reduce((s, k) => s + k.qtypes.reduce((t, ty) => t + [1, 2].reduce((u, L) => u + Math.max(0, 5 - qsOfKp(k.id).filter(q => q.type === ty && q.level === L).length), 0), 0), 0); return `<tr><td>${n}</td><td>${gap} 道</td><td>约 ${(gap * 1.6).toFixed(0)} 千</td></tr>`; }).join('')}</table>
  <p class="small muted">开发代理模式下，请求进入 AI 任务队列，由开发方分批完成（需求 Q6：先补足 ★1、★2 每题型 5 题）。</p>${btnRow('<button data-act="close">取消</button><button class="primary" data-act="fillUpOk">加入任务队列</button>')}`);
A.fillUpOk = () => { S.jobs.unshift({ id: newId('j'), role: 'gen', at: nowStr(), desc: '一键补足：三个学科 ★1、★2 每题型 5 道', state: '等待开发方' }); closeModal(); toast('已加入 AI 任务队列', 'ok'); };
A.importQOpen = () => modal(`<h3>⬆️ 导入习题</h3><p class="small muted">支持 Excel / CSV / JSON / Markdown 模板，可带图片。导入同样经过程序检查（格式、知识点落点、计算题复算、查重）。</p>
  <label class="inline"><input type="checkbox" id="impVerify" checked> 导入后送验证 AI 检查</label><div style="margin-top:10px"><input type="file" data-chg="qFile"></div><div id="qFileRes"></div>${btnRow('<button data-act="close">关闭</button>')}`, true);
CHG.qFile = el => {
  const f = el.files[0]; if (!f) return;
  document.getElementById('qFileRes').innerHTML = `<div class="card" style="margin-top:10px"><b>${esc(f.name)}</b> 检查结果（原型模拟）：<div class="ok-box">18 道通过检查</div>
  <div class="error-box">第 5 行（单选）：正确答案不在选项中<br>第 9 行（填空）：与 q4 重复（题干相似度 96%）<br>第 12 行（应用题）：缺少评分要点<br>第 14 行（应用题，2 个知识点）：「倍的认识与求几倍」没有对应的评分要点<br>第 17 行（填空）：程序复算 36 × 4 = 144，题中答案 134，不一致</div>
  ${checked('impVerify') ? '<p class="small muted">通过的 18 道将送验证 AI（开发代理），验证后入库。</p>' : ''}${btnRow('<button class="primary" data-act="close">导入 18 道</button>')}</div>`;
};

// ---- AI 生成习题 ----
A.genOpen = () => { UI.gen = { g: 0, ids: [], type: '', level: 1, n: 5, variants: true }; modal(genForm(), true); };
function genForm() {
  const G = UI.gen; const [stage, subject, gname] = GROUPS[G.g];
  const list = kpsOf(stage, subject).filter(k => k.status === '启用');
  const chk = combineCheck(G.ids);
  const types = G.ids.length ? ['single', 'fill', 'applied'].filter(t => G.ids.every(id => kp(id).qtypes.includes(t))) : [];
  if (!types.includes(G.type)) G.type = types[0] || '';
  const levels = G.ids.length > 1 ? [G.ids.length + 1] : [1, 2];
  if (!levels.includes(G.level)) G.level = levels[0];
  const rule = G.ids.length ? ruleFor(subject) : null;
  const ok = G.ids.length && chk.ok && G.type;
  return `<h3>🤖 AI 生成习题</h3>
  <div class="tabs">${GROUPS.map(([, , n], i) => `<a class="${i === G.g ? 'on' : ''}" data-act="genG" data-v="${i}">${n}</a>`).join('')}</div>
  <label>选择知识点（可多选，第一个为主知识点）</label>
  <div class="chk-list">${list.map(k => `<label><input type="checkbox" data-chg="genKp" value="${k.id}" ${G.ids.includes(k.id) ? 'checked' : ''}> ${G.ids.includes(k.id) ? `<b>${G.ids.indexOf(k.id) + 1}.</b> ` : ''}${esc(k.name)} <span class="small muted">${esc(k.unit)}</span></label>`).join('')}</div>
  ${G.ids.length ? `<div class="${chk.ok ? 'ok-box' : 'error-box'}">${chk.ok ? '✓ ' : '✗ '}${esc(chk.msg)}</div>` : '<p class="small muted">选两个知识点时，系统按“合并表”检查能否出在同一道题里。</p>'}
  ${G.ids.length && !types.length ? '<div class="error-box">所选知识点没有共同的适用题型</div>' : ''}
  <div class="form-grid">
    <div><label>题型</label><select data-chg="genSet" data-k="type">${types.map(t => `<option value="${t}" ${t === G.type ? 'selected' : ''}>${TYPE_NAME[t]}</option>`).join('')}</select></div>
    <div><label>难度</label><select data-chg="genSet" data-k="level">${levels.map(L => `<option value="${L}" ${L === G.level ? 'selected' : ''}>★${L} ${['', '基础', '变式', '2 个知识点', '3 个知识点'][L]}</option>`).join('')}</select></div>
    <div><label>数量</label><select data-chg="genSet" data-k="n">${[3, 5, 8].map(n => `<option ${n === G.n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    <div><label>&nbsp;</label><label class="inline"><input type="checkbox" data-chg="genVar" ${G.variants ? 'checked' : ''}> 生成为一个变式组（母题 + 变式）</label></div>
  </div>
  ${G.ids.length ? `<p class="small">出题规则：${rule ? `<b>${esc(rule.name)} v${rule.version}</b>（${esc(rule.scope)}）` : '<span class="tag bad">没有匹配的启用规则</span>'}　出题 AI：${esc(profName(S.roles.gen.main))}${S.roles.gen.backup ? `（备选 ${esc(profName(S.roles.gen.backup))}）` : ''}　验证 AI：${esc(profName(S.roles.gen.verify))}</p>` : ''}
  ${btnRow(`<button data-act="close">取消</button><button class="primary" data-act="genRun" ${ok ? '' : 'disabled'}>生成</button>`)}`;
}
A.genG = d => { UI.gen.g = Number(d.v); UI.gen.ids = []; setModal(genForm()); };
CHG.genKp = el => { const G = UI.gen; G.ids = el.checked ? [...G.ids, el.value] : G.ids.filter(x => x !== el.value); setModal(genForm()); };
CHG.genSet = el => { const v = el.dataset.k === 'type' ? el.value : Number(el.value); UI.gen[el.dataset.k] = v; setModal(genForm()); };
CHG.genVar = el => { UI.gen.variants = el.checked; };
A.genRun = async () => {
  const G = UI.gen; const k0 = kp(G.ids[0]); const rule = ruleFor(k0.subject);
  const out = simulateGen(G.ids, G.type, G.level, G.n, G.variants);
  const nFix = out.filter(x => x.verify.result === '更正').length, nDrop = out.filter(x => x.verify.result === '不能用').length;
  const hasV = !!S.roles.gen.verify;
  if (!hasV) out.forEach(x => { x.verify = null; x.status = '启用'; });
  const steps = [
    `出题 AI（${profName(S.roles.gen.main)}）按规则「${rule ? rule.name + ' v' + rule.version : '无'}」生成 ${G.n} 道${S.devMode ? ' —— 开发代理：请求进入 AI 任务队列，由开发方完成' : ''}`,
    `程序检查：输出格式 ✓，每个知识点都有对应的${G.type === 'applied' ? '评分要点' : G.type === 'fill' ? '空' : '错误选项诊断'} ✓${out[0].prog ? '，计算题答案程序复算 ✓' : ''}`,
    hasV ? `验证 AI（${profName(S.roles.gen.verify)}）：通过 ${out.length - nFix - nDrop}，更正 ${nFix}，不能用 ${nDrop}` : '未配置验证 AI，跳过验证',
    hasV && nFix ? `更正后的 ${nFix} 道再过一次程序检查：通过（每个结果只验证一轮，不再交回出题 AI）` : '更正后检查：无需',
    '查重：与题库中题干相似度均低于 85% ✓',
  ];
  for (let i = 0; i <= steps.length; i++) {
    setModal(`<h3>🤖 正在生成…</h3><div class="progress"><div style="width:${pct(i, steps.length)}%"></div></div><div class="loading-steps" style="margin-top:10px">${steps.map((s, j) => `<div>${j < i ? '✅' : j === i ? '⏳' : '⬜'} ${esc(s)}</div>`).join('')}</div>`);
    await sleep(500);
  }
  UI.genOut = out;
  setModal(`<h3>生成结果</h3><div class="loading-steps small">${steps.map(s => `<div>✅ ${esc(s)}</div>`).join('')}</div>
  ${S.roles.gen.main === S.roles.gen.verify && hasV ? '<div class="hint-box small">验证 AI 与主 AI 是同一个模型，验证效果会变差（可在 AI 配置中修改）。</div>' : ''}
  ${out.map(x => `<div class="card inner"><div class="row between"><b>${x.id} · ${esc(x.vk)}</b><span>${x.verify ? verifyTag(x) : '<span class="tag gray">未验证</span>'}</span></div>${qFull(x, { noExplain: true })}
  ${x.verify?.reason ? `<div class="${x.verify.result === '不能用' ? 'error-box' : 'hint-box'} small">${esc(x.verify.reason)}${x.verify.result === '不能用' ? '（丢弃，已记录）' : ''}</div>` : ''}</div>`).join('')}
  ${btnRow(`<button data-act="close">放弃</button><button class="primary" data-act="genSave">入库 ${out.filter(x => x.status !== '丢弃').length} 道</button>`)}`);
};
A.genSave = () => {
  const out = UI.genOut.filter(x => x.status !== '丢弃');
  for (const x of out) { x.unreviewed = true; S.qs.push(x); if (x.verify?.result === '更正') S.corrections.unshift({ role: 'gen', at: nowStr(), target: `${x.id}（${x.kps.map(kpName).join(' + ')}）`, before: x.verify.before, after: x.verify.reason, judge: '' }); }
  S.usage.gen[0] += 1; S.usage.gen[1] += 3200 * UI.genOut.length; S.usage.gen[3] += out.filter(x => x.verify?.result === '更正').length;
  S.jobs.unshift({ id: newId('j'), role: 'gen', at: nowStr(), desc: `出题：${UI.genOut[0].kps.map(kpName).join(' + ')} · ★${UI.genOut[0].level} · ${TYPE_NAME[UI.genOut[0].type]} × ${UI.genOut.length}（${UI.genOut[0].rule}）`, state: '已完成' });
  closeModal(); toast(`已入库 ${out.length} 道（未人工审核）`, 'ok'); go('#/t/bank?src=' + encodeURIComponent('AI 生成'));
};

// ================= 出题规则 =================
const RULE_SECTIONS = ['总体要求', '题型规范', '难度与变式', '多知识点合并', '干扰项与常见错误', '自检清单', '示例'];
const RULE_META = ['名称', '版本', '适用学科', '适用题型'];
function validateRule(text) {
  const errors = [], warns = []; const meta = {};
  const m = text.match(/^\s*---\n([\s\S]*?)\n---/);
  if (!m) errors.push('缺少开头的元信息（用 --- 包起来的一段）');
  else for (const line of m[1].split('\n')) { const x = line.match(/^([^:#]+):\s*([^#]*)/); if (x) meta[x[1].trim()] = x[2].trim(); }
  for (const k of RULE_META) if (m && !meta[k]) errors.push(`元信息缺少“${k}”`);
  if (meta['名称']?.startsWith('（')) errors.push('元信息“名称”还是模板中的占位文字');
  const heads = [...text.matchAll(/^##\s+(.+?)\s*$/gm)].map(x => x[1]);
  for (const s of RULE_SECTIONS) if (!heads.includes(s)) errors.push(`缺少必需章节“## ${s}”`);
  const ex = text.split(/^##\s+示例\s*$/m)[1]?.split(/^##\s/m)[0] || '';
  if (heads.includes('示例') && !(/题干[:：]/.test(ex) && /答案[:：]/.test(ex))) errors.push('“示例”中没有能解析的题目（需要“题干：”“答案：”）');
  if (heads.includes('示例') && /应用题/.test(ex) && !/评分要点[:：]/.test(ex)) errors.push('“示例”中的应用题缺少“评分要点：”');
  const kb = new Blob([text]).size / 1024;
  if (kb > 30) errors.push(`文件 ${kb.toFixed(1)} KB，超过 30 KB 上限（太长会占用大量 Token）`);
  if (/JSON|输出格式|返回格式/i.test(text)) warns.push('规则中提到了输出格式。系统调用时会在规则后附上固定的输出格式说明，冲突的内容以系统为准');
  if (!heads.includes('禁止事项')) warns.push('没有“禁止事项”章节（可选）');
  return { meta, errors, warns, kb };
}
const BAD_RULE = RULE_TEMPLATE.replace('（规则名称，如：小学数学出题规则）', '小学英语出题规则').replace('（姓名）', '李老师').replace('适用学科: 数学          # 可多个；“全部”表示通用', '适用学科: 英语').replace(/## 多知识点合并[\s\S]*?(?=## 干扰项)/, '').replace(/## 自检清单[\s\S]*?(?=## 示例)/, '') + '\n## 输出\n请按 JSON 输出。\n';
TP.rules = () => {
  const names = [...new Set(S.rules.map(r => r.name))];
  return `<div class="row between"><h1>出题规则</h1><div class="row"><button data-act="ruleTpl">⬇️ 下载规则模板</button><button class="primary" data-act="ruleImportOpen">⬆️ 导入规则</button></div></div>
  <div class="proto-note">出题 AI 按“规则文件”（Markdown）出题。规则可以在其他 AI 中反复试验、调整后导入。可同时启用多份，按“学科 + 年级 + 题型”匹配，越具体的优先（如“小学数学”优先于“通用”）。每道 AI 题记录使用的规则名称和版本。</div>
  ${names.map(n => { const vs = S.rules.filter(r => r.name === n).sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true })); return `<div class="card"><div class="row between"><h3 style="margin:0">${esc(n)}</h3><span class="small muted">${esc(vs[0].scope)} · ${esc(vs[0].types)}</span></div>
  <table style="margin-top:8px"><tr><th>版本</th><th>作者</th><th>导入时间</th><th>大小</th><th>状态</th><th title="按规则版本统计">生成 / 通过率 / 更正率 / 丢弃</th><th></th></tr>
  ${vs.map(r => `<tr><td><b>v${esc(r.version)}</b></td><td class="small">${esc(r.author)}</td><td class="small">${esc(r.at)}</td><td class="small">${r.size} KB</td><td>${r.status === '启用' ? '<span class="tag ok">启用</span>' : r.status === '停用' ? '<span class="tag gray">停用</span>' : '<span class="tag gray">历史版本</span>'}</td>
  <td class="small">${r.stats.gen} / ${pct(r.stats.pass, r.stats.gen)}% / ${pct(r.stats.fix, r.stats.gen)}% / ${r.stats.drop}</td>
  <td class="row" style="gap:4px"><button class="small" data-act="ruleView" data-v="${r.id}">查看</button><button class="small" data-act="ruleTrialOpen" data-v="${r.id}">试运行</button>${vs.length > 1 && r === vs[0] ? `<button class="small" data-act="ruleDiff" data-v="${n}">版本对比</button>` : ''}
  ${r.status === '启用' ? `<button class="small" data-act="ruleSt" data-v="${r.id}" data-s="停用">停用</button>` : `<button class="small" data-act="ruleSt" data-v="${r.id}" data-s="启用">${r.status === '历史版本' ? '回退到此版本' : '启用'}</button>`}</td></tr>`).join('')}</table></div>`; }).join('')}`;
};
A.ruleTpl = () => download('出题规则模板.md', RULE_TEMPLATE, 'text/markdown');
A.ruleSt = d => {
  const r = S.rules.find(x => x.id === d.v);
  if (d.s === '启用') { if (r.errors?.length) return toast('校验没有通过，不能启用', 'error'); S.rules.filter(x => x.name === r.name && x.status === '启用').forEach(x => { x.status = '历史版本'; }); }
  r.status = d.s; render(); toast(`${r.name} v${r.version} 已${d.s}`, 'ok');
};
const ruleText = r => r.text || RULE_TEMPLATE.replace('（规则名称，如：小学数学出题规则）', r.name).replace('版本: 1.0', `版本: ${r.version}`).replace('（姓名）', r.author);
A.ruleView = d => { const r = S.rules.find(x => x.id === d.v); modal(`<h3>${esc(r.name)} v${esc(r.version)}</h3><pre class="rule-pre">${esc(ruleText(r))}</pre>${btnRow('<button class="primary" data-act="close">关闭</button>')}`, true); };
A.ruleDiff = d => {
  const vs = S.rules.filter(r => r.name === d.v).sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
  const [a, b] = vs;
  modal(`<h3>版本对比 · ${esc(d.v)} v${b.version} → v${a.version}</h3>
  <table class="mini"><tr><th>章节</th><th>变化（原型示意）</th></tr>
  <tr><td>多知识点合并</td><td><span class="diff-add">+ 每个知识点至少落在一个评分要点、一个空或一个错误选项上</span><br><span class="diff-add">+ 后一步的题面不能泄露前一步的答案</span></td></tr>
  <tr><td>干扰项与常见错误</td><td><span class="diff-add">+ 周长和面积混淆；时间按十进制计算；拼接图形重合的边仍计入周长</span></td></tr>
  <tr><td>自检清单</td><td><span class="diff-del">− 答案正确</span><br><span class="diff-add">+ 答案唯一且正确，计算已验算</span></td></tr></table>
  <h3>效果对比</h3><table class="mini"><tr><th></th><th>v${b.version}</th><th>v${a.version}</th></tr>
  <tr><td>生成</td><td>${b.stats.gen}</td><td>${a.stats.gen}</td></tr><tr><td>验证通过率</td><td>${pct(b.stats.pass, b.stats.gen)}%</td><td>${pct(a.stats.pass, a.stats.gen)}%</td></tr>
  <tr><td>验证更正率</td><td>${pct(b.stats.fix, b.stats.gen)}%</td><td>${pct(a.stats.fix, a.stats.gen)}%</td></tr><tr><td>丢弃</td><td>${b.stats.drop}</td><td>${a.stats.drop}</td></tr>
  <tr><td>学生实测难度（首次正确率）</td><td>71%</td><td>78%</td></tr></table>${btnRow('<button class="primary" data-act="close">关闭</button>')}`, true);
};
A.ruleImportOpen = () => modal(`<h3>⬆️ 导入规则</h3><p class="small muted">上传 .md 文件或直接粘贴。每次导入生成一个新版本，旧版本保留。</p>
  <div class="row"><input type="file" accept=".md,.txt" data-chg="ruleFile"><button class="small" data-act="ruleFillTpl">填入模板</button><button class="small" data-act="ruleFillBad">填入一份缺章节的示例</button></div>
  <textarea id="ruleText" rows="14" style="margin-top:8px" placeholder="粘贴规则 Markdown"></textarea><div id="ruleRes"></div>
  ${btnRow('<button data-act="close">取消</button><button class="primary" data-act="ruleCheck">校验</button>')}`, true);
A.ruleFillTpl = () => { document.getElementById('ruleText').value = RULE_TEMPLATE.replace('（规则名称，如：小学数学出题规则）', '小学数学出题规则').replace('（姓名）', '张老师').replace('版本: 1.0', '版本: 1.3'); };
A.ruleFillBad = () => { document.getElementById('ruleText').value = BAD_RULE; };
CHG.ruleFile = el => { const f = el.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { document.getElementById('ruleText').value = r.result; }; r.readAsText(f); };
A.ruleCheck = () => {
  const text = val('ruleText'); if (!text.trim()) return toast('请先上传或粘贴规则', 'error');
  const v = validateRule(text); UI.ruleV = { text, ...v };
  document.getElementById('ruleRes').innerHTML = `<div class="card inner"><b>校验结果</b> · ${esc(v.meta['名称'] || '（无名称）')} v${esc(v.meta['版本'] || '?')} · ${v.kb.toFixed(1)} KB
  ${v.errors.length ? `<div class="error-box">✗ 不能启用，缺少或有误：<br>${v.errors.map(esc).join('<br>')}</div>` : '<div class="ok-box">✓ 元信息齐全，必需章节齐全，示例可以解析</div>'}
  ${v.warns.length ? `<div class="hint-box small">${v.warns.map(esc).join('<br>')}</div>` : ''}
  ${btnRow(v.errors.length ? '<button data-act="ruleSave" data-s="草稿">保存为草稿（不能启用）</button>' : '<button data-act="ruleSave" data-s="停用">保存（暂不启用）</button><button class="primary" data-act="ruleSave" data-s="启用">保存并启用</button>')}</div>`;
};
A.ruleSave = d => {
  const v = UI.ruleV; const name = v.meta['名称'] || '未命名规则';
  const r = { id: newId('r'), name, version: v.meta['版本'] || '1.0', scope: `${v.meta['适用学科'] || '?'} · ${v.meta['适用年级'] || '全部年级'}`, types: (v.meta['适用题型'] || '').replace(/,\s*/g, '、'), author: v.meta['作者'] || '老师', status: d.s === '草稿' ? '停用' : d.s, at: '2026-10-24', size: Number(v.kb.toFixed(1)), stats: { gen: 0, pass: 0, fix: 0, drop: 0 }, text: v.text, errors: v.errors };
  if (S.rules.some(x => x.name === name && x.version === r.version)) r.version += '.1';
  if (r.status === '启用') S.rules.filter(x => x.name === name && x.status === '启用').forEach(x => { x.status = '历史版本'; });
  S.rules.push(r); closeModal(); render(); toast(`已保存 ${name} v${r.version}`, 'ok');
};
A.ruleTrialOpen = d => {
  const r = S.rules.find(x => x.id === d.v); const subj = Object.entries(SUBJECTS).find(([, s]) => r.scope.startsWith(s.name))?.[0];
  const list = S.kps.filter(k => k.status === '启用' && (!subj || k.subject === subj));
  modal(`<h3>试运行 · ${esc(r.name)} v${esc(r.version)}</h3><p class="small muted">选一个知识点，用这份规则生成 3 道题。结果<b>只预览，不入库</b>，并显示程序检查和验证结果。</p>
  <div class="form-grid"><div><label>知识点</label><select id="trKp">${list.map(k => `<option value="${k.id}">${esc(k.name)}</option>`).join('')}</select></div>
  <div><label>题型</label><select id="trType">${Object.entries(TYPE_NAME).map(([t, n]) => `<option value="${t}">${n}</option>`).join('')}</select></div></div>
  <div id="trRes"></div>${btnRow(`<button data-act="close">关闭</button><button class="primary" data-act="ruleTrial" data-v="${r.id}">试运行</button>`)}`, true);
};
A.ruleTrial = async d => {
  const r = S.rules.find(x => x.id === d.v); const id = val('trKp'); let type = val('trType');
  if (!kp(id).qtypes.includes(type)) type = kp(id).qtypes[0];
  const box = document.getElementById('trRes'); box.innerHTML = '<p>⏳ 出题 AI 生成中…</p>'; await sleep(600);
  box.innerHTML = '<p>⏳ 程序检查、验证 AI 检查中…</p>'; await sleep(600);
  const save = S.nextId; const out = simulateGen([id], type, 1, 3, true); S.nextId = save;
  out.forEach((x, i) => { x.id = `试运行 ${i + 1}`; x.rule = `${r.name} v${r.version}`; });
  box.innerHTML = `<div class="hint-box small">试运行结果不入库。${type !== val('trType') ? `该知识点不适用所选题型，已改为${TYPE_NAME[type]}。` : ''}</div>${out.map(x => `<div class="card inner"><div class="row between"><b>${x.id} · ${esc(x.vk)}</b>${verifyTag(x)}</div>${qFull(x, { noExplain: true })}<div class="small muted">程序检查：格式 ✓ 知识点落点 ✓${x.prog ? ' 复算 ✓' : ''}</div>${x.verify?.reason ? `<div class="hint-box small">${esc(x.verify.reason)}</div>` : ''}</div>`).join('')}`;
};

// ================= AI 配置 =================
TP.ai = (_, q) => {
  const filt = q.get('cr') || '';
  const opt = (sel, allowEmpty, emptyText = '（不使用）') => `${allowEmpty ? `<option value="">${emptyText}</option>` : ''}${S.profiles.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}`;
  const U = S.usage;
  return `<h1>AI 配置</h1>
  <div class="card dev-card"><div class="row between"><div><b>🧪 开发代理模式</b><div class="small muted">开启时所有角色使用“开发代理（离线）”：系统照常生成请求并进入 AI 任务队列，由开发方离线完成后按同样格式写回。上线时关闭，把各角色改为真实 AI，不改代码。</div></div>
  <label class="switch"><input type="checkbox" data-chg="devMode" ${S.devMode ? 'checked' : ''}><span></span></label></div></div>
  <h2>五个角色</h2>
  <div class="role-grid">${ROLES.map(R => { const r = S.roles[R.id]; const same = R.verify && r.verify && r.verify === r.main; return `<div class="card role"><div class="row between"><b>${R.icon} ${R.name}</b>${r.main ? `<span class="tag ${r.main === 'dev' ? 'warn' : 'ok'}">${esc(profName(r.main))}</span>` : '<span class="tag gray">未配置</span>'}</div>
    <div class="small muted">${esc(R.desc)}</div>${R.note ? `<div class="small muted">${esc(R.note)}</div>` : ''}
    <label>主 AI</label><select data-chg="roleSet" data-r="${R.id}" data-k="main">${opt(r.main, R.id === 'kp' || R.id === 'eval' || R.id === 'ocr', R.id === 'kp' ? '（不填，用出题 AI）' : R.id === 'eval' ? '（不填，用规则算法）' : '（不填，老师手动录入）')}</select>
    <label>备选 AI（主 AI 失败时自动切换）</label><select data-chg="roleSet" data-r="${R.id}" data-k="backup">${opt(r.backup, true)}</select>
    ${R.verify ? `<label>验证 AI</label><select data-chg="roleSet" data-r="${R.id}" data-k="verify">${opt(r.verify, true)}</select><div class="small muted">${esc(R.verify)}</div>
    <label>验证比例</label><select data-chg="roleSet" data-r="${R.id}" data-k="ratio">${['全部', '错 / 部分对 / 低可信度', '低可信度和单选', '抽查 20%'].map(x => `<option ${x === r.ratio ? 'selected' : ''}>${x}</option>`).join('')}</select>
    ${same ? '<div class="hint-box small">验证 AI 与主 AI 是同一个模型，验证效果会变差。</div>' : ''}` : '<div class="small muted" style="margin-top:8px">验证：—（由老师审核 / 系统限制范围）</div>'}</div>`; }).join('')}</div>
  <p class="small muted">每个结果只验证一轮，不会把更正结果再交回主 AI；验证 AI 自己没把握时不更正，交老师。主 AI 超时、报错、额度用完或返回格式不对（重试 1 次）时切换备选 AI；连续失败 5 次的 AI 暂停 10 分钟。</p>
  <div class="row between"><h2>AI 配置列表</h2><button data-act="profEdit" data-v="">＋ 新增配置</button></div>
  <div class="card table-wrap"><table><tr><th>名称</th><th>服务商</th><th>模型</th><th>接口地址</th><th>密钥</th><th>能力</th><th></th></tr>
  ${S.profiles.map(p => `<tr><td><b>${esc(p.name)}</b></td><td>${esc(p.vendor)}</td><td class="small">${esc(p.model)}</td><td class="small">${esc(p.url)}</td><td>${p.id === 'dev' ? '—' : p.key ? '<span class="tag ok">已保存</span>' : '<span class="tag gray">未填写</span>'}</td><td>${p.web ? '<span class="tag">联网</span> ' : ''}${p.vision ? '<span class="tag">看图</span>' : ''}</td>
  <td class="row" style="gap:4px"><button class="small" data-act="profTest" data-v="${p.id}">测试连接</button>${p.id !== 'dev' ? `<button class="small" data-act="profEdit" data-v="${p.id}">编辑</button>` : ''}</td></tr>`).join('')}</table></div>
  <h2>用量（本月）</h2>
  <div class="card table-wrap"><table><tr><th>角色</th><th>调用次数</th><th>Token</th><th>失败</th><th>切换备选</th><th>验证更正</th></tr>
  ${ROLES.map(R => `<tr><td>${R.icon} ${R.name}</td><td>${U[R.id][0]}</td><td>${U[R.id][1].toLocaleString()}</td><td>${U[R.id][2]}</td><td>${R.id === 'ocr' ? 2 : 0}</td><td>${U[R.id][3]}</td></tr>`).join('')}</table>
  <p class="small muted">每日预算 200,000 Token、每月 3,000,000 Token。达到预算后停止出题和评估，判题和识别优先保留。</p></div>
  <h2>AI 任务队列</h2>
  <div class="card table-wrap"><table><tr><th>时间</th><th>角色</th><th>请求</th><th>状态</th><th></th></tr>
  ${S.jobs.map(j => `<tr><td class="small">${j.at}</td><td>${ROLES.find(r => r.id === j.role).name}</td><td class="small">${esc(j.desc)}</td><td><span class="tag ${j.state === '已完成' ? 'ok' : 'warn'}">${j.state}</span></td><td>${j.state !== '已完成' ? `<button class="small" data-act="jobDone" data-v="${j.id}">模拟开发方完成</button>` : ''} <button class="small link" data-act="jobView" data-v="${j.id}">请求内容</button></td></tr>`).join('')}</table></div>
  <div class="row between"><h2>AI 更正记录</h2><div class="tabs" style="margin:0">${[['', '全部'], ['gen', '出题'], ['judge', '判题'], ['ocr', '识别']].map(([v, n]) => `<a class="${v === filt ? 'on' : ''}" data-act="setq" data-key="cr" data-v="${v}">${n}</a>`).join('')}</div></div>
  <div class="card table-wrap"><table><tr><th>时间</th><th>角色</th><th>对象</th><th>更正前</th><th>更正后</th><th>老师判定</th></tr>
  ${S.corrections.map((c, i) => [c, i]).filter(([c]) => !filt || c.role === filt).map(([c, i]) => `<tr><td class="small">${c.at}</td><td>${ROLES.find(r => r.id === c.role).name}</td><td class="small">${esc(c.target)}</td><td class="small diff-del">${esc(c.before)}</td><td class="small diff-add">${esc(c.after)}</td>
  <td>${c.judge ? `<span class="tag ${c.judge === '更正正确' ? 'ok' : 'bad'}">${c.judge}</span>` : `<button class="small" data-act="corJudge" data-v="${i}" data-j="更正正确">更正正确</button><button class="small" data-act="corJudge" data-v="${i}" data-j="更正错误">更正错误</button>`}</td></tr>`).join('')}</table>
  <p class="small muted">老师的判定用于统计各 AI 的可靠程度：出题验证更正正确率 ${pct(S.corrections.filter(c => c.judge === '更正正确').length, S.corrections.filter(c => c.judge).length)}%（已判定 ${S.corrections.filter(c => c.judge).length} 条）。</p></div>`;
};
CHG.devMode = el => {
  S.devMode = el.checked;
  if (el.checked) { for (const r of Object.values(S.roles)) { if (r.main) r.main = 'dev'; if (r.verify) r.verify = 'dev'; } toast('已开启开发代理模式'); }
  else { Object.assign(S.roles.kp, { main: 'qw' }); Object.assign(S.roles.gen, { main: 'ds', verify: 'qw' }); Object.assign(S.roles.judge, { main: 'ds', verify: 'qw' }); Object.assign(S.roles.ocr, { main: 'mu', backup: 'db', verify: 'db' }); Object.assign(S.roles.eval, { main: 'ds' }); toast('已改为真实 AI，请先填写密钥并“测试连接”、用出题规则“试运行”各验证一次'); }
  render();
};
CHG.roleSet = el => { S.roles[el.dataset.r][el.dataset.k] = el.value; if (el.dataset.k === 'main' && el.value && el.value !== 'dev') S.devMode = false; render(); };
A.profTest = async d => {
  const p = prof(d.v); toast(`正在测试 ${p.name}…`); await sleep(700);
  if (p.id === 'dev') return toast('开发代理：请求会进入 AI 任务队列，由开发方完成', 'ok');
  if (!p.key) return toast(`${p.name}：连接失败，没有填写密钥`, 'error');
  toast(`${p.name}：连接成功（模拟），响应 0.8 秒`, 'ok');
};
A.profEdit = d => {
  const p = d.v ? prof(d.v) : { id: '', name: '', vendor: '', model: '', url: '', key: false, vision: false, web: false };
  modal(`<h3>${d.v ? '编辑' : '新增'} AI 配置</h3><div class="form-grid">
  <div><label>名称</label><input id="pfName" value="${esc(p.name)}"></div><div><label>服务商</label><input id="pfVendor" value="${esc(p.vendor)}"></div>
  <div><label>模型名称</label><input id="pfModel" value="${esc(p.model)}"></div><div><label>接口地址（兼容 OpenAI 格式）</label><input id="pfUrl" value="${esc(p.url === '—' ? '' : p.url)}"></div>
  <div><label>密钥</label><input id="pfKey" type="password" placeholder="${p.key ? '已保存，留空不修改' : '未填写'}" autocomplete="off"></div>
  <div><label>温度 / 单次超时</label><div class="row"><input value="0.3" style="width:70px"><input value="30 秒" style="width:90px"></div></div>
  <div><label class="inline"><input type="checkbox" id="pfWeb" ${p.web ? 'checked' : ''}> 支持联网（知识点整理用）</label></div><div><label class="inline"><input type="checkbox" id="pfVis" ${p.vision ? 'checked' : ''}> 支持看图（识别用）</label></div></div>
  <p class="small muted">密钥保存在 Cloudflare Secret / 加密字段中，保存后不回显，不写入日志和备份导出。</p>
  ${btnRow(`${p.key ? `<button class="danger" data-act="profKeyClear" data-v="${p.id}">清除密钥</button>` : ''}<button data-act="close">取消</button><button class="primary" data-act="profSave" data-v="${p.id}">保存</button>`)}`, true);
};
A.profSave = d => {
  let p = prof(d.v); if (!p) { p = { id: newId('ai') }; S.profiles.push(p); }
  Object.assign(p, { name: val('pfName') || '未命名', vendor: val('pfVendor'), model: val('pfModel'), url: val('pfUrl') || '—', web: checked('pfWeb'), vision: checked('pfVis') });
  if (val('pfKey')) p.key = true; closeModal(); render(); toast('已保存', 'ok');
};
A.profKeyClear = d => { prof(d.v).key = false; closeModal(); render(); toast('密钥已清除'); };
A.jobDone = d => { S.jobs.find(j => j.id === d.v).state = '已完成'; render(); toast('开发方已写回结果（模拟）', 'ok'); };
A.jobView = d => {
  const j = S.jobs.find(x => x.id === d.v);
  const req = j.role === 'eval' ? { role: 'eval', student: 'S-0002', stage: 'J3', kps: [{ id: 'p1', recent: '1011010110', c: [3, 0] }, { id: 'p3', recent: '0100101001', c: [2, 0] }], limits: { ratio: [5, 40], levelStep: 1, perDayMax: 30 } }
    : { role: j.role, rule: '小学数学出题规则 v1.2', kps: [{ id: 'm9', name: '认识几分之一和几分之几' }], type: 'fill', level: 2, n: 5, output_format: '（系统固定的 JSON 字段说明）' };
  modal(`<h3>请求内容</h3><p class="small muted">发给 AI 的内容不含学生姓名、账号和照片中的姓名区域；学生用内部编号代替。</p><pre>${esc(JSON.stringify(req, null, 2))}</pre>${btnRow('<button class="primary" data-act="close">关闭</button>')}`, true);
};
A.corJudge = d => { S.corrections[Number(d.v)].judge = d.j; render(); };

// ================= 判题复核 =================
TP.review = (_, q) => {
  const tab = q.get('tab') || 'todo';
  const list = S.review.filter(r => tab === 'todo' ? r.status !== '已处理' : r.status === '已处理');
  const judgeFix = S.corrections.filter(c => c.role === 'judge');
  return `<h1>判题复核</h1>
  <div class="tabs">${[['todo', `待处理（${pendingReview()}）`], ['done', '已处理'], ['fix', `判题 AI 更正抽查（${judgeFix.length}）`]].map(([v, n]) => `<a class="${v === tab ? 'on' : ''}" data-act="setq" data-key="tab" data-v="${v}">${n}</a>`).join('')}</div>
  ${tab === 'fix' ? `<div class="card table-wrap"><table><tr><th>时间</th><th>对象</th><th>判题 AI 原结论</th><th>验证 AI 更正为</th><th>老师判定</th></tr>${judgeFix.map(c => { const i = S.corrections.indexOf(c); return `<tr><td class="small">${c.at}</td><td>${esc(c.target)}</td><td class="small diff-del">${esc(c.before)}</td><td class="small diff-add">${esc(c.after)}</td><td>${c.judge ? `<span class="tag">${c.judge}</span>` : `<button class="small" data-act="corJudge" data-v="${i}" data-j="更正正确">更正正确</button><button class="small" data-act="corJudge" data-v="${i}" data-j="更正错误">更正错误</button>`}</td></tr>`; }).join('')}</table></div>`
    : list.map(reviewCard).join('') || '<div class="empty">没有需要处理的内容 🎉</div>'}`;
};
function reviewCard(r) {
  const q = q$(r.qid); const s = stu(r.sid);
  let body = `<div class="card inner small">${esc(q.stem)}</div>`;
  if (q.type === 'applied') {
    const g = r.grade;
    body += `<div class="form-grid"><div><label>学生答案</label><pre>${esc(r.answer)}</pre></div><div><label>评分要点</label><table class="mini">${q.rubric.map((x, i) => `<tr><td>${i + 1}. ${esc(x.step)}</td><td><code>${esc(x.key)}</code></td><td>${x.score} 分</td>${g ? `<td>${g.steps[i].ok ? (g.steps[i].carry ? '✅ 带错判对' : '✅') : '❌'}</td>` : ''}</tr>`).join('')}</table></div></div>
    ${r.ai ? `<div class="small"><b>判题 AI：</b>${esc(r.ai.verdict)}（${r.ai.score}/${g?.full ?? q.rubric.reduce((a, x) => a + x.score, 0)}，可信度 ${r.ai.conf}）${r.ai.where ? '　错在哪里：' + esc(r.ai.where) : ''}</div>` : ''}
    ${r.verify ? `<div class="small"><b>验证 AI：</b>${esc(r.verify)}</div>` : ''}`;
  } else {
    const ans = r.ans || [];
    body += `<table class="mini"><tr><th>空</th><th>学生写的</th><th>可接受答案</th><th>系统判</th></tr>${q.blanks.map((acc, i) => { const ok = gradeObjective({ ...q, blanks: [acc] }, [ans[i]]).ok; return `<tr><td>${'①②③'[i]}</td><td>${esc(ans[i])}</td><td>${acc.map(esc).join(' / ')}</td><td>${ok ? '✅' : '❌'}</td></tr>`; }).join('')}</table>`;
  }
  body += `<div class="hint-box small">${esc(r.reason)}</div>`;
  const done = r.status === '已处理';
  const actions = done ? `<div class="ok-box small">已处理：${esc(r.result)}</div>`
    : q.type === 'applied' ? `<div class="row"><button data-act="rvKeep" data-v="${r.id}">确认 AI 结论</button><select id="rvV-${r.id}"><option>对</option><option>部分对</option><option>错</option></select><input id="rvS-${r.id}" type="number" min="0" max="${q.rubric.reduce((a, x) => a + x.score, 0)}" value="${r.ai?.score ?? 0}" style="width:70px"> 分<button class="primary" data-act="rvChange" data-v="${r.id}">改判</button></div>`
      : `<div class="row"><button data-act="rvKeep" data-v="${r.id}">维持原判</button><label class="inline"><input type="checkbox" id="rvAdd-${r.id}" checked> 把学生写法加入可接受答案（之后所有学生都按新答案判）</label><button class="primary" data-act="rvAccept" data-v="${r.id}">改判为对</button></div>`;
  return `<div class="card"><div class="row between"><div><b>${s.avatar} ${esc(s.nick)}</b> · ${esc(r.kind)} · <a data-act="qView" data-v="${q.id}">${q.id}</a> ${typeTag(q.type)}</div><span class="small muted">${r.at}</span></div>${body}${actions}</div>`;
}
A.rvKeep = d => { const r = S.review.find(x => x.id === d.v); r.status = '已处理'; r.result = r.ai ? `确认 AI 结论（${r.ai.verdict}，${r.ai.score} 分）` : '维持原判'; settleMastery(r, null); render(); toast('已处理', 'ok'); };
A.rvChange = d => {
  const r = S.review.find(x => x.id === d.v); const v = val('rvV-' + d.v); const sc = Number(val('rvS-' + d.v));
  r.status = '已处理'; r.result = `老师改判为“${v}”，${sc} 分`;
  if (r.ai && (r.ai.verdict !== v || r.ai.score !== sc)) S.corrections.unshift({ role: 'judge', at: nowStr(), target: `${stu(r.sid).nick} · ${r.qid}`, before: `${r.ai.verdict}（${r.ai.score} 分）`, after: `老师改判：${v}（${sc} 分）`, judge: '老师复核' });
  settleMastery(r, v === '对'); render(); toast('已改判，学生端可看到结果', 'ok');
};
A.rvAccept = d => {
  const r = S.review.find(x => x.id === d.v); const q = q$(r.qid); const ans = r.ans || []; const added = [];
  if (checked('rvAdd-' + d.v)) q.blanks.forEach((acc, i) => { if (ans[i] && !gradeObjective({ ...q, blanks: [acc] }, [ans[i]]).ok) { acc.push(ans[i]); added.push(`第 ${'①②③'[i]} 空加入“${ans[i]}”`); } });
  r.status = '已处理'; r.result = `改判为对${added.length ? '；' + added.join('，') : ''}`; settleMastery(r, true); render(); toast(r.result, 'ok');
};
// 待老师确认的结果确认后才计入掌握度（§6.3 第 4 条）
function settleMastery(r, ok) {
  if (!r.pendingMastery) return; const q = q$(r.qid);
  const final = ok ?? (r.ai?.verdict === '对');
  for (const id of q.kps) recordAnswer(r.sid, id, q.level, final || !(r.grade?.kpsWrong || q.kps).includes(id));
  r.pendingMastery = false;
}
