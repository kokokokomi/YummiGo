package com.sy.websocket;

import jakarta.websocket.OnClose;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 商家端 Jakarta WebSocket（管理画面が接続）。<br/>
 * Stripe 支払い成功などのイベントは {@link #broadcast(String)} で全接続に JSON テキストを送る。
 */
@Slf4j
@Component
@ServerEndpoint("/ws/{sid}")
public class WebSocketServer {

    private static final Map<String, Session> SESSION_MAP = new ConcurrentHashMap<>();

    @OnOpen
    public void onOpen(Session session, @PathParam("sid") String sid) {
        log.info("WebSocket 客户端连接: sid={}", sid);
        SESSION_MAP.put(sid, session);
    }

    @OnMessage
    public void onMessage(String message, @PathParam("sid") String sid) {
        log.debug("WebSocket 收到消息 sid={} message={}", sid, message);
    }

    @OnClose
    public void onClose(@PathParam("sid") String sid) {
        log.info("WebSocket 连接断开: sid={}", sid);
        SESSION_MAP.remove(sid);
    }

    /**
     * 向当前所有已连接的商家端会话广播一条文本（一般为 JSON）。<br/>
     * 与 Spring Bean 生命周期独立，供 Service 在业务事件（如 Stripe 回调）中直接调用。
     */
    public static void broadcast(String text) {
        List<Session> snapshot = new ArrayList<>(SESSION_MAP.values());
        for (Session session : snapshot) {
            if (session == null || !session.isOpen()) {
                continue;
            }
            try {
                synchronized (session) {
                    session.getBasicRemote().sendText(text);
                }
            } catch (Exception e) {
                log.warn("WebSocket 发送失败: {}", e.getMessage());
            }
        }
        log.debug("WebSocket 广播完成，当前在线数={}", SESSION_MAP.size());
    }
}
