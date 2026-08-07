-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'match', 'message', 'status_change'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  related_item_id UUID REFERENCES public.items(id) ON DELETE CASCADE, -- for match notifications
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- System can insert notifications (service role)
CREATE POLICY "Service role can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Create item_matches table
CREATE TABLE public.item_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lost_item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  found_item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  match_score DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
  match_reason TEXT, -- AI explanation
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'dismissed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lost_item_id, found_item_id)
);

-- Enable RLS
ALTER TABLE public.item_matches ENABLE ROW LEVEL SECURITY;

-- Users can view matches for their own items
CREATE POLICY "Users can view matches for their items" 
ON public.item_matches 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE (items.id = lost_item_id OR items.id = found_item_id) 
    AND items.user_id = auth.uid()
  )
);

-- Users can update matches for their items (dismiss/confirm)
CREATE POLICY "Users can update matches for their items" 
ON public.item_matches 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE (items.id = lost_item_id OR items.id = found_item_id) 
    AND items.user_id = auth.uid()
  )
);

-- Service role can insert matches
CREATE POLICY "Service role can insert matches" 
ON public.item_matches 
FOR INSERT 
WITH CHECK (true);

-- Add indexes
CREATE INDEX idx_item_matches_lost_item ON public.item_matches(lost_item_id);
CREATE INDEX idx_item_matches_found_item ON public.item_matches(found_item_id);
CREATE INDEX idx_item_matches_score ON public.item_matches(match_score DESC);

-- Add email_notifications preference to profiles
ALTER TABLE public.profiles 
ADD COLUMN email_notifications BOOLEAN NOT NULL DEFAULT true;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;