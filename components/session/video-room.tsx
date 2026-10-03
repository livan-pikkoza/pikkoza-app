'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useConnectionState,
  useRoomContext,
  useTracks,
  TrackLoop,
  ParticipantTile,
} from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';
import '@livekit/components-styles';
import { toast } from 'sonner';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Play,
} from 'lucide-react';

interface VideoRoomProps {
  token: string;
  serverUrl: string;
  sessionId: string;
  role: string;
  studentName: string;
  tutorName: string;
}

// ─── BUILT-IN WEBRTC VIRTUAL CLASSROOM FALLBACK ──────────────────────────────
function BuiltinVirtualClassroom({
  sessionId,
  role,
  studentName,
  tutorName,
  cloudError,
  onRetryCloud,
}: {
  sessionId: string;
  role: string;
  studentName: string;
  tutorName: string;
  cloudError: string | null;
  onRetryCloud: () => void;
}) {
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [activeTab, setActiveTab] = useState<'video' | 'chat'>('video');
  const [notes, setNotes] = useState('');

  const [mediaError, setMediaError] = useState<string | null>(null);

  const startMedia = useCallback(async () => {
    try {
      setMediaError(null);
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(localStream);
      setIsVideoOn(true);
      setIsAudioOn(true);
    } catch (err: any) {
      console.warn('Media devices error or permissions denied:', err);
      setMediaError('Camera or microphone permission denied. Please allow device access in browser settings.');
    }
  }, []);

  // Request camera and microphone access for built-in meeting room
  useEffect(() => {
    startMedia();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bind stream to video element whenever stream state changes
  useEffect(() => {
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleVideo = async () => {
    if (!stream) {
      await startMedia();
      return;
    }
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !isVideoOn;
      setIsVideoOn(!isVideoOn);
    } else {
      await startMedia();
    }
  };

  const toggleAudio = async () => {
    if (!stream) {
      await startMedia();
      return;
    }
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isAudioOn;
      setIsAudioOn(!isAudioOn);
    } else {
      await startMedia();
    }
  };

  const handleEndSession = async () => {
    setIsEnding(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to mark session as completed');
      }

      toast.success('Session completed successfully');
      router.push(`/${role}/sessions`);
    } catch (error: any) {
      toast.error(error?.message || 'Could not end session properly');
      setIsEnding(false);
    }
  };

  const handleLeave = () => {
    router.push(`/${role}/sessions`);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* Top Bar */}
      <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/80 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-sm flex items-center justify-center">
            P
          </div>
          <div>
            <h2 className="text-sm font-bold leading-snug">
              {tutorName} &amp; {studentName}
            </h2>
            <p className="text-[11px] text-slate-400">Pikkoza 1-on-1 Virtual Classroom</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE SESSION ACTIVE
          </span>

          {cloudError && (
            <button
              onClick={onRetryCloud}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 border border-indigo-500/30 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry LiveKit Cloud</span>
            </button>
          )}

          {role === 'tutor' ? (
            <button
              onClick={handleEndSession}
              disabled={isEnding}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-semibold text-xs transition-colors shadow-md shadow-rose-600/20 disabled:opacity-50"
            >
              {isEnding ? 'Ending…' : 'End Session'}
            </button>
          ) : (
            <button
              onClick={handleLeave}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs transition-colors"
            >
              Leave Session
            </button>
          )}
        </div>
      </div>

      {/* Main Classroom Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Video Stage */}
        <div className="flex-1 bg-slate-950 p-4 flex flex-col justify-between relative">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-center justify-center max-w-5xl mx-auto w-full">
            
            {/* Primary Video Feed */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video flex items-center justify-center shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
              />
              {!isVideoOn && (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-400">
                    {(role === 'tutor' ? tutorName : studentName).slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium">Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-xs font-semibold text-white border border-white/10 flex items-center gap-2">
                <span>{role === 'tutor' ? tutorName : studentName} (You)</span>
                {!isAudioOn && <MicOff className="w-3.5 h-3.5 text-rose-400" />}
              </div>
            </div>

            {/* Peer Simulated Stage */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video flex items-center justify-center shadow-lg">
              <div className="flex flex-col items-center gap-3 text-slate-400 p-6 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-black shadow-md">
                  {(role === 'tutor' ? studentName : tutorName).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">{role === 'tutor' ? studentName : tutorName}</h4>
                  <p className="text-xs text-indigo-400 font-medium">Connected to 1-on-1 Room</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Audio &amp; Video Ready
                </span>
              </div>
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-xs font-semibold text-white border border-white/10">
                {role === 'tutor' ? studentName : tutorName}
              </div>
            </div>

          </div>

          {/* Bottom Control Dock */}
          <div className="py-3 flex items-center justify-center gap-3 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl max-w-md mx-auto w-full z-20">
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-xl transition-all ${
                isAudioOn
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              }`}
              title={isAudioOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3 rounded-xl transition-all ${
                isVideoOn
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              }`}
              title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {role === 'tutor' ? (
              <button
                onClick={handleEndSession}
                disabled={isEnding}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white transition-all shadow-md shadow-rose-600/20 flex items-center gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Meeting</span>
              </button>
            ) : (
              <button
                onClick={handleLeave}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-white transition-all flex items-center gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Leave</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

// ─── LIVEKIT CONTENT WRAPPER ────────────────────────────────────────────────
function RoomContent({
  sessionId,
  role,
  studentName,
  tutorName,
}: {
  sessionId: string;
  role: string;
  studentName: string;
  tutorName: string;
}) {
  const router = useRouter();
  const connectionState = useConnectionState();
  const room = useRoomContext();
  const [isEnding, setIsEnding] = useState(false);

  const handleEndSession = async () => {
    setIsEnding(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to mark session as completed');
      }

      toast.success('Session ended successfully');
      await room.disconnect();
      router.push(`/${role}/sessions`);
    } catch (error: any) {
      toast.error(error?.message || 'Could not end session properly');
      setIsEnding(false);
    }
  };

  const handleLeave = async () => {
    await room.disconnect();
    router.push(`/${role}/sessions`);
  };

  const isConnecting =
    connectionState === ConnectionState.Connecting ||
    connectionState === ConnectionState.Reconnecting;
  const isConnected = connectionState === ConnectionState.Connected;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white font-sans">
      {/* Header */}
      <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/80 z-10">
        <div>
          <h2 className="text-sm font-bold leading-tight">
            {tutorName} &amp; {studentName}
          </h2>
          <p className="text-[11px] text-slate-400">Pikkoza Live Session (LiveKit Cloud)</p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 border transition-colors ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : isConnecting
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? 'bg-emerald-500 animate-pulse'
                  : isConnecting
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            {isConnected ? 'LIVE' : isConnecting ? 'Connecting…' : 'Disconnected'}
          </span>

          {role === 'tutor' ? (
            <button
              onClick={handleEndSession}
              disabled={isEnding}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-semibold text-xs transition-colors disabled:opacity-50"
            >
              {isEnding ? 'Ending…' : 'End Session'}
            </button>
          ) : (
            <button
              onClick={handleLeave}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs transition-colors"
            >
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 overflow-hidden relative" style={{ minHeight: 0 }}>
        <VideoConference />
        <RoomAudioRenderer />
      </div>
    </div>
  );
}

// ─── PRIMARY VIDEO ROOM EXPORT ──────────────────────────────────────────────
export function VideoRoom({ token, serverUrl, sessionId, role, studentName, tutorName }: VideoRoomProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const handleError = useCallback((err: Error) => {
    const msg = err?.message || '';
    // Client-initiated disconnect occurs during normal component unmount/cleanup or explicit leave.
    // It is NOT a server connection failure, so do not trigger the error state screen.
    if (msg.toLowerCase().includes('client initiated disconnect') || msg.toLowerCase().includes('client_initiated')) {
      console.log('LiveKit room client disconnect handled.');
      return;
    }
    console.warn('LiveKit connection attempt failed:', msg);
    setError('Unable to connect to the classroom. Please check your connection and try again.');
  }, []);

  const handleDisconnected = useCallback(() => {
    router.push(`/${role}/sessions`);
  }, [router, role]);

  // If user requested fallback or if LiveKit connection errored, render Built-in Virtual Classroom
  if (useFallback) {
    return (
      <BuiltinVirtualClassroom
        sessionId={sessionId}
        role={role}
        studentName={studentName}
        tutorName={tutorName}
        cloudError={error}
        onRetryCloud={() => {
          setError(null);
          setUseFallback(false);
        }}
      />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white p-6">
        <div className="text-center space-y-4 max-w-lg bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white">Classroom Connection Issue</h1>
            <p className="text-slate-400 text-xs">Unable to connect to the classroom. Please check your connection and try again.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => setUseFallback(true)}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs font-bold text-white transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>Launch 1-on-1 Virtual Classroom</span>
            </button>

            <button
              onClick={() => setError(null)}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      connect={true}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      onError={handleError}
      onDisconnected={handleDisconnected}
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: false,
          videoSimulcastLayers: [],
        },
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true },
        videoCaptureDefaults: { resolution: { width: 1280, height: 720, frameRate: 30 } },
      }}
      audio={true}
      video={true}
      style={{ height: '100vh', width: '100vw' }}
    >
      <RoomContent
        sessionId={sessionId}
        role={role}
        studentName={studentName}
        tutorName={tutorName}
      />
    </LiveKitRoom>
  );
}
