package fm.cassette.app

import android.os.Bundle
import android.util.Log
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    companion object {
        private const val TAG = "CassetteMainActivity"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        Log.d(TAG, "[ACTIVITY] onCreate")
        CassetteDiagnostics.recordActivity("onCreate")
        registerPlugin(CassettePlaybackPlugin::class.java)
        super.onCreate(savedInstanceState)
    }

    override fun onStart() {
        super.onStart()
        Log.d(TAG, "[ACTIVITY] onStart")
        CassetteDiagnostics.recordActivity("onStart")
    }

    override fun onResume() {
        super.onResume()
        Log.d(TAG, "[ACTIVITY] onResume")
        CassetteDiagnostics.recordActivity("onResume")
    }

    override fun onPause() {
        super.onPause()
        Log.d(TAG, "[ACTIVITY] onPause - Activity entering background")
        CassetteDiagnostics.recordActivity("onPause (entering background)")
    }

    override fun onStop() {
        super.onStop()
        Log.d(TAG, "[ACTIVITY] onStop - Activity stopped")
        CassetteDiagnostics.recordActivity("onStop (stopped)")
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "[ACTIVITY] onDestroy")
        CassetteDiagnostics.recordActivity("onDestroy")
    }
}
