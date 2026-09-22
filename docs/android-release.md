<!-- ⁦dir: rtl⁩ · لغة المحتوى: العربية -->

# بناء ملف ⁦APK⁩ موقَّع للإصدار (⁦Release)⁩

دليل لصاحب المشروع لإنتاج ⁦APK⁩ موقَّع من قوقعة ⁦Capacitor.⁩ إتمامه يفكّ عنصر الـ ⁦backlog⁩ رقم **⁦P2-4⁩**.
كل الأوامر تُنفَّذ في **⁦PowerShell⁩** على ويندوز. الأوامر والمسارات تبقى بالإنجليزية.

> **قاعدة أساسية:** الوكلاء (⁦agents)⁩ لا يُنشئون ولا يرون ملف المفاتيح (⁦keystore)⁩ ولا كلمات مروره.
> أنت وحدك تنفّذ الخطوات ⁦2⁩ و⁦3⁩ و⁦4⁩ على جهازك. لا تكتب كلمة المرور في محادثة ولا في ملف داخل المستودع.

---

## ⁦1.⁩ المتطلبات

- ⁦JDK 21⁩ (المستخدم في هذا المشروع): `⁦C:\Users\sabdo\.jdks\jbr-21.0.11⁩`.
- ⁦Android SDK⁩ (يأتي مع ⁦Android Studio):⁩ `⁦C:\Users\sabdo\AppData\Local\Android\Sdk⁩`.
- المشروع يحتوي «é» في مساره، لذلك `⁦android.overridePathCheck⁩=⁦true⁩` مفعّل في `⁦android/gradle.properties⁩` — لا تحذفه.
- التطبيق منشور على ⁦Vercel⁩ (راجع `⁦docs/deploy-vercel.md⁩`)، فالـ ⁦APK⁩ مجرّد قوقعة تشير إلى ذلك الرابط.

جهّز متغيّرات الجلسة في ⁦PowerShell⁩ (كل نافذة جديدة تحتاجها):

```powershell
$env:JAVA_HOME = "C:\Users\sabdo\.jdks\jbr-21.0.11"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$Sdk = "C:\Users\sabdo\AppData\Local\Android\Sdk"
```

---

## ⁦2.⁩ إنشاء ملف المفاتيح (مرة واحدة فقط)

أنشئه **خارج المستودع**، مثلًا في `⁦C:\Users\sabdo\keystores\⁩`:

```powershell
New-Item -ItemType Directory -Force "C:\Users\sabdo\keystores"

keytool -genkeypair -v `
  -keystore "C:\Users\sabdo\keystores\creche-release.jks" `
  -alias creche `
  -keyalg RSA -keysize 2048 -validity 10000
```

- سيطلب `⁦keytool⁩` كلمة مرور لملف المفاتيح وبيانات الشهادة (الاسم، المؤسسة…). اختر كلمة مرور قوية واحفظها في مدير كلمات مرور.
- إن ضغطت ⁦Enter⁩ عند سؤال كلمة مرور المفتاح تصبح مطابقة لكلمة مرور الملف. ضعها بنفس القيمة في `⁦keyPassword⁩` أدناه.

> **تحذير — انسخ الملف احتياطيًّا الآن.**
> احتفظ بنسخة من `⁦creche-release.jks⁩` **وكلمة مروره** في مكانين على الأقل (قرص خارجي + تخزين سحابي خاص).
> إن ضاع الملف أو نُسيت كلمة المرور فلن تستطيع نشر تحديثات لنفس التطبيق (`⁦dz.creche.app⁩`)؛
> سيضطرّ المستخدمون إلى حذف التطبيق وتثبيت آخر جديد بمعرّف مختلف.
> ولا تشاركه مع أحد ولا ترفعه إلى ⁦Git⁩ أو إلى أي محادثة.

---

## ⁦3.⁩ ضبط التوقيع دون تسريب الأسرار

`⁦android/app/build.gradle⁩` يقرأ الملف `⁦android/keystore.properties⁩` إن وُجد. الملف **مُتجاهَل في ⁦Git⁩**
(مع `*.⁦jks⁩` و`*.⁦keystore⁩`). إن لم يوجد، يُبنى الإصدار **غير موقَّع** ويبقى `⁦assembleDebug⁩` سليمًا.

```powershell
cd "C:\Users\sabdo\App créche\android"
Copy-Item keystore.properties.example keystore.properties
notepad keystore.properties
```

عدّل القيم الأربع:

```properties
storeFile=C:/Users/sabdo/keystores/creche-release.jks
storePassword=<كلمة مرور الملف>
keyAlias=creche
keyPassword=<كلمة مرور المفتاح>
```

- استعمل **الشرطة المائلة `/`** في `⁦storeFile⁩` حتى على ويندوز (الشرطة العكسية تُفسَّر كحرف هروب في ملفات ⁦properties).⁩
- الملف `⁦keystore.properties.example⁩` هو القالب المرفوع إلى ⁦Git⁩، بقيم نائبة فقط. لا تضع فيه قيمًا حقيقية.
- تحقّق أن ⁦Git⁩ لا يراه: `⁦git status⁩` يجب ألّا يُظهر `⁦keystore.properties⁩` ولا `*.⁦jks⁩`.

---

## ⁦4.⁩ تحديد رابط الإنتاج قبل المزامنة

الرابط الذي يفتحه التطبيق يُكتب في المشروع الأندرويدي وقت `⁦cap sync⁩`، وليس وقت البناء بـ ⁦Gradle.⁩
القيمة تأتي من `⁦CAPACITOR_SERVER_URL⁩`، وإن لم تُضبط فمن الرابط الافتراضي في `⁦capacitor.config.ts⁩`
(`⁦https://kindergarten-management-app.vercel.app/⁩`). الرابط يجب أن يكون **⁦https⁩** وإلا رفض الإعداد.

```powershell
cd "C:\Users\sabdo\App créche"

# الرابط الافتراضي:
npx cap sync android

# أو رابط مخصّص (دومين خاص مثلًا):
$env:CAPACITOR_SERVER_URL = "https://your-domain.example/"
npx cap sync android
Remove-Item Env:CAPACITOR_SERVER_URL
```

إن غيّرت الرابط لاحقًا فأعد `⁦cap sync⁩` ثم ابنِ ⁦APK⁩ جديدًا.

---

## ⁦5.⁩ البناء

```powershell
cd "C:\Users\sabdo\App créche\android"
$env:JAVA_HOME = "C:\Users\sabdo\.jdks\jbr-21.0.11"

.\gradlew assembleRelease
```

الناتج:

```
android\app\build\outputs\apk\release\app-release.apk            # موقَّع (keystore.properties موجود)
android\app\build\outputs\apk\release\app-release-unsigned.apk   # غير موقَّع (الملف غير موجود)
```

الـ ⁦APK⁩ غير الموقَّع **لا يُثبَّت** على الجهاز؛ إن ظهر لك هذا الاسم فراجع الخطوة ⁦3.⁩

اختياري — لرفع التطبيق إلى ⁦Google Play⁩ تحتاج حزمة ⁦AAB⁩ بدل ⁦APK:⁩

```powershell
.\gradlew bundleRelease
# الناتج: android\app\build\outputs\bundle\release\app-release.aab
```

(⁦Play⁩ يطلب حساب مطوّر مدفوعًا، ويُفضَّل تفعيل ⁦Play App Signing.)⁩

---

## ⁦6.⁩ التحقق من التوقيع

```powershell
$Sdk = "C:\Users\sabdo\AppData\Local\Android\Sdk"
& "$Sdk\build-tools\36.0.0\apksigner.bat" verify --verbose --print-certs `
  "C:\Users\sabdo\App créche\android\app\build\outputs\apk\release\app-release.apk"
```

المتوقَّع: `⁦Verifies⁩` وسطر `⁦Verified using v2 scheme: true⁩`، مع بصمة الشهادة (⁦SHA-256)⁩ التي أنشأتها.
سجّل هذه البصمة؛ يجب أن تبقى ثابتة في كل الإصدارات القادمة.

---

## ⁦7.⁩ التثبيت على الجهاز

فعّل **⁦USB debugging⁩** على الهاتف ثم:

```powershell
$Sdk = "C:\Users\sabdo\AppData\Local\Android\Sdk"
& "$Sdk\platform-tools\adb.exe" devices
& "$Sdk\platform-tools\adb.exe" install -r "C:\Users\sabdo\App créche\android\app\build\outputs\apk\release\app-release.apk"
```

- إن كان على الجهاز نسخة **⁦debug⁩** مثبّتة فالتثبيت يفشل بـ `⁦INSTALL_FAILED_UPDATE_INCOMPATIBLE⁩` لأن التوقيع مختلف.
  احذفها أولًا: `⁦adb uninstall dz.creche.app⁩` (سيُحذف تسجيل الدخول المحلي فقط، لا بيانات الخادم).
- للتوزيع اليدوي يمكنك إرسال ملف الـ ⁦APK⁩ نفسه وتفعيل «التثبيت من مصادر غير معروفة» على الهاتف.

---

## ⁦8.⁩ رفع رقم الإصدار للتحديثات

في `⁦android/app/build.gradle⁩` داخل `⁦defaultConfig⁩`:

```groovy
versionCode 2        // عدد صحيح، يجب أن يزيد في كل إصدار (1 ← 2 ← 3 ...)
versionName "1.1"    // نص يراه المستخدم
```

- `⁦versionCode⁩` هو ما يقارنه أندرويد؛ لا يقبل التثبيت فوق نسخة بـ `⁦versionCode⁩` أعلى أو مساوٍ.
- وقّع دائمًا بنفس ملف المفاتيح وإلا رفض أندرويد التحديث.
- بما أن التطبيق قوقعة تشير إلى ⁦Vercel⁩، **تحديثات الواجهة والمنطق تصل تلقائيًّا بدون ⁦APK⁩ جديد**.
  ابنِ ⁦APK⁩ جديدًا فقط عند تغيير الغلاف نفسه (الأيقونة، الاسم، الرابط، إضافات ⁦Capacitor).⁩

---

## ⁦9.⁩ ملاحظات أمان

- `⁦android:allowBackup⁩="⁦false⁩"` مفعّل في `⁦AndroidManifest.xml⁩` لأن الـ ⁦WebView⁩ يحتفظ بكوكيز الجلسة؛
  لا نريد أن تُنسخ احتياطيًّا إلى السحابة أو تُستخرج عبر `⁦adb backup⁩`.
- التطبيق لا يسمح بحركة ⁦HTTP⁩ غير المشفّرة (⁦cleartext⁩ معطّل) ويحمّل روابط ⁦https⁩ فقط.
- قبل كل `⁦git commit⁩` نفّذ `⁦git status⁩` وتأكّد أنه لا يظهر أي ملف `⁦keystore.properties⁩` أو `*.⁦jks⁩` أو `*.⁦keystore⁩` أو `*.⁦apk⁩`.
