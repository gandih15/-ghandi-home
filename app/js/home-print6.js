/* Ghandi Home 1.9.4 — one design for every document: what is saved in «Invoice design» is what the print
   preview shows and what prints for sales, returns, quotations, purchases and every other A4 document.
   Eng. Mohamed Ali — 01098811581 */
'use strict';
(function () {
  // quotations and the other documents follow the sales invoice design (switch in the editor, on by default)
  var dc = docCfg;
  docCfg = function () {
    var d = dc.apply(this, arguments);
    if (d.follow !== false) { var t = d.tpl.sale || 'classic'; d.tpl.quote = t; d.tpl.other = t === 'tiba' ? 'ws' : t; }
    return d;
  };
  // free layout & free texts: the quotation uses the same ones as the invoice
  var fk = DocFree.key;
  DocFree.key = function (d, kind) { kind = kind || A4.kindNow || 'other'; if ((d || {}).follow !== false && kind === 'quote') kind = 'sale'; return fk.call(this, d, kind); };
  var fcss = DocFree.css;
  DocFree.css = function () { return (A4.kindNow === 'sale' || A4.kindNow === 'quote') ? fcss.apply(this, arguments) : ''; };

  // the print preview window: every change is saved straight into the invoice design
  var op = DocPrev.open;
  DocPrev.open = function (html, kind) {
    var r = op.apply(this, arguments), m = $$('.mask').pop(); if (!m || !$('#dpF', m)) return r;
    var d = docCfg(), save = function () { Store.save(); };
    var k = kind || 'other', tk = d.follow !== false ? 'sale' : k;
    if (can('settings')) {
      $('#dpT', m).addEventListener('change', function () { d.tpl[tk] = this.value; save(); });
      $('#dpP', m).addEventListener('change', function () { d.paper = this.value; save(); });
      $('#dpFs', m).addEventListener('input', function () { d.font = +this.value; save(); });
      $$('[data-sh]', m).forEach(function (c) { c.addEventListener('change', function () { d.show[c.dataset.sh] = c.checked; save(); }); });
      var sv = $('#dpSave', m); if (sv) sv.style.display = 'none';
      // margin + fill-the-sheet right here
      var fs = $('#dpFs', m), host = fs && fs.closest('.grid'); 
      if (host) {
        var row = document.createElement('div'); row.className = 'row'; row.style.gap = '6px';
        row.innerHTML = '<label class="f" style="flex:1">' + L('الهامش (مم)', 'Margin (mm)') + '<input class="in num" type="number" id="dpM" min="0" max="25" value="' + (String(d.margin) === '0' ? 0 : (U.n(d.margin) || 10)) + '"></label><button class="btn sm" id="dpFit" style="align-self:flex-end">📐 ' + L('على قد الورقة', 'Fill sheet') + '</button>';
        host.parentNode.insertBefore(row, host.nextSibling);
        var redraw = function () { var p = $('#dpP', m); p.dispatchEvent(new Event('change')); };
        $('#dpM', row).oninput = function () { d.margin = Math.max(0, Math.min(25, this.value === '' ? 10 : U.n(this.value))); save(); redraw(); };
        $('#dpFit', row).onclick = function () { d.margin = 4; $('#dpM', row).value = 4; save(); redraw(); };
      }
      var note = document.createElement('div'); note.className = 'chip ok'; note.style.cssText = 'display:block;white-space:normal'; note.textContent = '💾 ' + L('أي تغيير هنا بيتحفظ في تصميم الفاتورة وبيطلع في كل الطباعة الجاية', 'Changes here are saved into the invoice design'); 
      var set = $('#dpSet', m); if (set) set.parentNode.insertBefore(note, set);
    }
    // "edit wording" opens the full editor
    var st = $('#dpSet', m); if (st) { st.textContent = '✏️ ' + L('افتح محرر الفاتورة كامل', 'Open the full invoice editor'); st.onclick = function () { Modal.close(m); if (can('settings')) { S().invoice.paper = 'A4'; go('invoice'); } else DocSet.open(); }; }
    return r;
  };

  // the editor: one switch to keep every document on the same design
  var ext = DocSet.extend;
  DocSet.extend = function (cur) {
    ext.apply(this, arguments);
    var k = $('#lvK', cur.m); if (!k || $('#fwOn', cur.m)) return;
    var w = cur.w, lab = document.createElement('label'); lab.className = 'row small'; lab.style.marginTop = '6px';
    lab.innerHTML = '<input type="checkbox" class="sw" id="fwOn"' + (w.follow !== false ? ' checked' : '') + '> ' + L('نفس التصميم لكل المستندات (البيع، المرتجع، عرض السعر، المشتريات، الكشوف…)', 'Same design for every document');
    k.parentNode.insertBefore(lab, k.nextSibling);
    $('#fwOn', lab).onchange = function () { w.follow = this.checked; if (w.follow) { var t = w.tpl.sale || 'classic'; w.tpl.quote = t; w.tpl.other = t === 'tiba' ? 'ws' : t; } cur.draw(); toast(w.follow ? L('كل المستندات بقت بنفس التصميم', 'All documents now share the design') : L('كل مستند ليه تصميمه', 'Each document keeps its own design'), 'ok'); };
    var tsel = $('#lvT', cur.m); if (tsel) tsel.addEventListener('change', function () { if (w.follow !== false) { w.tpl.sale = tsel.value; w.tpl.quote = tsel.value; w.tpl.other = tsel.value === 'tiba' ? 'ws' : tsel.value; } });
  };
})();
