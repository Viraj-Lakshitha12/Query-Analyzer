import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_BASE_URL } from '../config/constants';

export interface QueryEventWsDTO {
  id: string;
  sqlText: string;
  durationMs: number;
  status: string;
  tableName: string;
  capturedAt: string;
}

export function useWebSocket(appId: string | null) {
  const [liveQueries, setLiveQueries] = useState<QueryEventWsDTO[]>([]);

  useEffect(() => {
    if (!appId) {
      setLiveQueries([]);
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_BASE_URL),
      // We don't send Authorization header because STOMP connection is public 
      // (authenticated at the application layer if needed, or open for this demo)
      connectHeaders: {},
      debug: (_str) => {
        // console.log(str); // Uncomment for STOMP debugging
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log(`STOMP Connected: subscribing to /topic/apps/${appId}/queries`);
        client.subscribe(`/topic/apps/${appId}/queries`, (msg) => {
          try {
            const newQuery: QueryEventWsDTO = JSON.parse(msg.body);
            setLiveQueries((prev) => {
              // Prepend to top, keep only last 50
              const updated = [newQuery, ...prev];
              return updated.slice(0, 50);
            });
          } catch (e) {
            console.error('Failed to parse STOMP message', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [appId]);

  const clearFeed = () => setLiveQueries([]);

  return { liveQueries, clearFeed };
}
