package ru.tiho.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** После перезагрузки телефона или обновления приложения снова включаем фоновую связь */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (ctx.getSharedPreferences("tiho", Context.MODE_PRIVATE).getBoolean("background", true)) TihoService.start(ctx);
    }
}
