package ru.tiho.app;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * «Тихо» для Android — собственное приложение со встроенным WebView.
 * Сообщения шифруются в коде мессенджера (как и в браузере); приложение даёт ему
 * камеру, микрофон, файлы, сохранение в «Загрузки» и системные уведомления.
 */
public class MainActivity extends Activity {
    private static final int REQ_MEDIA = 1;
    private static final int REQ_FILE = 2;
    private static final int REQ_NOTIFY = 3;
    private static final String CHANNEL = "messages";

    private WebView web;
    private View splash;
    private SharedPreferences prefs;
    private ValueCallback<Uri[]> fileCallback;
    private PermissionRequest pendingPermission;
    private volatile boolean offline = false;
    private int notifyId = 100;
    static volatile boolean visible = false;
    private String pendingAnswer = null;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        prefs = getSharedPreferences("tiho", MODE_PRIVATE);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#080D0B"));
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        splash = buildSplash();
        root.addView(splash, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        // поле ввода не должно прятаться под клавиатуру и в полноэкранном режиме
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int bottom = Build.VERSION.SDK_INT >= 30 ? insets.getInsets(android.view.WindowInsets.Type.ime()).bottom : insets.getSystemWindowInsetBottom();
            v.setPadding(0, 0, 0, fullscreen() ? bottom : 0);
            return insets;
        });
        if (Build.VERSION.SDK_INT >= 28) getWindow().getAttributes().layoutInDisplayCutoutMode = android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        applyFullscreen();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setUserAgentString(s.getUserAgentString() + " TihoApp/" + BuildConfig.VERSION_NAME);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);

        web.addJavascriptInterface(new Bridge(), "TihoAndroid");
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());

        createChannel();
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFY);
        }

        if (prefs.getBoolean("background", true)) TihoService.start(this);
        askBatteryExemption();
        handleCallIntent(getIntent());

        Uri link = getIntent().getData();
        open(link != null && isOurs(link) ? link.toString() : baseUrl() + "/");
    }

    private boolean fullscreen() { return prefs.getBoolean("fullscreen", true); }

    /** Полноэкранный режим: прячем строку состояния и кнопки навигации (появляются по свайпу от края) */
    @SuppressWarnings("deprecation")
    private void applyFullscreen() {
        boolean on = fullscreen();
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(!on);
            android.view.WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                if (on) {
                    c.hide(android.view.WindowInsets.Type.statusBars() | android.view.WindowInsets.Type.navigationBars());
                    c.setSystemBarsBehavior(android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                } else c.show(android.view.WindowInsets.Type.statusBars() | android.view.WindowInsets.Type.navigationBars());
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(on
                    ? View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    : View.SYSTEM_UI_FLAG_VISIBLE);
        }
        getWindow().getDecorView().requestApplyInsets();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && fullscreen()) applyFullscreen();
    }

    /** Чтобы система не усыпляла фоновую связь — один раз просим исключить из экономии батареи */
    private void askBatteryExemption() {
        if (Build.VERSION.SDK_INT < 23 || prefs.getBoolean("askedBattery", false)) return;
        prefs.edit().putBoolean("askedBattery", true).apply();
        try {
            android.os.PowerManager pm = (android.os.PowerManager) getSystemService(POWER_SERVICE);
            if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
                startActivity(new Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getPackageName())));
            }
        } catch (Exception ignored) { }
    }

    /** Открыли из уведомления о звонке: «Ответить» — отвечаем сразу, как только звонок появится в мессенджере */
    private void handleCallIntent(Intent intent) {
        if (intent == null || intent.getStringExtra("callId") == null) return;
        TihoService.cancelCall(this);
        if (intent.getBooleanExtra("answer", false)) {
            pendingAnswer = intent.getStringExtra("callId");
            injectAnswer();
        }
    }

    private void injectAnswer() {
        if (pendingAnswer == null) return;
        String id = pendingAnswer.replaceAll("[^A-Za-z0-9-]", "");
        web.evaluateJavascript("window.__tihoAutoAnswer='" + id + "';window.__tihoAnswerCall&&window.__tihoAnswerCall('" + id + "')", null);
    }

    /** fxTunnel показывает браузеру страницу-предупреждение; приложению она не нужна */
    private void open(String url) {
        java.util.Map<String, String> h = new java.util.HashMap<>();
        h.put("X-FxTunnel-Skip-Warning", "1");
        web.loadUrl(url, h);
    }

    private View buildSplash() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setBackgroundColor(Color.parseColor("#080D0B"));
        ImageView logo = new ImageView(this);
        logo.setImageResource(R.mipmap.ic_launcher);
        int size = (int) (96 * getResources().getDisplayMetrics().density);
        box.addView(logo, new LinearLayout.LayoutParams(size, size));
        ProgressBar bar = new ProgressBar(this);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.topMargin = size / 3;
        box.addView(bar, lp);
        return box;
    }

    private String baseUrl() {
        String u = prefs.getString("url", getString(R.string.app_url));
        return u.replaceAll("/+$", "");
    }

    private boolean isOurs(Uri u) {
        Uri base = Uri.parse(baseUrl());
        return "https".equals(u.getScheme()) && base.getHost() != null && base.getHost().equalsIgnoreCase(u.getHost());
    }

    private void showOffline(String reason) {
        offline = true;
        web.loadUrl("file:///android_asset/offline.html?e=" + Uri.encode(reason == null ? "" : reason));
        splash.setVisibility(View.GONE);
    }

    private class Client extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
            Uri u = req.getUrl();
            if (isOurs(u) || "file".equals(u.getScheme())) return false;
            try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (ActivityNotFoundException ignored) { }
            return true;
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            splash.setVisibility(View.GONE);
            injectAnswer();
            CookieManager.getInstance().flush();
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
            if (req.isForMainFrame() && !req.getUrl().toString().startsWith("file:")) showOffline(String.valueOf(err.getDescription()));
        }
    }

    private class Chrome extends WebChromeClient {
        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            runOnUiThread(() -> {
                List<String> need = new ArrayList<>();
                for (String r : request.getResources()) {
                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) need.add(Manifest.permission.CAMERA);
                    if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) need.add(Manifest.permission.RECORD_AUDIO);
                }
                List<String> missing = new ArrayList<>();
                for (String p : need) if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) missing.add(p);
                if (missing.isEmpty()) { request.grant(request.getResources()); return; }
                if (pendingPermission != null) pendingPermission.deny();
                pendingPermission = request;
                requestPermissions(missing.toArray(new String[0]), REQ_MEDIA);
            });
        }

        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = callback;
            Intent pick = params.createIntent();
            pick.addCategory(Intent.CATEGORY_OPENABLE);
            if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            try {
                startActivityForResult(Intent.createChooser(pick, "Выберите файл"), REQ_FILE);
            } catch (ActivityNotFoundException e) {
                fileCallback = null;
                return false;
            }
            return true;
        }
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        if (code != REQ_MEDIA || pendingPermission == null) return;
        List<String> ok = new ArrayList<>();
        for (String r : pendingPermission.getResources()) {
            String p = PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r) ? Manifest.permission.CAMERA
                    : PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r) ? Manifest.permission.RECORD_AUDIO : null;
            if (p != null && checkSelfPermission(p) == PackageManager.PERMISSION_GRANTED) ok.add(r);
        }
        if (ok.isEmpty()) pendingPermission.deny(); else pendingPermission.grant(ok.toArray(new String[0]));
        pendingPermission = null;
    }

    @Override
    protected void onActivityResult(int code, int result, Intent data) {
        if (code != REQ_FILE || fileCallback == null) { super.onActivityResult(code, result, data); return; }
        Uri[] uris = null;
        if (result == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int n = data.getClipData().getItemCount();
                uris = new Uri[n];
                for (int i = 0; i < n; i++) uris[i] = data.getClipData().getItemAt(i).getUri();
            } else if (data.getData() != null) {
                uris = new Uri[]{data.getData()};
            }
        }
        fileCallback.onReceiveValue(uris);
        fileCallback = null;
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack() && !offline) web.goBack();
        else moveTaskToBack(true); // не закрываем: пусть сообщения и звонки продолжают приходить
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleCallIntent(intent);
        Uri link = intent.getData();
        if (link != null && isOurs(link)) open(link.toString());
    }

    @Override
    protected void onPause() {
        super.onPause();
        visible = false;
        // WebView не ставим на паузу — так приходят сообщения и звонки, пока приложение свёрнуто
        web.evaluateJavascript("window.__tihoBg=true;document.dispatchEvent(new Event('tiho-bg'))", null);
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onResume() {
        super.onResume();
        visible = true;
        TihoService.cancelCall(this);
        if (prefs.getBoolean("background", true)) TihoService.start(this);
        web.evaluateJavascript("window.__tihoBg=false;document.dispatchEvent(new Event('tiho-fg'))", null);
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm != null) nm.cancelAll();
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "Сообщения и звонки", NotificationManager.IMPORTANCE_HIGH);
        ch.enableVibration(true);
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm != null) nm.createNotificationChannel(ch);
    }

    /** Мост для кода мессенджера: window.TihoAndroid */
    private class Bridge {
        @JavascriptInterface
        public boolean isApp() { return true; }

        /** Звонок пришёл, пока приложение свёрнуто: показываем экран звонка системы */
        @JavascriptInterface
        public void incomingCall(String callId, int from, String name, boolean video) {
            if (!visible) TihoService.showCall(MainActivity.this, callId, from, name, video);
        }

        @JavascriptInterface
        public void callEnded() { TihoService.cancelCall(MainActivity.this); pendingAnswer = null; }

        @JavascriptInterface
        public void answered() { pendingAnswer = null; }

        @JavascriptInterface
        public boolean getFullscreen() { return fullscreen(); }

        @JavascriptInterface
        public void setFullscreen(boolean on) {
            prefs.edit().putBoolean("fullscreen", on).apply();
            runOnUiThread(MainActivity.this::applyFullscreen);
        }

        @JavascriptInterface
        public boolean getBackground() { return prefs.getBoolean("background", true); }

        @JavascriptInterface
        public void setBackground(boolean on) {
            prefs.edit().putBoolean("background", on).apply();
            if (on) TihoService.start(MainActivity.this);
            else startService(new Intent(MainActivity.this, TihoService.class).setAction(TihoService.ACTION_STOP));
        }

        @JavascriptInterface
        public String getUrl() { return baseUrl(); }

        @JavascriptInterface
        public void retry() {
            runOnUiThread(() -> { offline = false; splash.setVisibility(View.VISIBLE); open(baseUrl() + "/"); });
        }

        @JavascriptInterface
        public void setUrl(String url) {
            if (!offline) return; // менять адрес можно только с экрана «Нет связи»
            String u = url == null ? "" : url.trim();
            if (!u.startsWith("https://")) u = "https://" + u.replaceFirst("^[a-z]+://", "");
            final String clean = u.replaceAll("/+$", "");
            if (Uri.parse(clean).getHost() == null) { runOnUiThread(() -> Toast.makeText(MainActivity.this, "Неверный адрес", Toast.LENGTH_SHORT).show()); return; }
            prefs.edit().putString("url", clean).apply();
            retry();
        }

        @JavascriptInterface
        public void notify(String title, String body, String tag) {
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;
            Intent open = new Intent(MainActivity.this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pi = PendingIntent.getActivity(MainActivity.this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(MainActivity.this, CHANNEL) : new Notification.Builder(MainActivity.this);
            b.setSmallIcon(R.mipmap.ic_launcher).setContentTitle(title == null ? "Тихо" : title).setContentText(body == null ? "" : body)
                    .setAutoCancel(true).setContentIntent(pi);
            if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_HIGH).setDefaults(Notification.DEFAULT_ALL);
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) nm.notify(tag == null ? "tiho" : tag, notifyId++, b.build());
        }

        @JavascriptInterface
        public void saveFile(String base64, String name, String mime) {
            try {
                byte[] data = Base64.decode(base64, Base64.DEFAULT);
                String safe = (name == null || name.isEmpty() ? "file" : name).replaceAll("[\\\\/:*?\"<>|]", "_");
                String type = mime == null || mime.isEmpty() ? "application/octet-stream" : mime;
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Downloads.DISPLAY_NAME, safe);
                    v.put(MediaStore.Downloads.MIME_TYPE, type);
                    v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Тихо");
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    if (uri == null) throw new Exception("нет доступа");
                    try (OutputStream out = getContentResolver().openOutputStream(uri)) { out.write(data); }
                } else {
                    File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    try (FileOutputStream out = new FileOutputStream(new File(dir, safe))) { out.write(data); }
                }
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Сохранено в «Загрузки/Тихо»: " + safe, Toast.LENGTH_SHORT).show());
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Не удалось сохранить файл", Toast.LENGTH_SHORT).show());
            }
        }
    }
}
