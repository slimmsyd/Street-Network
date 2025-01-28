'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RightDashboardProps } from '@/types/user';

export function RightDashboard({ userName, userAvatar, userRole }: RightDashboardProps) {
  const { data: session } = useSession();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{id: string; sender: string; text: string; isAI?: boolean}>>([
    {
      id: '1',
      sender: 'Street Orcale',
      text: "Currently down for beta",
      isAI: true
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`/api/users/email/${encodeURIComponent(session?.user?.email || '')}`);
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchCurrentUser();
    }
  }, [session]);

  const getInitials = (name: string | undefined) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      sender: userName || 'You',
      text: newMessage
    };
    setMessages(prev => [...prev, userMessage]);

    // Add AI response
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'Street Network AI',
        text: "Currently down for beta",
        isAI: true
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);

    setNewMessage('');
  };

  return (
    <div className="h-full border-l border-zinc-200 p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Avatar>
        <AvatarImage src={userAvatar || "https://api.dicebear.com/7.x/emoji/svg"} />
        <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
            {userName ? getInitials(userName) : 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium !text-black">Hello, {userName?.split(' ')[0]}</div>
          <div className="text-sm !text-black">{userRole || 'Member'}</div>
        </div>
      </div>

      {/* Chat Box */}
      <Card className="flex-1 min-h-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-400/10 backdrop-blur-sm flex flex-col">
        <CardHeader className="py-2 px-3 flex-shrink-0">
          <CardTitle className="text-xs font-medium text-zinc-300 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Street Network Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 rounded-md bg-black/20 border border-purple-400/10 backdrop-blur-sm p-2 overflow-y-auto">
            <div className="space-y-2">
              {messages.map((message) => (
                <div key={message.id} className={`flex items-start gap-2 ${message.isAI ? 'opacity-80' : ''}`}>
                  <Avatar className="h-6 w-6 border border-purple-400/20">
                    <AvatarFallback className="text-[10px] bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                      {message.isAI ? 'AI' : getInitials(message.sender)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-[10px] text-zinc-400 mb-0.5">{message.sender}</p>
                    <div className="inline-block rounded-lg bg-white/5 px-2 py-1 text-xs text-zinc-300">
                      {message.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 flex-shrink-0 mt-3">
            <Input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 h-8 bg-black/20 border-purple-400/20 text-zinc-300 text-sm placeholder:text-zinc-600"
              placeholder="Ask me anything about your community..."
            />
            <Button 
              size="sm" 
              onClick={handleSendMessage}
              className="h-8 px-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 shadow-none focus:shadow-none active:shadow-none"
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}