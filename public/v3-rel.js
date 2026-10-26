'use strict';
/* 学习系统 3.0 原型：教师端 · 知识点关系（先学后学、能否合并）、关系图、合并表 */

function wouldCycle(a, b) {
  const adj = {}; for (const r of S.prereqs) (adj[r.a] ||= []).push(r.b);
  const path = []; const seen = new Set();
  const dfs = x => { if (x === a) { path.push(x); return true; } if (seen.has(x)) return false; seen.add(x); for (const y of adj[x] || []) if (dfs(y)) { path.push(x); return true; } return false; };
  return dfs(b) ? [a, ...path.reverse()] : null;
}
function combineCheck(ids) {
  if (ids.length < 2) return { ok: true, msg: '单个知识点：出 ★1 基础 / ★2 变式题' };
  const k0 = kpById(ids[0]); const cap = comboCap(k0.subject, k0.stage);
  if (ids.length > cap) return { ok: false, msg: `超过${BAND_NAMES[bandIdx(k0.stage)]}${subj(k0.subject).name}的综合上限（一题最多 ${cap} 个知识点）` };
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const c = comboOf(ids[i], ids[j]);
    if (c?.v === 'no' && c.state === 'ok') return { ok: false, msg: `「${kpById(ids[i]).name}」和「${kpById(ids[j]).name}」设为不可合并：${c.how}` };
  }
  const seen = new Set([ids[0]]); let grow = true;
  while (grow) { grow = false; for (const c of S.combos) if (c.v === 'yes' && c.state === 'ok' && ids.includes(c.a) && ids.includes(c.b) && seen.has(c.a) !== seen.has(c.b)) { seen.add(c.a); seen.add(c.b); grow = true; } }
  if (seen.size < ids.length) return { ok: false, msg: `没有把这些知识点连起来的“可合并”关系（未设置的等同不可合并）：${ids.filter(x => !seen.has(x)).map(x => kpById(x).name).join('、')}` };
  return { ok: true, msg: `可以合并，出 ★${ids.length + 1} 题。出题 AI 将按：${S.combos.filter(c => c.v === 'yes' && ids.includes(c.a) && ids.includes(c.b)).map(c => c.how).join('；')}` };
}
function layers(list) {
  const ids = new Set(list.map(k => k.id)); const memo = {};
  const lv = id => memo[id] ??= Math.max(0, ...S.prereqs.filter(r => r.b === id && ids.has(r.a)).map(r => lv(r.a) + 1));
  return Object.fromEntries(list.map(k => [k.id, lv(k.id)]));
}
const qBoth = (a, b) => QUESTIONS.filter(q => q.kps?.includes(a) && q.kps.includes(b)).length;

function kpGraph(list) {
  const lv = layers(list); const cols = {};
  list.forEach(k => (cols[lv[k.id]] ||= []).push(k));
  const W = 190, H = 66, GX = 64, GY = 16, pos = {}; let rows = 0;
  for (const [c, ks] of Object.entries(cols)) { ks.forEach((k, i) => { pos[k.id] = { x: c * (W + GX), y: i * (H + GY) }; }); rows = Math.max(rows, ks.length); }
  const width = (Math.max(...Object.keys(cols).map(Number)) + 1) * (W + GX) - GX, height = rows * (H + GY) - GY;
  const ids = new Set(list.map(k => k.id)); const edges = S.prereqs.filter(r => ids.has(r.a) && ids.has(r.b));
  const cross = S.prereqs.filter(r => ids.has(r.a) !== ids.has(r.b));
  const hl = ids.has(UI.hl) ? UI.hl : null;
  const near = hl ? new Set([hl, ...edges.filter(r => r.a === hl || r.b === hl).flatMap(r => [r.a, r.b])]) : null;
  const path = r => { const a = pos[r.a], b = pos[r.b]; const x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x - 6, y2 = b.y + H / 2; const m = (x1 + x2) / 2; return `M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`; };
  const dim = r => near && !(r.a === hl || r.b === hl);
  return `<div class="card"><div class="small muted" style="margin-bottom:10px">按先学后学从左到右排列。<b>实线</b> = 必须，<b>虚线</b> = 建议，<span style="color:#e58a00">橙色</span> = AI 建议、待确认。点击知识点高亮它的前后关系，再点一次打开它的关系管理。</div>
  <div class="graph-wrap"><div class="graph" style="width:${width}px;height:${height}px">
  <svg width="${width}" height="${height}"><defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#8a96b3"/></marker><marker id="arrw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#e58a00"/></marker></defs>
  ${edges.map(r => `<path d="${path(r)}" class="edge ${r.kind} ${r.state} ${dim(r) ? 'dim' : ''}" marker-end="url(#${r.state === 'pending' ? 'arrw' : 'arr'})"/>`).join('')}</svg>
  ${list.map(k => `<div class="gnode ${k.id === hl ? 'hl' : ''} ${near && !near.has(k.id) ? 'dim' : ''} ${k.status === '待审核' ? 'pend' : ''}" style="left:${pos[k.id].x}px;top:${pos[k.id].y}px;width:${W}px;height:${H}px" data-act="gnode" data-v="${k.id}"><b>${esc(k.name)}</b><span class="small muted gunit">${esc(k.unit)}${k.status === '待审核' ? ' · 待审核' : ''}</span></div>`).join('')}
  </div></div>
  ${cross.length ? `<div class="small muted" style="margin-top:8px">跨年级关系：${cross.map(r => `${esc(kpById(r.a)?.name)}（${stageName(kpById(r.a)?.stage)}）→ ${esc(kpById(r.b)?.name)}（${stageName(kpById(r.b)?.stage)}）`).join('；')}</div>` : ''}</div>`;
}
function kpMatrix(list) {
  list = list.filter(isComb);
  return `<div class="card"><div class="small muted" style="margin-bottom:10px">两两组合：<span class="tag ok">✓</span> 可合并（悬停看“怎么合并”）　<span class="tag bad">✗</span> 不可合并　空白 = 未设置（等同不可合并）　<span class="tag warn">?</span> AI 建议待确认。格子里的小数字是已有的合并题数量。点击格子修改。记忆型、阅读表达型不在表中。</div>
  <div class="table-wrap"><table class="cmx"><tr><th></th>${list.map((k, j) => `<th class="v" title="${esc(k.name)}">${j + 1}</th>`).join('')}</tr>
  ${list.map((a, i) => `<tr><th class="h">${i + 1}. ${esc(a.name.length > 16 ? a.name.slice(0, 16) + '…' : a.name)}</th>${list.map((b, j) => {
    if (i === j) return '<td class="self"></td>';
    const c = comboOf(a.id, b.id); const n = qBoth(a.id, b.id);
    const cls = !c ? '' : c.state === 'pending' ? 'pend' : c.v === 'yes' ? 'yes' : 'no';
    const sym = !c ? '' : c.state === 'pending' ? '?' : c.v === 'yes' ? '✓' : '✗';
    return `<td class="cell ${cls}" data-act="cmxCell" data-a="${a.id}" data-b="${b.id}" title="${esc(a.name)} × ${esc(b.name)}${c ? '：' + esc(c.how) : ''}">${sym}${n ? `<sub>${n}</sub>` : ''}</td>`;
  }).join('')}</tr>`).join('')}</table></div></div>`;
}
const relBack = () => { if (UI.relFor) A.relOpen({ v: UI.relFor }); else closeModal(); render(); };
Object.assign(A, {
  gnode(d) { if (UI.hl === d.v) A.relOpen(d); else { UI.hl = d.v; render(); } },
  cmxCell(d) {
    const { a, b } = d; const c = comboOf(a, b); const n = qBoth(a, b);
    const title = `<h3>${esc(kpById(a).name)} × ${esc(kpById(b).name)}</h3>`;
    const btns = inner => `<div class="row" style="justify-content:flex-end;margin-top:12px">${inner}</div>`;
    if (c?.state === 'pending') return modal(`${title}<div class="hint-box">AI 建议<b>${c.v === 'yes' ? '可合并' : '不可合并'}</b>：${esc(c.how)}</div><label>怎么合并（可修改）</label><input id="howIn" value="${esc(c.how)}" style="width:100%">${btns(`<button data-act="comboDel" data-a="${a}" data-b="${b}">删除建议</button><button data-act="comboSet" data-a="${a}" data-b="${b}" data-v="no">改为不可合并</button><button class="primary" data-act="comboSet" data-a="${a}" data-b="${b}" data-v="yes">确认可合并</button>`)}`);
    if (!c) return modal(`${title}<p>设为<b>可合并</b>时必须写“怎么合并”，出题 AI 按这句话把两个知识点串成一道题。</p><label>怎么合并 / 不可合并的原因</label><input id="howIn" placeholder="如：先统一长度单位，再求周长" style="width:100%">${btns(`<button data-act="close">取消</button><button data-act="comboSet" data-a="${a}" data-b="${b}" data-v="no">设为不可合并</button><button class="primary" data-act="comboSet" data-a="${a}" data-b="${b}" data-v="yes">设为可合并</button>`)}`);
    if (c.v === 'yes') {
      const qs = QUESTIONS.filter(q => q.kps?.includes(a) && q.kps.includes(b));
      if (!qs.length) { c.v = 'no'; c.how = '老师设为不可合并'; log(`「${kpById(a).name}」×「${kpById(b).name}」改为不可合并`); toast('已改为不可合并'); return relBack(); }
      return modal(`${title}<p>改为<b>不可合并</b>后，这两个知识点不会再出现在同一道新题中。</p><div class="hint-box">已有 <b>${qs.length}</b> 道题同时包含这两个知识点：${qs.map(q => `${q.id}「${esc(String(q.stem).slice(0, 18))}…」`).join('、')}</div>${btns(`<button data-act="close">取消</button><button data-act="comboNo" data-a="${a}" data-b="${b}" data-v="keep">改为不可合并，保留这些题</button><button class="primary" data-act="comboNo" data-a="${a}" data-b="${b}" data-v="stop">改为不可合并，停用这些题</button>`)}`, true);
    }
    S.combos = S.combos.filter(x => x !== c); toast('已改为“未设置”'); relBack();
  },
  comboSet(d) {
    const how = val('howIn').trim(); let c = comboOf(d.a, d.b);
    if (d.v === 'yes' && !how) return toast('请填写“怎么合并”', 'error');
    if (!c) { c = { a: d.a, b: d.b }; S.combos.push(c); }
    Object.assign(c, { v: d.v, how: how || '老师设为不可合并', state: 'ok', src: '教师确认' });
    log(`「${kpById(d.a).name}」×「${kpById(d.b).name}」设为${d.v === 'yes' ? '可合并' : '不可合并'}`); toast('已保存', 'ok'); relBack();
  },
  comboDel(d) { S.combos = S.combos.filter(x => x !== comboOf(d.a, d.b)); relBack(); },
  comboNo(d) {
    const c = comboOf(d.a, d.b); c.v = 'no'; c.how = '老师设为不可合并';
    if (d.v === 'stop') { S.qOff ||= {}; QUESTIONS.filter(q => q.kps?.includes(d.a) && q.kps.includes(d.b)).forEach(q => { S.qOff[q.id] = true; }); }
    log(`「${kpById(d.a).name}」×「${kpById(d.b).name}」改为不可合并${d.v === 'stop' ? '，停用相关题目' : ''}`); toast(d.v === 'stop' ? '已改为不可合并，相关题目已停用' : '已改为不可合并', 'ok'); relBack();
  },
  // ---- 某个知识点的全部关系
  relOpen(d) {
    const k = kpById(d.v); UI.relFor = k.id; const si = ALL_STAGES.indexOf(k.stage);
    const cand = S.kps.filter(x => x.subject === k.subject && x.id !== k.id && isComb(x) && ALL_STAGES.indexOf(x.stage) >= si - 2 && ALL_STAGES.indexOf(x.stage) <= si + 1);
    const row = (r, other, dir) => `<tr><td>${dir === 'pre' ? '' : '→ '}${esc(kpById(other)?.name)}${dir === 'pre' ? ' →' : ''}${kpById(other)?.stage !== k.stage ? ` <span class="tag gray">${stageName(kpById(other)?.stage)}</span>` : ''}</td><td><span class="tag ${r.kind === 'must' ? 'bad' : 'gray'}">${r.kind === 'must' ? '必须' : '建议'}</span></td><td class="small muted">${esc(r.src)}</td>
      <td>${r.state === 'pending' ? `<span class="tag warn">待确认</span> <button class="small primary" data-act="preOk" data-a="${r.a}" data-b="${r.b}">确认</button>` : '<span class="tag ok">已确认</span>'} <button class="small" data-act="preDel" data-a="${r.a}" data-b="${r.b}">删除</button></td></tr>`;
    const combos = S.combos.filter(c => c.a === k.id || c.b === k.id);
    modal(`<h3>🧩 ${esc(k.name)} 的关系</h3>
    <h4 style="margin:10px 0 4px">先学后学</h4><p class="small muted" style="margin:0 0 6px">“必须”前置没有基本掌握时，这个知识点不进入推荐，学生端显示“建议先学”；“建议”只影响推荐顺序。可以跨年级，不能形成环。</p>
    <table class="mini"><tr><th>要先学（前置）</th><th>强度</th><th>来源</th><th></th></tr>${prereqsOf(k.id).map(r => row(r, r.a, 'pre')).join('') || '<tr><td colspan="4" class="muted">没有前置知识点</td></tr>'}</table>
    <div class="row" style="margin-top:6px"><select id="preA">${cand.map(x => `<option value="${x.id}">${x.stage !== k.stage ? `[${stageName(x.stage)}] ` : ''}${esc(x.name)}</option>`).join('')}</select><select id="preKind"><option value="must">必须</option><option value="suggest">建议</option></select><button data-act="preAdd" data-v="${k.id}">＋ 添加前置</button></div><div id="preErr"></div>
    <table class="mini" style="margin-top:8px"><tr><th>学会后可以学（后学）</th><th>强度</th><th>来源</th><th></th></tr>${nextsOf(k.id).map(r => row(r, r.b, 'next')).join('') || '<tr><td colspan="4" class="muted">没有后学知识点</td></tr>'}</table>
    <h4 style="margin:14px 0 4px">能否合并出题</h4><p class="small muted" style="margin:0 0 6px">“可合并”必须写怎么合并，出题 AI 按这句话把知识点串成一道题；“不可合并”的两个知识点不会出现在同一道新题中；未设置的等同不可合并。</p>
    <table class="mini"><tr><th>知识点</th><th>状态</th><th>怎么合并 / 原因</th><th>已有合并题</th><th></th></tr>${combos.map(c => { const o = c.a === k.id ? c.b : c.a; return `<tr><td>${esc(kpById(o)?.name)}${kpById(o)?.stage !== k.stage ? ` <span class="tag gray">${stageName(kpById(o)?.stage)}</span>` : ''}</td><td>${c.state === 'pending' ? '<span class="tag warn">AI 建议 · 待确认</span>' : c.v === 'yes' ? '<span class="tag ok">✓ 可合并</span>' : '<span class="tag bad">✗ 不可合并</span>'}</td><td class="small">${esc(c.how)}</td><td>${qBoth(k.id, o)} 道</td><td><button class="small" data-act="cmxCell" data-a="${k.id}" data-b="${o}">修改</button></td></tr>`; }).join('') || '<tr><td colspan="5" class="muted">还没有设置，这个知识点只能出 ★1、★2 题</td></tr>'}</table>
    <div class="row" style="margin-top:6px"><select id="cbTo">${cand.filter(x => !comboOf(k.id, x.id)).map(x => `<option value="${x.id}">${x.stage !== k.stage ? `[${stageName(x.stage)}] ` : ''}${esc(x.name)}</option>`).join('')}</select><button data-act="cmxCellPick" data-v="${k.id}">设置合并关系</button></div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="primary" data-act="relClose">完成</button></div>`, true);
  },
  relClose() { UI.relFor = null; closeModal(); render(); },
  cmxCellPick(d) { const to = val('cbTo'); if (to) A.cmxCell({ a: d.v, b: to }); },
  preAdd(d) {
    const a = val('preA'), b = d.v, kind = val('preKind');
    const err = m => { document.getElementById('preErr').innerHTML = `<div class="error-box">${m}</div>`; };
    if (S.prereqs.some(r => r.a === a && r.b === b)) return err('这条关系已经存在。');
    const cyc = wouldCycle(a, b);
    if (cyc) return err(`不能添加：会形成环 <b>${cyc.map(x => esc(kpById(x).name)).join(' → ')}</b>。<br>先学后学关系不能首尾相接，请检查是否方向写反了。`);
    S.prereqs.push({ a, b, kind, state: 'ok', src: '教师添加' }); log(`添加前置关系：「${kpById(a).name}」→「${kpById(b).name}」`); toast('已添加', 'ok'); relBack();
  },
  preOk(d) { S.prereqs.find(r => r.a === d.a && r.b === d.b).state = 'ok'; relBack(); },
  preDel(d) { S.prereqs = S.prereqs.filter(r => !(r.a === d.a && r.b === d.b)); relBack(); },
  // ---- 停用知识点：显示受影响的关系（§3.1）
  kpStopOpen(d) {
    const k = kpById(d.v); const pre = prereqsOf(k.id), nx = nextsOf(k.id);
    const link = pre.flatMap(p => nx.map(n => `${esc(kpById(p.a).name)} → ${esc(kpById(n.b).name)}`));
    modal(`<h3>停用「${esc(k.name)}」</h3><p>受影响的关系：前置 ${pre.length} 条、后学 ${nx.length} 条、合并 ${S.combos.filter(c => c.a === k.id || c.b === k.id).length} 条。学生的学习记录保留。</p>
    ${link.length ? `<div class="hint-box">选“连接前后”会新增：${link.join('；')}</div>` : ''}
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button data-act="close">取消</button><button data-act="kpStop" data-v="${k.id}" data-m="drop">停用，直接删除这些关系</button>${link.length ? `<button class="primary" data-act="kpStop" data-v="${k.id}" data-m="link">停用，连接前后</button>` : ''}</div>`);
  },
  kpStop(d) {
    const id = d.v; const pre = prereqsOf(id), nx = nextsOf(id);
    if (d.m === 'link') for (const p of pre) for (const n of nx) if (!S.prereqs.some(r => r.a === p.a && r.b === n.b)) S.prereqs.push({ a: p.a, b: n.b, kind: p.kind === 'must' && n.kind === 'must' ? 'must' : 'suggest', state: 'ok', src: `停用「${kpById(id).name}」时连接前后` });
    S.prereqs = S.prereqs.filter(r => r.a !== id && r.b !== id); S.combos = S.combos.filter(c => c.a !== id && c.b !== id);
    kpById(id).status = '停用'; log(`停用知识点「${kpById(id).name}」（${d.m === 'link' ? '连接前后' : '删除关系'}）`); closeModal(); toast('已停用', 'ok'); render();
  },
});
