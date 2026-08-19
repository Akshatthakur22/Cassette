package fm.cassette.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CassettePlaybackPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
