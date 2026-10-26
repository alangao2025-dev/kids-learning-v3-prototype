'use strict';
/* 学习系统 3.0 原型：路由、公共组件、入口页 */

const A = {};   // 点击动作
const CHG = {}; // change 事件
const stars = n => `<span class="stars">${'⭐'.repeat(Math.max(0, n))}</span>`;
const lvTag = n => `<span class="tag gray">★${n}</span>`;
const typeTag = t => `<span class="tag ${{ single: '', fill: 'ok', applied: 'warn' }[t]}">${TYPE_NAME[t]}</span>`;
const kpTags = ids => ids.map((id, i) => `<span class="tag ${i ? 'gray' : ''}" title="${i ? '' : '主知识点'}">${esc(kpName(id))}</span>`).join(' ');
const srcTag = q => `<span class="tag ${{ 'AI 生成': '', '老师导入': 'ok', '2.x 保留': 'gray' }[q.source] ?? 'gray'}">${esc(q.source)}</span>`;
function verifyTag(q) {
  const r = q.verify?.result;
  if (!r) return '<span class="tag gray">未验证</span>';
  return `<span class="tag ${{ 通过: 'ok', 更正: 'warn', 不能用: 'bad' }[r]}">${r === '更正' ? '已被验证 AI 更正' : '验证' + r}</span>`;
}
const statusTag = s => `<span class="tag ${{ 启用: 'ok', 待审核: 'warn', 停用: 'gray', 丢弃: 'bad' }[s] || 'gray'}">${esc(s)}</span>`;
const q$ = id => S.qs.find(q => q.id === id);
const short = (s, n = 38) => { s = String(s ?? '').replace(/\n/g, ' '); return s.length > n ? s.slice(0, n) + '…' : s; };
const btnRow = inner => `<div class="row" style="justify-content:flex-end;margin-top:14px">${inner}</div>`;

// ================= 弹窗与提示 =================
function modal(html, wide) { document.getElementById('modal-root').innerHTML = `<div class="modal-mask" data-act="maskClose"><div class="modal ${wide ? 'wide' : ''}" id="modal">${html}</div></div>`; }
function setModal(html) { const m = document.getElementById('modal'); if (m) m.innerHTML = html; }
function closeModal() { document.getElementById('modal-root').innerHTML = ''; }
function toast(msg, type = '') { const t = document.createElement('div'); t.className = `toast ${type}`; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2800); }
const val = id => document.getElementById(id)?.value ?? '';
const checked = id => !!document.getElementById(id)?.checked;
function download(name, text, type = 'text/plain') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
A.close = () => closeModal();
A.maskClose = () => closeModal();

// ================= 题目展示 =================
// 只读展示（教师端详情、试运行、生成结果）
function qFull(q, opts = {}) {
  let h = `<div class="qv-stem">${esc(q.stem)}</div>`;
  if (q.type === 'single') h += `<div class="qv-opts">${q.options.map(x => `<div class="qv-opt ${x.id === q.answer ? 'right' : ''}"><b>${x.id}.</b> ${esc(x.text)}${x.id === q.answer ? ' <span class="tag ok">正确答案</span>' : x.diag ? ` <span class="small muted">错误诊断：${esc(x.diag)}</span>` : ''}</div>`).join('')}</div>`;
  if (q.type === 'fill') h += `<table class="mini"><tr><th>空</th><th>可接受答案</th>${q.blankKp ? '<th>对应知识点</th>' : ''}</tr>${q.blanks.map((acc, i) => `<tr><td>${'①②③④⑤'[i]}</td><td>${acc.map(esc).join(' / ')}</td>${q.blankKp ? `<td>${esc(kpName(q.blankKp[i]))}</td>` : ''}</tr>`).join('')}</table>`;
  if (q.type === 'applied') h += `<div class="small"><b>标准答案：</b>${esc(q.answer)}</div>
    <div class="small" style="margin-top:6px"><b>评分要点</b>（交给判题 AI，用于判断“错在哪一步”）</div>
    <table class="mini"><tr><th>#</th><th>这一步要做什么</th><th>关键结果</th><th>对应知识点</th><th>分值</th></tr>${q.rubric.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.step)}</td><td><code>${esc(r.key)}</code></td><td>${r.kp ? esc(kpName(r.kp)) : '<span class="muted">—</span>'}</td><td>${r.score}</td></tr>`).join('')}</table>`;
  if (q.explain && !opts.noExplain) h += `<div class="small muted" style="margin-top:6px"><b>解析：</b>${esc(q.explain)}</div>`;
  return h;
}

// 每个知识点在题中的落点（§4.4，验收 3）
function kpCoverage(q) {
  return q.kps.map(id => {
    let where = '';
    if (q.type === 'applied') { const i = q.rubric.findIndex(r => r.kp === id); if (i >= 0) where = `评分要点第 ${i + 1} 步`; }
    if (q.type === 'fill') { const i = (q.blankKp || (q.kps.length === 1 ? q.blanks.map(() => id) : [])).indexOf(id); if (i >= 0) where = `第 ${'①②③④⑤'[i]} 空`; }
    if (q.type === 'single') { if (q.kps.length === 1) where = '整题'; else { const x = q.options.find(x => x.diag && x.diag.includes(kpName(id))); if (x) where = `错误选项 ${x.id} 的诊断`; } }
    return { id, where };
  });
}

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
  let html; let cls = '';
  if (parts[0] === 't') html = teacherPage(parts[1] || 'home', parts[2], q);
  else if (parts[0] === 's' && me()) { cls = me().stage[0] === 'J' ? 'kid teen' : 'kid'; html = studentPage(parts[1] || 'home', parts[2], q); }
  else { cls = 'kid'; html = entryPage(); }
  document.body.className = cls; app.className = 'app-root ' + cls;
  app.innerHTML = html + `<div class="proto-badge" data-act="goEntry">原型 · 切换角色</div>`;
  save();
}
A.goEntry = () => go('#/');
A.setq = d => setQ(d.key, d.v);
CHG.setq = el => setQ(el.dataset.key, el.value);
A.go = d => go(d.v);

// ================= 入口 =================
function entryPage() {
  const card = (act, v, avatar, name, sub, desc) => `<div class="card" data-act="${act}" data-v="${v}"><div class="row"><span class="big-avatar">${avatar}</span><div><b style="font-size:19px">${name}</b><div class="muted small">${sub}</div></div></div><p class="small muted" style="margin-bottom:0">${desc}</p></div>`;
  const paths = [
    ['知识点关系', '老师 → 知识点 → 三年级数学 → 切换“关系图”“合并表”；在合并表中点格子切换 ✓ / ✗；在「秒的认识与时间单位换算」详情里把「计算经过的时间」加为前置（会形成环，被拦下）', '#/t/kp'],
    ['联网获取知识点', '知识点 →“联网获取教材知识点”→ 选人教版三年级上册 → 看差异预览和 AI 建议的关系 → 勾选入库', '#/t/kp'],
    ['出题规则', '出题规则 → 下载模板 → 导入一份缺章节的规则看校验结果 → 试运行', '#/t/rules'],
    ['AI 生成习题', '题库 →“AI 生成习题”→ 选「长方形和正方形的周长」+「多位数乘一位数」（可合并），再试「倍的认识」+「认识几分之一」（不可合并）→ 生成', '#/t/bank'],
    ['题目与转换', '题库按题型、来源筛选；看 q2（判断 → 单选）、q6（分步 → 应用题）的转换和评分要点；看一个变式组', '#/t/bank'],
    ['AI 配置', '五个角色的主 / 备选 / 验证；开发代理模式开关；AI 更正记录', '#/t/ai'],
    ['应用题判分', '学生小禾 → 练习 → 数学 →“应用题” → 做图书室那道题，故意把第一步算错（如 465 − 178 = 277），看“错在哪里”和验证结果，点“申诉”；再到老师 → 判题复核', '#/'],
    ['学习评估', '老师 → 学生 → 小禾 → 学习策略 →“立即评估”，看比例和难度怎么调整、超限部分怎么截断；锁定一个知识点', '#/t/stu/s1'],
    ['纸质试卷', '老师 → 纸质试卷 → 预览新版式（单选在括号里写字母）→ 查看 J3-007 识别结果中验证 AI 的更正', '#/t/paper'],
  ];
  return `<main class="entry">
  <h1>📚 学习系统 3.0 原型</h1>
  <div class="proto-note">这是 3.0 开发前的<b>可点击原型</b>，数据只保存在当前浏览器里。所有 AI 的工作（联网获取、出题、判题、识别、评估、验证）都是<b>模拟结果</b>，相当于“开发代理模式”，不代表真实 AI 的效果。原型只录入了三年级数学、英语和初三物理的部分知识点和题目。2.x 的正式版和原型都不受影响。</div>
  <h2>建议体验路径</h2>
  <div class="card"><ol class="paths">${paths.map(([t, d, h]) => `<li><b>${t}</b>：${d} ${h !== '#/' ? `<a href="${h}" data-act="loginT" data-v="${h}">去看 →</a>` : ''}</li>`).join('')}</ol></div>
  <h2>选择角色</h2>
  <div class="who">
    ${card('loginT', '#/t/home', '👩‍🏫', '老师', '教师 / 管理员', '知识点与关系、题库与 AI 出题、出题规则、AI 配置、判题复核、学习策略、纸质试卷')}
    ${S.students.map(s => card('loginS', s.id, s.avatar, esc(s.nick), `${STAGE_NAME[s.stage]} · ${s.user}`, s.id === 's1' ? '三年级：数学、英语。练习中有单选、填空和应用题，应用题由判题 AI 判分并指出错在哪一步' : '初三：物理（电学）。初中风格页面')).join('')}
  </div>
  <h2>原型工具</h2>
  <div class="card"><div class="row"><button class="danger" data-act="reset">重置原型数据</button><span class="small muted">恢复到初始数据（清除你在原型中做的所有修改）</span></div></div>
  </main>`;
}
A.loginT = d => { S.who = 'teacher'; go(d.v && d.v.startsWith('#') ? d.v : '#/t/home'); };
A.loginS = d => { S.who = 'student'; S.sid = d.v; UI.sess = null; go('#/s/home'); };
A.reset = () => { if (!confirm('确定重置原型数据？')) return; resetAll(); UI.sess = null; toast('已重置', 'ok'); go('#/'); };

// ================= 事件 =================
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  if (el.dataset.act === 'maskClose' && e.target !== el) return;
  const fn = A[el.dataset.act]; if (!fn) return;
  if (el.tagName !== 'INPUT' && el.tagName !== 'LABEL') e.preventDefault();
  fn(el.dataset, el); save();
});
document.addEventListener('change', e => { const el = e.target; const fn = CHG[el.dataset.chg]; if (fn) { fn(el); save(); } });
window.addEventListener('hashchange', () => { closeModal(); render(); });
window.addEventListener('DOMContentLoaded', () => { load(); render(); });
