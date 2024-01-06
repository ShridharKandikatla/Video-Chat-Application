import React, { useCallback, useEffect, useState } from 'react';
import { useSocket } from '../context/SocketProvider';
import { useNavigate } from 'react-router-dom';
import './myStylesLobby.css';

const Lobby = () => {
  const [email, setEmail] = useState('');
  const [room, setRoom] = useState('');
  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit('room:join', { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback((data) => {
    navigate(`/room/${data.room}`);
  });

  useEffect(() => {
    socket.on('room:join', handleJoinRoom);
    return () => {
      socket.off('room:join', handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className='lobby-container'>
      <h1 className='title'>Lobby</h1>
      <form className='form' onSubmit={handleSubmitForm}>
        <label htmlFor='email' className='form-label'>
          Email
          <input
            type='email'
            name='email'
            id='email'
            onChange={(e) => setEmail(e.target.value)}
            className='form-input'
          />
        </label>
        <br />
        <label htmlFor='room' className='form-label'>
          Room
          <input
            type='text'
            name='room'
            id='room'
            onChange={(e) => setRoom(e.target.value)}
            className='form-input'
          />
        </label>
        <br />
        <button type='submit' className='submit-button'>
          Join
        </button>
      </form>
    </div>
  );
};

export default Lobby;
