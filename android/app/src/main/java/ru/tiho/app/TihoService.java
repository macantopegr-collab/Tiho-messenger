package ru.tiho.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Person;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.webkit.CookieManager;

import org.json.JSONObject;

import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

/**
 * Фоновая связь с сервером «Тихо»: держит лёгкое соединение, даже когда приложение закрыто,
 * и показывает входящие звонки на весь экран и уведомления о сообщениях.
 * Содержимое сообщений сюда не приходит — только «от кого» (переписка зашифрована).
 */
public class TihoService extends Service {
    static final String CH_BG = "background", CH_CALLS = "calls_v1", CH_MSG = "messages";
    static final String ACTION_REJECT = "ru.tiho.app.REJECT", ACTION_STOP = "ru.tiho.app.STOP";
    private static final int ID_BG = 1, ID_CALL = 2;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private OkHttpClient client;
    private WebSocket ws;
    private long backoff = 2000;
    private boolean stopped = false;
    private int msgId = 1000;

    public static void start(Context ctx) {
        Intent i = new Intent(ctx, TihoService.class);
        try {
            if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i); else ctx.startService(i);
        } catch (Exception ignored) { /* система не разрешила запуск из фона — запустится при открытии приложения */ }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createChannels(this);
        client = new OkHttpClient.Builder().pingInterval(25, TimeUnit.SECONDS).retryOnConnectionFailure(true).build();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(ID_BG, bgNotification());
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_STOP.equals(action)) {
            stopped = true;
            if (ws != null) ws.close(1000, "stop");
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }
        if (ACTION_REJECT.equals(action)) {
            String callId = intent.getStringExtra("callId");
            int from = intent.getIntExtra("from", 0);
            cancelCall(this);
            if (ws != null && callId != null) {
                try { ws.send(new JSONObject().put("type", "call").put("to", from).put("callId", callId).put("action", "reject").toString()); } catch (Exception ignored) { }
            }
            return START_STICKY;
        }
        stopped = false;
        connect();
        return START_STICKY;
    }

    private String baseUrl() {
        return getSharedPreferences("tiho", MODE_PRIVATE).getString("url", getString(R.string.app_url)).replaceAll("/+$", "");
    }

    private void connect() {
        if (ws != null || stopped) return;
        String base = baseUrl();
        String cookies = null;
        try { cookies = CookieManager.getInstance().getCookie(base); } catch (Exception ignored) { }
        if (cookies == null || !cookies.contains("tiho_session")) { retry(60000); return; } // ещё не вошли
        Request req = new Request.Builder()
                .url(base.replaceFirst("^https", "wss") + "/ws?bg=1")
                .header("Cookie", cookies)
                .header("X-FxTunnel-Skip-Warning", "1")
                .header("User-Agent", "TihoApp/" + BuildConfig.VERSION_NAME + " background")
                .build();
        ws = client.newWebSocket(req, new WebSocketListener() {
            @Override public void onOpen(WebSocket s, Response r) { backoff = 2000; }
            @Override public void onMessage(WebSocket s, String text) { handler.post(() -> onEvent(text)); }
            @Override public void onClosed(WebSocket s, int code, String reason) { lost(s, 3000); }
            @Override public void onFailure(WebSocket s, Throwable t, Response r) {
                lost(s, r != null && r.code() == 401 ? 5 * 60000 : backoff);
                backoff = Math.min(backoff * 2, 60000);
            }
        });
    }

    private void lost(WebSocket s, long delay) {
        handler.post(() -> { if (ws == s) ws = null; retry(delay); });
    }

    private void retry(long delay) {
        if (stopped) return;
        handler.removeCallbacksAndMessages(null);
        handler.postDelayed(this::connect, delay);
    }

    private void onEvent(String text) {
        try {
            JSONObject o = new JSONObject(text);
            String type = o.optString("type");
            if ("bgCall".equals(type)) showCall(this, o.optString("callId"), o.optInt("from"), o.optString("name", "Собеседник"), "video".equals(o.optString("kind")));
            else if ("bgCallEnd".equals(type)) cancelCall(this);
            else if ("bgNotify".equals(type) && !"call".equals(o.optString("tag"))) showMessage(o.optString("title", "Тихо"), o.optString("body", "Новое сообщение"), o.optString("tag", "tiho"));
            else if ("loggedOut".equals(type)) { stopped = true; if (ws != null) ws.close(1000, "logout"); }
        } catch (Exception ignored) { }
    }

    private void showMessage(String title, String body, String tag) {
        if (MainActivity.visible) return;
        Intent open = new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 1, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CH_MSG) : new Notification.Builder(this);
        b.setSmallIcon(R.mipmap.ic_launcher).setContentTitle(title).setContentText(body).setAutoCancel(true).setContentIntent(pi)
                .setCategory(Notification.CATEGORY_MESSAGE);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_HIGH).setDefaults(Notification.DEFAULT_ALL);
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(tag, msgId++, b.build());
    }

    /** Входящий звонок: на весь экран (на заблокированном телефоне тоже), с мелодией и кнопками */
    static void showCall(Context ctx, String callId, int from, String name, boolean video) {
        createChannels(ctx);
        Intent open = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP)
                .putExtra("callId", callId);
        PendingIntent full = PendingIntent.getActivity(ctx, 10, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Intent ans = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP)
                .putExtra("callId", callId).putExtra("answer", true).putExtra("video", video);
        PendingIntent answer = PendingIntent.getActivity(ctx, 11, ans, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Intent rej = new Intent(ctx, TihoService.class).setAction(ACTION_REJECT).putExtra("callId", callId).putExtra("from", from);
        PendingIntent reject = PendingIntent.getService(ctx, 12, rej, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        String what = video ? "Входящий видеозвонок" : "Входящий звонок";
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(ctx, CH_CALLS) : new Notification.Builder(ctx);
        b.setSmallIcon(R.mipmap.ic_launcher).setContentTitle(name).setContentText(what)
                .setCategory(Notification.CATEGORY_CALL).setOngoing(true).setAutoCancel(false)
                .setFullScreenIntent(full, true).setContentIntent(full);
        if (Build.VERSION.SDK_INT >= 26) b.setTimeoutAfter(50000);
        if (Build.VERSION.SDK_INT >= 31) {
            Person caller = new Person.Builder().setName(name).setImportant(true).build();
            b.setStyle(Notification.CallStyle.forIncomingCall(caller, reject, answer));
        } else {
            b.addAction(new Notification.Action.Builder(null, "Отклонить", reject).build());
            b.addAction(new Notification.Action.Builder(null, "Ответить", answer).build());
            if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_MAX).setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE));
        }
        Notification n = b.build();
        n.flags |= Notification.FLAG_INSISTENT; // мелодия играет, пока не ответят
        NotificationManager nm = (NotificationManager) ctx.getSystemService(NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(ID_CALL, n);
    }

    static void cancelCall(Context ctx) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(ID_CALL);
    }

    static void createChannels(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) ctx.getSystemService(NOTIFICATION_SERVICE);
        if (nm == null) return;
        NotificationChannel bg = new NotificationChannel(CH_BG, "Фоновая связь", NotificationManager.IMPORTANCE_MIN);
        bg.setShowBadge(false);
        bg.setDescription("Нужна, чтобы звонки и сообщения приходили, когда приложение закрыто");
        nm.createNotificationChannel(bg);
        NotificationChannel msg = new NotificationChannel(CH_MSG, "Сообщения", NotificationManager.IMPORTANCE_HIGH);
        msg.enableVibration(true);
        nm.createNotificationChannel(msg);
        NotificationChannel calls = new NotificationChannel(CH_CALLS, "Входящие звонки", NotificationManager.IMPORTANCE_HIGH);
        Uri ring = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        calls.setSound(ring, new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
        calls.enableVibration(true);
        calls.setVibrationPattern(new long[]{0, 800, 600, 800, 600});
        calls.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        calls.setBypassDnd(true);
        nm.createNotificationChannel(calls);
    }

    private Notification bgNotification() {
        Intent open = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(this, 2, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CH_BG) : new Notification.Builder(this);
        b.setSmallIcon(R.mipmap.ic_launcher).setContentTitle("Тихо на связи").setContentText("Звонки и сообщения придут, даже если приложение закрыто")
                .setOngoing(true).setContentIntent(pi);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_MIN);
        return b.build();
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (ws != null) ws.cancel();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
