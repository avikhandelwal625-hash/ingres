-- Add DELETE policy for messages table
CREATE POLICY "Anyone can delete messages"
ON public.messages
FOR DELETE
USING (true);

-- Add DELETE policy for conversations table
CREATE POLICY "Anyone can delete conversations"
ON public.conversations
FOR DELETE
USING (true);