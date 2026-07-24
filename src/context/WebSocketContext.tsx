import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { Client, StompSubscription } from "@stomp/stompjs";
import { envConfig } from "../config/env";
import { STORAGE_KEYS } from "../constants";
import { useAuthStore } from "../store/useAuthStore";
import { auditLogger } from "../utils/auditLogger";

interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (destination: string, callback: (message: any) => void) => StompSubscription | null;
  sendMessage: (destination: string, body: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, StompSubscription>>(new Map());
  const accessToken = useAuthStore((state) => state.accessToken);
  const accessTokenRef = useRef<string | null>(accessToken);

  useEffect(() => {
    accessTokenRef.current = accessToken;
    if (stompClientRef.current && stompClientRef.current.connectHeaders) {
      stompClientRef.current.connectHeaders["Authorization"] = `Bearer ${accessToken || ""}`;
    }
  }, [accessToken]);

  const hasToken = !!accessToken;

  useEffect(() => {
    // Standard connection lifecycle matching Spring Boot Actuator/WebSockets configuration
    const stompClient = new Client({
      brokerURL: envConfig.wsBaseUrl,
      connectHeaders: {
        Authorization: `Bearer ${accessTokenRef.current || ""}`,
        "X-Tenant-Id": localStorage.getItem(STORAGE_KEYS.TENANT_ID) || "",
      },
      debug: (str) => {
        if (envConfig.isDevelopment) {
          console.debug("[STOMP Debug]:", str);
        }
      },
      reconnectDelay: 5000, // Reconnect retry interval
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = (frame) => {
      if (envConfig.isDevelopment) {
        console.log("[STOMP Connected]:", frame);
      }
      setIsConnected(true);
    };

    stompClient.onWebSocketClose = () => {
      if (envConfig.isDevelopment) {
        console.warn("[STOMP Closed]");
      }
      setIsConnected(false);
    };

    stompClient.onStompError = (frame) => {
      auditLogger.log("UNAUTHORIZED_ACCESS", { details: `STOMP Protocol Error: ${frame.headers["message"]}` });
      console.error("[STOMP Protocol Error]:", frame.headers["message"]);
      console.error("[STOMP Details]:", frame.body);
    };

    stompClientRef.current = stompClient;
    stompClient.activate();

    return () => {
      subscriptionsRef.current.forEach((sub, subId) => {
        try {
          sub.unsubscribe();
        } catch (err) {
          console.warn(`Failed to unsubscribe ${subId} during teardown:`, err);
        }
      });
      subscriptionsRef.current.clear();
      stompClient.deactivate();
    };
  }, [hasToken]);

  const subscribe = (destination: string, callback: (message: any) => void): StompSubscription | null => {
    if (!stompClientRef.current || !isConnected) {
      console.warn("STOMP Client is not active or connected. Unable to subscribe to destination:", destination);
      return null;
    }

    const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const subId = `${destination}-${uniqueId}`;
    try {
      const subscription = stompClientRef.current.subscribe(destination, (message) => {
        try {
          const payload = JSON.parse(message.body);
          callback(payload);
        } catch (err) {
          console.warn("WebSocket message payload is not JSON format. Returning raw text.", err);
          callback(message.body);
        }
      });

      const originalUnsubscribe = subscription.unsubscribe.bind(subscription);
      subscription.unsubscribe = () => {
        try {
          originalUnsubscribe();
        } catch (err) {
          console.warn("Error calling original unsubscribe:", err);
        }
        subscriptionsRef.current.delete(subId);
        if (envConfig.isDevelopment) {
          console.log(`[STOMP Unsubscribed]: Tracked subscription removed for ${destination}`);
        }
      };

      subscriptionsRef.current.set(subId, subscription);
      if (envConfig.isDevelopment) {
        console.log(`[STOMP Subscribed]: Tracked subscription added for ${destination}`);
      }

      return subscription;
    } catch (error) {
      console.error("Failed to subscribe to destination:", destination, error);
      return null;
    }
  };

  const sendMessage = (destination: string, body: any) => {
    if (!stompClientRef.current || !isConnected) {
      console.error("STOMP client not connected. Drop transaction to destination:", destination);
      return;
    }

    stompClientRef.current.publish({
      destination,
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, subscribe, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

export const useWebSocketSubscription = (
  destination: string | null | undefined,
  callback: (message: any) => void
) => {
  const { isConnected, subscribe } = useWebSocket();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isConnected || !destination) return;

    let active = true;
    let subscription: StompSubscription | null = null;

    if (envConfig.isDevelopment) {
      console.log(`[useWebSocketSubscription] Initiating subscription to \${destination}`);
    }

    subscription = subscribe(destination, (msg) => {
      if (active) {
        callbackRef.current(msg);
      }
    });

    return () => {
      active = false;
      if (subscription) {
        if (envConfig.isDevelopment) {
          console.log(`[useWebSocketSubscription] Cleaning up subscription to \${destination}`);
        }
        subscription.unsubscribe();
      }
    };
  }, [isConnected, destination, subscribe]);
};
