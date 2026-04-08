import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Avatar, Button, Flex } from "antd";
import { toast } from "react-toastify";
import {
  AudioMutedOutlined,
  AudioOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  CloseOutlined,
  DesktopOutlined,
  PushpinFilled,
  StopOutlined,
  UserOutlined,
  VideoCameraAddOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";

import { Card } from "@/components/ui/card";
import { socket } from "@/services/socket";
import { getCookie } from "@/helpers/cookies";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  findMessages,
  uploadMessageImages,
  uploadMessageMaterials,
  uploadMessageVideos,
} from "@/services/message";
import { findRoomChatsByUserId } from "@/services/roomChat";
import { findUserById, userFindUserByIds } from "@/services/user";
import SocketEvent from "@/enums/socketEvent.enum";
import type { IMessage } from "@/interfaces/message.interface";
import type { IUser } from "@/interfaces/user.interface";
import type {
  ServerResponseMessageToRoomChatDto,
  ServerResponseDeleteMessageDto,
  ServerResponsePinMessageDto,
  ServerResponseTypingToRoomChatDto,
} from "@/dtos/dtos/message.dto";
import type { ChatMessage } from "@/interfaces/chatMessage.interface";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import TypingIndicator from "./TypingIndicator";
import ImagePreviewList from "./ImagePreviewList";
import VideoPreviewList from "./VideoPreviewList";
import MaterialPreviewList from "./MaterialPreviewList";
import ChatInput from "./ChatInput";

type RoomChatUser = {
  userId: string;
  role: string;
};

type RoomChatItem = {
  _id: string;
  users: RoomChatUser[];
};

type CallState = {
  isOpen: boolean;
  isCalling: boolean;
  isIncoming: boolean;
  callType: "audio" | "video";
  fromUserId?: string;
};

function RoomChat() {
  const { roomChatId } = useParams();
  const accessToken = getCookie("accessToken");
  const userId = getCookie("userId");
  const location = useLocation();
  const friend = (location.state as { friend?: IUser } | null)?.friend;
  const { markMessagesRead, setActiveRoomChatId } = useNotifications();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const imagePreviewsRef = useRef<string[]>([]);
  const videoPreviewsRef = useRef<string[]>([]);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userById, setUserById] = useState<Record<string, IUser>>({});
  const [roomChatUserIds, setRoomChatUserIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [materialPreviews, setMaterialPreviews] = useState<string[]>([]);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [callState, setCallState] = useState<CallState>({
    isOpen: false,
    isCalling: false,
    isIncoming: false,
    callType: "audio",
  });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isUpgradePending, setIsUpgradePending] = useState(false);
  const [upgradeRequest, setUpgradeRequest] = useState<{
    fromUserId: string;
  } | null>(null);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const ringtoneIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenVideoSenderRef = useRef<RTCRtpSender | null>(null);
  const screenAudioSenderRef = useRef<RTCRtpSender | null>(null);
  const cameraVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const micAudioTrackRef = useRef<MediaStreamTrack | null>(null);
  const upgradeApprovedRef = useRef(false);
  const callEndedRef = useRef(false);
  const pendingOfferRef = useRef<{
    fromUserId: string;
    roomChatId: string;
    offer: RTCSessionDescriptionInit;
    callType: "audio" | "video";
  } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const otherUserId = useMemo(() => {
    return roomChatUserIds.find((id) => id !== userId) || friend?._id || "";
  }, [friend?._id, roomChatUserIds, userId]);

  const formatCallDuration = (value: number) => {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const stopRingtone = useCallback(() => {
    if (ringtoneIntervalRef.current) {
      window.clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  }, []);

  const playTone = useCallback(
    (frequency: number, durationMs: number, volume = 0.08) => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        const ctx = audioContextRef.current;
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.frequency.value = frequency;
        gainNode.gain.value = volume;

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + durationMs / 1000);
      } catch {
        // ignore audio errors
      }
    },
    [],
  );

  const startRingtone = useCallback(
    (type: "incoming" | "outgoing") => {
      stopRingtone();
      const frequency = type === "incoming" ? 520 : 420;
      ringtoneIntervalRef.current = window.setInterval(() => {
        playTone(frequency, 350);
      }, 1200);
    },
    [playTone, stopRingtone],
  );

  const cleanupCall = useCallback(() => {
    stopRingtone();
    peerRef.current?.close();
    peerRef.current = null;

    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    screenVideoSenderRef.current = null;
    screenAudioSenderRef.current = null;
    cameraVideoTrackRef.current = null;
    micAudioTrackRef.current = null;
    setIsScreenSharing(false);

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);

    pendingOfferRef.current = null;
    upgradeApprovedRef.current = false;
    callEndedRef.current = false;

    setCallState({
      isOpen: false,
      isCalling: false,
      isIncoming: false,
      callType: "audio",
    });
    setIsMuted(false);
    setIsCameraOff(false);
    setHasVideoTrack(false);
    setCallStartedAt(null);
    setCallDuration(0);
    setIsUpgradePending(false);
    setUpgradeRequest(null);
  }, [stopRingtone]);

  const startScreenShare = async () => {
    if (!peerRef.current || !callState.isOpen) return;
    if (callState.isCalling || callState.isIncoming) return;
    if (isScreenSharing) return;
    if (!hasVideoTrack) {
      toast.info("Upgrade to video before sharing the screen.");
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const [screenVideoTrack] = displayStream.getVideoTracks();
      if (!screenVideoTrack) {
        displayStream.getTracks().forEach((track) => track.stop());
        toast.error("Unable to share the screen.");
        return;
      }

      screenStreamRef.current = displayStream;
      screenVideoTrack.onended = () => {
        stopScreenShare();
      };

      const videoSender = peerRef.current
        .getSenders()
        .find((sender) => sender.track?.kind === "video");

      if (videoSender) {
        cameraVideoTrackRef.current = videoSender.track || null;
        await videoSender.replaceTrack(screenVideoTrack);
        screenVideoSenderRef.current = videoSender;
      } else {
        screenVideoSenderRef.current = peerRef.current.addTrack(
          screenVideoTrack,
          displayStream,
        );
      }

      const [screenAudioTrack] = displayStream.getAudioTracks();
      if (screenAudioTrack) {
        const audioSender = peerRef.current
          .getSenders()
          .find((sender) => sender.track?.kind === "audio");

        if (audioSender) {
          micAudioTrackRef.current = audioSender.track || null;
          await audioSender.replaceTrack(screenAudioTrack);
          screenAudioSenderRef.current = audioSender;
        } else {
          screenAudioSenderRef.current = peerRef.current.addTrack(
            screenAudioTrack,
            displayStream,
          );
        }
      }

      setIsScreenSharing(true);
    } catch {
      toast.error("Unable to start screen sharing.");
    }
  };

  const stopScreenShare = async () => {
    if (!peerRef.current || !screenStreamRef.current) return;

    if (screenVideoSenderRef.current) {
      if (cameraVideoTrackRef.current) {
        await screenVideoSenderRef.current.replaceTrack(
          cameraVideoTrackRef.current,
        );
      } else {
        peerRef.current.removeTrack(screenVideoSenderRef.current);
      }
    }

    if (screenAudioSenderRef.current) {
      if (micAudioTrackRef.current) {
        await screenAudioSenderRef.current.replaceTrack(
          micAudioTrackRef.current,
        );
      } else {
        peerRef.current.removeTrack(screenAudioSenderRef.current);
      }
    }

    screenStreamRef.current.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    screenVideoSenderRef.current = null;
    screenAudioSenderRef.current = null;
    cameraVideoTrackRef.current = null;
    micAudioTrackRef.current = null;
    setIsScreenSharing(false);
  };

  const createPeerConnection = (targetUserId: string) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onicecandidate = (event) => {
      if (!event.candidate || !roomChatId) return;
      socket.emit(SocketEvent.CLIENT_CALL_ICE, {
        fromUserId: userId,
        toUserId: targetUserId,
        roomChatId,
        candidate: event.candidate.toJSON(),
      });
    };

    peer.ontrack = (event) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current?.addTrack(track);
      });
      setRemoteStream(remoteStreamRef.current);
    };

    return peer;
  };

  const enableVideoTrack = async () => {
    if (!peerRef.current) return;

    if (!localStreamRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      stream.getTracks().forEach((track) => {
        peerRef.current?.addTrack(track, stream);
      });
    } else if (localStreamRef.current.getVideoTracks().length === 0) {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      const [videoTrack] = videoStream.getVideoTracks();
      if (videoTrack) {
        localStreamRef.current.addTrack(videoTrack);
        peerRef.current.addTrack(videoTrack, localStreamRef.current);
        setLocalStream(localStreamRef.current);
      }
      videoStream.getAudioTracks().forEach((track) => track.stop());
    }

    setHasVideoTrack(true);
    setIsCameraOff(false);
  };

  const startCall = async (callType: "audio" | "video") => {
    if (!accessToken || !userId || !roomChatId) {
      toast.error("Unable to start call.");
      return;
    }

    if (!otherUserId) {
      toast.error("No user available for this call.");
      return;
    }

    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });

      localStreamRef.current = localStream;
      setLocalStream(localStream);
      setHasVideoTrack(localStream.getVideoTracks().length > 0);
      setIsCameraOff(callType !== "video");

      const peer = createPeerConnection(otherUserId);
      peerRef.current = peer;

      localStream.getTracks().forEach((track) => {
        peer.addTrack(track, localStream);
      });

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit(SocketEvent.CLIENT_CALL_OFFER, {
        fromUserId: userId,
        toUserId: otherUserId,
        roomChatId,
        offer,
        callType,
      });

      setCallState({
        isOpen: true,
        isCalling: true,
        isIncoming: false,
        callType,
      });
    } catch {
      toast.error("Unable to access camera or microphone.");
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!pendingOfferRef.current || !userId || !roomChatId) {
      return;
    }

    const { fromUserId, offer, callType } = pendingOfferRef.current;

    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });

      localStreamRef.current = localStream;
      setLocalStream(localStream);
      setHasVideoTrack(localStream.getVideoTracks().length > 0);
      setIsCameraOff(callType !== "video");

      const peer = createPeerConnection(fromUserId);
      peerRef.current = peer;

      localStream.getTracks().forEach((track) => {
        peer.addTrack(track, localStream);
      });

      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit(SocketEvent.CLIENT_CALL_ANSWER, {
        fromUserId: userId,
        toUserId: fromUserId,
        roomChatId,
        answer,
      });

      setCallState({
        isOpen: true,
        isCalling: false,
        isIncoming: false,
        callType,
        fromUserId,
      });
      stopRingtone();
      setCallStartedAt(Date.now());
      pendingOfferRef.current = null;
    } catch {
      toast.error("Unable to join the call.");
      cleanupCall();
    }
  };

  const declineCall = () => {
    if (!pendingOfferRef.current || !userId || !roomChatId) {
      pendingOfferRef.current = null;
      setCallState({
        isOpen: false,
        isCalling: false,
        isIncoming: false,
        callType: "audio",
      });
      return;
    }

    socket.emit(SocketEvent.CLIENT_CALL_END, {
      fromUserId: pendingOfferRef.current.fromUserId,
      toUserId: userId,
      roomChatId,
      durationSeconds: 0,
      callType: pendingOfferRef.current.callType,
      endReason: "declined",
    });
    stopRingtone();
    pendingOfferRef.current = null;
    cleanupCall();
  };

  const endCall = () => {
    if (!userId || !roomChatId) {
      cleanupCall();
      return;
    }

    if (callEndedRef.current) {
      cleanupCall();
      return;
    }

    callEndedRef.current = true;

    const durationSeconds = callStartedAt
      ? Math.max(1, Math.floor((Date.now() - callStartedAt) / 1000))
      : 0;
    const endReason =
      !callStartedAt && callState.isCalling ? "canceled" : "ended";

    socket.emit(SocketEvent.CLIENT_CALL_END, {
      fromUserId: callState.fromUserId || userId,
      toUserId: otherUserId || callState.fromUserId || "",
      roomChatId,
      durationSeconds,
      callType: callState.callType,
      endReason,
    });

    cleanupCall();
  };

  const requestVideoUpgrade = () => {
    if (!userId || !roomChatId || !otherUserId) return;
    if (!callState.isOpen || callState.isCalling || callState.isIncoming) {
      toast.info("Wait until the call is connected.");
      return;
    }
    if (!callStartedAt) {
      toast.info("Wait until the call is connected.");
      return;
    }
    if (isUpgradePending) return;

    socket.emit(SocketEvent.CLIENT_CALL_UPGRADE_REQUEST, {
      fromUserId: userId,
      toUserId: otherUserId,
      roomChatId,
    });

    setIsUpgradePending(true);
    toast.info("Requested to turn on video.");
  };

  const acceptUpgrade = async () => {
    if (!userId || !roomChatId || !upgradeRequest) return;

    upgradeApprovedRef.current = true;
    try {
      await enableVideoTrack();
    } catch {
      toast.error("Unable to access camera.");
      upgradeApprovedRef.current = false;
      return;
    }

    socket.emit(SocketEvent.CLIENT_CALL_UPGRADE_RESPONSE, {
      fromUserId: userId,
      toUserId: upgradeRequest.fromUserId,
      roomChatId,
      accepted: true,
    });

    setUpgradeRequest(null);
  };

  const declineUpgrade = () => {
    if (!userId || !roomChatId || !upgradeRequest) return;

    socket.emit(SocketEvent.CLIENT_CALL_UPGRADE_RESPONSE, {
      fromUserId: userId,
      toUserId: upgradeRequest.fromUserId,
      roomChatId,
      accepted: false,
    });

    setUpgradeRequest(null);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  };

  const toggleCamera = () => {
    if (callState.callType === "audio") {
      requestVideoUpgrade();
      return;
    }
    if (!hasVideoTrack) return;
    const nextOff = !isCameraOff;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !nextOff;
    });
    setIsCameraOff(nextOff);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!userId || !roomChatId) return;

    const handleOffer = (data: {
      fromUserId: string;
      toUserId: string;
      roomChatId: string;
      offer: RTCSessionDescriptionInit;
      callType: "audio" | "video";
      upgrade?: boolean;
    }) => {
      if (data.toUserId !== userId || data.roomChatId !== roomChatId) return;

      if (data.upgrade && callState.isOpen) {
        if (callState.isCalling || callState.isIncoming || !callStartedAt) {
          return;
        }
        if (!upgradeApprovedRef.current || !peerRef.current) {
          return;
        }

        const applyUpgrade = async () => {
          await peerRef.current?.setRemoteDescription(
            new RTCSessionDescription(data.offer),
          );
          const answer = await peerRef.current?.createAnswer();
          if (!answer) return;
          await peerRef.current?.setLocalDescription(answer);

          socket.emit(SocketEvent.CLIENT_CALL_ANSWER, {
            fromUserId: userId,
            toUserId: data.fromUserId,
            roomChatId,
            answer,
          });

          setCallState((prev) => ({
            ...prev,
            callType: "video",
          }));
          setCallStartedAt((prev) => prev ?? Date.now());
          upgradeApprovedRef.current = false;
        };

        applyUpgrade().catch(() => {
          toast.error("Unable to upgrade to video.");
        });
        return;
      }

      pendingOfferRef.current = {
        fromUserId: data.fromUserId,
        roomChatId: data.roomChatId,
        offer: data.offer,
        callType: data.callType,
      };

      setCallState({
        isOpen: true,
        isCalling: false,
        isIncoming: true,
        callType: data.callType,
        fromUserId: data.fromUserId,
      });
    };

    const handleAnswer = async (data: {
      fromUserId: string;
      toUserId: string;
      roomChatId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      if (data.toUserId !== userId || data.roomChatId !== roomChatId) return;
      if (!peerRef.current) return;

      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(data.answer),
      );

      setCallState((prev) => ({
        ...prev,
        isCalling: false,
        isIncoming: false,
        callType: prev.callType === "video" ? "video" : prev.callType,
      }));
      setCallStartedAt(Date.now());
    };

    const handleIce = async (data: {
      fromUserId: string;
      toUserId: string;
      roomChatId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      if (data.toUserId !== userId || data.roomChatId !== roomChatId) return;
      if (!peerRef.current) return;
      try {
        await peerRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate),
        );
      } catch {
        // ignore ice errors
      }
    };

    const handleEnd = (data: {
      fromUserId: string;
      toUserId: string;
      roomChatId: string;
    }) => {
      if (data.roomChatId !== roomChatId) return;
      if (data.toUserId !== userId && data.fromUserId !== userId) return;
      callEndedRef.current = true;
      cleanupCall();
    };

    const handleUpgradeRequest = (data: {
      fromUserId: string;
      toUserId: string;
      roomChatId: string;
    }) => {
      if (data.toUserId !== userId || data.roomChatId !== roomChatId) return;
      if (!callState.isOpen || callState.callType !== "audio") return;
      if (callState.isCalling || callState.isIncoming || !callStartedAt) {
        return;
      }

      setUpgradeRequest({ fromUserId: data.fromUserId });
    };

    const handleUpgradeResponse = async (data: {
      fromUserId: string;
      toUserId: string;
      roomChatId: string;
      accepted: boolean;
    }) => {
      if (data.toUserId !== userId || data.roomChatId !== roomChatId) return;
      setIsUpgradePending(false);

      if (!data.accepted) {
        toast.info("Video upgrade declined.");
        return;
      }

      try {
        await enableVideoTrack();
        if (!peerRef.current) return;

        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);

        socket.emit(SocketEvent.CLIENT_CALL_OFFER, {
          fromUserId: userId,
          toUserId: data.fromUserId,
          roomChatId,
          offer,
          callType: "video",
          upgrade: true,
        });

        setCallState((prev) => ({
          ...prev,
          callType: "video",
        }));
      } catch {
        toast.error("Unable to upgrade to video.");
      }
    };

    socket.on(SocketEvent.SERVER_CALL_OFFER, handleOffer);
    socket.on(SocketEvent.SERVER_CALL_ANSWER, handleAnswer);
    socket.on(SocketEvent.SERVER_CALL_ICE, handleIce);
    socket.on(SocketEvent.SERVER_CALL_END, handleEnd);
    socket.on(SocketEvent.SERVER_CALL_UPGRADE_REQUEST, handleUpgradeRequest);
    socket.on(SocketEvent.SERVER_CALL_UPGRADE_RESPONSE, handleUpgradeResponse);

    return () => {
      socket.off(SocketEvent.SERVER_CALL_OFFER, handleOffer);
      socket.off(SocketEvent.SERVER_CALL_ANSWER, handleAnswer);
      socket.off(SocketEvent.SERVER_CALL_ICE, handleIce);
      socket.off(SocketEvent.SERVER_CALL_END, handleEnd);
      socket.off(SocketEvent.SERVER_CALL_UPGRADE_REQUEST, handleUpgradeRequest);
      socket.off(
        SocketEvent.SERVER_CALL_UPGRADE_RESPONSE,
        handleUpgradeResponse,
      );
    };
  }, [
    callStartedAt,
    callState.callType,
    callState.isCalling,
    callState.isIncoming,
    callState.isOpen,
    cleanupCall,
    roomChatId,
    userId,
  ]);

  useEffect(() => {
    if (!callState.isOpen) {
      stopRingtone();
      return;
    }

    if (callState.isIncoming) {
      startRingtone("incoming");
      return;
    }

    if (callState.isCalling) {
      startRingtone("outgoing");
      return;
    }

    stopRingtone();
  }, [
    callState.isCalling,
    callState.isIncoming,
    callState.isOpen,
    startRingtone,
    stopRingtone,
  ]);

  useEffect(() => {
    if (!callState.isOpen || callState.isCalling || callState.isIncoming) {
      setCallDuration(0);
      return;
    }

    const startedAt = callStartedAt ?? Date.now();
    setCallStartedAt(startedAt);

    const intervalId = window.setInterval(() => {
      setCallDuration(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    callStartedAt,
    callState.isCalling,
    callState.isIncoming,
    callState.isOpen,
  ]);

  useEffect(() => {
    if (localVideoRef.current) {
      if (isScreenSharing && screenStreamRef.current) {
        localVideoRef.current.srcObject = screenStreamRef.current;
      } else {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream, callState.isOpen, isScreenSharing]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState.isOpen]);

  useEffect(() => {
    setActiveRoomChatId(roomChatId || null);
    if (roomChatId) {
      markMessagesRead(roomChatId);
    }

    return () => {
      setActiveRoomChatId(null);
    };
  }, [markMessagesRead, roomChatId, setActiveRoomChatId]);

  useEffect(() => {
    const fetchApi = async () => {
      if (!roomChatId) {
        return;
      }

      try {
        const responseMessages = await findMessages({
          accessToken,
          filter: { roomChatId },
          sort: { sortKey: "createdAt", sortValue: "asc" },
        });

        setMessages(
          responseMessages.data.data.messages.items.map((item: IMessage) => ({
            _id: item._id,
            content: item.content || "",
            images: item.images,
            videos: item.videos,
            materials: item.materials,
            userId: item.userId || "",
            pinned: item.pinned,
            pinnedBy: item.pinnedBy,
            pinnedAt: item.pinnedAt || null,
            createdAt: item.createdAt,
            deleted: item.deleted,
          })),
        );
      } catch {
        toast.error("Unable to load messages.");
      }
    };

    fetchApi();
  }, [accessToken, roomChatId]);

  const pinnedMessages = messages.filter(
    (item) => item.pinned && !item.deleted,
  );
  const hasPinned = pinnedMessages.length > 0;

  const describePinnedMessage = (item: ChatMessage) => {
    const trimmed = item.content?.trim();
    if (trimmed) {
      return trimmed;
    }

    const imageCount = item.images?.length || 0;
    const videoCount = item.videos?.length || 0;
    const materialCount = item.materials?.length || 0;
    const parts: string[] = [];

    if (imageCount)
      parts.push(`${imageCount} image${imageCount > 1 ? "s" : ""}`);
    if (videoCount)
      parts.push(`${videoCount} video${videoCount > 1 ? "s" : ""}`);
    if (materialCount)
      parts.push(`${materialCount} file${materialCount > 1 ? "s" : ""}`);

    return parts.length ? `Attachment: ${parts.join(", ")}` : "Pinned message";
  };

  const registerMessageRef = (
    messageId: string,
    node: HTMLDivElement | null,
  ) => {
    messageRefs.current[messageId] = node;
  };

  const handleJumpToMessage = (messageId: string) => {
    const target = messageRefs.current[messageId];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  useEffect(() => {
    const fetchMissingUsers = async () => {
      if (!accessToken || messages.length === 0) {
        return;
      }

      const missingIds = Array.from(
        new Set(messages.map((item) => item.userId)),
      ).filter((id) => id && !userById[id]);

      if (!missingIds.length) {
        return;
      }

      try {
        const responseUsers = await userFindUserByIds({
          accessToken,
          ids: missingIds,
        });
        const users = responseUsers?.data?.data || [];
        const nextMap: Record<string, IUser> = { ...userById };
        users.forEach((user: IUser) => {
          const key = user._id || (user as { id?: string }).id;
          if (key) {
            nextMap[key] = user;
          }
        });
        setUserById(nextMap);
      } catch {
        // ignore - fallback to unknown
      }
    };

    fetchMissingUsers();
  }, [accessToken, messages, userById]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!accessToken || !userId) {
        return;
      }

      const nextMap: Record<string, IUser> = {};

      try {
        const responseMe = await findUserById({ accessToken, id: userId });
        if (responseMe?.data?.data?._id) {
          nextMap[responseMe.data.data._id] = responseMe.data.data as IUser;
        }
      } catch {
        // ignore, fallback to unknown user
      }

      if (friend?._id) {
        nextMap[friend._id] = friend;
      }

      if (Object.keys(nextMap).length > 0) {
        setUserById(nextMap);
      }
    };

    fetchUsers();
  }, [accessToken, friend, userId]);

  useEffect(() => {
    const fetchRoomChatUsers = async () => {
      if (!accessToken || !userId || !roomChatId) {
        return;
      }

      try {
        const response = await findRoomChatsByUserId({ accessToken, userId });
        const roomChats: RoomChatItem[] = response.data?.data?.roomChats || [];
        const room = roomChats.find((item) => item._id === roomChatId);
        const ids =
          room?.users
            ?.map((user) => user.userId)
            .filter((id): id is string => Boolean(id)) || [];
        setRoomChatUserIds(ids);
      } catch {
        setRoomChatUserIds([]);
      }
    };

    fetchRoomChatUsers();
  }, [accessToken, roomChatId, userId]);

  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  useEffect(() => {
    const fetchRoomChatUserProfiles = async () => {
      if (!accessToken || roomChatUserIds.length === 0) {
        return;
      }

      const missingIds = roomChatUserIds.filter((id) => id && !userById[id]);

      if (!missingIds.length) {
        return;
      }

      try {
        const responseUsers = await userFindUserByIds({
          accessToken,
          ids: missingIds,
        });
        const users = responseUsers?.data?.data || [];
        const nextMap: Record<string, IUser> = { ...userById };
        users.forEach((user: IUser) => {
          const key = user._id || (user as { id?: string }).id;
          if (key) {
            nextMap[key] = user;
          }
        });
        setUserById(nextMap);
      } catch {
        // ignore - fallback to unknown
      }
    };

    fetchRoomChatUserProfiles();
  }, [accessToken, roomChatUserIds, userById]);

  const mentionCandidates = useMemo(() => {
    return roomChatUserIds
      .filter((id) => id && id !== userId)
      .map((id) => userById[id])
      .filter(Boolean)
      .map((user) => ({
        id: user._id,
        fullName: user.fullName,
        avatar: user.avatar,
      }));
  }, [roomChatUserIds, userById, userId]);

  useEffect(() => {
    const handler = (data: ServerResponseMessageToRoomChatDto) => {
      if (!roomChatId || data.roomChatId !== roomChatId) {
        return;
      }

      setMessages((prev) => {
        if (data.userId === userId) {
          const index = prev.findIndex(
            (item) =>
              item.status === "sending" &&
              item.content === data.content &&
              JSON.stringify(item.images || []) ===
                JSON.stringify(data.images || []) &&
              JSON.stringify(item.videos || []) ===
                JSON.stringify(data.videos || []) &&
              JSON.stringify(item.materials || []) ===
                JSON.stringify(data.materials || []),
          );
          if (index !== -1) {
            const next = [...prev];
            next[index] = {
              _id: data._id,
              content: data.content,
              images: data.images,
              videos: data.videos,
              materials: data.materials,
              userId: data.userId,
              pinned: data.pinned,
              pinnedBy: data.pinnedBy,
              pinnedAt: data.pinnedAt,
              createdAt: data.createdAt,
              deleted: data.deleted,
            };
            return next;
          }
        }

        return [
          ...prev,
          {
            _id: data._id,
            content: data.content,
            images: data.images,
            videos: data.videos,
            materials: data.materials,
            userId: data.userId,
            pinned: data.pinned,
            pinnedBy: data.pinnedBy,
            pinnedAt: data.pinnedAt,
            createdAt: data.createdAt,
            deleted: data.deleted,
          },
        ];
      });
    };

    socket.on(SocketEvent.SERVER_RESPONSE_MESSAGE_TO_ROOM_CHAT, handler);

    return () => {
      socket.off(SocketEvent.SERVER_RESPONSE_MESSAGE_TO_ROOM_CHAT, handler);
    };
  }, [roomChatId, userId]);

  useEffect(() => {
    const handler = (data: ServerResponseDeleteMessageDto) => {
      if (!roomChatId || data.roomChatId !== roomChatId) {
        return;
      }

      setMessages((prev) =>
        prev.map((item) =>
          item._id === data.messageId
            ? {
                ...item,
                deleted: data.deleted,
                pinned: false,
                pinnedBy: "",
                pinnedAt: null,
              }
            : item,
        ),
      );
    };

    socket.on(SocketEvent.SERVER_RESPONSE_DELETE_MESSAGE, handler);

    return () => {
      socket.off(SocketEvent.SERVER_RESPONSE_DELETE_MESSAGE, handler);
    };
  }, [roomChatId]);

  useEffect(() => {
    const handler = (data: ServerResponsePinMessageDto) => {
      if (!roomChatId || data.roomChatId !== roomChatId) {
        return;
      }

      setMessages((prev) =>
        prev.map((item) =>
          item._id === data.messageId
            ? {
                ...item,
                pinned: data.pinned,
                pinnedBy: data.pinnedBy,
                pinnedAt: data.pinnedAt,
              }
            : item,
        ),
      );
    };

    socket.on(SocketEvent.SERVER_RESPONSE_PIN_MESSAGE, handler);

    return () => {
      socket.off(SocketEvent.SERVER_RESPONSE_PIN_MESSAGE, handler);
    };
  }, [roomChatId]);

  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    videoPreviewsRef.current = videoPreviews;
  }, [videoPreviews]);

  useEffect(() => {
    return () => {
      imagePreviewsRef.current.forEach((url) => URL.revokeObjectURL(url));
      videoPreviewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    const handler = (data: ServerResponseTypingToRoomChatDto) => {
      if (!roomChatId || data.roomChatId !== roomChatId) {
        return;
      }

      if (data.userId === userId) {
        return;
      }

      setIsFriendTyping(data.isTyping);

      if (data.isTyping) {
        if (typingClearTimeoutRef.current) {
          clearTimeout(typingClearTimeoutRef.current);
        }

        typingClearTimeoutRef.current = setTimeout(() => {
          setIsFriendTyping(false);
        }, 2000);
      }
    };

    socket.on(SocketEvent.SERVER_RESPONSE_TYPING_TO_ROOM_CHAT, handler);

    return () => {
      socket.off(SocketEvent.SERVER_RESPONSE_TYPING_TO_ROOM_CHAT, handler);
    };
  }, [roomChatId, userId]);

  const emitTyping = (isTyping: boolean) => {
    if (!roomChatId || !userId) {
      return;
    }

    socket.emit(SocketEvent.CLIENT_TYPING_TO_ROOM_CHAT, {
      roomChatId,
      userId,
      isTyping,
    });
  };

  const handleTogglePin = (messageId: string, pinned: boolean) => {
    if (!roomChatId || !userId) {
      return;
    }

    socket.emit(SocketEvent.CLIENT_TOGGLE_PIN_MESSAGE, {
      roomChatId,
      userId,
      messageId,
      pinned,
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!roomChatId || !userId) {
      return;
    }

    socket.emit(SocketEvent.CLIENT_DELETE_MESSAGE, {
      roomChatId,
      userId,
      messageId,
    });
  };

  const handleMessageChange = (nextValue: string) => {
    setMessage(nextValue);

    if (!roomChatId || !userId) {
      return;
    }

    if (nextValue.trim().length === 0) {
      emitTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    emitTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
      typingTimeoutRef.current = null;
    }, 1200);
  };

  const sendMessage = ({
    content,
    images,
    videos,
    materials,
    clearInput = false,
  }: {
    content?: string;
    images?: string[];
    videos?: string[];
    materials?: string[];
    clearInput?: boolean;
  }) => {
    if (!roomChatId) {
      return;
    }

    const trimmedContent = content?.trim() ?? "";
    const nextImages = images || [];
    const nextVideos = videos || [];
    const nextMaterials = materials || [];

    if (
      !trimmedContent &&
      nextImages.length === 0 &&
      nextVideos.length === 0 &&
      nextMaterials.length === 0
    ) {
      return;
    }

    setIsSending(true);
    if (clearInput) {
      setMessage("");
    }
    setMessages((prev) => [
      ...prev,
      {
        content: trimmedContent,
        images: nextImages,
        videos: nextVideos,
        materials: nextMaterials,
        userId,
        status: "sending",
      },
    ]);

    emitTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    socket.emit(SocketEvent.CLIENT_SEND_MESSAGE_TO_ROOM_CHAT, {
      roomChatId,
      userId,
      content: trimmedContent,
      images: nextImages,
      videos: nextVideos,
      materials: nextMaterials,
    });

    setIsSending(false);
  };

  const handleSendMessage = () => {
    if (
      isSending ||
      isUploadingImage ||
      isUploadingVideo ||
      isUploadingMaterial
    ) {
      return;
    }

    if (
      selectedImages.length === 0 &&
      selectedVideos.length === 0 &&
      selectedMaterials.length === 0
    ) {
      sendMessage({ content: message, clearInput: true });
      return;
    }

    const uploadAndSend = async () => {
      try {
        setIsSending(true);
        setIsUploadingImage(selectedImages.length > 0);
        setIsUploadingVideo(selectedVideos.length > 0);
        setIsUploadingMaterial(selectedMaterials.length > 0);

        const [imagesResponse, videosResponse, materialsResponse] =
          await Promise.all([
            selectedImages.length > 0
              ? uploadMessageImages({ accessToken, files: selectedImages })
              : Promise.resolve(null),
            selectedVideos.length > 0
              ? uploadMessageVideos({ accessToken, files: selectedVideos })
              : Promise.resolve(null),
            selectedMaterials.length > 0
              ? uploadMessageMaterials({
                  accessToken,
                  files: selectedMaterials,
                })
              : Promise.resolve(null),
          ]);

        const images = imagesResponse?.data?.data?.images || [];
        const videos = videosResponse?.data?.data?.videos || [];
        const materials = materialsResponse?.data?.data?.materials || [];
        sendMessage({
          content: message,
          images,
          videos,
          materials,
          clearInput: true,
        });

        setSelectedImages([]);
        setSelectedVideos([]);
        setSelectedMaterials([]);
        setImagePreviews([]);
        setVideoPreviews([]);
        setMaterialPreviews([]);
      } catch {
        toast.error("Unable to upload media.");
      } finally {
        setIsSending(false);
        setIsUploadingImage(false);
        setIsUploadingVideo(false);
        setIsUploadingMaterial(false);
      }
    };

    uploadAndSend();
  };

  const handleImagesSelected = (files: File[]) => {
    if (!files.length) {
      return;
    }

    const nextPreviews = files.map((file) => URL.createObjectURL(file));
    setSelectedImages((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...nextPreviews]);
  };

  const handleVideosSelected = (files: File[]) => {
    if (!files.length) {
      return;
    }

    const nextPreviews = files.map((file) => URL.createObjectURL(file));
    setSelectedVideos((prev) => [...prev, ...files]);
    setVideoPreviews((prev) => [...prev, ...nextPreviews]);
  };

  const handleMaterialsSelected = (files: File[]) => {
    if (!files.length) {
      return;
    }

    setSelectedMaterials((prev) => [...prev, ...files]);
    setMaterialPreviews((prev) => [...prev, ...files.map((file) => file.name)]);
  };

  const handleRemovePreview = (index: number) => {
    setSelectedImages((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
    setImagePreviews((prev) => {
      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed);
      }
      return next;
    });
  };

  const handleRemoveVideoPreview = (index: number) => {
    setSelectedVideos((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
    setVideoPreviews((prev) => {
      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed);
      }
      return next;
    });
  };

  const handleRemoveMaterialPreview = (index: number) => {
    setSelectedMaterials((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
    setMaterialPreviews((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const handleMessageKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="p-6">
      <ChatHeader
        friend={friend}
        onCallAudio={() => startCall("audio")}
        onCallVideo={() => startCall("video")}
      />
      {hasPinned && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/90 to-amber-100/60 p-3">
          <button
            type="button"
            onClick={() => setIsPinnedOpen((prev) => !prev)}
            className="w-full flex items-center justify-between gap-3"
            aria-expanded={isPinnedOpen}
            aria-controls="pinned-messages-panel"
          >
            <div className="flex items-center gap-2 text-amber-800 text-sm font-semibold">
              <PushpinFilled />
              <span>Pinned messages</span>
              <span className="text-amber-700/80 font-medium">
                ({pinnedMessages.length})
              </span>
            </div>
            <span className="text-amber-700">
              {isPinnedOpen ? <CaretDownOutlined /> : <CaretRightOutlined />}
            </span>
          </button>

          {isPinnedOpen && (
            <div
              id="pinned-messages-panel"
              className="mt-3 max-h-56 overflow-y-auto rounded-lg bg-white/80 p-2"
            >
              <div className="flex flex-col gap-2 text-sm text-gray-700">
                {pinnedMessages.map((item, index) => (
                  <button
                    key={item._id || `${item.userId}-${index}`}
                    type="button"
                    className="text-left rounded-md px-2 py-1 hover:bg-amber-100/60 hover:text-amber-900 transition"
                    onClick={() => item._id && handleJumpToMessage(item._id)}
                  >
                    {describePinnedMessage(item)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <MessageList
        messages={messages}
        userId={userId}
        messagesEndRef={messagesEndRef}
        userById={userById}
        mentionUsers={Object.values(userById)}
        showSenderName
        onTogglePin={handleTogglePin}
        onDeleteMessage={handleDeleteMessage}
        registerMessageRef={registerMessageRef}
      />

      {!messages.length && (
        <Flex
          vertical
          align="center"
          justify="center"
          style={{ height: "100%", opacity: 0.7 }}
        >
          <Avatar
            size={64}
            icon={<UserOutlined />}
            className="mb-4 bg-blue-500"
          />
          <h3 className="text-xl font-semibold text-gray-700">
            Say hello to start the chat
          </h3>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            Messages will appear here in real-time.
          </p>
        </Flex>
      )}

      <TypingIndicator isVisible={isFriendTyping} />
      <ImagePreviewList
        imagePreviews={imagePreviews}
        onRemove={handleRemovePreview}
      />
      <VideoPreviewList
        videoPreviews={videoPreviews}
        onRemove={handleRemoveVideoPreview}
      />
      <MaterialPreviewList
        materials={materialPreviews}
        onRemove={handleRemoveMaterialPreview}
      />
      <ChatInput
        message={message}
        onMessageChange={handleMessageChange}
        onMessageBlur={() => emitTyping(false)}
        onMessageKeyDown={handleMessageKeyDown}
        onImagesSelected={handleImagesSelected}
        onVideosSelected={handleVideosSelected}
        onMaterialsSelected={handleMaterialsSelected}
        onSend={handleSendMessage}
        isSending={isSending}
        isUploadingImage={isUploadingImage}
        isUploadingVideo={isUploadingVideo}
        isUploadingMaterial={isUploadingMaterial}
        mentionCandidates={mentionCandidates}
        enableMentions
      />

      {callState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {callState.callType === "video" ? "Video call" : "Audio call"}
                </h3>
                <p className="text-sm text-gray-500">
                  {callState.isIncoming
                    ? "Incoming call"
                    : callState.isCalling
                      ? "Calling..."
                      : "In call"}
                </p>
                {!callState.isIncoming && !callState.isCalling && (
                  <p className="text-xs text-gray-500">
                    {formatCallDuration(callDuration)}
                  </p>
                )}
              </div>
              <Button icon={<CloseOutlined />} onClick={endCall} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative overflow-hidden rounded-xl bg-slate-900/90">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-64 w-full object-cover"
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold">
                  You
                </span>
              </div>
              <div className="relative overflow-hidden rounded-xl bg-slate-900/90">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="h-64 w-full object-cover"
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold">
                  {friend?.fullName || "Friend"}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  shape="circle"
                  icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
                  onClick={toggleMute}
                  disabled={!localStreamRef.current}
                />
                <Button
                  shape="circle"
                  icon={
                    isCameraOff ? (
                      <VideoCameraAddOutlined />
                    ) : (
                      <VideoCameraOutlined />
                    )
                  }
                  onClick={toggleCamera}
                  disabled={
                    isScreenSharing ||
                    (callState.callType === "audio" ? false : !hasVideoTrack)
                  }
                />
                <Button
                  shape="circle"
                  icon={
                    isScreenSharing ? <StopOutlined /> : <DesktopOutlined />
                  }
                  onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                  disabled={
                    !peerRef.current ||
                    callState.isIncoming ||
                    callState.isCalling
                  }
                  title={
                    isScreenSharing ? "Stop screen sharing" : "Share screen"
                  }
                />
              </div>
              {upgradeRequest && (
                <>
                  <Button onClick={declineUpgrade} danger>
                    Decline video
                  </Button>
                  <Button type="primary" onClick={acceptUpgrade}>
                    Accept video
                  </Button>
                </>
              )}
              {callState.isIncoming && !upgradeRequest && (
                <>
                  <Button onClick={declineCall} danger>
                    Decline
                  </Button>
                  <Button type="primary" onClick={acceptCall}>
                    Accept
                  </Button>
                </>
              )}
              {!callState.isIncoming && !upgradeRequest && (
                <Button danger onClick={endCall}>
                  End call
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default RoomChat;
