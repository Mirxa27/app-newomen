/**
 * Shared utility for getting API keys from database or environment variables
 * This allows admins to configure API keys through the admin panel
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Cache for API keys to avoid repeated database queries
const apiKeyCache = new Map<string, { key: string | null; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds cache (reduced for faster updates after admin changes)

/**
 * Get API key for a provider from database or environment variable
 * @param providerName - Name of the provider (e.g., 'OpenAI', 'Anthropic', 'Google AI')
 * @param envVarName - Optional environment variable name as fallback (e.g., 'OPENAI_API_KEY')
 * @returns API key or null if not found
 */
export async function getApiKey(
  providerName: string,
  envVarName?: string
): Promise<string | null> {
  try {
    // Check cache first
    const cached = apiKeyCache.get(providerName);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.key;
    }

    // First try environment variable (for backward compatibility)
    if (envVarName) {
      const envKey = Deno.env.get(envVarName);
      if (envKey) {
        apiKeyCache.set(providerName, { key: envKey, timestamp: Date.now() });
        return envKey;
      }
    }

    // Then try to get from database (case-insensitive search)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // First try exact match
    let { data, error } = await supabase
      .from('api_providers')
      .select('api_key, is_active, name')
      .eq('name', providerName)
      .maybeSingle();

    // If not found, try case-insensitive search
    if (!data && !error) {
      const { data: allProviders, error: listError } = await supabase
        .from('api_providers')
        .select('api_key, is_active, name');
      
      if (!listError && allProviders) {
        const matched = allProviders.find(p => 
          p.name.toLowerCase() === providerName.toLowerCase()
        );
        if (matched) {
          data = matched;
        }
      }
    }

    if (error) {
      console.error(`Error fetching ${providerName} API key from database:`, error);
      // Cache null result to avoid repeated failed queries
      apiKeyCache.set(providerName, { key: null, timestamp: Date.now() });
      return null;
    }

    // Check if provider exists and is active
    if (!data) {
      console.log(`Provider "${providerName}" not found in database. Available providers: ${(await supabase.from('api_providers').select('name')).data?.map(p => p.name).join(', ') || 'none'}`);
      // Cache null result
      apiKeyCache.set(providerName, { key: null, timestamp: Date.now() });
      return null;
    }

    if (!data.is_active) {
      console.log(`Provider "${data.name}" is not active. Please activate it in Admin Panel → API Providers.`);
      apiKeyCache.set(providerName, { key: null, timestamp: Date.now() });
      return null;
    }

    // Check if API key is actually set (not empty string)
    const apiKey = data.api_key && typeof data.api_key === 'string' && data.api_key.trim() !== '' ? data.api_key.trim() : null;
    
    if (!apiKey) {
      console.log(`Provider "${data.name}" has no API key configured. Please add an API key in Admin Panel → API Providers.`);
    } else {
      console.log(`Successfully retrieved API key for "${data.name}" (length: ${apiKey.length})`);
    }
    
    apiKeyCache.set(providerName, { key: apiKey, timestamp: Date.now() });
    return apiKey;
  } catch (error) {
    console.error(`Error in getApiKey for ${providerName}:`, error);
    return null;
  }
}

/**
 * Clear the API key cache (useful after updating keys in admin panel)
 */
export function clearApiKeyCache(providerName?: string): void {
  if (providerName) {
    apiKeyCache.delete(providerName);
  } else {
    apiKeyCache.clear();
  }
}

/**
 * Get multiple API keys at once
 */
export async function getApiKeys(
  providers: Array<{ name: string; envVar?: string }>
): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {};
  
  await Promise.all(
    providers.map(async (provider) => {
      results[provider.name] = await getApiKey(provider.name, provider.envVar);
    })
  );
  
  return results;
}

