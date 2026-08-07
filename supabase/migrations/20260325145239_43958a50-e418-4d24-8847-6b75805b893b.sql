
CREATE TABLE public.claim_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  claimer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view claim requests for items they own or submitted
CREATE POLICY "Users can view claim requests for their items or their own requests"
ON public.claim_requests FOR SELECT TO authenticated
USING (
  claimer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.items WHERE items.id = claim_requests.item_id AND items.user_id = auth.uid())
);

-- Users can create claim requests
CREATE POLICY "Users can create claim requests"
ON public.claim_requests FOR INSERT TO authenticated
WITH CHECK (claimer_id = auth.uid());

-- Item owners can update claim requests (approve/reject)
CREATE POLICY "Item owners can update claim requests"
ON public.claim_requests FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.items WHERE items.id = claim_requests.item_id AND items.user_id = auth.uid())
);

-- Claimers can delete their own pending requests
CREATE POLICY "Users can delete their pending claim requests"
ON public.claim_requests FOR DELETE TO authenticated
USING (claimer_id = auth.uid() AND status = 'pending');
