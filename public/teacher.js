'use strict';
/* 学习系统 3.0 原型：教师端 */

const TNAV = [['home', '🏠', '概览'], ['kp', '🧩', '知识点'], ['bank', '📝', '题库'], ['rules', '📜', '出题规则'], ['ai', '🤖', 'AI 配置'], ['review', '✅', '判题复核'], ['students', '👧', '学生'], ['paper', '📄', '纸质试卷']];
const TP = {};
const pendingReview = () => S.review.filter(r => r.status !== '已处理').length;
function teacherPage(page, arg, q) {
  const active = { kpd: 'kp', stu: 'students' }[page] || page;
  const nav = `<div class="topnav"><span class="brand">📚 学习系统 3.0 · 教师端</span>
  <nav>${TNAV.map(([p, ic, t]) => `<a class="${active === p ? 'active' : ''}" href="#/t/${p}">${ic} ${t}${p === 'review' && pendingReview() ? ` <span class="tag bad">${pendingReview()}</span>` : ''}</a>`).join('')}</nav>
  <div class="me"><span class="muted small hide-sm">teacher</span></div></div>`;
  const dev = S.devMode ? `<div class="dev-bar">🧪 开发代理模式：所有 AI 的工作由开发方离线完成，可能有延迟（原型中为即时模拟）。<a href="#/t/ai">AI 配置</a></div>` : '';
  return nav + dev + `<main class="wide-main">${(TP[page] || TP.home)(arg, q)}</main>`;
}
const groupOf = q => Number(q.get('g') || 0);
const groupTabs = (g, extra = '') => `<div class="tabs">${GROUPS.map(([, , n], i) => `<a class="${i === g ? 'on' : ''}" data-act="setq" data-key="g" data-v="${i}">${n}</a>`).join('')}${extra}</div>`;

// ================= 概览 =================
TP.home = () => {
  const pendRel = S.prereqs.filter(r => r.state === 'pending').length + S.combos.filter(c => c.state === 'pending').length;
  const pendQ = S.qs.filter(q => q.status === '待审核').length; const pendK = S.kps.filter(k => k.status === '待审核').length;
  const jobs = S.jobs.filter(j => j.state !== '已完成').length;
  const stat = (label, n, href, hint) => `<a class="stat" href="${href}" style="color:inherit"><div class="label">${label}</div><div class="num">${n}</div><div class="small muted">${hint}</div></a>`;
  return `<h1>概览</h1>
  <div class="grid">
    ${stat('知识点', S.kps.length, '#/t/kp', `${pendK} 个待审核`)}
    ${stat('待确认的关系', pendRel, '#/t/kp', 'AI 建议的先学后学 / 可合并')}
    ${stat('题库', S.qs.length, '#/t/bank', `${pendQ} 道待审核`)}
    ${stat('判题复核', pendingReview(), '#/t/review', '待确认应用题、学生申诉')}
    ${stat('AI 任务队列', jobs, '#/t/ai', '等待开发方完成')}
    ${stat('启用的出题规则', S.rules.filter(r => r.status === '启用').length, '#/t/rules', '按学科 + 年级 + 题型匹配')}
  </div>
  <h2>3.0 的主要变化</h2>
  <div class="card"><ul class="paths">
    <li>知识点可<b>联网获取</b>或老师上传；知识点之间有<b>先学后学</b>和<b>能否合并出题</b>两种关系（知识点页的“关系图”“合并表”）</li>
    <li>题型只有<b>单选、填空、应用题</b>；2.2.1 的 5380 道题按规则转换后全部保留；去掉联网搜索习题，新题只来自 <b>AI 生成</b>和<b>老师导入</b></li>
    <li>出题 AI 按可导入的<b>规则文件</b>（Markdown）出题；规则有版本、校验和试运行</li>
    <li>应用题由<b>判题 AI</b> 判分并指出错在哪一步，学生可申诉</li>
    <li><b>五个 AI 角色</b>分别配置主 / 备选 / 验证 AI；开发测试期用“开发代理”</li>
    <li><b>学习评估</b>按知识点调整出题比例和难度，系统限制范围，老师可锁定</li>
    <li>纸质试卷单选题在括号里<b>写字母</b></li>
  </ul></div>`;
};

// ================= 知识点 =================
TP.kp = (_, q) => {
  const g = groupOf(q); const [stage, subject] = GROUPS[g]; const list = kpsOf(stage, subject);
  const view = q.get('v') || 'list';
  const pend = S.prereqs.filter(r => r.state === 'pending' && list.some(k => k.id === r.b)).length + S.combos.filter(c => c.state === 'pending' && list.some(k => k.id === c.a)).length;
  const live = list.filter(k => k.status !== '停用');
  const body = view === 'graph' ? kpGraph(live) : view === 'combo' ? kpMatrix(live) : kpList(list);
  return `<div class="row between"><h1>知识点</h1><div class="row">
    <button class="primary" data-act="fetchOpen" data-v="${g}">🌐 联网获取教材知识点</button><button data-act="uploadKpOpen">⬆️ 上传知识点</button><button data-act="aiRelOpen" data-v="${g}">🤖 AI 建议关系</button></div></div>
  ${groupTabs(g)}
  <div class="tabs">${[['list', '📋 列表'], ['graph', '🔀 关系图'], ['combo', '🧮 合并表']].map(([v, n]) => `<a class="${v === view ? 'on' : ''}" data-act="setq" data-key="v" data-v="${v}">${n}</a>`).join('')}
  ${pend ? `<span class="tag warn" style="align-self:center">${pend} 条关系待确认</span>` : ''}</div>
  ${body}`;
};
function kpList(list) {
  const units = [...new Set(list.map(k => k.unit))];
  return `<div class="card table-wrap"><table><tr><th>知识点</th><th>类型</th><th>适用题型</th><th title="先学后学">前置 / 后学</th><th>可合并</th><th>题目</th><th>状态</th></tr>
  ${units.map(u => `<tr><td colspan="7" class="unit-row">${esc(u)}</td></tr>` + list.filter(k => k.unit === u).map(k => {
    const pre = prereqsOf(k.id), nx = nextsOf(k.id), cb = combosOf(k.id).filter(c => c.v === 'yes');
    const pd = [...pre, ...nx].some(r => r.state === 'pending') || combosOf(k.id).some(c => c.state === 'pending');
    return `<tr class="click" data-act="go" data-v="#/t/kpd/${k.id}"><td><b>${esc(k.name)}</b><div class="small muted">${esc(k.source)}</div></td><td class="small">${KP_TYPE_NAME[k.type]}</td><td>${k.qtypes.map(t => `<span class="tag gray">${TYPE_NAME[t].slice(0, -1)}</span>`).join(' ')}</td>
    <td>${pre.length} / ${nx.length}${pd ? ' <span class="tag warn">待确认</span>' : ''}</td><td>${cb.length}</td><td>${qsOfKp(k.id).length}</td><td>${statusTag(k.status)}</td></tr>`;
  }).join('')).join('')}</table></div>`;
}
function kpGraph(list) {
  const lv = layers(list); const cols = {};
  list.forEach(k => (cols[lv[k.id]] ||= []).push(k));
  const W = 184, H = 66, GX = 64, GY = 18, pos = {};
  let rows = 0; const nc = Math.max(0, ...Object.keys(cols).map(Number)) + 1;
  for (const [c, ks] of Object.entries(cols)) { ks.forEach((k, i) => { pos[k.id] = { x: c * (W + GX), y: i * (H + GY) }; }); rows = Math.max(rows, ks.length); }
  const width = nc * (W + GX) - GX, height = rows * (H + GY) - GY;
  const ids = new Set(list.map(k => k.id));
  const edges = S.prereqs.filter(r => ids.has(r.a) && ids.has(r.b));
  const hl = ids.has(UI.hl) ? UI.hl : null;
  const near = hl ? new Set([hl, ...edges.filter(r => r.a === hl || r.b === hl).flatMap(r => [r.a, r.b])]) : null;
  const path = r => { const a = pos[r.a], b = pos[r.b]; const x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x - 6, y2 = b.y + H / 2; const m = (x1 + x2) / 2; return `M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`; };
  return `<div class="card">
  <div class="small muted" style="margin-bottom:10px">按先学后学从左到右排列。<b>实线</b> = 必须，<b>虚线</b> = 建议，<span style="color:#e58a00">橙色</span> = AI 建议、待确认。点击知识点高亮它的前后关系，再点一次进入详情。</div>
  <div class="graph-wrap"><div class="graph" style="width:${width}px;height:${height}px">
  <svg width="${width}" height="${height}"><defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#8a96b3"/></marker><marker id="arrw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#e58a00"/></marker></defs>
  ${edges.map(r => `<path d="${path(r)}" class="edge ${r.kind} ${r.state} ${near && !(near.has(r.a) && near.has(r.b) && (r.a === hl || r.b === hl)) ? 'dim' : ''}" marker-end="url(#${r.state === 'pending' ? 'arrw' : 'arr'})"/>`).join('')}</svg>
  ${list.map(k => `<div class="gnode ${k.id === hl ? 'hl' : ''} ${near && !near.has(k.id) ? 'dim' : ''}" style="left:${pos[k.id].x}px;top:${pos[k.id].y}px;width:${W}px;height:${H}px" data-act="gnode" data-v="${k.id}"><b>${esc(k.name)}</b><span class="small muted gunit">${esc(k.unit)}</span></div>`).join('')}
  </div></div></div>`;
}
A.gnode = d => { if (UI.hl === d.v) go(`#/t/kpd/${d.v}`); else { UI.hl = d.v; render(); } };
function kpMatrix(list) {
  return `<div class="card"><div class="small muted" style="margin-bottom:10px">两两组合：<span class="tag ok">✓</span> 可合并（悬停看“怎么合并”）　<span class="tag bad">✗</span> 不可合并　空白 = 未设置（等同不可合并）　<span class="tag warn">?</span> AI 建议待确认。格子里的数字是已有的合并题数量。点击格子切换。</div>
  <div class="table-wrap"><table class="cmx"><tr><th></th>${list.map((k, j) => `<th class="v" title="${esc(k.name)}">${j + 1}</th>`).join('')}</tr>
  ${list.map((a, i) => `<tr><th class="h">${i + 1}. ${esc(short(a.name, 14))}</th>${list.map((b, j) => {
    if (i === j) return '<td class="self"></td>';
    const c = comboOf(a.id, b.id); const n = qBoth(a.id, b.id);
    const cls = !c ? '' : c.state === 'pending' ? 'pend' : c.v === 'yes' ? 'yes' : 'no';
    const sym = !c ? '' : c.state === 'pending' ? '?' : c.v === 'yes' ? '✓' : '✗';
    return `<td class="cell ${cls}" data-act="cmxCell" data-a="${a.id}" data-b="${b.id}" title="${esc(a.name)} × ${esc(b.name)}${c ? '：' + esc(c.how) : ''}">${sym}${n ? `<sub>${n}</sub>` : ''}</td>`;
  }).join('')}</tr>`).join('')}</table></div></div>`;
}
A.cmxCell = d => {
  const { a, b } = d; const c = comboOf(a, b); const n = qBoth(a, b);
  const title = `<h3>${esc(kpName(a))} × ${esc(kpName(b))}</h3>`;
  if (c?.state === 'pending') return modal(`${title}<div class="hint-box">AI 建议<b>${c.v === 'yes' ? '可合并' : '不可合并'}</b>：${esc(c.how)}</div><label>怎么合并（可修改）</label><input id="howIn" value="${esc(c.how)}" style="width:100%">${btnRow(`<button data-act="comboDel" data-a="${a}" data-b="${b}">删除建议</button><button data-act="comboSet" data-a="${a}" data-b="${b}" data-v="no">改为不可合并</button><button class="primary" data-act="comboSet" data-a="${a}" data-b="${b}" data-v="yes">确认可合并</button>`)}`);
  if (!c) return modal(`${title}<p>设为<b>可合并</b>时必须写“怎么合并”，出题 AI 按这句话把两个知识点串成一道题。</p><label>怎么合并</label><input id="howIn" placeholder="如：先统一长度单位，再求周长" style="width:100%">${btnRow(`<button data-act="close">取消</button><button class="primary" data-act="comboSet" data-a="${a}" data-b="${b}" data-v="yes">设为可合并</button>`)}`);
  if (c.v === 'yes') {
    if (!n) { c.v = 'no'; c.how = '老师设为不可合并'; toast('已改为不可合并'); return render(); }
    return modal(`${title}<p>改为<b>不可合并</b>后，这两个知识点不会再出现在同一道新题中。</p><div class="hint-box">已有 <b>${n}</b> 道题同时包含这两个知识点：${S.qs.filter(q => q.kps.includes(a) && q.kps.includes(b)).map(q => `${q.id}「${esc(short(q.stem, 20))}」`).join('、')}</div>${btnRow(`<button data-act="close">取消</button><button data-act="comboNo" data-a="${a}" data-b="${b}" data-v="keep">改为不可合并，保留这些题</button><button class="primary" data-act="comboNo" data-a="${a}" data-b="${b}" data-v="stop">改为不可合并，停用这些题</button>`)}`, true);
  }
  S.combos = S.combos.filter(x => x !== c); toast('已改为“未设置”'); render();
};
A.comboSet = d => {
  const how = val('howIn').trim(); let c = comboOf(d.a, d.b);
  if (d.v === 'yes' && !how) return toast('请填写“怎么合并”', 'error');
  if (!c) { c = { a: d.a, b: d.b }; S.combos.push(c); }
  Object.assign(c, { v: d.v, how: d.v === 'yes' ? how : how || '老师设为不可合并', state: 'ok' });
  closeModal(); toast('已保存', 'ok'); render();
};
A.comboDel = d => { S.combos = S.combos.filter(x => x !== comboOf(d.a, d.b)); closeModal(); render(); };
A.comboNo = d => {
  const c = comboOf(d.a, d.b); c.v = 'no'; c.how = '老师设为不可合并';
  if (d.v === 'stop') S.qs.filter(q => q.kps.includes(d.a) && q.kps.includes(d.b)).forEach(q => { q.status = '停用'; });
  closeModal(); toast(d.v === 'stop' ? '已改为不可合并，相关题目已停用' : '已改为不可合并', 'ok'); render();
};

// ---- 知识点详情 ----
TP.kpd = id => {
  const k = kp(id); if (!k) return '<div class="empty">知识点不存在</div>';
  const g = GROUPS.findIndex(([st, su]) => st === k.stage && su === k.subject);
  const same = S.kps.filter(x => x.subject === k.subject && x.id !== k.id);
  const relRow = (r, other, dir) => `<tr><td>${dir === 'pre' ? '' : '→ '}<a href="#/t/kpd/${other}">${esc(kpName(other))}</a>${dir === 'pre' ? ' →' : ''}${kp(other).stage !== k.stage ? ` <span class="tag gray">${STAGE_NAME[kp(other).stage]}</span>` : ''}</td>
    <td><span class="tag ${r.kind === 'must' ? 'bad' : 'gray'}">${r.kind === 'must' ? '必须' : '建议'}</span></td><td class="small muted">${esc(r.src)}</td>
    <td>${r.state === 'pending' ? `<span class="tag warn">待确认</span> <button class="small" data-act="preOk" data-a="${r.a}" data-b="${r.b}">确认</button>` : '<span class="tag ok">已确认</span>'} <button class="small link" data-act="preDel" data-a="${r.a}" data-b="${r.b}">删除</button></td></tr>`;
  const qs = qsOfKp(id);
  const cnt = (t, L) => qs.filter(q => q.type === t && q.level === L).length;
  return `<div class="row"><a href="#/t/kp?g=${g}">← 知识点</a></div>
  <div class="row between"><h1>${esc(k.name)}</h1><div class="row">${statusTag(k.status)}${k.status === '待审核' ? `<button class="primary small" data-act="kpOk" data-v="${id}">审核通过，启用</button>` : ''}${k.status === '启用' ? `<button class="small danger" data-act="kpStopOpen" data-v="${id}">停用</button>` : ''}</div></div>
  <div class="card"><div class="form-grid">
    <div><label>学科 / 年级</label>${SUBJECTS[k.subject].name} · ${STAGE_NAME[k.stage]}</div><div><label>单元</label>${esc(k.unit)}</div>
    <div><label>类型</label>${KP_TYPE_NAME[k.type]}</div><div><label>适用题型（出题 AI 按此出题）</label>${k.qtypes.map(t => TYPE_NAME[t]).join('、')}</div>
    <div style="grid-column:1/-1"><label>来源</label><span class="small">${esc(k.source)}</span></div></div></div>
  <div class="card"><h3 style="margin-top:0">先学后学</h3>
    <p class="small muted">“必须”前置没有基本掌握时，后学知识点不进入推荐，学生端显示“建议先学”；“建议”只影响推荐顺序。关系不能形成环。</p>
    <table><tr><th>要先学（前置）</th><th>强度</th><th>来源</th><th></th></tr>${prereqsOf(id).map(r => relRow(r, r.a, 'pre')).join('') || '<tr><td colspan="4" class="muted">没有前置知识点</td></tr>'}</table>
    <div class="row" style="margin-top:10px"><select id="preA">${same.map(x => `<option value="${x.id}">${esc(x.name)}（${STAGE_NAME[x.stage]}）</option>`).join('')}</select>
    <select id="preKind"><option value="must">必须</option><option value="suggest">建议</option></select><button data-act="preAdd" data-v="${id}">＋ 添加前置知识点</button></div>
    <div id="preErr"></div>
    <table style="margin-top:14px"><tr><th>学完后可以学（后学）</th><th>强度</th><th>来源</th><th></th></tr>${nextsOf(id).map(r => relRow(r, r.b, 'next')).join('') || '<tr><td colspan="4" class="muted">没有后学知识点</td></tr>'}</table></div>
  <div class="card"><h3 style="margin-top:0">能否合并出题</h3>
    <table><tr><th>知识点</th><th>状态</th><th>怎么合并 / 原因</th><th>已有合并题</th></tr>${combosOf(id).map(c => { const o = other(c, id); return `<tr><td><a href="#/t/kpd/${o}">${esc(kpName(o))}</a></td><td>${c.state === 'pending' ? '<span class="tag warn">AI 建议 · 待确认</span>' : c.v === 'yes' ? '<span class="tag ok">✓ 可合并</span>' : '<span class="tag bad">✗ 不可合并</span>'}</td><td class="small">${esc(c.how)}</td><td>${qBoth(id, o)} <button class="small link" data-act="cmxCell" data-a="${id}" data-b="${o}">修改</button></td></tr>`; }).join('') || '<tr><td colspan="4" class="muted">还没有设置</td></tr>'}</table>
    <p class="small muted">在“合并表”视图中可以一次看全整册的合并关系。未设置的组合等同不可合并。</p></div>
  <div class="card"><h3 style="margin-top:0">题目（${qs.length}）</h3>
    <table class="mini"><tr><th></th>${[1, 2, 3].map(L => `<th>★${L}</th>`).join('')}</tr>${k.qtypes.map(t => `<tr><td>${TYPE_NAME[t]}</td>${[1, 2, 3].map(L => `<td>${cnt(t, L)} / 5</td>`).join('')}</tr>`).join('')}</table>
    <p class="small muted">“现有 / 目标”。★3 起为多知识点题。<a href="#/t/bank?kp=${id}">在题库中查看 →</a></p></div>`;
};
A.preAdd = d => {
  const a = val('preA'), b = d.v, kind = val('preKind');
  const err = m => { document.getElementById('preErr').innerHTML = `<div class="error-box">${m}</div>`; };
  if (S.prereqs.some(r => r.a === a && r.b === b)) return err('这条关系已经存在。');
  const cyc = wouldCycle(a, b);
  if (cyc) return err(`不能添加：会形成环 <b>${cyc.map(x => esc(kpName(x))).join(' → ')}</b>。<br>先学后学关系不能首尾相接，请检查是否方向写反了。`);
  S.prereqs.push({ a, b, kind, state: 'ok', src: '教师添加' }); toast('已添加', 'ok'); render();
};
A.preOk = d => { S.prereqs.find(r => r.a === d.a && r.b === d.b).state = 'ok'; render(); };
A.preDel = d => { S.prereqs = S.prereqs.filter(r => !(r.a === d.a && r.b === d.b)); render(); };
A.kpOk = d => { kp(d.v).status = '启用'; toast('已启用', 'ok'); render(); };
A.kpStopOpen = d => {
  const pre = prereqsOf(d.v), nx = nextsOf(d.v);
  const link = pre.flatMap(p => nx.map(n => `${esc(kpName(p.a))} → ${esc(kpName(n.b))}`));
  modal(`<h3>停用「${esc(kpName(d.v))}」</h3><p>受影响的关系：前置 ${pre.length} 条、后学 ${nx.length} 条、合并 ${combosOf(d.v).length} 条。</p>
  ${link.length ? `<div class="hint-box">选“连接前后”会新增：${link.join('；')}</div>` : ''}
  ${btnRow(`<button data-act="close">取消</button><button data-act="kpStop" data-v="${d.v}" data-m="drop">直接删除这些关系</button>${link.length ? `<button class="primary" data-act="kpStop" data-v="${d.v}" data-m="link">连接前后</button>` : ''}`)}`);
};
A.kpStop = d => {
  const id = d.v; const pre = prereqsOf(id), nx = nextsOf(id);
  if (d.m === 'link') for (const p of pre) for (const n of nx) if (!S.prereqs.some(r => r.a === p.a && r.b === n.b)) S.prereqs.push({ a: p.a, b: n.b, kind: p.kind === 'must' && n.kind === 'must' ? 'must' : 'suggest', state: 'ok', src: `停用「${kpName(id)}」时连接前后` });
  S.prereqs = S.prereqs.filter(r => r.a !== id && r.b !== id); S.combos = S.combos.filter(c => c.a !== id && c.b !== id);
  kp(id).status = '停用'; closeModal(); toast('已停用', 'ok'); render();
};

// ---- 联网获取教材知识点（模拟） ----
const FETCH_SIM = {
  book: '人教版 · 数学 · 三年级上册（2024 年版）',
  add: [
    { name: '万以内数的估算', unit: '万以内的加法和减法（二）', type: 'apply', qtypes: ['single', 'fill'], src: '人教社教材目录 第 4 单元；课程标准（2022 年版）“运算能力”' },
    { name: '口算多位数乘一位数', unit: '多位数乘一位数', type: 'skill', qtypes: ['fill'], src: '人教社教材目录 第 6 单元', dup: 'm7' },
    { name: '分数的简单加减法', unit: '分数的初步认识', type: 'skill', qtypes: ['single', 'fill'], src: '人教社教材目录 第 8 单元' },
    { name: '认识四边形', unit: '长方形和正方形', type: 'apply', qtypes: ['single'], src: '人教社教材目录 第 7 单元' },
    { name: '数字编码', unit: '数学广角', type: 'apply', qtypes: ['single'], src: null },
  ],
  rename: [{ id: 'm4', to: '毫米、分米、千米和吨的认识', src: '人教社教材目录 第 3 单元' }],
  rels: [
    { k: 'pre', a: 'm5', b: '#0', kind: 'suggest', why: '估算建立在笔算加减之上' },
    { k: 'combo', a: '#0', b: 'm5', how: '先估算，再笔算，并用估算检验笔算结果' },
    { k: 'pre', a: '#1', b: 'm7', kind: 'suggest', why: '教材中口算在笔算之前' },
    { k: 'pre', a: 'm9', b: '#2', kind: 'must', why: '同分母分数加减要先认识分数' },
    { k: 'combo', a: '#2', b: 'm6', v: 'no', how: '“几分之几”和“几倍”容易混淆（与已有设置一致）' },
    { k: 'pre', a: '#3', b: 'm8', kind: 'must', why: '求周长前要认识长方形、正方形的特征' },
  ],
};
A.fetchOpen = d => {
  const g = Number(d.v); const [stage, subject] = GROUPS[g];
  const books = subject === 'math' ? ['人教版 · 数学 · 三年级上册（2024 年版）', '人教版 · 数学 · 三年级下册（2024 年版）'] : subject === 'english' ? ['人教版 PEP · 英语 · 三年级上册（2024 年版）'] : ['人教版 · 物理 · 九年级全一册'];
  const ai = S.roles.kp.main || S.roles.gen.main;
  modal(`<h3>🌐 联网获取教材知识点</h3>
  <p class="small muted">由“知识点整理 AI”联网查找课程标准、教材目录和单元知识清单，整理成知识点列表，同时给出建议的先学后学关系和可合并关系。结果先预览，老师勾选后入库，入库后为“待审核”。</p>
  <div class="form-grid"><div><label>学科 / 年级</label><b>${SUBJECTS[subject].name} · ${STAGE_NAME[stage]}</b></div><div><label>使用的 AI</label>${esc(profName(ai))}${prof(ai)?.web ? ' <span class="tag ok">支持联网</span>' : ' <span class="tag warn">不支持联网，结果将标“未经联网”</span>'}${!S.roles.kp.main ? '<div class="small muted">知识点整理角色未配置，使用出题 AI</div>' : ''}</div></div>
  <label>教材册次</label><select id="fetchBook" style="width:100%">${books.map(b => `<option>${b}</option>`).join('')}</select>
  ${btnRow(`<button data-act="close">取消</button><button class="primary" data-act="fetchRun" data-v="${g}">开始获取</button>`)}`, true);
};
A.fetchRun = async d => {
  const g = Number(d.v); const book = val('fetchBook'); const run = UI.fetchRun = {};
  const steps = ['查找课程标准（2022 年版）中对应学段的内容要求', `查找《${book}》教材目录`, '整理单元知识清单', '与系统中已有知识点比对差异', '建议先学后学关系和可合并关系'];
  for (let i = 0; i <= steps.length; i++) {
    if (run.cancel) return;
    setModal(`<h3>🌐 正在获取…</h3><div class="progress"><div style="width:${pct(i, steps.length)}%"></div></div>
    <div class="loading-steps" style="margin-top:10px">${steps.map((s, j) => `<div>${j < i ? '✅' : j === i ? '⏳' : '⬜'} ${s}</div>`).join('')}</div>
    <p class="small muted">后台分批执行，可以关闭窗口，完成后在知识点页提示。</p>${btnRow('<button data-act="fetchCancel">取消获取</button>')}`);
    await sleep(450);
  }
  if (run.cancel) return;
  if (book !== FETCH_SIM.book) {
    return setModal(`<h3>获取完成</h3><div class="ok-box">《${esc(book)}》与系统中已有知识点一致，没有差异。</div><p class="small muted">原型只模拟了“人教版数学三年级上册”的差异结果，可以换这一册再试。</p>${btnRow('<button class="primary" data-act="close">关闭</button>')}`);
  }
  UI.fetchG = g; setModal(fetchPreview());
};
A.fetchCancel = () => { if (UI.fetchRun) UI.fetchRun.cancel = true; closeModal(); toast('已取消'); };
function fetchPreview() {
  const F = FETCH_SIM; const nm = x => x.startsWith('#') ? `<b>${esc(F.add[+x.slice(1)].name)}</b>（新）` : esc(kpName(x));
  return `<h3>差异预览 · ${esc(F.book)}</h3>
  <p class="small muted">来源：人教社教材目录、课程标准（2022 年版）。使用：${esc(profName(S.roles.kp.main || S.roles.gen.main))}。只显示与系统现有知识点的<b>差异</b>。</p>
  <h3>新增（${F.add.length}）</h3>
  <table class="mini"><tr><th></th><th>知识点</th><th>单元</th><th>类型 / 题型</th><th>出处</th></tr>${F.add.map((x, i) => `<tr><td><input type="checkbox" id="fa${i}" ${x.src ? 'checked' : ''}></td><td><b>${esc(x.name)}</b>${x.dup ? `<div class="hint-box small" style="margin:4px 0">可能重复：与已有「${esc(kpName(x.dup))}」相近<br><label class="inline"><input type="checkbox" id="fm${i}"> 合并到已有知识点（不新增）</label></div>` : ''}</td><td class="small">${esc(x.unit)}</td><td class="small">${KP_TYPE_NAME[x.type]}<br>${x.qtypes.map(t => TYPE_NAME[t]).join('、')}</td><td class="small">${x.src ? esc(x.src) : '<span class="tag bad">未找到出处</span><div class="muted">默认不勾选</div>'}</td></tr>`).join('')}</table>
  <h3>名称变化（${F.rename.length}）</h3>
  <table class="mini">${F.rename.map((x, i) => `<tr><td><input type="checkbox" id="fr${i}"></td><td>「${esc(kpName(x.id))}」→「<b>${esc(x.to)}</b>」</td><td class="small">${esc(x.src)}</td></tr>`).join('')}</table>
  <h3>系统里有、教材里没有（0）</h3><p class="small muted">无。</p>
  <h3>AI 建议的关系（入库后为“待确认”）</h3>
  <table class="mini">${F.rels.map((r, i) => `<tr><td><input type="checkbox" id="fl${i}" checked></td><td>${r.k === 'pre' ? `${nm(r.a)} → ${nm(r.b)} <span class="tag ${r.kind === 'must' ? 'bad' : 'gray'}">${r.kind === 'must' ? '必须' : '建议'}</span>` : `${nm(r.a)} × ${nm(r.b)} ${r.v === 'no' ? '<span class="tag bad">✗ 不可合并</span>' : '<span class="tag ok">✓ 可合并</span>'}`}</td><td class="small muted">${esc(r.why || r.how)}</td></tr>`).join('')}</table>
  ${btnRow('<button data-act="close">放弃</button><button class="primary" data-act="fetchImport">勾选的入库</button>')}`;
}
A.fetchImport = () => {
  const F = FETCH_SIM; const [stage, subject] = GROUPS[UI.fetchG]; const map = {}; let n = 0, r = 0;
  F.add.forEach((x, i) => {
    if (!checked('fa' + i)) return;
    if (x.dup && checked('fm' + i)) { map['#' + i] = x.dup; return; }
    const id = newId('m');
    S.kps.push({ id, subject, stage, unit: x.unit, name: x.name, type: x.type, qtypes: x.qtypes, status: '待审核', order: S.kps.filter(k => k.unit === x.unit).reduce((m, k) => Math.max(m, k.order), 0) + 0.5, source: `联网获取 · ${x.src || '未找到出处'} · ${profName(S.roles.kp.main || S.roles.gen.main)} · ${nowStr()}` });
    map['#' + i] = id; n++;
  });
  F.rename.forEach((x, i) => { if (checked('fr' + i)) kp(x.id).name = x.to; });
  const rid = x => x.startsWith('#') ? map[x] : x;
  F.rels.forEach((x, i) => {
    if (!checked('fl' + i)) return; const a = rid(x.a), b = rid(x.b); if (!a || !b || a === b) return;
    if (x.k === 'pre') { if (!S.prereqs.some(p => p.a === a && p.b === b) && !wouldCycle(a, b)) { S.prereqs.push({ a, b, kind: x.kind, state: 'pending', src: 'AI 建议（联网获取）' }); r++; } }
    else if (!comboOf(a, b)) { S.combos.push({ a, b, v: x.v || 'yes', how: x.how, state: 'pending' }); r++; }
  });
  closeModal(); toast(`已入库 ${n} 个知识点（待审核）、${r} 条关系（待确认）`, 'ok'); render();
};

// ---- 上传知识点 ----
const KP_TEMPLATE = '\ufeff单元,知识点名称,类型（技能/理解应用/记忆/阅读表达）,适用题型（单选/填空/应用题）,前置知识点（名称，多个用；分隔）,前置强度（必须/建议）,可合并知识点（名称：怎么合并）\n' +
  '时、分、秒,秒的认识与时间单位换算,技能,单选；填空,,,计算经过的时间：先把时间单位换算成同一种，再计算经过的时间\n';
A.uploadKpOpen = () => modal(`<h3>⬆️ 上传知识点</h3><p class="small muted">支持 Excel / CSV / Markdown。模板中可以带“前置知识点”“可合并知识点”两列。也可以拍教材目录页上传，由识别 AI 读成文字后再整理。上传后同样先预览，入库后为“待审核”。</p>
  <div class="row"><button data-act="kpTpl">下载模板（CSV）</button><input type="file" accept=".xlsx,.csv,.md,.jpg,.png" data-chg="kpFile"></div><div id="kpFileRes"></div>${btnRow('<button data-act="close">关闭</button>')}`, true);
A.kpTpl = () => download('知识点模板.csv', KP_TEMPLATE, 'text/csv');
CHG.kpFile = el => {
  const f = el.files[0]; if (!f) return;
  document.getElementById('kpFileRes').innerHTML = `<div class="card" style="margin-top:10px"><b>${esc(f.name)}</b> 解析结果（原型模拟）：
  <table class="mini"><tr><th>知识点</th><th>前置</th><th>可合并</th><th>检查</th></tr>
  <tr><td>Unit 3 身体部位单词</td><td>—</td><td>用颜色描述物品</td><td><span class="tag ok">通过</span></td></tr>
  <tr><td>用 This is my… 介绍身体部位</td><td>Unit 3 身体部位单词（必须）</td><td>—</td><td><span class="tag ok">通过</span></td></tr>
  <tr><td>文具单词（ruler、pencil…）</td><td>—</td><td>—</td><td><span class="tag warn">可能重复：与已有知识点同名，将跳过</span></td></tr></table>
  ${btnRow('<button class="primary" data-act="kpFileImport">导入 2 个（待审核）</button>')}</div>`;
};
A.kpFileImport = () => {
  const a = newId('e'), b = newId('e');
  S.kps.push({ id: a, subject: 'english', stage: 'P3', unit: 'Unit 3 Amazing animals', name: 'Unit 3 身体部位单词', type: 'memory', qtypes: ['single', 'fill'], status: '待审核', order: 2.5, source: `老师上传 · 文件 · ${nowStr()}` });
  S.kps.push({ id: b, subject: 'english', stage: 'P3', unit: 'Unit 3 Amazing animals', name: '用 This is my… 介绍身体部位', type: 'apply', qtypes: ['single', 'fill'], status: '待审核', order: 2.6, source: `老师上传 · 文件 · ${nowStr()}` });
  S.prereqs.push({ a, b, kind: 'must', state: 'pending', src: '导入' }); S.combos.push({ a, b: 'e4', v: 'yes', how: '用颜色描述身体部位', state: 'pending' });
  closeModal(); toast('已导入 2 个知识点（三年级英语，待审核）', 'ok'); render();
};

// ---- AI 建议关系（整册） ----
const REL_SUG = { 0: [{ k: 'pre', a: 'm3', b: 'm2', kind: 'suggest', why: '计算经过的分钟数要用到两位数加减' }, { k: 'combo', a: 'm2', b: 'm3', how: '用两位数加减计算经过的分钟数' }, { k: 'combo', a: 'm1', b: 'm4', v: 'no', how: '时间单位和长度、质量单位换算进率不同，容易混淆，先分开练' }],
  1: [{ k: 'combo', a: 'e2', b: 'e1', how: '介绍自己时说出自己的文具：I have a ruler.' }], 2: [{ k: 'pre', a: 'p2', b: 'p4', kind: 'suggest', why: '串联电路中求各用电器电功率' }] };
A.aiRelOpen = d => {
  const list = (REL_SUG[d.v] || []).filter(r => r.k === 'pre' ? !S.prereqs.some(p => p.a === r.a && p.b === r.b) : !comboOf(r.a, r.b));
  UI.relSug = list;
  modal(`<h3>🤖 AI 建议关系 · ${GROUPS[d.v][2]}</h3><p class="small muted">知识点整理 AI 对整册给出建议，优先从已有的先学后学关系和同单元相邻知识点中找。结果标“待确认”，老师确认后才生效。</p>
  ${list.length ? `<table class="mini">${list.map((r, i) => `<tr><td><input type="checkbox" id="rs${i}" checked></td><td>${r.k === 'pre' ? `${esc(kpName(r.a))} → ${esc(kpName(r.b))} <span class="tag gray">${r.kind === 'must' ? '必须' : '建议'}</span>` : `${esc(kpName(r.a))} × ${esc(kpName(r.b))} ${r.v === 'no' ? '<span class="tag bad">✗ 不可合并</span>' : '<span class="tag ok">✓ 可合并</span>'}`}</td><td class="small muted">${esc(r.why || r.how)}</td></tr>`).join('')}</table>` : '<div class="ok-box">没有新的建议。</div>'}
  ${btnRow(`<button data-act="close">关闭</button>${list.length ? '<button class="primary" data-act="aiRelOk">加入（待确认）</button>' : ''}`)}`, true);
};
A.aiRelOk = () => {
  UI.relSug.forEach((r, i) => { if (!checked('rs' + i)) return; if (r.k === 'pre') { if (!wouldCycle(r.a, r.b)) S.prereqs.push({ a: r.a, b: r.b, kind: r.kind, state: 'pending', src: 'AI 建议' }); } else S.combos.push({ a: r.a, b: r.b, v: r.v || 'yes', how: r.how, state: 'pending' }); });
  closeModal(); toast('已加入，待确认', 'ok'); render();
};
