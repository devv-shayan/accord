"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAudioPlayback({
  src,
  duration: fallbackDuration,
  start = 0,
  end,
  initialTime = start,
}: {
  src: string;
  duration: number;
  start?: number;
  end?: number;
  initialTime?: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const pendingSeek = useRef(initialTime);
  const boundaryTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previewRef = useRef<{ start: number; end: number } | null>(null);
  const [preview, setPreview] = useState<{ start: number; end: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(fallbackDuration);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const upperBound = () => Math.min(previewRef.current?.end ?? end ?? Infinity, Number.isFinite(audio.duration) ? audio.duration : fallbackDuration);
    const clearBoundary = () => clearTimeout(boundaryTimerRef.current);
    const scheduleBoundary = () => {
      clearBoundary();
      if ((end === undefined && !previewRef.current) || audio.paused || audio.readyState < 3) return;
      boundaryTimerRef.current = setTimeout(() => {
        audio.pause();
        audio.currentTime = upperBound();
        setCurrentTime(audio.currentTime);
      }, Math.max(0, (upperBound() - audio.currentTime) * 1000 / audio.playbackRate));
    };
    const metadata = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
      audio.currentTime = Math.max(start, Math.min(upperBound(), pendingSeek.current));
      setCurrentTime(audio.currentTime);
      setError(null);
    };
    const update = () => {
      if ((end !== undefined || previewRef.current) && audio.currentTime >= upperBound()) {
        audio.pause();
        if (audio.currentTime > upperBound()) audio.currentTime = upperBound();
      }
      setCurrentTime(audio.currentTime);
    };
    const onPlaying = () => { setPlaying(true); setBuffering(false); setError(null); scheduleBoundary(); };
    const onPause = () => { setPlaying(false); setBuffering(false); clearBoundary(); };
    const onWaiting = () => { setBuffering(true); clearBoundary(); };
    const onError = () => { setError("The recording could not load. Retry the audio."); setPlaying(false); setBuffering(false); clearBoundary(); };
    audio.addEventListener("loadedmetadata", metadata);
    audio.addEventListener("timeupdate", update);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("error", onError);
    audio.addEventListener("ended", onPause);
    audio.addEventListener("seeked", scheduleBoundary);
    audio.addEventListener("ratechange", scheduleBoundary);
    if (audio.readyState >= 1) metadata();
    return () => {
      clearBoundary();
      audio.removeEventListener("loadedmetadata", metadata);
      audio.removeEventListener("timeupdate", update);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("ended", onPause);
      audio.removeEventListener("seeked", scheduleBoundary);
      audio.removeEventListener("ratechange", scheduleBoundary);
    };
  }, [end, fallbackDuration, src, start]);

  const seek = useCallback((seconds: number) => {
    if (!Number.isFinite(seconds)) return;
    const audio = audioRef.current;
    const maximum = Math.min(previewRef.current?.end ?? end ?? Infinity, audio && Number.isFinite(audio.duration) ? audio.duration : fallbackDuration);
    const next = Math.max(previewRef.current?.start ?? start, Math.min(maximum, seconds));
    pendingSeek.current = next;
    if (audio?.readyState && audio.readyState >= 1) audio.currentTime = next;
    setCurrentTime(next);
  }, [end, fallbackDuration, start]);

  useEffect(() => { seek(initialTime); }, [initialTime, seek]);

  const play = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setError(null);
    const limit = previewRef.current?.end ?? end;
    if (audio.ended || (limit !== undefined && audio.currentTime >= limit)) seek(previewRef.current?.start ?? start);
    try { await audio.play(); }
    catch { setError("Playback could not start. Press Play to try again."); setBuffering(false); }
  };
  const toggle = () => {
    if (audioRef.current?.paused) void play();
    else audioRef.current?.pause();
  };
  const clearPreview = () => { clearTimeout(boundaryTimerRef.current); previewRef.current = null; setPreview(null); };
  const listenAt = (seconds: number) => { clearPreview(); seek(seconds); void play(); };
  const listenRange = (from: number, to: number) => {
    const range = { start: Math.max(start, from), end: Math.min(duration, to) };
    if (range.end <= range.start) return;
    previewRef.current = range;
    setPreview(range);
    seek(range.start);
    void play();
  };
  const setPlaybackSpeed = (value: number) => {
    if (!Number.isFinite(value) || value < 0.5 || value > 3) return;
    setSpeed(value);
    if (audioRef.current) audioRef.current.playbackRate = value;
  };
  const toggleMute = () => {
    setMuted(!muted);
    if (audioRef.current) audioRef.current.muted = !muted;
  };
  const retry = () => {
    pendingSeek.current = currentTime;
    setError(null);
    audioRef.current?.load();
  };

  return { audioRef, playback: { currentTime, duration, playing, buffering, error, speed, muted, preview, seek, toggle, listenAt, listenRange, clearPreview, setPlaybackSpeed, toggleMute, retry } };
}
