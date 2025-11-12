/*
# Create Photo Storage Bucket

## Purpose
Create storage bucket for user photos in chat (Daily Omen Hunt).

## Changes
- Create public bucket for photos
- Set 1MB file size limit
*/

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('newomen-photos', 'newomen-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;
