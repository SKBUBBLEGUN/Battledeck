package com.battledeck.launcher;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(0xFF14080C);
        getWindow().setNavigationBarColor(0xFF06090D);

        webView = new WebView(this);
        webView.setBackgroundColor(0xFF14080C);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        webView.getSettings().setAllowContentAccess(true);
        webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new BattledeckBridge(), "Android");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("file".equals(uri.getScheme())) return false;
                openUrl(uri.toString());
                return true;
            }
        });
        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null) {
            webView.evaluateJavascript(
                "if (window.onBack) { window.onBack(); }", null
            );
        } else {
            super.onBackPressed();
        }
    }

    private void openUrl(String url) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        } catch (Exception ignored) { }
    }

    private class BattledeckBridge {
        @JavascriptInterface
        public String getApps() {
            JSONArray result = new JSONArray();
            try {
                Intent query = new Intent(Intent.ACTION_MAIN, null);
                query.addCategory(Intent.CATEGORY_LAUNCHER);
                PackageManager pm = getPackageManager();
                List<ResolveInfo> apps = pm.queryIntentActivities(query, 0);
                Collections.sort(apps, new Comparator<ResolveInfo>() {
                    @Override
                    public int compare(ResolveInfo a, ResolveInfo b) {
                        return a.loadLabel(pm).toString().compareToIgnoreCase(b.loadLabel(pm).toString());
                    }
                });
                for (ResolveInfo info : apps) {
                    JSONObject item = new JSONObject();
                    item.put("label", info.loadLabel(pm).toString());
                    item.put("pkg", info.activityInfo.packageName);
                    result.put(item);
                }
            } catch (Exception ignored) { }
            return result.toString();
        }

        @JavascriptInterface
        public String getIcon(String packageName) {
            try {
                Drawable drawable = getPackageManager().getApplicationIcon(packageName);
                int width = Math.max(1, drawable.getIntrinsicWidth());
                int height = Math.max(1, drawable.getIntrinsicHeight());
                Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(bitmap);
                drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
                drawable.draw(canvas);
                ByteArrayOutputStream stream = new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.PNG, 90, stream);
                bitmap.recycle();
                return Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP);
            } catch (Exception ignored) {
                return "";
            }
        }

        @JavascriptInterface
        public boolean launch(String packageName) {
            try {
                Intent intent = getPackageManager().getLaunchIntentForPackage(packageName);
                if (intent == null) return false;
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
                return true;
            } catch (Exception ignored) {
                return false;
            }
        }

        @JavascriptInterface
        public boolean launchCategory(String category) {
            Intent intent;
            switch (category) {
                case "email":
                    intent = new Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:"));
                    break;
                case "sms":
                    intent = new Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:"));
                    break;
                case "phone":
                    intent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:"));
                    break;
                case "camera":
                    intent = new Intent("android.media.action.IMAGE_CAPTURE");
                    break;
                default:
                    return false;
            }
            try {
                if (intent.resolveActivity(getPackageManager()) == null) return false;
                startActivity(intent);
                return true;
            } catch (Exception ignored) {
                return false;
            }
        }

        @JavascriptInterface
        public void openUrl(String url) {
            MainActivity.this.openUrl(url);
        }
    }
}
