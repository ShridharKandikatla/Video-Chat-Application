import React, { useCallback, useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { useSocket } from '../context/SocketProvider';
import peer from '../services/peeer';
import './myStylesRoom.css';

const Room = () => {
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const socket = useSocket();

  const handleUserJoined = useCallback(({ email, id }) => {
    setRemoteSocketId(id);
  });

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      const ans = await peer.getAnswer(offer);
      socket.emit('call:accepted', { to: from, ans });
    },
    [socket]
  );

  const sendStreams = () => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  };

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit('peer:nego:needed', { to: remoteSocketId, offer });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener('negotiationneeded', handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncoming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit('peer:nego:done', { to: from, ans });
    },
    [socket]
  );

  const handleNegoFinal = useCallback(({ ans }) => {
    peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener('track', async (ev) => {
      const remoteStream = ev.streams;
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on('user:joined', handleUserJoined);
    socket.on('incoming:call', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('peer:nego:needed', handleNegoNeedIncoming);
    socket.on('peer:nego:final', handleNegoFinal);
    return () => {
      socket.off('user:joined', handleUserJoined);
      socket.off('incoming:call', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('peer:nego:needed', handleNegoNeedIncoming);
      socket.off('peer:nego:final', handleNegoFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoNeedIncoming,
    handleNegoFinal,
  ]);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit('user:call', { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  return (
    <div className='room-container'>
      <h1 className='title'>Room Page</h1>
      <h3 className='connection-status'>
        {remoteSocketId ? 'Connected' : 'No One Connected'}
      </h3>

      {myStream && (
        <button className='action-button' onClick={sendStreams}>
          Send Stream
        </button>
      )}
      {remoteSocketId && (
        <button className='action-button' onClick={handleCallUser}>
          CALL
        </button>
      )}

      {myStream && (
        <div className='stream-container'>
          <h1 className='stream-title'>My Stream</h1>
          <ReactPlayer
            url={myStream}
            height='300px'
            width='300px'
            playing
            muted
          />
        </div>
      )}

      {remoteStream && (
        <div className='stream-container'>
          <h1 className='stream-title'>Remote Stream</h1>
          <ReactPlayer
            url={remoteStream}
            height='300px'
            width='300px'
            playing
            muted
          />
        </div>
      )}
    </div>
  );
};

export default Room;
