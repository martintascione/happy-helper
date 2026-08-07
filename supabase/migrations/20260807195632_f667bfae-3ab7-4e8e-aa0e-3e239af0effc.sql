-- Ensure RLS on storage bucket is set for receipts
CREATE POLICY "SuperAdmins can see all receipts" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Renters can upload their receipts" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-receipts');

CREATE POLICY "Renters can see their own receipts" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'payment-receipts' AND (auth.uid()::text = (storage.foldername(name))[1]));
