// node build/manual/build.js → releases/دليل-صاحب-المحل-غاندي-للأدوات-المنزلية.pdf
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const D = __dirname, SPEC = require('./spec.js'), MARKS = JSON.parse(fs.readFileSync(path.join(D, 'marks.json'), 'utf8'));
const VER = JSON.parse(fs.readFileSync(path.join(D, '../../app/package.json'), 'utf8')).version;
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const img = id => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(D, 'img', id + '.jpg')).toString('base64');

const shotBlock = (id, cap) => {
  const ms = (MARKS[id] || []).filter(m => m.title || m.text);
  return '<div class="shot"><div class="frame"><img src="' + img(id) + '"></div>' + (cap ? '<div class="cap">' + cap + '</div>' : '') +
    (ms.length ? '<ol class="legend">' + ms.map(m => '<li><span class="no">' + m.n + '</span><div><b>' + esc(m.title) + '</b>' + (m.text ? ' — ' + esc(m.text) : '') + '</div></li>').join('') + '</ol>' : '') + '</div>';
};
const tips = t => t && t.length ? '<div class="tip"><b>💡 نصيحة مني</b><ul>' + t.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' : '';

/* ---------- system map ---------- */
const box = (x, y, w, h, t, s, c) => '<g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="14" fill="' + (c || '#fff') + '" stroke="#1f4e79" stroke-width="2"/><text x="' + (x + w / 2) + '" y="' + (y + (s ? h / 2 - 4 : h / 2 + 6)) + '" text-anchor="middle" font-size="17" font-weight="800" fill="#12263f">' + t + '</text>' + (s ? '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 18) + '" text-anchor="middle" font-size="12.5" fill="#4a5a70">' + s + '</text>' : '') + '</g>';
const arr = (x1, y1, x2, y2, lbl) => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#e11d48" stroke-width="2.4" marker-end="url(#ah)"/>' + (lbl ? '<text x="' + ((x1 + x2) / 2) + '" y="' + ((y1 + y2) / 2 - 6) + '" text-anchor="middle" font-size="11.5" fill="#b4123a" font-weight="700">' + lbl + '</text>' : '');
const MAP = '<svg viewBox="0 0 1000 860" xmlns="http://www.w3.org/2000/svg" style="width:100%;font-family:Tahoma,Arial" direction="rtl"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#e11d48"/></marker></defs>' +
  '<rect x="0" y="0" width="1000" height="56" rx="12" fill="#12263f"/><text x="500" y="35" text-anchor="middle" font-size="17" fill="#fff" font-weight="800">👤 المستخدمين والصلاحيات — كل موظف بيشوف ويعمل اللي انت سامحله بيه بس · وسجل العمليات بيسجّل كل حاجة</text>' +
  box(790, 90, 190, 70, '🏭 الموردين', 'فواتير · تسديد · كشف حساب') + box(560, 90, 190, 70, '🚚 استلام البضاعة', 'بيزوّد المخزن والتكلفة') + box(330, 90, 190, 70, '📦 الأصناف والمخازن', 'رصيد كل مخزن · جرد') + box(70, 90, 210, 70, '🏷️ الأسعار والعروض', 'رفع / تخفيض · عروض') +
  arr(790, 125, 752, 125) + arr(560, 125, 522, 125) + arr(282, 125, 328, 125) + box(790, 180, 190, 50, '🏭 أقساط الموردين', '', '#fff7e6') + arr(885, 162, 885, 178) +
  box(780, 290, 200, 60, '📝 عروض الأسعار', 'تتحول لفاتورة') + box(780, 370, 200, 60, '💍 ملفات العرائس', 'تسليم على مراحل') + box(780, 450, 200, 60, '🪟 أوامر الستائر والسجاد', 'مقاسات · ورشة · تركيب') +
  '<g><rect x="390" y="300" width="250" height="200" rx="22" fill="#1f4e79"/><text x="515" y="380" text-anchor="middle" font-size="26" font-weight="900" fill="#fff">🛍️ نقطة البيع</text><text x="515" y="412" text-anchor="middle" font-size="13.5" fill="#dbe7f5">باركود · بالمتر · سيريال</text><text x="515" y="434" text-anchor="middle" font-size="13.5" fill="#dbe7f5">كاش · فيزا · محافظ · آجل · تقسيط</text></g>' +
  arr(425, 162, 470, 298, 'بيتخصم من المخزن') + arr(778, 320, 642, 360) + arr(778, 400, 642, 400) + arr(778, 480, 642, 440) +
  box(30, 250, 220, 60, '🧾 الفاتورة', 'A4 أو حراري · معاينة') + box(30, 330, 220, 60, '👥 العملاء', 'آجل · نقاط · كشف حساب') + box(30, 410, 220, 60, '🏦 التقسيط', 'عقود · كمبيالات · تحصيل') + box(30, 490, 220, 60, '🚚 التوصيل والتركيب', 'مواعيد · إذن تسليم') + box(30, 570, 220, 60, '🛡️ الضمان', 'بالسيريال أو الفاتورة') +
  arr(388, 340, 252, 280) + arr(388, 370, 252, 360) + arr(388, 410, 252, 440) + arr(388, 450, 252, 520) + arr(388, 480, 252, 600) +
  box(390, 560, 250, 64, '🕐 الوردية والخزنة', 'المتوقع في الدرج · العجز والزيادة', '#eef6ee') + arr(515, 502, 515, 558) + box(700, 560, 200, 64, '💸 المصروفات', 'من الدرج أو برّه', '#eef6ee') + arr(698, 592, 642, 592) + arr(250, 440, 388, 585, 'تحصيل الأقساط') +
  box(390, 670, 250, 70, '📊 التقارير والأرباح', 'المبيعات · الربح · العمولات', '#fff7e6') + arr(515, 626, 515, 668) +
  '<rect x="0" y="780" width="1000" height="66" rx="12" fill="#eaf2fb" stroke="#1f4e79" stroke-width="2" stroke-dasharray="6 5"/><text x="500" y="808" text-anchor="middle" font-size="16" font-weight="800" fill="#12263f">💾 النسخ الاحتياطي التلقائي — كل البيانات دي بتتحفظ نسخة منها جنب البرنامج + 3 أماكن بتختارها</text><text x="500" y="832" text-anchor="middle" font-size="13" fill="#4a5a70">⚙️ الإعدادات وشكل الفواتير والتصميمات بتتحكم في شكل وشغل كل الصفحات</text></svg>';

/* ---------- installer mockups ---------- */
const win = (title, body, foot) => '<div class="win"><div class="wt"><span>●</span><span>●</span><span>●</span> تسطيب غاندي للأدوات المنزلية</div><div class="wb"><div class="wside">🏠</div><div class="wc"><h4>' + title + '</h4>' + body + '</div></div><div class="wf">' + foot + '</div></div>';
const INSTALL = '<div class="wins">' +
  win('أهلاً بيك في تسطيب غاندي', '<p>نظام إدارة معارض الأدوات المنزلية والأجهزة الكهربائية وتجهيز العرائس والسجاد والستائر.</p>', '<span class="wbtn">إلغاء</span><span class="wbtn pri">التالي ←</span>') +
  win('اختار مكان التسطيب', '<p>المكان المقترح:</p><div class="wpath">D:\\GhandiHome</div><p class="sm">لو جهازك فيه بارتيشن D البرنامج بيختاره لوحده — عشان لو الويندوز وقع البيانات تفضل سليمة.</p>', '<span class="wbtn">رجوع</span><span class="wbtn pri">تسطيب</span>') +
  win('جاري التسطيب…', '<div class="wbar"><span></span></div><p class="sm">بيتنسخ البرنامج وبيتعمل أيقونة على سطح المكتب وفي قائمة ابدأ.</p>', '<span class="wbtn pri">التالي ←</span>') +
  win('تم تسطيب غاندي بنجاح ✓', '<p>أول ما البرنامج يفتح هيظهرلك بصمة الجهاز — ابعتها للمطوّر علشان تاخد كود التفعيل.</p><p>☑ شغّل غاندي دلوقتي</p>', '<span class="wbtn pri">إنهاء</span>') + '</div>';

const CH = [];
const chapter = (title, html, sub) => { CH.push(title); return '<section class="ch"><div class="chh"><span class="chn">' + CH.length + '</span><div><h2>' + title + '</h2>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div></div>' + html + '</section>'; };

let body = '';
body += chapter('خريطة البرنامج — إزاي كل حاجة مربوطة ببعض', '<p class="intro">قبل ما ندخل في التفاصيل، بص على الرسمة دي: هي البرنامج كله في صفحة واحدة. البضاعة بتيجي من <b>الموردين</b> وتدخل <b>المخزن</b>، ومن <b>نقطة البيع</b> بتطلع للعميل: فاتورة، أو آجل على حسابه، أو تقسيط، ومعاها توصيل وتركيب وضمان. وكل الفلوس بتتحسب في <b>الوردية</b>، وكله بيطلع في <b>التقارير</b>. وفوق ده كله <b>الصلاحيات</b> اللي بتحدد كل موظف يعمل إيه، وتحت ده كله <b>النسخ الاحتياطي</b> اللي بيحمي بياناتك.</p><div class="map">' + MAP + '</div>' +
  '<div class="tip"><b>💡 الأسهم الحمرا</b><ul><li>بتوريك الحاجة بتروح فين: مثلاً بيع صنف بيتخصم من المخزن، وتحصيل قسط كاش بيدخل الوردية.</li><li>مش محتاج تعمل أي ربط بإيدك — البرنامج بيعمل ده كله لوحده.</li></ul></div>');
body += chapter('تسطيب البرنامج', '<p class="intro">هتلاقي معاك ملف اسمه <b>Ghandi-Home-Setup.exe</b>. دوس عليه دبل كليك وامشي مع الخطوات دي — كلها 4 شاشات ومش محتاج إنترنت خالص. البرنامج بيشتغل على ويندوز 7 و8 و10 و11.</p>' + INSTALL +
  '<div class="tip"><b>💡 بعد التسطيب</b><ul><li>هتلاقي أيقونة «غاندي للأدوات المنزلية» على سطح المكتب.</li><li>في قائمة ابدأ هتلاقي كمان: «فولدر النسخ الاحتياطية» و«إزالة غاندي».</li><li>لو جالك تحديث مني (ملف Ghandi-Home-Update.exe) شغّله بنفس الطريقة — بيحدّث البرنامج من غير ما يلمس بياناتك أو التفعيل.</li></ul></div>');
body += chapter('التفعيل وأول دخول', '<p class="intro">أول مرة البرنامج يفتح هيطلب تفعيل. التفعيل مربوط بجهازك (بصمة الجهاز)، يعني الكود اللي هبعتهولك هيشتغل على الجهاز ده بس.</p>' +
  shotBlock('activation', 'شاشة التفعيل') + shotBlock('login', 'شاشة الدخول') + '<p class="intro">أول دخول هيطلب منك تغيّر كلمة السر الافتراضية 1234 — ده مهم عشان محدش يدخل على البرنامج غيرك:</p>' + shotBlock('first_pass', 'تغيير كلمة السر') +
  '<div class="tip"><b>💡 بعد كلمة السر</b><ul><li>البرنامج بيوديك على «بيانات المحل» على طول — اكتب اسم المحل وارفع اللوجو (هتلاقي شرحها في فصل «بيانات المحل»).</li><li>بعد كده ضيف الموظفين من «المستخدمين والصلاحيات»، وابدأ تضيف الأصناف.</li></ul></div>');

const sub = { dash: 'أول حاجة بتشوفها', pos: 'البيع اليومي', inst: 'أهم ميزة في معارض الأجهزة', docs: 'الفاتورة والمعاينة', backup: 'متهملهاش أبداً' };
SPEC.forEach(ch => { body += chapter(ch.title, '<p class="intro">' + esc(ch.intro) + '</p>' + ch.shots.map(s => shotBlock(s.id)).join('') + tips(ch.tips), sub[ch.ch]); });

body += chapter('يوم شغل في المعرض — من الفتح للقفل', '<ol class="day">' + [
  ['🔓', 'افتح البرنامج وادخل باسمك', 'كل موظف بيدخل باسمه وكلمة سره.'],
  ['🕐', 'افتح الوردية', 'اكتب الفلوس اللي في الدرج أول اليوم.'],
  ['🏠', 'بص على الرئيسية', 'تنبيهات اليوم: أقساط مستحقة، توصيلات، تركيبات، أفراح قربت.'],
  ['🛍️', 'بيع من نقطة البيع', 'كاش، فيزا، آجل، أو تقسيط — والفاتورة بتتطبع وبتتعرض قبل الطباعة.'],
  ['💵', 'حصّل الأقساط', 'من صفحة التقسيط، واطبع إيصال لكل عميل.'],
  ['🚚', 'تابع التوصيل والتركيب', 'اطبع خط السير للسواق والفني.'],
  ['💸', 'سجّل المصروفات', 'أي فلوس طلعت من الدرج.'],
  ['🧮', 'اقفل الوردية', 'عدّ الدرج — البرنامج بيقولك فيه عجز ولا زيادة.'],
  ['💾', 'النسخة الاحتياطية', 'بتتعمل لوحدها عند قفل الوردية والخروج — ولو معاك فلاشة متحددة بتتحفظ عليها كمان.']
].map(s => '<li><span class="de">' + s[0] + '</span><div><b>' + s[1] + '</b><br>' + s[2] + '</div></li>').join('') + '</ol>');

body += chapter('أسئلة بتتكرر', '<div class="faq">' + [
  ['لو غيّرت الأسعار، الفواتير القديمة بتتغير؟', 'لأ. كل فاتورة بتتحفظ بسعرها وقت البيع، والتغيير بيأثر على البيع الجديد بس.'],
  ['غيّرت الجهاز، أعمل إيه؟', 'خد ملف النسخة الاحتياطية (.gbk) على فلاشة ← سطّب البرنامج على الجهاز الجديد ← كلّمني بالبصمة الجديدة عشان أفعّله ← النسخ الاحتياطي ← استرجاع نسخة ← اختار الملف. كل بياناتك هترجع زي ما هي.'],
  ['الموظف مش شايف صفحة معيّنة', 'من «المستخدمين والصلاحيات» افتح صلاحياته وشغّل الصفحة دي.'],
  ['نسيت كلمة السر', 'اتصل بيا وأنا أرجعهالك.'],
  ['الطابعة مش بتطبع', 'من «الإعدادات ← الطابعات» اختار الطابعة الصح، ولفاتورة A4 اختار الطابعة الليزر من «إعدادات المعرض ← طابعة A4».'],
  ['عايز أغيّر كلمة في الفاتورة أو أشيل الختم', 'الإعدادات ← «شكل الفواتير وعروض الأسعار» ← تعديل الشكل والكلام والشروط.'],
  ['التفعيل خلص', 'هيظهرلك شاشة التفعيل تاني ومعاها البصمة — ابعتهالي وأبعتلك كود جديد. بياناتك مش بتتمسح.'],
  ['البرنامج محتاج إنترنت؟', 'لأ خالص. كله بيشتغل من غير إنترنت، والإنترنت بس لو عايز تبعت واتساب للعميل.']
].map(q => '<div class="q"><b>❓ ' + q[0] + '</b><p>' + q[1] + '</p></div>').join('') + '</div>');

const TOC = '<section class="toc"><h2>المحتويات</h2><ol>' + CH.map((c, i) => '<li><span>' + (i + 1) + '</span>' + c + '</li>').join('') + '</ol></section>';
const COVER = '<section class="cover"><div class="cv-top">🏠</div><h1>غاندي للأدوات المنزلية</h1><div class="cv-sub">نظام إدارة معارض الأدوات المنزلية والأجهزة الكهربائية<br>وتجهيز العرائس والسجاد والستائر</div><div class="cv-badge">دليل صاحب المحل — من التسطيب لحد آخر ميزة</div><div class="cv-shot"><img src="' + img('dashboard') + '"></div><div class="cv-dev">برمجة وتطوير<br><b>م. محمد علي</b><br><span>01098811581</span></div><div class="cv-ver">الإصدار ' + VER + '</div></section>';
const HELLO = '<section class="hello"><h2>👋 أهلاً بيك</h2><p>أنا <b>م. محمد علي</b>، اللي عامل البرنامج ده. عملته مخصوص لمعارض الأدوات المنزلية والأجهزة وتجهيز العرائس والسجاد والستائر، عشان كل حاجة في معرضك تبقى في مكان واحد: البيع، والتقسيط، والعرائس، والتفصيل، والتوصيل، والمخازن، والموردين، والحسابات.</p><p>في الكتيب ده هشرحلك البرنامج خطوة بخطوة، من أول ما تسطّبه لحد آخر ميزة فيه. في كل صفحة هتلاقي صورة من البرنامج عليها <span class="no inline">1</span> <span class="no inline">2</span> <span class="no inline">3</span> بالأحمر، وتحت الصورة شرح كل رقم: الخانة دي اسمها إيه، بتعمل إيه، وإمتى تستخدمها.</p><p>البرنامج <b>شغّال من غير إنترنت</b>، وبياناتك <b>محفوظة ومتشفّرة على جهازك</b>، وبيتعمل منها <b>نسخة احتياطية لوحدها</b>.</p><p>لو وقفت في أي حاجة أو محتاج ميزة جديدة، كلّمني على طول:</p><div class="contact">📱 <b>01098811581</b> — م. محمد علي</div><div class="tip"><b>💡 إزاي تقرا الكتيب</b><ul><li>لو لسه بادئ: اقرا الفصول الأولى بالترتيب (الخريطة، التسطيب، التفعيل، الرئيسية، نقطة البيع).</li><li>بعد كده ارجع لأي فصل وقت ما تحتاجه — المحتويات في الصفحة الجاية.</li><li>الصور ببيانات تجريبية (معرض النور)، وعندك هتلاقي بيانات محلك.</li></ul></div></section>';
const BACK = '<section class="back"><div class="cv-top">🏠</div><h2>غاندي للأدوات المنزلية</h2><p>أي سؤال، أي مشكلة، أو ميزة محتاجها — أنا موجود.</p><div class="contact big">📱 01098811581</div><p><b>م. محمد علي</b> — برمجة وتطوير</p><p class="sm">التحديثات بتوصلك كملف تحديث صغير بيحافظ على بياناتك وتفعيلك.</p></section>';

const CSS = `@page{size:A4;margin:12mm 12mm 14mm}
*{box-sizing:border-box}body{margin:0;font-family:Tahoma,"Segoe UI",Arial,sans-serif;color:#17233a;font-size:12.6px;line-height:1.75}
h1,h2,h4{margin:0}section{page-break-after:always}
.cover{height:271mm;background:linear-gradient(160deg,#12263f,#1f4e79 55%,#2c6ca8);color:#fff;border-radius:16px;padding:22mm 16mm;text-align:center;position:relative;overflow:hidden}
.cover h1{font-size:46px;font-weight:900;margin-top:6px}.cv-top{font-size:60px}.cv-sub{font-size:17px;opacity:.92;margin-top:10px;line-height:1.8}
.cv-badge{display:inline-block;margin-top:18px;background:#f0a830;color:#12263f;font-weight:900;font-size:17px;padding:8px 22px;border-radius:30px}
.cv-shot{margin:22px auto 0;width:88%;border-radius:12px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.45);border:4px solid rgba(255,255,255,.25)}.cv-shot img{width:100%;display:block}
.cv-dev{margin-top:20px;font-size:15px;line-height:1.7}.cv-dev b{font-size:21px}.cv-dev span{font-size:20px;font-weight:800;color:#f0a830;letter-spacing:1px}
.cv-ver{position:absolute;bottom:12mm;left:0;right:0;font-size:12px;opacity:.75}
.hello h2,.toc h2{font-size:26px;color:#1f4e79;margin-bottom:10px}.hello p{font-size:14px;line-height:2}
.contact{background:#12263f;color:#fff;display:inline-block;padding:10px 22px;border-radius:12px;font-size:17px;margin:6px 0 14px}.contact.big{font-size:28px;font-weight:900;letter-spacing:1px}
.toc ol{list-style:none;padding:0;columns:2;column-gap:10mm}.toc li{display:flex;gap:10px;align-items:center;padding:6px 0;border-bottom:1px dashed #c9d5e6;font-size:14px;break-inside:avoid}.toc li span{background:#1f4e79;color:#fff;border-radius:50%;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:12.5px;flex:none}
.chh{display:flex;gap:14px;align-items:center;background:linear-gradient(90deg,#1f4e79,#2c6ca8);color:#fff;padding:12px 16px;border-radius:14px;margin-bottom:10px}
.chh h2{font-size:22px}.chh .sub{font-size:12px;opacity:.85}.chn{background:#f0a830;color:#12263f;font-weight:900;font-size:22px;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex:none}
.intro{font-size:13.6px;background:#f4f7fb;border-right:5px solid #1f4e79;padding:9px 14px;border-radius:8px;margin:8px 0 12px;line-height:1.95}
.shot{margin:0 0 14px;page-break-inside:avoid}.frame{border:1px solid #c9d5e6;border-radius:10px;overflow:hidden;box-shadow:0 4px 14px rgba(18,38,63,.12);text-align:center;background:#eef2f7}
.frame img{max-width:100%;max-height:150mm;display:block;margin:0 auto}.cap{text-align:center;font-size:11.5px;color:#56657a;margin-top:4px}
.legend{list-style:none;padding:0;margin:8px 0 0;columns:2;column-gap:8mm}.legend li{display:flex;gap:8px;align-items:flex-start;break-inside:avoid;padding:4px 0;font-size:12.2px;line-height:1.7}
.no{background:#e11d48;color:#fff;border-radius:50%;min-width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex:none;margin-top:2px}.no.inline{margin:0 1px;vertical-align:middle}
.tip{background:#fff8e8;border:1px solid #f1d39a;border-radius:10px;padding:8px 14px;margin:10px 0;page-break-inside:avoid}.tip ul{margin:4px 0 0;padding-right:20px}.tip li{margin:2px 0}
.map{border:1px solid #c9d5e6;border-radius:12px;padding:10px;background:#fbfcfe}
.wins{display:grid;grid-template-columns:1fr 1fr;gap:10px}.win{border:1px solid #9fb2c9;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 3px 10px rgba(0,0,0,.1);font-size:11.5px}
.wt{background:#dfe7f1;padding:5px 10px;font-weight:700;color:#334}.wt span{color:#f05;margin-left:3px;font-size:9px}.wb{display:flex;min-height:120px}.wside{width:70px;background:linear-gradient(#1f4e79,#2c6ca8);color:#fff;font-size:30px;display:flex;align-items:center;justify-content:center}.wc{padding:10px 12px;flex:1}.wc h4{font-size:14px;color:#1f4e79;margin-bottom:6px}.wc p{margin:4px 0}
.wpath{background:#f4f7fb;border:1px solid #9fb2c9;padding:5px 8px;direction:ltr;text-align:left;font-family:Consolas,monospace;border-radius:4px}.wbar{height:12px;background:#e6edf5;border-radius:6px;overflow:hidden;margin:16px 0 8px}.wbar span{display:block;width:68%;height:100%;background:#2c6ca8}
.wf{background:#f3f5f8;padding:6px 10px;display:flex;gap:6px;justify-content:flex-start;flex-direction:row-reverse}.wbtn{border:1px solid #9fb2c9;border-radius:4px;padding:2px 12px;background:#fff}.wbtn.pri{background:#1f4e79;color:#fff;border-color:#1f4e79}
.sm{font-size:11px;color:#56657a}
.day{list-style:none;padding:0}.day li{display:flex;gap:12px;align-items:center;padding:9px 12px;margin-bottom:8px;border:1px solid #c9d5e6;border-radius:12px;font-size:13.5px;page-break-inside:avoid}.de{font-size:28px;width:44px;text-align:center}
.faq .q{border:1px solid #c9d5e6;border-radius:12px;padding:9px 14px;margin-bottom:9px;page-break-inside:avoid}.faq .q b{color:#1f4e79;font-size:13.8px}.faq .q p{margin:4px 0 0}
.back{height:271mm;text-align:center;padding-top:60mm;background:#f4f7fb;border-radius:16px}.back h2{font-size:32px;color:#1f4e79;margin:10px 0}.back p{font-size:15px}`;

const html = '<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><style>' + CSS + '</style></head><body>' + COVER + HELLO + TOC + body + BACK + '</body></html>';
fs.writeFileSync(path.join(D, 'guide.html'), html);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const p = await b.newPage(); await p.setContent(html, { waitUntil: 'load' }); await p.waitForTimeout(500);
  const out = path.join(D, '../../releases/دليل-صاحب-المحل-غاندي-للأدوات-المنزلية.pdf');
  await p.pdf({ path: out, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<div></div>',
    footerTemplate: '<div style="width:100%;font-family:Tahoma;font-size:8.5px;color:#7a8799;display:flex;justify-content:space-between;padding:0 12mm" dir="rtl"><span>غاندي للأدوات المنزلية — دليل صاحب المحل</span><span>صفحة <span class="pageNumber"></span> من <span class="totalPages"></span></span><span>م. محمد علي 01098811581</span></div>',
    margin: { top: '12mm', bottom: '14mm', left: '12mm', right: '12mm' } });
  console.log('pdf ->', out, (fs.statSync(out).size / 1048576).toFixed(1) + 'MB', 'chapters', CH.length);
  await b.close();
})();
