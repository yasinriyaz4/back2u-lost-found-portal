-- Enable realtime for messages table for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;