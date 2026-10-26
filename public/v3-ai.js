'use strict';
/* 学习系统 3.0 原型：教师端 · AI 配置（§8）、判题复核（§6）、学习策略（§9）；最后初始化 */

function tAi(_, q) {
  const filt = q.get('cr') || ''; const U = S.usage;
  const opt = (sel, allowEmpty, emptyText = '（不使用）') => `${allowEmpty ? `<option value="">${emptyText}</option>` : ''}${S.profiles.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}`;
  return `<h1>AI 配置</h1>
  <div class="card dev-card"><div class="row between"><div style="flex:1"><b>🧪 开发代理模式</b><div class="small muted">开启时所有角色使用“开发代理（离线）”：系统照常生成请求、进入 AI 任务队列，由开发方离线完成后按同样格式写回。上线时关闭，把各角色改为真实 AI，不改代码；切换前用“测试连接”和出题规则“试运行”各验证一次。</div></div>
  <label class="switch"><input type="checkbox" data-chg="devMode" ${S.devMode ? 'checked' : ''}><span></span></label></div></div>
  <h2>五个角色</h2>
  <div class="role-grid">${ROLES.map(R => { const r = S.roles[R.id]; const same = R.verify && r.verify && r.verify === r.main; return `<div class="card role"><div class="row between"><b>${R.icon} ${R.name}</b>${r.main ? `<span class="tag ${r.main === 'dev' ? 'warn' : 'ok'}">${esc(profName(r.main))}</span>` : '<span class="tag gray">未配置</span>'}</div>
    <div class="small muted">${esc(R.desc)}</div>${R.note ? `<div class="small muted">${esc(R.note)}</div>` : ''}
    <label>主 AI</label><select data-chg="roleSet" data-r="${R.id}" data-k="main">${opt(r.main, ['kp', 'eval', 'ocr'].includes(R.id), { kp: '（不填，用出题 AI）', eval: '（不填，用规则算法）', ocr: '（不填，老师手动录入）' }[R.id])}</select>
    <label>备选 AI（主 AI 失败时自动切换）</label><select data-chg="roleSet" data-r="${R.id}" data-k="backup">${opt(r.backup, true)}</select>
    ${R.verify ? `<label>验证 AI</label><select data-chg="roleSet" data-r="${R.id}" data-k="verify">${opt(r.verify, true)}</select><div class="small muted">${esc(R.verify)}</div>
    <label>验证比例</label><select data-chg="roleSet" data-r="${R.id}" data-k="ratio">${['全部', '错 / 部分对 / 低可信度', '低可信度和单选', '抽查 20%'].map(x => `<option ${x === r.ratio ? 'selected' : ''}>${x}</option>`).join('')}</select>
    ${same ? '<div class="hint-box small">验证 AI 与主 AI 是同一个模型，验证效果会变差。</div>' : ''}` : '<div class="small muted" style="margin-top:8px">验证：—（由老师审核 / 系统限制范围）</div>'}</div>`; }).join('')}</div>
  <p class="small muted">每个结果只验证一轮，不会把更正结果再交回主 AI；验证 AI 自己没把握时不更正，交老师。主 AI 超时、报错、额度用完或返回格式不对（重试 1 次）时切换备选 AI；连续失败 5 次的 AI 暂停 10 分钟。发给 AI 的内容不含学生姓名、账号和照片中的姓名区域。</p>
  <div class="row between"><h2>AI 配置列表</h2><button data-act="profEdit" data-v="">＋ 新增配置</button></div>
  <div class="card table-wrap"><table><tr><th>名称</th><th>服务商</th><th>模型</th><th>接口地址</th><th>密钥</th><th>能力</th><th></th></tr>
  ${S.profiles.map(p => `<tr><td><b>${esc(p.name)}</b></td><td>${esc(p.vendor)}</td><td class="small">${esc(p.model)}</td><td class="small">${esc(p.url)}</td><td>${p.id === 'dev' ? '—' : p.key ? '<span class="tag ok">已设置</span>' : '<span class="tag gray">未填写</span>'}</td><td>${p.web ? '<span class="tag">联网</span> ' : ''}${p.vision ? '<span class="tag">看图</span>' : ''}</td>
  <td><div class="row" style="gap:4px"><button class="small" data-act="profTest" data-v="${p.id}">测试连接</button>${p.id !== 'dev' ? `<button class="small" data-act="profEdit" data-v="${p.id}">编辑</button>` : ''}</div></td></tr>`).join('')}</table></div>
  <h2>用量（本月）</h2><div class="card table-wrap"><table><tr><th>角色</th><th>调用次数</th><th>Token</th><th>失败</th><th>切换备选</th><th>验证更正</th></tr>
  ${ROLES.map(R => `<tr><td>${R.icon} ${R.name}</td><td>${U[R.id][0]}</td><td>${U[R.id][1].toLocaleString()}</td><td>${U[R.id][2]}</td><td>${R.id === 'ocr' ? 2 : 0}</td><td>${U[R.id][3]}</td></tr>`).join('')}</table>
  <p class="small muted">每日预算 ${S.config.dailyBudget.toLocaleString()} Token、每月 ${S.config.monthlyBudget.toLocaleString()} Token（系统配置中修改）。达到预算后停止出题和评估，判题和识别优先保留。</p></div>
  <h2>AI 任务队列</h2><div class="card table-wrap"><table><tr><th>时间</th><th>角色</th><th>请求</th><th>状态</th><th></th></tr>
  ${S.jobs.map(j => `<tr><td class="small">${j.at}</td><td>${ROLES.find(r => r.id === j.role).name}</td><td class="small">${esc(j.desc)}</td><td><span class="tag ${j.state === '已完成' ? 'ok' : 'warn'}">${j.state}</span></td><td>${j.state !== '已完成' ? `<button class="small" data-act="jobDone" data-v="${j.id}">模拟开发方完成</button>` : ''} <button class="small link" data-act="jobView" data-v="${j.id}">请求内容</button></td></tr>`).join('')}</table></div>
  <div class="row between"><h2>AI 更正记录</h2><div class="tabs" style="margin:0">${[['', '全部'], ['gen', '出题'], ['judge', '判题'], ['ocr', '识别']].map(([v, n]) => `<a class="${v === filt ? 'on' : ''}" data-act="setq" data-key="cr" data-v="${v}">${n}</a>`).join('')}</div></div>
  <div class="card table-wrap">${corrTable(c => !filt || c.role === filt)}
  <p class="small muted">老师的判定用于统计各 AI 的可靠程度：已判定 ${S.corrections.filter(c => c.judge).length} 条，其中更正正确 ${pct(S.corrections.filter(c => c.judge === '更正正确').length, S.corrections.filter(c => c.judge).length)}%。</p></div>`;
}
const corrTable = f => `<table><tr><th>时间</th><th>角色</th><th>对象</th><th>更正前</th><th>更正后</th><th>老师判定</th></tr>${S.corrections.map((c, i) => [c, i]).filter(([c]) => f(c)).map(([c, i]) => `<tr><td class="small">${c.at}</td><td>${ROLES.find(r => r.id === c.role).name}</td><td class="small">${esc(c.target)}</td><td class="small diff-del">${esc(c.before)}</td><td class="small diff-add">${esc(c.after)}</td>
  <td>${c.judge ? `<span class="tag ${c.judge === '更正错误' ? 'bad' : 'ok'}">${c.judge}</span>` : `<button class="small" data-act="corJudge" data-v="${i}" data-j="更正正确">更正正确</button><button class="small" data-act="corJudge" data-v="${i}" data-j="更正错误">更正错误</button>`}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">没有记录</td></tr>'}</table>`;
Object.assign(CHG, {
  devMode(el) {
    S.devMode = el.checked;
    if (el.checked) { for (const r of Object.values(S.roles)) { if (r.main) r.main = 'dev'; if (r.verify) r.verify = 'dev'; } toast('已开启开发代理模式'); }
    else { Object.assign(S.roles.kp, { main: 'qw' }); Object.assign(S.roles.gen, { main: 'ds', verify: 'qw' }); Object.assign(S.roles.judge, { main: 'ds', verify: 'qw' }); Object.assign(S.roles.ocr, { main: 'mu', backup: 'db', verify: 'db' }); Object.assign(S.roles.eval, { main: 'ds' }); toast('已改为真实 AI。请先填写密钥并“测试连接”，再用出题规则“试运行”验证'); }
    log(`${el.checked ? '开启' : '关闭'}开发代理模式`); render();
  },
  roleSet(el) { S.roles[el.dataset.r][el.dataset.k] = el.value; if (el.dataset.k === 'main' && el.value && el.value !== 'dev') S.devMode = false; log(`AI 配置：${ROLES.find(r => r.id === el.dataset.r).name}的${{ main: '主 AI', backup: '备选 AI', verify: '验证 AI', ratio: '验证比例' }[el.dataset.k]}改为 ${profName(el.value) || el.value}`); render(); },
});
Object.assign(A, {
  async profTest(d) {
    const p = prof(d.v); toast(`正在测试 ${p.name}…`); await sleep(700);
    if (p.id === 'dev') return toast('开发代理：请求会进入 AI 任务队列，由开发方完成', 'ok');
    if (!p.key) return toast(`${p.name}：连接失败，没有填写密钥`, 'error');
    toast(`${p.name}：连接成功（模拟），响应 0.8 秒`, 'ok');
  },
  profEdit(d) {
    const p = d.v ? prof(d.v) : { id: '', name: '', vendor: '', model: '', url: '', key: false, vision: false, web: false };
    modal(`<h3>${d.v ? '编辑' : '新增'} AI 配置</h3><div class="form-grid">
    <div><label>名称</label><input id="pfName" value="${esc(p.name)}"></div><div><label>服务商</label><select id="pfVendor">${['DeepSeek', '阿里云百炼', '火山方舟', 'MinerU', '其他（兼容 OpenAI 格式）'].map(v => `<option ${v === p.vendor ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    <div><label>模型名称</label><input id="pfModel" value="${esc(p.model)}"></div><div><label>接口地址</label><input id="pfUrl" value="${esc(p.url === '—' ? '' : p.url)}"></div>
    <div><label>密钥</label><input id="pfKey" type="password" placeholder="${p.key ? '已设置，留空不修改' : '未填写'}" autocomplete="off"></div><div><label>温度 / 单次超时（秒）</label><div class="row"><input value="0.3" style="width:70px"><input value="30" style="width:70px"></div></div>
    <div><label class="inline"><input type="checkbox" id="pfWeb" ${p.web ? 'checked' : ''} style="min-height:0"> 支持联网（知识点整理用）</label></div><div><label class="inline"><input type="checkbox" id="pfVis" ${p.vision ? 'checked' : ''} style="min-height:0"> 支持看图（识别用）</label></div></div>
    <p class="small muted">密钥保存在 Cloudflare Secret 或数据库加密字段中，保存后不回显，不写入日志和备份导出。</p>
    <div class="row" style="justify-content:flex-end;margin-top:10px">${p.key ? `<button class="danger" data-act="profKeyClear" data-v="${p.id}">清除密钥</button>` : ''}<button data-act="close">取消</button><button class="primary" data-act="profSave" data-v="${p.id}">保存</button></div>`, true);
  },
  profSave(d) { let p = prof(d.v); if (!p) { p = { id: 'ai' + Date.now() }; S.profiles.push(p); } Object.assign(p, { name: val('pfName') || '未命名', vendor: val('pfVendor'), model: val('pfModel'), url: val('pfUrl') || '—', web: checked('pfWeb'), vision: checked('pfVis') }); if (val('pfKey')) p.key = true; log(`保存 AI 配置「${p.name}」`); closeModal(); render(); toast('已保存', 'ok'); },
  profKeyClear(d) { prof(d.v).key = false; log(`清除 AI 配置「${prof(d.v).name}」的密钥`); closeModal(); render(); toast('密钥已清除'); },
  jobDone(d) { S.jobs.find(j => j.id === d.v).state = '已完成'; render(); toast('开发方已写回结果（模拟）', 'ok'); },
  jobView(d) {
    const j = S.jobs.find(x => x.id === d.v);
    const req = j.role === 'eval' ? { role: 'eval', student: 'S-0003', stage: 'J3', kps: [{ id: 'physics-J3-4', recent: '1011010110', counts: [3, 0] }], limits: { ratio: [5, 40], levelStep: 1, perDayMax: dayCap('s3') } } : { role: j.role, rule: '小学数学出题规则 v1.2', kps: [{ id: 'math-P3-9', name: '认识几分之一和几分之几' }], type: 'fill', level: 2, n: 5, output_format: '（系统固定的 JSON 字段说明）' };
    modal(`<h3>请求内容</h3><p class="small muted">发给 AI 的内容不含学生姓名和账号，学生用内部编号代替。</p><pre>${esc(JSON.stringify(req, null, 2))}</pre><div class="row" style="justify-content:flex-end"><button class="primary" data-act="close">关闭</button></div>`, true);
  },
  corJudge(d) { S.corrections[Number(d.v)].judge = d.j; render(); },
});

// ================= 判题复核 =================
function tReview(_, q) {
  const tab = q.get('tab') || 'todo';
  const list = S.review.filter(r => tab === 'todo' ? r.status !== '已处理' : r.status === '已处理');
  return `<h1>判题复核</h1><div class="proto-note">这里处理：判题 AI 可信度低或验证后仍有分歧的应用题（确认前不计掌握度）、学生对判分的申诉（含填空申诉），以及判题 AI 更正记录抽查。学生只看到判分结果和“错在哪里”，不提供和 AI 对话的入口。</div>
  <div class="tabs">${[['todo', `待处理（${pendingReview()}）`], ['done', '已处理'], ['fix', `判题 AI 更正抽查（${S.corrections.filter(c => c.role === 'judge').length}）`]].map(([v, n]) => `<a class="${v === tab ? 'on' : ''}" data-act="setq" data-key="tab" data-v="${v}">${n}</a>`).join('')}</div>
  ${tab === 'fix' ? `<div class="card table-wrap">${corrTable(c => c.role === 'judge')}</div>` : list.map(reviewCard).join('') || '<div class="empty">没有需要处理的内容 🎉</div>'}`;
}
function reviewCard(r) {
  const q = Q[r.qid]; const s = student(r.sid);
  let body = `<div class="card inner small">${String(q.stem).replace(/\n/g, '<br>')}</div>`;
  if (q.type === 'applied') {
    const g = aiJudge(q, r.answer);
    body += `<div class="form-grid"><div><label>学生答案</label><pre>${esc(r.answer)}</pre></div><div><label>评分要点</label><table class="mini">${q.rubric.map((x, i) => `<tr><td>${i + 1}. ${esc(x.step)}</td><td><code>${esc(x.key)}</code></td><td>${x.score} 分</td><td>${g.steps[i].ok ? (g.steps[i].carry ? '✅ 带错判对' : '✅') : '❌'}</td></tr>`).join('')}</table></div></div>
    ${r.ai ? `<div class="small"><b>判题 AI：</b>${esc(r.ai.verdict)}（${r.ai.score}/${r.ai.full}，可信度 ${r.ai.conf}）${r.ai.where ? '　错在哪里：' + esc(r.ai.where) : ''}</div>` : ''}${r.verify ? `<div class="small"><b>验证 AI：</b>${esc(r.verify)}</div>` : ''}`;
  } else {
    const ans = r.ans || [];
    body += `<table class="mini"><tr><th>空</th><th>学生写的</th><th>可接受答案</th><th>系统判</th></tr>${q.blanks.map((b, i) => `<tr><td>${CIRCLED[i]} ${esc(b.pre || '')}</td><td>${esc(ans[i])}</td><td>${b.ans.map(esc).join(' / ')}</td><td>${fillOk(q, b, ans[i]) ? '✅' : '❌'}</td></tr>`).join('')}</table>`;
  }
  body += `<div class="hint-box small">${esc(r.reason)}</div>`;
  const full = q.type === 'applied' ? q.rubric.reduce((a, x) => a + x.score, 0) : 0;
  const actions = r.status === '已处理' ? `<div class="ok-box small">已处理：${esc(r.result)}</div>`
    : q.type === 'applied' ? `<div class="row"><button data-act="rvKeep" data-v="${r.id}">确认 AI 结论</button><span class="small muted">或改判：</span><select id="rvV-${r.id}"><option>对</option><option>部分对</option><option>错</option></select><input id="rvS-${r.id}" type="number" min="0" max="${full}" value="${r.ai?.score ?? 0}" style="width:70px"> / ${full} 分<button class="primary" data-act="rvChange" data-v="${r.id}">改判</button></div>`
      : `<div class="row"><button data-act="rvKeep" data-v="${r.id}">维持原判</button><label class="inline small"><input type="checkbox" id="rvAdd-${r.id}" checked style="min-height:0"> 把学生的写法加入可接受答案（之后所有学生都按新答案判）</label><button class="primary" data-act="rvAccept" data-v="${r.id}">改判为对</button></div>`;
  return `<div class="card"><div class="row between"><div><b>${s.avatar} ${esc(s.nick)}</b> · ${esc(r.kind)} · <a data-act="qView" data-v="${q.id}" style="cursor:pointer">${q.id}</a> ${qTypeTag(q)}</div><span class="small muted">${r.at}</span></div>${body}${actions}</div>`;
}
Object.assign(A, {
  rvKeep(d) { const r = S.review.find(x => x.id === d.v); r.status = '已处理'; r.result = r.ai ? `确认 AI 结论（${r.ai.verdict}，${r.ai.score} 分）` : '维持原判'; settleCredit(r, r.ai?.verdict === '对'); log(`判题复核：${student(r.sid).nick} · ${r.qid}，${r.result}`); render(); toast('已处理', 'ok'); },
  rvChange(d) {
    const r = S.review.find(x => x.id === d.v); const v = val('rvV-' + d.v); const sc = Number(val('rvS-' + d.v));
    r.status = '已处理'; r.result = `老师改判为“${v}”，${sc} 分`;
    if (r.ai && (r.ai.verdict !== v || r.ai.score !== sc)) S.corrections.unshift({ role: 'judge', at: nowStr(), target: `${student(r.sid).nick} · ${r.qid}`, before: `${r.ai.verdict}（${r.ai.score} 分）`, after: `老师改判：${v}（${sc} 分）`, judge: '老师复核' });
    settleCredit(r, v === '对'); log(`判题复核：${student(r.sid).nick} · ${r.qid}，${r.result}`); render(); toast('已改判，学生端可以看到结果', 'ok');
  },
  rvAccept(d) {
    const r = S.review.find(x => x.id === d.v); const q = Q[r.qid]; const ans = r.ans || []; const added = [];
    if (checked('rvAdd-' + d.v)) q.blanks.forEach((b, i) => { if (ans[i] && !fillOk(q, b, ans[i])) { b.ans.push(ans[i]); added.push(`第 ${CIRCLED[i]} 空加入“${ans[i]}”`); } });
    if (added.length) persistQ(q);
    r.status = '已处理'; r.result = `改判为对${added.length ? '；' + added.join('，') : ''}`; settleCredit(r, true); log(`判题复核：${student(r.sid).nick} · ${r.qid}，${r.result}`); render(); toast(r.result, 'ok');
  },
});

// ================= 学习策略（学生详情） =================
function strategyCard(sid) {
  const s = student(sid); const st = S.strategy[sid]; const ks = evalKps(sid); const cap = dayCap(sid);
  const subs = [...new Set(ks.map(k => k.subject))];
  return `<div class="card"><div class="row between"><h3 style="margin:0">📈 学习策略</h3><div class="row"><button class="primary" data-act="evalNow" data-v="${sid}">立即评估</button><button data-act="evalRule" data-v="${sid}">用规则算法重算</button></div></div>
  <div class="row" style="margin:8px 0"><span class="tag ${st.src.startsWith('评估') ? '' : 'gray'}">${esc(st.src)}</span><span class="small muted">${st.at} 更新${st.why ? ' · ' + esc(st.why) : ''} · 评估 AI：${S.roles.eval.main ? esc(profName(S.roles.eval.main)) : '未配置（使用规则算法）'}</span></div>
  <div class="hint-box small"><b>给老师的说明</b>（只给老师看）：${esc(st.note)}</div>
  ${st.clipped?.length ? `<div class="clip small"><b>系统截断记录</b>（评估 AI 输出超出限制的部分）：<ul>${st.clipped.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
  <div class="form-grid"><div><label>每日题量</label><b>${st.perDay} 题</b> <span class="small muted">（上限 ${cap} 题：约 ${S.config.dayMin[band(s.stage)]} 分钟）</span></div><div><label>题型比例</label>单选 ${st.mix.single}% · 填空 ${st.mix.fill}% · 应用题 ${st.mix.applied}%</div><div><label>目标正确率</label>${S.config.targetAcc[0]}%～${S.config.targetAcc[1]}%（系统配置中修改）</div></div>
  ${subs.map(sub => `<h4 style="margin:14px 0 4px">${subj(sub).icon} ${subj(sub).name}</h4><div class="table-wrap"><table><tr><th>知识点</th><th>掌握</th><th>最近 10 次</th><th>出题比例</th><th>目标难度</th><th>说明</th><th>锁定</th></tr>
  ${ks.filter(k => k.subject === sub).map(k => { const it = st.items[k.id]; if (!it) return ''; const m = peekM(sid, k.id); const stt = statusOf(sid, k); const r = rateOf(sid, k.id); const mm = missingMust(sid, k.id);
    return `<tr class="${it.lock ? 'locked' : ''}"><td><b>${esc(k.name)}</b></td><td><span class="tag ${stt.cls}">${stt.t}</span><div class="small muted">${m.c.slice(0, maxLevel(k)).map((c, i) => `★${i + 1} ${c}/${T(i + 1)}`).join(' · ')}</div></td>
    <td><span class="dots">${[...recentOf(sid, k.id)].map(x => `<i class="${x === '1' ? 'on' : 'off'}"></i>`).join('')}</span><div class="small muted">${r == null ? '未作答' : Math.round(r * 100) + '%'}</div></td>
    <td class="nw">${it.lock ? `<input type="number" min="0" max="40" value="${it.ratio}" data-chg="lockRatio" data-s="${sid}" data-k="${k.id}" style="width:64px">%` : it.ratio ? `<span class="rbar"><span style="width:${Math.min(100, it.ratio * 2.5)}%"></span></span><b>${it.ratio}%</b>` : '<span class="tag gray">不推荐</span>'}</td>
    <td>${it.lock ? `<select data-chg="lockLevel" data-s="${sid}" data-k="${k.id}">${Array.from({ length: maxLevel(k) }, (_, i) => i + 1).map(L => `<option ${L === it.level ? 'selected' : ''}>${L}</option>`).join('')}</select>` : `★${it.level}`}</td>
    <td class="small">${esc(it.why)}${mm.length ? `<div><span class="tag warn">学生端显示：建议先学「${mm.map(x => esc(kpById(x).name)).join('、')}」</span></div>` : ''}</td>
    <td><label class="inline"><input type="checkbox" data-chg="lockKp" data-s="${sid}" data-k="${k.id}" ${it.lock ? 'checked' : ''} style="min-height:0"> 🔒</label></td></tr>`; }).join('')}</table></div>`).join('')}
  <p class="small muted">出题比例按学科分别合计 100%，用于系统抽题的练习、考核和今日任务。系统限制：单个知识点 5%～40%；目标难度每次最多升降一级且不超过可用的最高等级；每种题型至少 10%；每日题量不超过上限。锁定的项评估时不修改。学生端只看到今日推荐的题和“建议先学”，不显示比例数字。老师布置的指定练习和考核不受学习策略影响。</p></div>`;
}
function strategyDiff(sid, before, after) {
  return `<table class="mini"><tr><th>知识点</th><th>出题比例</th><th>目标难度</th><th>说明</th></tr>${evalKps(sid).map(k => {
    const b = before.items[k.id], a = after.items[k.id]; if (!a) return '';
    const dr = a.ratio - (b?.ratio ?? 0); const dl = a.level - (b?.level ?? a.level);
    return `<tr class="${a.lock ? 'locked' : ''}"><td>${esc(k.name)}${a.lock ? ' 🔒' : ''}</td><td class="nw">${b?.ratio ?? '—'}% → <b>${a.ratio}%</b> ${dr ? `<span class="${dr > 0 ? 'up' : 'down'}">${dr > 0 ? '+' : ''}${dr}</span>` : ''}</td><td class="nw">★${b?.level ?? '—'} → <b>★${a.level}</b> ${dl ? `<span class="${dl > 0 ? 'up' : 'down'}">${dl > 0 ? '↑' : '↓'}</span>` : ''}</td><td class="small">${esc(a.why)}</td></tr>`;
  }).join('')}</table>`;
}
Object.assign(A, {
  async evalNow(d) {
    const sid = d.v; const before = JSON.parse(JSON.stringify(S.strategy[sid])); const useAi = !!S.roles.eval.main;
    const steps = useAi ? [`收集作答数据：${evalKps(sid).length} 个知识点最近的对错和用时（学生用内部编号代替姓名）`, `评估 AI（${profName(S.roles.eval.main)}）给出建议参数`, '系统检查限制：比例 5%～40%、难度每次最多升降一级、每日题量上限、锁定项不改', '保存学习策略'] : ['收集作答数据', '未配置评估 AI，按规则算法计算（§9.4）', '保存学习策略'];
    modal('<h3>📈 正在评估…</h3>', true); const m = () => document.querySelector('.modal');
    for (let i = 0; i <= steps.length; i++) { if (!m()) return; m().innerHTML = `<h3>📈 正在评估 ${esc(student(sid).nick)}…</h3><div class="loading-steps">${steps.map((s, j) => `<div>${j < i ? '✅' : j === i ? '⏳' : '⬜'} ${esc(s)}</div>`).join('')}</div>`; await sleep(450); }
    const after = evaluate(sid, '老师点“立即评估”'); S.strategy[sid] = after; log(`评估学习策略：${student(sid).nick}（${after.src}）`); save();
    m().innerHTML = `<h3>评估完成 · ${esc(after.src)}</h3><div class="hint-box small">${esc(after.note)}</div>
    ${after.clipped.length ? `<div class="clip small"><b>超出限制，已由系统截断：</b><ul>${after.clipped.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : '<div class="ok-box small">输出都在限制范围内</div>'}
    ${strategyDiff(sid, before, after)}<p class="small">每日题量：${before.perDay} → <b>${after.perDay}</b>　题型比例：单选 ${after.mix.single}% · 填空 ${after.mix.fill}% · 应用题 ${after.mix.applied}%</p>
    <div class="row" style="justify-content:flex-end"><button class="primary" data-act="closeRender">好的</button></div>`;
  },
  evalRule(d) { S.strategy[d.v] = { ...ruleStrategy(d.v, S.strategy[d.v]), why: '老师点“用规则算法重算”' }; log(`按规则算法重算学习策略：${student(d.v).nick}`); render(); toast('已按规则算法重算（锁定项保留）', 'ok'); },
  closeRender() { closeModal(); render(); },
});
Object.assign(CHG, {
  lockKp(el) { S.strategy[el.dataset.s].items[el.dataset.k].lock = el.checked; log(`${el.checked ? '锁定' : '解锁'} ${student(el.dataset.s).nick}「${kpById(el.dataset.k).name}」的出题比例和难度`); render(); toast(el.checked ? '已锁定，评估时不会修改' : '已解锁'); },
  lockRatio(el) { const st = S.strategy[el.dataset.s]; st.items[el.dataset.k].ratio = Math.max(0, Math.min(40, Number(el.value) || 0)); normalize(st.items); render(); },
  lockLevel(el) { S.strategy[el.dataset.s].items[el.dataset.k].level = Number(el.value); render(); },
});

// ================= 初始化 =================
load();
render();
