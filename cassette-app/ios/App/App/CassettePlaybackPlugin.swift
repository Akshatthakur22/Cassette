import Foundation
import Capacitor
import AVFoundation
import MediaPlayer

@objc(CassettePlaybackPlugin)
public class CassettePlaybackPlugin: CAPPlugin, CAPBridgedPlugin {
    public const let pluginId = "CassettePlaybackPlugin"
    public const let jsName = "CassettePlayback"
    public const let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pause", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "seek", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "next", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "previous", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setQueue", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "destroy", returnType: CAPPluginReturnPromise)
    ]

    private var player: AVPlayer?
    private var timeObserverToken: Any?
    private var queue: [[String: Any]] = []
    private var currentIndex: Int = 0
    private var currentTrackId: String?
    private var isPlayingState: Bool = false

    override public func load() {
        super.load()
        setupAudioSession()
        setupRemoteCommandCenter()
        setupInterruptionNotification()
    }

    private func setupAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [])
        } catch {
            print("[CassettePlaybackPlugin] AudioSession config error: \(error)")
        }
    }

    private func activateAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("[CassettePlaybackPlugin] AudioSession activate error: \(error)")
        }
    }

    private func setupInterruptionNotification() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleInterruption(_:)),
            name: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance()
        )
    }

    @objc private func handleInterruption(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
            return
        }

        if type == .began {
            pauseInternal()
        } else if type == .ended {
            if let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt {
                let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
                if options.contains(.shouldResume) {
                    playInternal()
                }
            }
        }
    }

    private func setupRemoteCommandCenter() {
        let commandCenter = MPRemoteCommandCenter.shared()

        commandCenter.playCommand.addTarget { [weak self] _ in
            self?.playInternal()
            return .success
        }

        commandCenter.pauseCommand.addTarget { [weak self] _ in
            self?.pauseInternal()
            return .success
        }

        commandCenter.togglePlayPauseCommand.addTarget { [weak self] _ in
            if self?.isPlayingState == true {
                self?.pauseInternal()
            } else {
                self?.playInternal()
            }
            return .success
        }

        commandCenter.nextTrackCommand.addTarget { [weak self] _ in
            self?.nextInternal()
            return .success
        }

        commandCenter.previousTrackCommand.addTarget { [weak self] _ in
            self?.previousInternal()
            return .success
        }

        commandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
            if let positionEvent = event as? MPChangePlaybackPositionCommandEvent {
                self?.seekInternal(seconds: positionEvent.positionTime)
                return .success
            }
            return .commandFailed
        }
    }

    private func updateNowPlayingInfo(title: String, artist: String, duration: Double, currentTime: Double) {
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: title,
            MPMediaItemPropertyArtist: artist,
            MPMediaItemPropertyAlbumTitle: "Cassette",
            MPMediaItemPropertyPlaybackDuration: duration,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: currentTime,
            MPNowPlayingInfoPropertyPlaybackRate: isPlayingState ? 1.0 : 0.0
        ]

        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    @objc func play(_ call: CAPPluginCall) {
        let urlStr = call.getString("url") ?? ""
        let trackId = call.getString("id") ?? ""
        let title = call.getString("title") ?? "Cassette Voice Track"
        let artist = call.getString("artist") ?? "Cassette"

        if !urlStr.isEmpty, let url = URL(string: urlStr) {
            activateAudioSession()
            currentTrackId = trackId

            let playerItem = AVPlayerItem(url: url)
            if player == nil {
                player = AVPlayer(playerItem: playerItem)
                setupTimeObserver()
                setupItemEndedObserver(item: playerItem)
            } else {
                player?.replaceCurrentItem(with: playerItem)
                setupItemEndedObserver(item: playerItem)
            }

            player?.play()
            isPlayingState = true

            let duration = playerItem.asset.duration.seconds
            updateNowPlayingInfo(
                title: title,
                artist: artist,
                duration: duration.isFinite ? duration : 0,
                currentTime: 0
            )

            notifyListeners("playbackEvent", data: [
                "type": "play",
                "isPlaying": true,
                "trackId": trackId
            ])
        } else if let player = player {
            activateAudioSession()
            player.play()
            isPlayingState = true
            notifyListeners("playbackEvent", data: ["type": "play", "isPlaying": true])
        }

        call.resolve(["success": true])
    }

    private func playInternal() {
        activateAudioSession()
        player?.play()
        isPlayingState = true
        notifyListeners("playbackEvent", data: ["type": "play", "isPlaying": true])
    }

    @objc func pause(_ call: CAPPluginCall) {
        pauseInternal()
        call.resolve(["success": true])
    }

    private func pauseInternal() {
        player?.pause()
        isPlayingState = false
        notifyListeners("playbackEvent", data: ["type": "pause", "isPlaying": false])
    }

    @objc func seek(_ call: CAPPluginCall) {
        let seconds = call.getDouble("seconds") ?? 0
        seekInternal(seconds: seconds)
        call.resolve(["success": true])
    }

    private func seekInternal(seconds: Double) {
        let targetTime = CMTime(seconds: seconds, preferredTimescale: 1000)
        player?.seek(to: targetTime)
        notifyListeners("playbackEvent", data: ["type": "timeUpdate", "currentTime": seconds])
    }

    @objc func next(_ call: CAPPluginCall) {
        nextInternal()
        call.resolve(["success": true])
    }

    private func nextInternal() {
        if currentIndex + 1 < queue.count {
            currentIndex += 1
            let track = queue[currentIndex]
            if let trackId = track["id"] as? String, let urlStr = track["url"] as? String {
                let title = (track["title"] as? String) ?? "Voice Track"
                let artist = (track["artist"] as? String) ?? "Cassette"
                playTrackDict(urlStr: urlStr, trackId: trackId, title: title, artist: artist)
            }
        }
    }

    @objc func previous(_ call: CAPPluginCall) {
        previousInternal()
        call.resolve(["success": true])
    }

    private func previousInternal() {
        if currentIndex > 0 {
            currentIndex -= 1
            let track = queue[currentIndex]
            if let trackId = track["id"] as? String, let urlStr = track["url"] as? String {
                let title = (track["title"] as? String) ?? "Voice Track"
                let artist = (track["artist"] as? String) ?? "Cassette"
                playTrackDict(urlStr: urlStr, trackId: trackId, title: title, artist: artist)
            }
        }
    }

    private func playTrackDict(urlStr: String, trackId: String, title: String, artist: String) {
        guard let url = URL(string: urlStr) else { return }
        activateAudioSession()
        currentTrackId = trackId
        let item = AVPlayerItem(url: url)
        player?.replaceCurrentItem(with: item)
        setupItemEndedObserver(item: item)
        player?.play()
        isPlayingState = true

        notifyListeners("playbackEvent", data: ["type": "trackChanged", "trackId": trackId])
    }

    @objc func setQueue(_ call: CAPPluginCall) {
        if let rawQueue = call.getArray("queue") as? [[String: Any]] {
            queue = rawQueue
            currentIndex = call.getInt("index") ?? 0
        }
        call.resolve(["success": true])
    }

    @objc func getState(_ call: CAPPluginCall) {
        let currentTime = player?.currentTime().seconds ?? 0
        let duration = player?.currentItem?.duration.seconds ?? 0

        call.resolve([
            "isPlaying": isPlayingState,
            "currentTime": currentTime.isFinite ? currentTime : 0,
            "duration": duration.isFinite ? duration : 0,
            "isBuffering": false
        ])
    }

    @objc func destroy(_ call: CAPPluginCall) {
        player?.pause()
        removeTimeObserver()
        player = nil
        isPlayingState = false
        call.resolve(["success": true])
    }

    private func setupTimeObserver() {
        removeTimeObserver()
        let interval = CMTime(seconds: 0.5, preferredTimescale: 1000)
        timeObserverToken = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            guard let self = self, let item = self.player?.currentItem else { return }
            let currentTime = time.seconds
            let duration = item.duration.seconds

            if currentTime.isFinite {
                self.notifyListeners("playbackEvent", data: [
                    "type": "timeUpdate",
                    "currentTime": currentTime,
                    "duration": duration.isFinite ? duration : 0
                ])
            }
        }
    }

    private func removeTimeObserver() {
        if let token = timeObserverToken {
            player?.removeTimeObserver(token)
            timeObserverToken = nil
        }
    }

    private func setupItemEndedObserver(item: AVPlayerItem) {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(playerItemDidReachEnd(_:)),
            name: .AVPlayerItemDidPlayToEndTime,
            object: item
        )
    }

    @objc private func playerItemDidReachEnd(_ notification: Notification) {
        isPlayingState = false
        notifyListeners("playbackEvent", data: ["type": "ended", "isPlaying": false])
    }
}
