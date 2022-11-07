import io from 'socket.io-client';
import { useCallback } from 'react';

const backUrl = 'http://localhost:3095';

// ts는 빈 배열일 경우 타이핑 해줘야한다.
const sockets: { [key: string]: SocketIOClient.Socket } = {};
const useSocket = (workspace?: string): [SocketIOClient.Socket | undefined, () => void] => {
  // console.log('rerender', workspace);
  const disconnect = useCallback(() => {
    if (workspace) {
      sockets[workspace].disconnect();
      delete sockets[workspace];
    }
  }, [workspace]);
  if (!workspace) {
    return [undefined, disconnect];
  }
  // 기존에 없었다면
  if (!sockets[workspace]) {
    // workspace url을 적어서 채널 바뀔 때 Disconnect후 Connect
    sockets[workspace] = io.connect(`${backUrl}/ws-${workspace}`, {
      transports: ['websocket'],
    });
  }

  // hooks 보낼 것
  // 기존의 값 리턴
  return [sockets[workspace], disconnect];
};

export default useSocket;
