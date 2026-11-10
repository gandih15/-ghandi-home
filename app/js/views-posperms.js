/* Ghandi Home — per-user control of every option on the sales screen.
   The owner ticks / unticks them in «Users & permissions»; what is off disappears for that user. */
'use strict';

var POS_OPTS = [
  ['pos.giftcard', 'زرار «🎁 كارت هدية» (بيع كارت هدية)', '«Gift card» button (sell a gift card)', ['#xGift']],
  ['pos.pricecheck', 'زرار «🔎 فحص سعر»', '«Price check» button', ['#xPc']],
  ['pos.clear', 'زرار «مسح» الفاتورة', '«Clear» invoice button', ['#bClear']],
  ['pos.custPhone', 'خانة موبايل العميل في البيع', 'Customer mobile box', ['.custbox']],
  ['pos.coupon', 'الكوبون في شاشة الدفع', 'Coupon in checkout', ['.px:has(#cpIn)']],
  ['pos.points', 'استبدال نقاط العميل في شاشة الدفع', 'Redeem points in checkout', ['.px:has(#ptsIn)']],
  ['pos.giftPay', 'الدفع بكارت هدية في شاشة الدفع', 'Pay with a gift card in checkout', ['.px:has(#gcIn)']],
  ['pos.custDisplay', 'زرار شاشة العميل 🖥️', 'Customer display button', ['#xCd']]
];
// buttons of permissions that already exist: hide them too instead of showing an error
var POS_OLD = [['pos.discount', ['#bDisc']], ['pos.hold', ['#bHold', '#held']], ['layaway', ['#xLay']], ['pos.drawer', ['#xDrw']]];

(function () {
  // add the new options to the permissions list, right after the sales screen ones
  var at = PERMS.map(function (p) { return p[0]; }).indexOf('layaway') + 1;
  POS_OPTS.forEach(function (o, i) { PERMS.splice(at + i, 0, [o[0], o[1], o[2]]); });
  // presets: a cashier gets them all; the owner unticks what to hide
  var cp = ROLE_PRESETS.cashier; ROLE_PRESETS.cashier = function () { var o = cp(); POS_OPTS.forEach(function (x) { o[x[0]] = true; }); return o; };
  // users made before this update keep everything until the owner changes it
  var c0 = can;
  can = function (p) {
    if (App.user && App.user.role !== 'admin' && POS_OPTS.some(function (o) { return o[0] === p; }) && !(p in (App.user.perms || {}))) return true;
    return c0.apply(this, arguments);
  };
  // user editor: show older users as ticked
  var ed = Views.users && Views.users.edit;
  if (ed) Views.users.edit = function (u) { if (u && u.perms) POS_OPTS.forEach(function (o) { if (!(o[0] in u.perms)) u.perms[o[0]] = true; }); return ed.apply(this, arguments); };
})();

var PosHide = {
  run: function () {
    if (!App.user || App.user.role === 'admin') return;
    POS_OPTS.forEach(function (o) { if (!can(o[0])) o[3].forEach(function (s) { $$(s).forEach(function (e) { e.style.display = 'none'; }); }); });
    POS_OLD.forEach(function (o) { if (!can(o[0])) o[1].forEach(function (s) { $$(s).forEach(function (e) { e.style.display = 'none'; }); }); });
  }
};
(function () {
  var t = null, mo = new MutationObserver(function () { if (t) return; t = requestAnimationFrame(function () { t = null; try { PosHide.run(); } catch (e) { } }); });
  mo.observe(document.body, { childList: true, subtree: true });
})();
if (typeof Updater !== 'undefined') Updater.notes['2.0.7'] = ['🔐 صلاحيات جديدة لكل مستخدم لكل اختيارات شاشة البيع: كارت الهدية، فحص السعر، مسح الفاتورة، خانة موبايل العميل، الكوبون والنقاط وكارت الهدية في الدفع، شاشة العميل — واللي مقفول بيختفي عنده (وكمان الخصم والتعليق والحجز والدرج)'];
