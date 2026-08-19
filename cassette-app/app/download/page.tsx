import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Download CASSETTE — Native App for Android",
  description:
    "Take Cassette with you. Install the Cassette native Android app for an enhanced playback experience.",
  openGraph: {
    title: "Download CASSETTE — Native App for Android",
    description:
      "Take your digital mixtapes with you. Install the native Cassette app.",
    url: "https://cassette-share.vercel.app/download",
    siteName: "CASSETTE",
  },
};

export default function DownloadPage() {
  const downloadUrl =
    process.env.NEXT_PUBLIC_ANDROID_APK_URL || "/downloads/cassette.apk";

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-amber-500/30">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 max-w-3xl w-full mx-auto flex items-center justify-between py-2">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-neutral-300 hover:text-white transition-colors group"
        >
          <span className="text-xl">📼</span>
          <span className="font-mono text-sm tracking-widest font-bold text-amber-400 group-hover:text-amber-300">
            CASSETTE
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-mono px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-all"
        >
          ← Open Web App
        </Link>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-xl w-full mx-auto my-auto py-12 flex flex-col items-center text-center space-y-8">
        {/* Hero Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Native App Release
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-mono">
            Take Cassette with you.
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Install the native Cassette app for an OS-integrated playback
            experience designed to keep your mixtapes and voice messages
            flowing seamlessly.
          </p>
        </div>

        {/* Platform Cards */}
        <div className="w-full space-y-4">
          {/* Android Card */}
          <div className="p-6 rounded-2xl border border-amber-500/30 bg-neutral-900/70 backdrop-blur-md shadow-xl text-left space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity font-mono text-6xl select-none">
              🤖
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <h2 className="font-mono font-bold text-lg text-white">
                  Android App
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready to Install
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Direct APK download for Android 7.0+ (API 24+)
              </p>
            </div>

            {/* Download Button */}
            <a
              href={downloadUrl}
              download="cassette.apk"
              className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl font-mono text-sm font-bold bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black shadow-lg shadow-amber-500/20 transition-all"
            >
              <span>⬇️</span>
              <span>Download for Android (.apk)</span>
            </a>

            <div className="text-[11px] font-mono text-neutral-400 text-center">
              Version 1.0 (Build 1) • ~28 MB
            </div>
          </div>

          {/* iOS Card */}
          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-md text-left space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🍎</span>
                <h2 className="font-mono font-bold text-base text-neutral-300">
                  iPhone / iOS
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              iOS distribution will be available through TestFlight and the App
              Store.
            </p>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="w-full p-6 rounded-2xl border border-neutral-800 bg-neutral-900/50 text-left space-y-3 font-mono text-xs text-neutral-300">
          <div className="font-bold text-amber-300 flex items-center gap-2">
            <span>📖</span>
            <span>How to install on Android</span>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-neutral-400">
            <li>
              Tap <strong className="text-neutral-200">Download for Android</strong> above.
            </li>
            <li>
              Open the downloaded <code className="text-amber-300 bg-neutral-800 px-1 py-0.5 rounded">cassette.apk</code> file from your browser downloads or file manager.
            </li>
            <li>
              If Android asks for permission to install apps from this source, tap <strong className="text-neutral-200">Settings</strong> and toggle allow.
            </li>
            <li>
              Tap <strong className="text-neutral-200">Install</strong>.
            </li>
            <li>
              Launch <strong className="text-neutral-200">Cassette</strong> from your home screen or app drawer.
            </li>
          </ol>
          <div className="pt-2 border-t border-neutral-800 text-[11px] text-neutral-400">
            💡 This is a direct APK package for physical testing and previewing OS-level media integration.
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 max-w-3xl w-full mx-auto py-4 text-center text-neutral-400 text-xs font-mono border-t border-neutral-800/60">
        <div>CASSETTE — Put your feelings on tape.</div>
      </footer>
    </main>
  );
}
