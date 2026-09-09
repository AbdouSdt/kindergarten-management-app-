# تركيب الـ agent loop

الملفات موجودة الآن في `App créche\claude-setup\`.
لم أستطع الكتابة مباشرة داخل `.claude` (محمي من الأدوات البعيدة)، فانقلها بنفسك.

افتح PowerShell ونفّذ:

```powershell
cd "$HOME\App créche"
Copy-Item -Path "claude-setup\*" -Destination ".claude\" -Recurse -Force
Remove-Item "claude-setup" -Recurse -Force
```

النتيجة:

```
.claude/
├── CLAUDE.md                  خريطة المشروع المختصرة (تُحمَّل تلقائيًا)
├── BACKLOG.md                 لوحة المهام المرتّبة
├── PROGRESS.md                سجل التشغيل
├── agents/
│   ├── db-agent.md            المخطط، RLS، الترحيلات، الأنواع
│   ├── feature-agent.md       الصفحات وserver actions والمنطق
│   ├── ui-agent.md            التنسيق، RTL، الهاتف
│   ├── mobile-agent.md        PWA ثم Capacitor ثم APK
│   └── review-agent.md        البوابة: lint / type-check / build + مراجعة الـ diff
└── skills/dev-loop/SKILL.md   المنسّق — استدعِه بـ /dev-loop
```

ثم في Claude Code داخل مجلد المشروع:

```
/dev-loop
```

## كيف تعمل الحلقة

المنسّق لا يقرأ الكود إطلاقًا. يقرأ ثلاثة ملفات فقط: `CLAUDE.md` و`BACKLOG.md`
وذيل `PROGRESS.md`. يأخذ أعلى مهمة غير منجزة، يكتب بريفًا مكتفيًا بذاته، يفوّضه
إلى الوكيل المختص، ثم يمرّر النتيجة إلى `review-agent` قبل الاعتماد.

كل وكيل يبدأ بسياق نظيف ويُرجع 25 سطرًا على الأكثر. لهذا يبقى سياق المنسّق
منخفضًا: بعد كل مهمتين يتحقق، وعند بلوغ ~30٪ يكتب `## HANDOFF` في `PROGRESS.md`
ويتوقف. تفتح جلسة جديدة وتكتب `/dev-loop` فيلتقط من حيث توقّف.

قاعدتان تحفظان جودة المخرجات:

- مهمة واحدة = وكيل واحد = مراجعة واحدة. المهمة التي تحتاج وكيلين ليست مهمة
  واحدة — قسّمها في `BACKLOG.md` أولًا. تغيير المخطط والواجهة فوقه دائمًا مهمتان.
- الفشل مرتين على نفس المهمة يوقف الحلقة. المشكلة عندها في صياغة المهمة، لا في
  الوكيل.
