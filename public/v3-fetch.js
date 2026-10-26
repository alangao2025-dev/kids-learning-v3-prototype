'use strict';
/* 学习系统 3.0 原型：教师端 · 联网获取知识点、AI 建议关系、上传知识点 */

// 联网获取：已有该册知识点时只显示差异（§2.2）
async function fetchRun() {
  const F = FETCH_SIM[UI.fetchKey]; const run = UI.fetchTask = {};
  const steps = ['查找课程标准（2022 年版）中对应学段的内容要求', `查找《${F.book}》教材目录`, '整理单元知识清单', '与系统中已有知识点比对差异', '建议先学后学关系和可合并关系'];
  const box = () => document.querySelector('.modal');
  for (let i = 0; i <= steps.length; i++) {
    if (run.cancel || !box()) return;
    box().innerHTML = `<h3>🌐 正在获取…</h3><div class="progress"><div style="width:${pct(i, steps.length)}%"></div></div><div class="loading-steps" style="margin-top:10px">${steps.map((s, j) => `<div>${j < i ? '✅' : j === i ? '⏳' : '⬜'} ${s}</div>`).join('')}</div><p class="small muted">后台分批执行，可以取消。</p><div class="row" style="justify-content:flex-end"><button data-act="fetchCancel">取消获取</button></div>`;
    await sleep(420);
  }
  S.tasks.unshift({ id: 't' + Date.now(), type: '联网获取知识点', scope: F.book, status: '已完成', progress: 100, tokens: 6100, result: `差异：新增 ${F.add.length}、名称变化 ${F.rename.length}，建议关系 ${F.rels.length} 条（等待教师确认）`, at: nowStr() });
  S.usage.kp[0]++; S.usage.kp[1] += 6100; save();
  box().innerHTML = fetchPreview(F);
}
function fetchPreview(F) {
  const nm = x => x.startsWith('#') ? `<b>${esc(F.add[+x.slice(1)].name)}</b>（新）` : esc(kpById(x)?.name);
  return `<h3>差异预览 · ${esc(F.book)}</h3>
  <p class="small muted">来源：人教社教材目录、课程标准（2022 年版）。使用：${esc(profName(S.roles.kp.main || S.roles.gen.main))}。系统里已有这一册的知识点，只显示<b>差异</b>。入库后知识点为“待审核”，关系为“待确认”。</p>
  <h4>新增（${F.add.length}）</h4>
  <table class="mini"><tr><th></th><th>知识点</th><th>单元</th><th>类型 / 题型</th><th>出处</th></tr>${F.add.map((x, i) => `<tr><td><input type="checkbox" id="fa${i}" ${x.src ? 'checked' : ''} style="min-height:0"></td><td><b>${esc(x.name)}</b>${x.dup ? `<div class="hint-box small" style="margin:4px 0">可能重复：与已有「${esc(kpById(x.dup).name)}」相近<br><label class="inline"><input type="checkbox" id="fm${i}" style="min-height:0"> 合并到已有知识点（不新增）</label></div>` : ''}</td><td class="small">${esc(x.unit)}</td><td class="small">${TYPE_TAG[x.type]}<br>${x.qtypes.map(t => QTYPE_NAME[t]).join('、')}</td><td class="small">${x.src ? esc(x.src) : '<span class="tag bad">未找到出处</span><div class="muted">默认不勾选</div>'}</td></tr>`).join('')}</table>
  <h4>名称变化（${F.rename.length}）</h4><table class="mini">${F.rename.map((x, i) => `<tr><td><input type="checkbox" id="fr${i}" style="min-height:0"></td><td>「${esc(kpById(x.id).name)}」→「<b>${esc(x.to)}</b>」</td><td class="small">${esc(x.src)}</td></tr>`).join('')}</table>
  <h4>系统里有、教材里没有（0）</h4><p class="small muted">无。</p>
  <h4>AI 建议的关系</h4>
  <table class="mini">${F.rels.map((r, i) => `<tr><td><input type="checkbox" id="fl${i}" checked style="min-height:0"></td><td>${r.k === 'pre' ? `${nm(r.a)} → ${nm(r.b)} <span class="tag ${r.kind === 'must' ? 'bad' : 'gray'}">${r.kind === 'must' ? '必须' : '建议'}</span>` : `${nm(r.a)} × ${nm(r.b)} ${r.v === 'no' ? '<span class="tag bad">✗ 不可合并</span>' : '<span class="tag ok">✓ 可合并</span>'}`}</td><td class="small muted">${esc(r.why || r.how)}</td></tr>`).join('')}</table>
  <div class="row" style="justify-content:flex-end;margin-top:12px"><button data-act="close">放弃</button><button class="primary" data-act="fetchImport">勾选的入库</button></div>`;
}
Object.assign(A, {
  fetchCancel() { if (UI.fetchTask) UI.fetchTask.cancel = true; closeModal(); toast('已取消'); },
  fetchImport() {
    const F = FETCH_SIM[UI.fetchKey]; const [sub, stage] = UI.fetchKey.split('-'); const map = {}; let n = 0, r = 0;
    F.add.forEach((x, i) => {
      if (!checked('fa' + i)) return;
      if (x.dup && checked('fm' + i)) { map['#' + i] = x.dup; return; }
      const id = `${sub}-${stage}-f${Date.now()}${i}`; const same = kpsOf(stage, sub, true).filter(k => k.unit === x.unit);
      S.kps.push({ id, subject: sub, stage, term: '上', unit: x.unit, name: x.name, diff: 2, book: defaultBook(sub, stage), desc: `学会“${x.name}”，能独立、正确地完成相关题目。`, status: '待审核', bank: [0, 0, 0, 0, 0], source: `联网获取 · ${x.src || '未找到出处'} · ${profName(S.roles.kp.main || S.roles.gen.main)} · ${nowStr()}`, order: (same.length ? Math.max(...same.map(k => k.order)) : 99) + 0.5, type: x.type, qtypes: x.qtypes, needFig: false });
      map['#' + i] = id; n++;
    });
    F.rename.forEach((x, i) => { if (checked('fr' + i)) kpById(x.id).name = x.to; });
    const rid = x => x.startsWith('#') ? map[x] : x;
    F.rels.forEach((x, i) => {
      if (!checked('fl' + i)) return; const a = rid(x.a), b = rid(x.b); if (!a || !b || a === b) return;
      if (x.k === 'pre') { if (!S.prereqs.some(p => p.a === a && p.b === b) && !wouldCycle(a, b)) { S.prereqs.push({ a, b, kind: x.kind, state: 'pending', src: 'AI 建议（联网获取）' }); r++; } }
      else if (!comboOf(a, b)) { S.combos.push({ a, b, v: x.v || 'yes', how: x.how, state: 'pending', src: 'AI 建议 · 待确认' }); r++; }
    });
    log(`联网获取知识点：${F.book}，入库 ${n} 个（待审核），关系 ${r} 条（待确认）`);
    closeModal(); toast(`已入库 ${n} 个知识点（待审核）、${r} 条关系（待确认）`, 'ok'); render();
  },
  aiRelOpen(d) {
    const [sub, stage] = d.v.split('|'); const list = kpsOf(stage, sub).filter(isComb); const sug = [];
    for (let i = 0; i + 1 < list.length && sug.length < 3; i++) {
      const a = list[i], b = list[i + 1]; if (a.unit !== b.unit) continue;
      if (!S.prereqs.some(p => (p.a === a.id && p.b === b.id) || (p.a === b.id && p.b === a.id)) && !wouldCycle(a.id, b.id)) sug.push({ k: 'pre', a: a.id, b: b.id, kind: 'suggest', why: '同一单元中教材顺序在前' });
      if (!comboOf(a.id, b.id) && sug.length < 3) sug.push({ k: 'combo', a: a.id, b: b.id, how: `（AI 建议）在「${b.name}」的情境中用到「${a.name}」` });
    }
    UI.relSug = sug;
    modal(`<h3>🤖 AI 建议关系 · ${stageName(stage)} ${subj(sub).name}</h3><p class="small muted">知识点整理 AI 对整册给出建议，优先从已有的先学后学关系和同单元相邻知识点中找。结果标“待确认”，老师确认后才生效。约 800 Token。</p>
    ${sug.length ? `<table class="mini">${sug.map((r, i) => `<tr><td><input type="checkbox" id="rs${i}" checked style="min-height:0"></td><td>${r.k === 'pre' ? `${esc(kpById(r.a).name)} → ${esc(kpById(r.b).name)} <span class="tag gray">建议</span>` : `${esc(kpById(r.a).name)} × ${esc(kpById(r.b).name)} <span class="tag ok">✓ 可合并</span>`}</td><td class="small muted">${esc(r.why || r.how)}</td></tr>`).join('')}</table>` : '<div class="ok-box">没有新的建议。</div>'}
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button data-act="close">关闭</button>${sug.length ? '<button class="primary" data-act="aiRelOk">加入（待确认）</button>' : ''}</div>`, true);
  },
  aiRelOk() {
    let n = 0; UI.relSug.forEach((r, i) => { if (!checked('rs' + i)) return; n++; if (r.k === 'pre') S.prereqs.push({ a: r.a, b: r.b, kind: r.kind, state: 'pending', src: 'AI 建议' }); else S.combos.push({ a: r.a, b: r.b, v: 'yes', how: r.how, state: 'pending', src: 'AI 建议 · 待确认' }); });
    S.usage.kp[0]++; S.aiUsedToday += 800; log(`AI 建议知识点关系 ${n} 条（待确认）`); closeModal(); toast('已加入，待确认', 'ok'); render();
  },
  kpTpl() { download('知识点模板.csv', [['单元', '知识点名称', '类型（技能/理解应用/记忆/阅读表达）', '适用题型（单选;填空;应用题）', '前置知识点（名称，多个用;分隔）', '前置强度（必须/建议）', '可合并知识点（名称：怎么合并）'], ['时、分、秒', '秒的认识与时间单位换算', '技能', '单选;填空', '', '', '计算经过的时间：先把时间单位换算成同一种，再计算经过的时间'], ['时、分、秒', '计算经过的时间', '理解应用', '单选;填空;应用题', '秒的认识与时间单位换算', '必须', '']]); },
});
Object.assign(CHG, {
  kpFile(el) {
    const f = el.files[0]; if (!f) return;
    document.getElementById('fileResult').innerHTML = `<div class="card" style="margin-top:10px"><b>${esc(f.name)}</b> 解析结果（原型模拟）：
    <table class="mini"><tr><th>知识点</th><th>前置</th><th>可合并</th><th>检查</th></tr>
    <tr><td>万以内数的估算</td><td>三位数加减三位数（笔算）· 建议</td><td>三位数加减三位数：先估算再笔算</td><td><span class="tag ok">通过</span></td></tr>
    <tr><td>两位数加减两位数（口算）</td><td>—</td><td>—</td><td><span class="tag warn">可能重复：与已有知识点同名，将跳过</span></td></tr>
    <tr><td>认识几分之一和几分之几</td><td>计算经过的时间 · 必须</td><td>—</td><td><span class="tag bad">前置关系不合理：两者没有先后关系（老师可修改后再导入）</span></td></tr></table>
    <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="primary" data-act="kpFileImport">导入 1 个（待审核）</button></div></div>`;
  },
});
A.kpFileImport = () => {
  const id = 'math-P3-u' + Date.now();
  S.kps.push({ id, subject: 'math', stage: 'P3', term: '上', unit: '万以内的加法和减法（二）', name: '万以内数的估算', diff: 2, book: defaultBook('math', 'P3'), desc: '会用估算判断计算结果是否合理。', status: '待审核', bank: [0, 0, 0, 0, 0], source: `老师上传 · 文件 · ${nowStr()}`, order: 4.5, type: '理解应用', qtypes: ['single', 'fill'], needFig: false });
  S.prereqs.push({ a: 'math-P3-5', b: id, kind: 'suggest', state: 'pending', src: '导入' }); S.combos.push({ a: id, b: 'math-P3-5', v: 'yes', how: '先估算再笔算', state: 'pending', src: 'AI 建议 · 待确认' });
  log('上传知识点：导入 1 个（待审核）'); closeModal(); toast('已导入 1 个知识点（三年级数学，待审核）', 'ok'); render();
};
