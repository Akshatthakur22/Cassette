package fm.cassette.app;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "CassetteMainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        Log.d(TAG, "[ACTIVITY] onCreate");
        registerPlugin(CassettePlaybackPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onStart() {
        super.onStart();
        Log.d(TAG, "[ACTIVITY] onStart");
    }

    @Override
    protected void onResume() {
        super.onResume();
        Log.d(TAG, "[ACTIVITY] onResume");
    }

    @Override
    protected void onPause() {
        super.onPause();
        Log.d(TAG, "[ACTIVITY] onPause - Activity entering background");
    }

    @Override
    protected void onStop() {
        super.onStop();
        Log.d(TAG, "[ACTIVITY] onStop - Activity stopped");
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "[ACTIVITY] onDestroy");
    }
}
