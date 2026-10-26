'use strict';
/* 学习系统 3.0 原型：教师端 · 出题规则（§5） */

const RULE_SECTIONS = ['总体要求', '题型规范', '难度与变式', '多知识点合并', '干扰项与常见错误', '自检清单', '示例'];
function validateRule(text) {
  const errors = [], warns = []; const meta = {};
  const m = text.match(/^\s*---\n([\s\S]*?)\n---/);
  if (!m) errors.push('缺少开头的元信息（用 --- 包起来的一段）');
  else for (const line of m[1].split('\n')) { const x = line.match(/^([^:#]+):\s*([^#]*)/); if (x) meta[x[1].trim()] = x[2].trim(); }
  for (const k of ['名称', '版本', '适用学科', '适用题型']) if (m && !meta[k]) errors.push(`元信息缺少“${k}”`);
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
const ruleText = r => r.text || RULE_TEMPLATE.replace('（规则名称，如：小学数学出题规则）', r.name).replace('版本: 1.0', `版本: ${r.version}`).replace('（姓名）', r.author);
const byVer = (a, b) => b.version.localeCompare(a.version, undefined, { numeric: true });
function tRules() {
  const names = [...new Set(S.rules.map(r => r.name))];
  return `<div class="row between"><h1>出题规则</h1><div class="row"><button data-act="ruleTpl">⬇️ 下载规则模板</button><button class="primary" data-act="ruleImportOpen">⬆️ 导入规则</button></div></div>
  <div class="proto-note">出题 AI 按“规则文件”（Markdown）出题：题型规范、难度和变式、多知识点怎么合并、常见错误怎么设计成干扰项等。规则可以在其他 AI 中反复试验后导入。可同时启用多份，按“学科 + 年级 + 题型”匹配，越具体的优先（如“小学数学”优先于“通用”）。每道 AI 题记录使用的规则名称和版本；系统调用时会在规则后附上固定的输出格式说明。</div>
  ${names.map(n => { const vs = S.rules.filter(r => r.name === n).sort(byVer); return `<div class="card"><div class="row between"><h3 style="margin:0">${esc(n)}</h3><span class="small muted">${esc(vs[0].scope)} · ${esc(vs[0].types)}</span></div>
  <div class="table-wrap"><table style="margin-top:8px"><tr><th>版本</th><th>作者</th><th>导入时间</th><th>大小</th><th>状态</th><th title="按规则版本统计">生成 / 验证通过率 / 更正率 / 丢弃</th><th></th></tr>
  ${vs.map(r => `<tr><td><b>v${esc(r.version)}</b></td><td class="small">${esc(r.author)}</td><td class="small">${esc(r.at)}</td><td class="small">${r.size} KB</td><td>${r.status === '启用' ? '<span class="tag ok">启用</span>' : r.errors?.length ? '<span class="tag bad">校验未通过</span>' : `<span class="tag gray">${r.status}</span>`}</td>
  <td class="small">${r.stats.gen} / ${pct(r.stats.pass, r.stats.gen)}% / ${pct(r.stats.fix, r.stats.gen)}% / ${r.stats.drop}</td>
  <td><div class="row" style="gap:4px"><button class="small" data-act="ruleView" data-v="${r.id}">查看</button><button class="small" data-act="ruleTrialOpen" data-v="${r.id}" ${r.errors?.length ? 'disabled' : ''}>试运行</button>${vs.length > 1 && r === vs[0] ? `<button class="small" data-act="ruleDiff" data-v="${esc(n)}">版本对比</button>` : ''}
  ${r.status === '启用' ? `<button class="small" data-act="ruleSt" data-v="${r.id}" data-s="停用">停用</button>` : `<button class="small" data-act="ruleSt" data-v="${r.id}" data-s="启用" ${r.errors?.length ? 'disabled' : ''}>${r.status === '历史版本' ? '回退到此版本' : '启用'}</button>`}</div></td></tr>`).join('')}</table></div></div>`; }).join('')}`;
}
Object.assign(A, {
  ruleTpl() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([RULE_TEMPLATE], { type: 'text/markdown;charset=utf-8' })); a.download = '出题规则模板.md'; a.click(); },
  ruleSt(d) {
    const r = S.rules.find(x => x.id === d.v);
    if (d.s === '启用') S.rules.filter(x => x.name === r.name && x.status === '启用').forEach(x => { x.status = '历史版本'; });
    r.status = d.s; log(`出题规则「${r.name} v${r.version}」${d.s}`); render(); toast(`${r.name} v${r.version} 已${d.s}`, 'ok');
  },
  ruleView(d) { const r = S.rules.find(x => x.id === d.v); modal(`<h3>${esc(r.name)} v${esc(r.version)}</h3><pre class="rule-pre">${esc(ruleText(r))}</pre><div class="row" style="justify-content:flex-end"><button class="primary" data-act="close">关闭</button></div>`, true); },
  ruleDiff(d) {
    const [a, b] = S.rules.filter(r => r.name === d.v).sort(byVer);
    modal(`<h3>版本对比 · ${esc(d.v)} v${b.version} → v${a.version}</h3>
    <table class="mini"><tr><th>章节</th><th>变化（原型示意）</th></tr>
    <tr><td>多知识点合并</td><td><span class="diff-add">+ 每个知识点至少落在一个评分要点、一个空或一个错误选项上</span><br><span class="diff-add">+ 后一步的题面不能泄露前一步的答案</span></td></tr>
    <tr><td>干扰项与常见错误</td><td><span class="diff-add">+ 周长和面积混淆；时间按十进制计算；拼接图形重合的边仍计入周长</span></td></tr>
    <tr><td>自检清单</td><td><span class="diff-del">− 答案正确</span><br><span class="diff-add">+ 答案唯一且正确，计算已验算</span></td></tr></table>
    <h4>效果对比</h4><table class="mini"><tr><th></th><th>v${b.version}</th><th>v${a.version}</th></tr><tr><td>生成</td><td>${b.stats.gen}</td><td>${a.stats.gen}</td></tr><tr><td>验证通过率</td><td>${pct(b.stats.pass, b.stats.gen)}%</td><td>${pct(a.stats.pass, a.stats.gen)}%</td></tr>
    <tr><td>验证更正率</td><td>${pct(b.stats.fix, b.stats.gen)}%</td><td>${pct(a.stats.fix, a.stats.gen)}%</td></tr><tr><td>丢弃</td><td>${b.stats.drop}</td><td>${a.stats.drop}</td></tr><tr><td>学生实测难度（首次正确率）</td><td>71%</td><td>78%</td></tr></table>
    <div class="row" style="justify-content:flex-end"><button class="primary" data-act="close">关闭</button></div>`, true);
  },
  ruleImportOpen() {
    modal(`<h3>⬆️ 导入规则</h3><p class="small muted">上传 .md 文件或直接粘贴。每次导入生成一个新版本，旧版本保留，可对比、可回退。</p>
    <div class="row"><input type="file" accept=".md,.txt" data-chg="ruleFile"><button class="small" data-act="ruleFill" data-v="good">填入模板</button><button class="small" data-act="ruleFill" data-v="bad">填入一份缺章节的示例</button></div>
    <textarea id="ruleText" rows="14" style="margin-top:8px" placeholder="粘贴规则 Markdown"></textarea><div id="ruleRes"></div>
    <div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">取消</button><button class="primary" data-act="ruleCheck">校验</button></div>`, true);
  },
  ruleFill(d) { document.getElementById('ruleText').value = d.v === 'bad' ? BAD_RULE : RULE_TEMPLATE.replace('（规则名称，如：小学数学出题规则）', '小学数学出题规则').replace('（姓名）', '张老师').replace('版本: 1.0', '版本: 1.3'); },
  ruleCheck() {
    const text = val('ruleText'); if (!text.trim()) return toast('请先上传或粘贴规则', 'error');
    const v = validateRule(text); UI.ruleV = { text, ...v };
    document.getElementById('ruleRes').innerHTML = `<div class="card inner"><b>校验结果</b> · ${esc(v.meta['名称'] || '（无名称）')} v${esc(v.meta['版本'] || '?')} · ${v.kb.toFixed(1)} KB
    ${v.errors.length ? `<div class="error-box">✗ 不能启用，缺少或有误：<br>${v.errors.map(esc).join('<br>')}</div>` : '<div class="ok-box">✓ 元信息齐全，必需章节齐全，示例可以解析</div>'}
    ${v.warns.length ? `<div class="hint-box small">${v.warns.map(esc).join('<br>')}</div>` : ''}
    <div class="row" style="justify-content:flex-end">${v.errors.length ? '<button data-act="ruleSave" data-s="停用">保存为草稿（不能启用）</button>' : '<button data-act="ruleSave" data-s="停用">保存（暂不启用）</button><button class="primary" data-act="ruleSave" data-s="启用">保存并启用</button>'}</div></div>`;
  },
  ruleSave(d) {
    const v = UI.ruleV; const name = v.meta['名称'] || '未命名规则';
    const r = { id: 'r' + Date.now(), name, version: v.meta['版本'] || '1.0', scope: `${v.meta['适用学科'] || '?'} · ${v.meta['适用年级'] || '全部年级'}`, types: (v.meta['适用题型'] || '').replace(/,\s*/g, '、'), author: v.meta['作者'] || '老师', status: d.s, at: todayStr(), size: Number(v.kb.toFixed(1)), stats: { gen: 0, pass: 0, fix: 0, drop: 0 }, text: v.text, errors: v.errors };
    if (S.rules.some(x => x.name === name && x.version === r.version)) r.version += '.1';
    if (r.status === '启用') S.rules.filter(x => x.name === name && x.status === '启用').forEach(x => { x.status = '历史版本'; });
    S.rules.push(r); log(`导入出题规则「${name} v${r.version}」${v.errors.length ? '（校验未通过）' : ''}`); closeModal(); render(); toast(`已保存 ${name} v${r.version}`, 'ok');
  },
  ruleTrialOpen(d) {
    const r = S.rules.find(x => x.id === d.v); const sub = S.subjects.find(s => r.scope.startsWith(s.name))?.id;
    const list = S.kps.filter(k => k.status === '启用' && isComb(k) && (!sub || k.subject === sub) && ['P3', 'P4', 'J3'].includes(k.stage));
    modal(`<h3>试运行 · ${esc(r.name)} v${esc(r.version)}</h3><p class="small muted">选一个知识点，用这份规则生成 3 道题。结果<b>只预览、不入库</b>，并显示程序检查和验证结果。</p>
    <div class="form-grid"><div><label>知识点</label><select id="trKp">${list.map(k => `<option value="${k.id}">${stageName(k.stage)} · ${esc(k.name)}</option>`).join('')}</select></div><div><label>题型</label><select id="trType">${Object.entries(QTYPE_NAME).map(([t, n]) => `<option value="${t}">${n}</option>`).join('')}</select></div></div>
    <div id="trRes"></div><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">关闭</button><button class="primary" data-act="ruleTrial" data-v="${r.id}">试运行</button></div>`, true);
  },
  async ruleTrial(d) {
    const r = S.rules.find(x => x.id === d.v); const id = val('trKp'); let type = val('trType'); const k = kpById(id);
    if (!qtypesOf(k).includes(type)) type = qtypesOf(k)[0];
    const box = document.getElementById('trRes'); box.innerHTML = '<p>⏳ 出题 AI 生成中…</p>'; await sleep(500); box.innerHTML = '<p>⏳ 程序检查、验证 AI 检查中…</p>'; await sleep(500);
    const out = simulateGen([id], type, 1, 3, true);
    box.innerHTML = `<div class="hint-box small">试运行结果不入库。${type !== val('trType') ? `该知识点不适用所选题型，已改为${QTYPE_NAME[type]}。` : ''}</div>${out.map((x, i) => `<div class="card inner"><div class="row between"><b>试运行 ${i + 1} · ${esc(x.vk)}</b>${verifyTag(x)}</div>${qFull(x, true)}<div class="small muted">程序检查：格式 ✓ 知识点落点 ✓${x.prog ? ' 复算 ✓' : ''} · 规则 ${esc(r.name)} v${esc(r.version)}</div>${x.verify?.reason ? `<div class="hint-box small">${esc(x.verify.reason)}</div>` : ''}</div>`).join('')}`;
  },
});
CHG.ruleFile = el => { const f = el.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { document.getElementById('ruleText').value = r.result; }; r.readAsText(f); };
