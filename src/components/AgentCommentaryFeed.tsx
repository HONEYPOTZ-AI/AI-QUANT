import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, TrendingUp, AlertTriangle, Info } from 'lucide-react';

interface CommentaryMessage {
  id: string;
  type: 'entry' | 'exit' | 'analysis' | 'risk';
  message: string;
  timestamp: string;
}

interface AgentCommentaryFeedProps {
  messages: CommentaryMessage[];
}

export default function AgentCommentaryFeed({ messages }: AgentCommentaryFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'entry':
        return {
          bg: 'bg-green-900/20',
          border: 'border-green-500/30',
          text: 'text-green-400',
          icon: <TrendingUp className="w-4 h-4" />,
        };
      case 'exit':
      case 'risk':
        return {
          bg: 'bg-red-900/20',
          border: 'border-red-500/30',
          text: 'text-red-400',
          icon: <AlertTriangle className="w-4 h-4" />,
        };
      case 'analysis':
        return {
          bg: 'bg-blue-900/20',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          icon: <Info className="w-4 h-4" />,
        };
      default:
        return {
          bg: 'bg-slate-800/50',
          border: 'border-slate-700',
          text: 'text-slate-400',
          icon: <MessageSquare className="w-4 h-4" />,
        };
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          Agent Commentary Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div ref={scrollRef} className="space-y-3 pr-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Waiting for strategy activity...</p>
              </div>
            ) : (
              messages.map((msg) => {
                const style = getMessageStyle(msg.type);
                return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg border ${style.bg} ${style.border} animate-in slide-in-from-bottom duration-300`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={style.text}>{style.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm leading-relaxed">
                          {msg.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={`text-xs ${style.text} border-current`}>
                            {msg.type.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
