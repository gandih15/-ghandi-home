/* Demo data — used only in browser preview (?demo). Never loaded data in the real Windows build. */
'use strict';
var Demo = {
  seed: function () {
    var db = Store.db, s = db.settings;
    s.shopName = 'معرض النور للأدوات المنزلية'; s.shopNameEn = 'Al Nour Home Store'; s.slogan = 'أدوات منزلية • أجهزة كهربائية • تجهيز عرائس • سجاد وستائر'; s.ownerName = 'أ. حسن النور'; s.shopPhone = '01001234567'; s.whatsapp = '01001234567'; s.instagram = ''; s.facebook = 'alnour.home'; s.shopAddress = 'بني سويف — شارع صلاح سالم — أمام البنك الأهلي';
    s.logo = '';
    var items = [
      ['ثلاجة توشيبا 14 قدم نوفروست', 'Toshiba fridge 14ft', 'أجهزة كهربائية', 'Toshiba', ['فضي'], 16800, [19500, 19000, 18500], 24],
      ['غسالة أوتوماتيك 7 كيلو', 'Automatic washer 7kg', 'أجهزة كهربائية', 'Zanussi', ['أبيض'], 12900, [14500, 14100, 13800], 24],
      ['بوتاجاز 5 شعلة فول أوبشن', 'Cooker 5 burners', 'أجهزة كهربائية', 'Unionaire', ['استانلس'], 8300, [9800, 9500, 9200], 12],
      ['شاشة سمارت 43 بوصة', 'Smart TV 43"', 'أجهزة كهربائية', 'Samsung', [''], 11200, [13200, 12900, 12500], 24],
      ['تكييف 1.5 حصان بارد ساخن', 'AC 1.5hp', 'أجهزة كهربائية', 'Sharp', [''], 21000, [24500, 24000, 23500], 60],
      ['خلاط مولينكس 2 لتر', 'Moulinex blender', 'أجهزة كهربائية', 'Moulinex', [''], 1650, [1950, 1880, 1800], 12],
      ['مكواة بخار', 'Steam iron', 'أجهزة كهربائية', 'Tefal', [''], 950, [1150, 1100, 1050], 12],
      ['طقم صيني 72 قطعة', 'Dinner set 72', 'أطقم صيني وأركوبال', 'Royal', ['أبيض ذهبي', 'كحلي'], 2500, [3200, 3050, 2900], 0],
      ['طقم أركوبال 46 قطعة', 'Arcopal set 46', 'أطقم صيني وأركوبال', 'Arcopal', [''], 1250, [1600, 1520, 1450], 0],
      ['طقم كاسات 12 قطعة', 'Glass set 12', 'أطقم صيني وأركوبال', 'Pasabahce', [''], 280, [380, 360, 340], 0],
      ['طقم حلل جرانيت 10 قطع', 'Granite cookware 10', 'أواني طهي', 'Zahran', ['رمادي', 'أحمر'], 2300, [2950, 2850, 2700], 0],
      ['طقم حلل استانلس 7 قطع', 'Stainless cookware 7', 'أواني طهي', 'Tefal', [''], 3100, [3850, 3700, 3600], 0],
      ['حلة ضغط 7 لتر', 'Pressure cooker 7L', 'أواني طهي', 'Zahran', [''], 950, [1250, 1200, 1150], 0],
      ['طقم ملايات قطن 4 قطع', 'Bed sheets set', 'مفروشات', 'Cotton Home', ['بيج', 'روز', 'سماوي'], 420, [650, 600, 560], 0],
      ['بطانية فايبر مزدوجة', 'Double blanket', 'مفروشات', '', ['بني', 'رمادي'], 520, [780, 740, 700], 0],
      ['طقم فوط 6 قطع', 'Towel set 6', 'مفروشات', '', ['أبيض'], 260, [380, 360, 340], 0],
      ['سجادة تركي 2×3 م', 'Turkish rug 2x3', 'سجاد', 'Merinos', ['بيج', 'رمادي'], 1300, [1800, 1720, 1650], 0],
      ['سجادة شاج 1.6×2.3 م', 'Shaggy rug 1.6x2.3', 'سجاد', 'Oriental Weavers', ['كريمي'], 950, [1350, 1290, 1220], 0],
      ['دواسة مطبخ', 'Kitchen mat', 'سجاد', '', [''], 90, [150, 140, 130], 0],
      ['طقم ستائر جاهز 2 ضلفة', 'Ready curtain pair', 'ستائر', '', ['بيج', 'زيتي'], 650, [950, 900, 860], 0],
      ['أنتريه مودرن 4 قطع', 'Modern living set', 'أنتريهات وموبيليا', 'دمياط', [''], 21000, [26500, 25800, 25000], 12]
    ];
    var meas = [
      ['سجاد موكيت رول عرض 4 م', 'Wall-to-wall roll 4m', 'سجاد', 'Oriental Weavers', 'بيج', 160, [240, 230, 220], 'm2', 4, 180],
      ['سجاد رول قص عرض 3 م', 'Cut-roll carpet 3m', 'سجاد', 'Merinos', 'رمادي', 210, [320, 305, 290], 'm2', 3, 120],
      ['قماش ستائر قطيفة تركي عرض 2.80', 'Velvet curtain fabric', 'ستائر', 'Turkish', 'زيتي', 140, [220, 210, 200], 'm', 0, 160],
      ['قماش شيفون ستائر', 'Chiffon voile', 'ستائر', '', 'أبيض', 45, [80, 75, 70], 'm', 0, 300],
      ['قماش بلاك أوت', 'Blackout fabric', 'ستائر', '', 'رمادي', 110, [170, 162, 155], 'm', 0, 90],
      ['مجرى ستارة ألومنيوم مزدوج', 'Double aluminium rail', 'ستائر', '', 'أبيض', 85, [140, 132, 125], 'm', 0, 60]
    ];
    var n = 0;
    items.forEach(function (it, i) {
      it[4].forEach(function (shade, j) {
        n++; var bcs = ['622' + U.pad(1000000 + i * 37 + j * 7, 9) + (j % 10)];
        var stock = [6, 3, 12, 2, 4, 8, 9, 5, 7, 20, 10, 6, 8, 15, 12, 25, 6, 4, 30, 9, 2][i % 21];
        db.products.push({ id: 'p' + n, name: it[0], nameEn: it[1], cat: it[2], brand: it[3], shade: shade, barcodes: bcs, cost: it[5], prices: [it[6][0], it[6][1], it[6][2], 0], stock: stock, minStock: 2, warranty: it[7], sellBy: 'pc', unit: 'قطعة', active: true, created: Date.now() - ((n * 37) % 30) * 864e5 - (n % 9) * 36e5 });
      });
    });
    meas.forEach(function (it, i) { n++; db.products.push({ id: 'p' + n, name: it[0], nameEn: it[1], cat: it[2], brand: it[3], shade: it[4], barcodes: ['623' + U.pad(5000000 + i * 11, 9) + '0'], cost: it[5], prices: [it[6][0], it[6][1], it[6][2], 0], stock: it[9], minStock: 20, sellBy: it[7], unit: it[7] === 'm2' ? 'م²' : 'متر', rollW: it[8] || '', active: true, created: Date.now() - i * 864e5 }); });
    Store.reindex();
    db.customers.push({ id: 'c1', name: 'منى عبد الحميد', phone: '01001234567', balance: 0, points: 14 }, { id: 'c2', name: 'محمود السيد (تاجر)', phone: '01112223334', tier: '2', balance: 1250, points: 0 }, { id: 'c3', name: 'أحمد فتحي', phone: '01223334445', balance: 0, points: 6 }, { id: 'c4', name: 'ياسمين خالد', phone: '01556677889', balance: 0, points: 0 }, { id: 'c5', name: 'منة الله سمير', phone: '01067891234', balance: 180, points: 0 });
    db.customers.forEach(function (c, i) { c.created = Date.now() - (60 - i * 9) * 864e5; c.pts = []; c.points = 0; });
    db.suppliers.push({ id: 's1', name: 'توكيل الأجهزة الكهربائية', phone: '0225551234', balance: 4800 }, { id: 's2', name: 'مصنع النساجون الشرقيون', phone: '01005556667', balance: 0 });
    return Promise.all([Sec.hash('1234'), Sec.hash('1111'), Sec.hash('2222')]).then(function (h) {
      db.users.push({ id: 'u1', username: 'admin', name: 'م. محمد علي', role: 'admin', salt: h[0].salt, hash: h[0].hash, perms: allPerms(true), active: true });
      db.users.push({ id: 'u2', username: 'mariam', name: 'مريم (كاشير)', role: 'cashier', salt: h[1].salt, hash: h[1].hash, perms: ROLE_PRESETS.cashier(), active: true });
      db.users.push({ id: 'u3', username: 'heba', name: 'هبة (جرد)', role: 'cashier', salt: h[2].salt, hash: h[2].hash, perms: ROLE_PRESETS.counter(), active: true });
      // history
      var rnd = (function () { var x = 7; return function () { x = (x * 16807) % 2147483647; return x / 2147483647; }; })();
      for (var d = 20; d >= 0; d--) {
        var day = dayStart() - d * 864e5, cnt = 3 + Math.floor(rnd() * 6);
        db.seq.shift++; var sh = { id: 'sh' + d, no: db.seq.shift, user: d % 3 ? 'u2' : 'u1', userName: d % 3 ? 'مريم (كاشير)' : 'م. محمد علي', openAt: day + 10 * 36e5, openCash: 500 };
        db.shifts.push(sh);
        for (var k = 0; k < cnt; k++) {
          var lines = [], m = 1 + Math.floor(rnd() * 2);
          for (var l = 0; l < m; l++) { var p = db.products[Math.floor(rnd() * 21)]; lines.push({ pid: p.id, name: p.name + (p.shade ? ' - ' + p.shade : ''), qty: 1, price: p.prices[0], cost: p.cost }); }
          var sub = lines.reduce(function (a, x) { return a + x.qty * x.price; }, 0), disc = rnd() < .2 ? Math.round(sub * .05) : 0, tot = sub - disc, pm = rnd() < .7 ? 'cash' : (rnd() < .5 ? 'wallet' : 'card');
          db.seq.invoice++; var pay = {}; pay[pm] = tot;
          db.sales.push({ id: 's' + db.seq.invoice, no: db.seq.invoice, date: day + (11 + k * .6) * 36e5, type: rnd() < .04 ? 'return' : 'sale', user: sh.user, userName: sh.userName, shift: sh.id, customer: (function () { var q = rnd(); return q < .14 ? 'c1' : q < .22 ? 'c3' : q < .27 ? 'c4' : q < .31 ? 'c5' : ''; })(), tier: 0, items: lines, subtotal: sub, discount: disc, vat: 0, total: tot, payments: pay, paid: tot, change: 0, credit: 0 });
        }
        if (d) { sh.closeAt = day + 22 * 36e5; var c = Views.shifts.calc(sh); sh.closeCash = c.expected + (d % 5 === 0 ? -20 : 0); sh.expected = c.expected; }
        else { App.shift = sh; }
      }
      db.expenses.push({ id: 'e1', t: Date.now() - 864e5 * 2, cat: 'كهرباء', v: 450, note: 'فاتورة الشهر', by: 'م. محمد علي' }, { id: 'e2', t: Date.now() - 36e5 * 3, cat: 'أكياس وتغليف', v: 120, note: '', by: 'مريم (كاشير)', drawer: true, shift: 'sh0' });
      db.counts.push({ id: 'k1', no: 1, name: 'جرد السجاد — المخزن', at: Date.now() - 36e5 * 5, by: 'هبة (جرد)', lines: { p1: { q: 23 }, p2: { q: 3 }, p4: { q: 10 }, p7: { q: 40 }, p9: { q: 6 } }, applied: false });
      db.held.push({ items: [{ pid: 'p6', name: 'خلاط مولينكس 2 لتر', qty: 1, price: 1950, cost: 1650 }], tier: 0, customer: '', disc: 0, discType: 'v', at: Date.now() - 36e5, by: 'مريم' });
      Store.log('login', 'admin'); Store.log('price.change', 'غسالة أوتوماتيك [14200] → [14500]'); Store.log('backup', 'auto → 2');
      db.promos.push({ id: 'pr1', name: 'عرض العرائس 10% على الصيني', scope: 'cat', cats: ['أطقم صيني وأركوبال'], brands: [], pids: [], type: 'pct', val: 10, round: 5, from: U.today(Date.now() - 2 * 864e5), to: U.today(Date.now() + 10 * 864e5), tiers: [0], active: true, by: 'م. محمد علي' },
        { id: 'pr2', name: 'عرض الشاشة', scope: 'items', cats: [], brands: [], pids: ['p4'], type: 'price', val: 12700, round: 0, from: U.today(), to: '', tiers: [0, 1], active: true },
        { id: 'pr3', name: 'خصم الجملة على المفروشات', scope: 'cat', cats: ['مفروشات'], brands: [], pids: [], type: 'amt', val: 15, round: 0, from: U.today(Date.now() + 5 * 864e5), to: '', tiers: [2], active: true });
      db.seq.purchase = 1; db.purchases.push({ id: 'rc1', no: 1, date: Date.now() - 864e5, supplier: 's1', ref: 'A-5531', items: [{ pid: 'p1', qty: 24, cost: 16800 }, { pid: 'p5', qty: 2, cost: 12900 }], total: 59400, paid: 40000, note: '', by: 'م. محمد علي' });
      s.loyalty = { on: true, earnEvery: 10, earnPts: 1, redeemPts: 100, redeemVal: 10, minRedeem: 100, maxPct: 50, expireMonths: 12, welcome: 20, onCredit: false };
      s.posPhone = { on: true, required: false }; s.drawer = { on: true, when: 'cash', printer: '' }; s.custDisplay = { on: false, msg: 'أهلاً بيك في معرض النور 🏠' };
      db.sales.forEach(function (x) { var c = x.customer && db.customers.filter(function (y) { return y.id === x.customer; })[0]; if (!c || x.type !== 'sale') return; x.ptsEarned = Math.floor(x.total / 10); c.points += x.ptsEarned; c.pts.push({ t: x.date, d: x.ptsEarned, r: 'earn', inv: x.no, by: x.userName }); c.lastVisit = x.date; });
      var c1 = db.customers[0]; c1.pts.push({ t: Date.now() - 3 * 864e5, d: -200, r: 'redeem', inv: '', by: 'مريم (كاشير)' }); c1.points -= 200; c1.birthday = '1998-03-14';
      db.coupons = [{ id: 'k1', code: 'BRIDE5', type: 'pct', val: 5, min: 5000, from: U.today(Date.now() - 5 * 864e5), to: U.today(Date.now() + 9 * 864e5), max: 100, used: 17, usedBy: [], once: true, active: true, note: 'خصم العرائس' }, { id: 'k2', code: 'WELCOME50', type: 'amt', val: 50, min: 250, from: '', to: '', max: 0, used: 6, usedBy: [], once: true, active: true, note: 'لأي عميلة جديدة' }];
      db.giftcards = [{ code: 'GC48213907', initial: 500, balance: 320, created: Date.now() - 9 * 864e5, customer: 'c3', sale: 41, log: [{ t: Date.now() - 9 * 864e5, v: 500, inv: 41 }, { t: Date.now() - 2 * 864e5, v: -180, inv: 160 }] }];
      db.seq.layaway = 1; db.layaways = [{ id: 'l1', no: 1, date: Date.now() - 2 * 864e5, customer: 'c4', items: [{ pid: 'p10', name: db.products[9].name, qty: 1, price: db.products[9].prices[0], cost: db.products[9].cost }, { pid: 'p3', name: db.products[2].name, qty: 2, price: db.products[2].prices[0], cost: db.products[2].cost }], subtotal: 0, discount: 0, total: 0, due: U.today(Date.now() + 5 * 864e5), note: 'هتيجي تاخدهم أول الشهر', status: 'open', by: 'مريم (كاشير)', pays: [] }];
      var L1 = db.layaways[0]; L1.total = L1.subtotal = L1.items.reduce(function (a, i) { return a + i.qty * i.price; }, 0); L1.pays.push({ t: L1.date, v: Math.round(L1.total * .3), m: 'cash', shift: 'sh2', by: 'مريم (كاشير)' });
      db.products.slice(0, 14).forEach(function (p, i) { Store.db.moves.push({ t: dayStart() + (10 + i * .4) * 36e5, p: p.id, q: [24, 12, 6, 10, 18, 4, 30, 8, 12, 6, 20, 5, 9, 16][i], k: i < 6 ? 'purchase' : i < 10 ? 'open' : 'import', r: '', u: 'admin', s: p.stock }); if (i > 9) p.created = dayStart() + 11 * 36e5; });
      var bk = s.backup; bk.slots = [{ path: 'D:\\نسخ المعرض', on: true }, { path: 'E:', on: true }, { path: '', on: true }];
      bk.status = { internal: { t: Date.now() - 18 * 60000, n: 23 }, s0: { t: Date.now() - 18 * 60000 }, s1: { t: Date.now() - 3 * 36e5 } };
      localStorage.setItem('ghandi.lastBackup', Date.now() - 18 * 60000);
      // ---------- home edition demo ----------
      var P = function (id) { return db.products.filter(function (x) { return x.id === id; })[0]; }, T = Date.now(), DAY = 864e5;
      db.customers.forEach(function (c, i) { c.address = ['بني سويف — الحي التاني', 'ناصر — شارع المدارس', 'الواسطى — بجوار المسجد الكبير', 'بني سويف الجديدة — الحي الأول', 'إهناسيا'][i % 5]; });
      var mk = function (no, cid, price, down, months, rate, start, paidN, items, g) { var r = Inst.calc(price, down, months, rate, 'monthly', 5); var c = { id: 'i' + no, no: no, date: T - (paidN + 1) * 30 * DAY, customer: cid, price: price, down: down, downM: 'cash', months: r.sched.length, rate: rate, rateType: 'monthly', fin: r.fin, extra: r.extra, instTotal: r.total, schedule: r.sched.map(function (a, i) { return { n: i + 1, due: H.addMonths(start, i), amount: a, paid: i < paidN ? a : 0 }; }), guarantors: g, pays: [], items: items, by: 'م. محمد علي', status: 'open', note: '' }; for (var i = 0; i < paidN; i++) c.pays.push({ t: new Date(c.schedule[i].due).getTime() + 36e5 * 12, v: c.schedule[i].amount, m: 'cash', shift: '', by: 'مريم (كاشير)', ins: [i + 1], rec: i + 1 }); db.inst.push(c); return c; };
      mk(1, 'c1', 19500, 4000, 12, 2, H.addMonths(U.today(T - 95 * DAY), 0), 2, [{ name: 'ثلاجة توشيبا 14 قدم نوفروست', qty: 1, price: 19500 }], [{ name: 'عبد الحميد سالم', phone: '01112345678', nid: '27001011234567', job: 'مدرس', address: 'بني سويف' }]);
      mk(2, 'c3', 14500, 3000, 10, 2.5, H.addMonths(U.today(T - 40 * DAY), 0), 1, [{ name: 'غسالة أوتوماتيك 7 كيلو', qty: 1, price: 14500 }], [{ name: 'فتحي علي', phone: '01223456789', nid: '', job: 'موظف', address: 'ناصر' }]);
      mk(3, 'c4', 26500, 8000, 18, 1.5, U.today(T + 5 * DAY), 0, [{ name: 'أنتريه مودرن 4 قطع', qty: 1, price: 26500 }], [{ name: 'سيد عبد الله', phone: '01098765432', nid: '', job: 'تاجر', address: 'الواسطى' }]);
      db.seq.inst = 3;
      db.brides.push({ id: 'b1', no: 1, date: T - 20 * DAY, customer: 'c5', bride: 'آية محمود', groom: 'كريم حسن', wedding: U.today(T + 24 * DAY), address: 'بني سويف الجديدة — عمارة 12 — الدور الثالث', budget: 120000, note: '', status: 'open', by: 'م. محمد علي', used: 3200, pays: [{ t: T - 20 * DAY, v: 15000, m: 'cash', shift: '', by: 'م. محمد علي' }, { t: T - 6 * DAY, v: 10000, m: 'instapay', shift: '', by: 'مريم (كاشير)' }],
        items: [{ id: 'bi1', pid: 'p1', name: 'ثلاجة توشيبا 14 قدم نوفروست', qty: 1, price: 19500, cost: 16800, cat: 'أجهزة كهربائية', status: 'reserved' }, { id: 'bi2', pid: 'p2', name: 'غسالة أوتوماتيك 7 كيلو', qty: 1, price: 14500, cost: 12900, cat: 'أجهزة كهربائية', status: 'planned' }, { id: 'bi3', pid: 'p3', name: 'بوتاجاز 5 شعلة فول أوبشن', qty: 1, price: 9800, cost: 8300, cat: 'أجهزة كهربائية', status: 'planned' }, { id: 'bi4', pid: 'p8', name: 'طقم صيني 72 قطعة أبيض ذهبي', qty: 1, price: 3200, cost: 2500, cat: 'مطبخ وسفرة', status: 'delivered', saleNo: 3 }, { id: 'bi5', pid: 'p13', name: 'طقم حلل جرانيت 10 قطع رمادي', qty: 1, price: 2950, cost: 2300, cat: 'مطبخ وسفرة', status: 'planned' }, { id: 'bi6', pid: null, name: 'أطقم ملايات', qty: 4, price: 650, cat: 'مفروشات', status: 'planned' }, { id: 'bi7', pid: null, name: 'سجاد الصالون', qty: 1, price: 0, cat: 'سجاد وستائر', status: 'planned' }, { id: 'bi8', pid: null, name: 'ستائر الصالون', qty: 1, price: 0, cat: 'سجاد وستائر', status: 'planned' }] });
      db.brides.push({ id: 'b2', no: 2, date: T - 3 * DAY, customer: 'c2', bride: 'سلمى أشرف', groom: 'محمد طارق', wedding: U.today(T + 75 * DAY), address: 'ناصر', budget: 80000, status: 'open', by: 'مريم (كاشير)', used: 0, pays: [{ t: T - 3 * DAY, v: 5000, m: 'cash', by: 'مريم (كاشير)' }], items: [{ id: 'bj1', pid: 'p5', name: 'تكييف 1.5 حصان بارد ساخن', qty: 1, price: 24500, cat: 'أجهزة كهربائية', status: 'planned' }, { id: 'bj2', pid: null, name: 'طقم أركوبال', qty: 1, price: 1600, cat: 'مطبخ وسفرة', status: 'planned' }] });
      db.seq.bride = 2; P('p1').stock -= 1;
      var fab = db.products.filter(function (x) { return x.sellBy === 'm'; })[0], rail = db.products.filter(function (x) { return /مجرى/.test(x.name); })[0], roll = db.products.filter(function (x) { return x.sellBy === 'm2'; })[0];
      db.orders.push({ id: 'o1', no: 1, date: T - 4 * DAY, customer: 'c5', address: 'بني سويف الجديدة — عمارة 12', status: 'cutting', tech: 'فني التركيب', appt: U.today(T + 2 * DAY), apptTime: '11:00', note: 'الصالون شباكين — تركيب على السقف', by: 'م. محمد علي', installFee: 300, deliveryFee: 0, discount: 0, extras: [{ name: 'كلبسات وحلقات', qty: 1, price: 150 }], log: [{ t: T - 4 * DAY, s: 'measure', u: 'م. محمد علي' }, { t: T - DAY, s: 'cutting', u: 'م. محمد علي' }], pays: [{ t: T - 4 * DAY, v: 2000, m: 'cash', by: 'م. محمد علي' }],
        rooms: [{ type: 'curtain', name: 'الصالون', w: 3.2, h: 2.7, panels: 2, fullness: 2.5, fabricPid: fab.id, fabricName: fab.name + ' ' + fab.shade, fabricPrice: 220, liningName: 'شيفون أبيض', liningPrice: 80, railPid: rail.id, railName: rail.name, railPrice: 140 }, { type: 'curtain', name: 'غرفة النوم', w: 2, h: 2.5, panels: 2, fullness: 2.5, fabricName: 'بلاك أوت رمادي', fabricPrice: 170 }] });
      db.orders.push({ id: 'o2', no: 2, date: T - 2 * DAY, customer: 'c1', address: 'بني سويف — الحي التاني', status: 'ready', tech: 'فني التركيب', appt: U.today(T), apptTime: '16:00', note: '', by: 'مريم (كاشير)', installFee: 0, deliveryFee: 100, discount: 0, extras: [], pays: [{ t: T - 2 * DAY, v: 1500, m: 'wallet', by: 'مريم (كاشير)' }], rooms: [{ type: 'carpet', name: 'الريسبشن', l: 5, w: 4, waste: 5, fabricPid: roll.id, fabricName: roll.name + ' ' + roll.shade, fabricPrice: 240, edgePrice: 25 }] });
      db.seq.order = 2;
      db.deliveries.push({ id: 'd1', no: 1, date: T - DAY, customer: 'c3', saleNo: 12, items: [{ name: 'غسالة أوتوماتيك 7 كيلو', qty: 1 }], when: U.today(), time: '13:00', type: 'both', staff: 'السائق', fee: 0, cod: 0, address: 'الواسطى — بجوار المسجد الكبير', note: 'الدور الرابع بدون أسانسير', status: 'scheduled', by: 'مريم (كاشير)' }, { id: 'd2', no: 2, date: T, customer: 'c4', saleNo: 15, items: [{ name: 'أنتريه مودرن 4 قطع', qty: 1 }], when: U.today(T + DAY), time: '10:00', type: 'delivery', staff: 'السائق', fee: 150, cod: 0, address: 'بني سويف الجديدة', note: '', status: 'scheduled', by: 'م. محمد علي' });
      db.seq.delivery = 2;
      db.quotes.push({ id: 'q1', no: 1, date: T - DAY, customer: '', name: 'م. وليد (شقة جديدة)', phone: '01155554444', valid: U.today(T + 6 * DAY), note: 'شامل التوصيل داخل بني سويف', tier: 0, items: [{ pid: 'p1', name: 'ثلاجة توشيبا 14 قدم نوفروست', qty: 1, price: 19500 }, { pid: 'p4', name: 'شاشة سمارت 43 بوصة', qty: 1, price: 13200 }], sub: 32700, disc: 700, vat: 0, total: 32000, by: 'م. محمد علي', status: 'open' });
      db.seq.quote = 1;
      homeCfg().whs = [{ id: 'main', name: 'المعرض' }, { id: 'store', name: 'المخزن الرئيسي' }, { id: 'w3', name: 'مخزن السجاد' }];
      db.products.forEach(function (p, i) { p.wh = {}; if (p.cat === 'سجاد') { var a = Math.floor(U.n(p.stock) * 0.6); p.wh.w3 = a; } else if (U.n(p.stock) > 4) { p.wh.store = Math.floor(U.n(p.stock) / 2); } Wh.ensure(p); });
      db.transfers.push({ id: 't1', no: 1, date: T - 2 * DAY, from: 'store', to: 'main', by: 'م. محمد علي', note: '', items: [{ pid: 'p2', name: 'غسالة أوتوماتيك 7 كيلو', qty: 2 }, { pid: 'p14', name: 'طقم ملايات قطن 4 قطع', qty: 5 }] }); db.seq.transfer = 1;
      s.invoice.paper = 'A4';
      ['p1', 'p2', 'p3', 'p4', 'p5'].forEach(function (id) { P(id).serial = true; });
      var hh = homeCfg(); hh.reps = ['أ. سامح (مندوب المعرض)']; hh.comm = { 'u:u1': 1, 'u:u2': 1.5, 'r:أ. سامح (مندوب المعرض)': 2 };
      hh.packages = [{ id: 'k1', name: 'باكدج المطبخ الكامل', price: 7900, items: [{ pid: 'p8', name: 'طقم صيني 72 قطعة أبيض ذهبي', qty: 1, price: 3200 }, { pid: 'p13', name: 'طقم حلل جرانيت 10 قطع رمادي', qty: 1, price: 2950 }, { pid: 'p10', name: 'طقم أركوبال 46 قطعة', qty: 1, price: 1600 }, { pid: 'p11', name: 'طقم كاسات 12 قطعة', qty: 2, price: 380 }] }, { id: 'k2', name: 'باكدج الأجهزة الأساسية', price: 42000, items: [{ pid: 'p1', name: 'ثلاجة توشيبا 14 قدم نوفروست', qty: 1, price: 19500 }, { pid: 'p2', name: 'غسالة أوتوماتيك 7 كيلو', qty: 1, price: 14500 }, { pid: 'p3', name: 'بوتاجاز 5 شعلة فول أوبشن', qty: 1, price: 9800 }] }];
      db.supInst.push({ id: 'y1', no: 1, date: T - 20 * DAY, supplier: 's1', total: 19400, ref: 'فاتورة توكيل 5531', schedule: [{ n: 1, due: U.today(T - 5 * DAY), amount: 6466.66, paid: 6466.66 }, { n: 2, due: U.today(T + 2 * DAY), amount: 6466.66, paid: 0 }, { n: 3, due: U.today(T + 32 * DAY), amount: 6466.68, paid: 0 }], pays: [{ t: T - 5 * DAY, v: 6466.66, m: 'cash', by: 'م. محمد علي' }], by: 'م. محمد علي' }); db.seq.supInst = 1; db.suppliers[0].balance = 12933.34; db.suppliers[0].payments = (db.suppliers[0].payments || []).concat([{ t: T - 5 * DAY, v: 6466.66, u: 'م. محمد علي', m: 'cash', ref: 'Y#1', shift: '' }]); db.suppliers[0].phone = '01005556677'; db.suppliers[0].company = 'أ. خالد — مندوب التوكيل'; db.suppliers[0].address = 'القاهرة — شارع عبد العزيز';
      Store.saveNow();
    });
  }
};
