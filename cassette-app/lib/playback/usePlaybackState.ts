"use client";

import { useState, useEffect } from "react";
import { playbackController } from "./PlaybackController";
import { PlaybackState } from "./types";

export function usePlaybackState(): PlaybackState {
  const [state, setState] = useState<PlaybackState>(playbackController.getState());

  useEffect(() => {
    return playbackController.subscribe(setState);
  }, []);

  return state;
}
