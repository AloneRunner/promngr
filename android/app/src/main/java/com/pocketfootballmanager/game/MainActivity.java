package com.pocketfootballmanager.game;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Enforce No Title Bar programmatically before super.onCreate
        supportRequestWindowFeature(Window.FEATURE_NO_TITLE);

        super.onCreate(savedInstanceState);

        // Force hide Action Bar (redundant safety)
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }

        // Clear any window title
        setTitle("");
        getWindow().setTitle("");

        // Handle display cutout for fullscreen without letterboxing
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow()
                    .getAttributes().layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
    }
}
