"use client";

import { useEffect } from "react";
import { playbackController } from "./PlaybackController";
import { initMediaSession } from "./MediaSessionManager";

export function MediaSessionInit() {
  useEffect(() => {
    initMediaSession(playbackController);
  }, []);

  return null;
}
