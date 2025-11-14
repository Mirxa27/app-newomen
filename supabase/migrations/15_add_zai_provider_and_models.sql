-- Add Z.ai provider if not exists
INSERT INTO ai_mgmt_providers (name, api_base_url, requires_api_key, is_active)
VALUES ('Z.ai', 'https://api.z.ai/v1', true, true)
ON CONFLICT (name) DO NOTHING;

-- Seed Z.ai Models
INSERT INTO ai_mgmt_models (provider_id, model_id, display_name, capabilities, context_window, is_active)
SELECT
  p.id,
  model_data.model_id,
  model_data.display_name,
  model_data.capabilities,
  model_data.context_window,
  true
FROM ai_mgmt_providers p
CROSS JOIN (
  VALUES
    ('Z.ai', 'GLM-4.6', 'GLM-4.6', ARRAY['chat', 'completion', 'coding'], 128000),
    ('Z.ai', 'GLM-4.5-Air', 'GLM-4.5-Air', ARRAY['chat', 'completion', 'coding'], 128000),
    ('Z.ai', 'GLM-4.5', 'GLM-4.5', ARRAY['chat', 'completion', 'coding'], 128000)
) AS model_data(provider_name, model_id, display_name, capabilities, context_window)
WHERE p.name = model_data.provider_name
ON CONFLICT (provider_id, model_id) DO NOTHING;

