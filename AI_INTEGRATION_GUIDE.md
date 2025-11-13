# AI Management System Integration Guide

## Overview

This guide explains how to integrate the AI Management System with your existing Edge Functions and application code.

## Quick Start

### 1. Configure Your First AI Function

Before using any AI function, you need to configure it:

1. **Add API Keys** (if not already done):
   - Go to Admin Dashboard → AI Function Config
   - Select a provider (e.g., OpenAI)
   - Click "Edit" and add your API key
   - Save

2. **Configure a Function**:
   - Select a function (e.g., "Chat")
   - Click "Configure"
   - Choose provider and model
   - Enter system prompt
   - Set temperature and max tokens
   - Save and Activate

### 2. Use in Edge Functions

Here's a complete example of using the AI Management System in an Edge Function:

```typescript
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get request data
    const { userInput, userId, functionKey = 'chat' } = await req.json();

    // Get active AI configuration
    const { data: config, error: configError } = await supabase
      .rpc('get_active_ai_config', { p_function_key: functionKey })
      .single();

    if (configError || !config) {
      throw new Error(`No active AI configuration found for ${functionKey}`);
    }

    // Get function ID for logging
    const { data: funcData } = await supabase
      .from('ai_mgmt_functions')
      .select('id')
      .eq('function_key', functionKey)
      .single();

    const startTime = Date.now();

    // Make AI API call
    const response = await fetch(`${config.provider_base_url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.provider_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model_id,
        messages: [
          { role: 'system', content: config.system_prompt },
          { role: 'user', content: userInput }
        ],
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        ...config.additional_config
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const responseTime = Date.now() - startTime;

    // Extract response text and token usage
    const outputText = aiResponse.choices[0]?.message?.content || '';
    const tokensUsed = aiResponse.usage?.total_tokens || 0;

    // Log the interaction
    await supabase.from('ai_mgmt_interaction_logs').insert({
      function_id: funcData?.id,
      user_id: userId,
      provider_id: config.provider_id,
      model_id: config.model_id,
      input_text: userInput,
      output_text: outputText,
      tokens_used: tokensUsed,
      response_time_ms: responseTime,
      status: 'success'
    });

    return new Response(JSON.stringify({
      success: true,
      response: outputText,
      tokensUsed,
      responseTime
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Log error
    console.error('AI function error:', error);

    // Log failed interaction
    if (funcData?.id) {
      await supabase.from('ai_mgmt_interaction_logs').insert({
        function_id: funcData.id,
        user_id: userId,
        input_text: userInput,
        status: 'error',
        error_message: error.message
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

### 3. Use in Frontend

Call the Edge Function from your React components:

```typescript
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

async function sendChatMessage(message: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        userInput: message,
        userId: user.id,
        functionKey: 'chat'
      }
    });

    if (error) {
      const errorMsg = await error?.context?.text();
      throw new Error(errorMsg || 'AI request failed');
    }

    return data.response;
  } catch (error) {
    toast.error(`Chat error: ${error.message}`);
    throw error;
  }
}
```

## Advanced Usage

### Custom Configuration per Request

You can pass additional configuration in the request:

```typescript
const { data } = await supabase.functions.invoke('ai-chat', {
  body: {
    userInput: message,
    userId: user.id,
    functionKey: 'chat',
    overrides: {
      temperature: 0.9,  // Override default temperature
      max_tokens: 500    // Override default max tokens
    }
  }
});
```

In your Edge Function:

```typescript
const { overrides = {} } = await req.json();

const response = await fetch(`${config.provider_base_url}/chat/completions`, {
  // ...
  body: JSON.stringify({
    model: config.model_id,
    messages: [...],
    temperature: overrides.temperature ?? config.temperature,
    max_tokens: overrides.max_tokens ?? config.max_tokens,
    ...config.additional_config
  })
});
```

### Streaming Responses

For streaming responses:

```typescript
const response = await fetch(`${config.provider_base_url}/chat/completions`, {
  // ...
  body: JSON.stringify({
    model: config.model_id,
    messages: [...],
    stream: true,
    temperature: config.temperature,
    max_tokens: config.max_tokens
  })
});

// Stream the response
const reader = response.body?.getReader();
const decoder = new TextDecoder();

return new Response(
  new ReadableStream({
    async start(controller) {
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        controller.enqueue(value);
      }
      controller.close();
    }
  }),
  {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  }
);
```

### Multiple Providers Fallback

Implement fallback to another provider if the primary fails:

```typescript
async function callAIWithFallback(functionKey: string, userInput: string) {
  // Try primary config
  const { data: primaryConfig } = await supabase
    .rpc('get_active_ai_config', { p_function_key: functionKey })
    .single();

  try {
    return await callAI(primaryConfig, userInput);
  } catch (error) {
    console.error('Primary provider failed, trying fallback:', error);

    // Get all configs for this function
    const { data: allConfigs } = await supabase
      .from('ai_mgmt_function_configs')
      .select('*, provider:ai_mgmt_providers(*), model:ai_mgmt_models(*)')
      .eq('function_id', functionId)
      .eq('is_active', false)  // Get inactive configs as fallback
      .limit(1);

    if (allConfigs && allConfigs.length > 0) {
      return await callAI(allConfigs[0], userInput);
    }

    throw error;
  }
}
```

### Supervisor Analysis

Trigger supervisor analysis for specific interactions:

```typescript
// After logging an interaction
const { data: interaction } = await supabase
  .from('ai_mgmt_interaction_logs')
  .insert({
    function_id: funcData.id,
    user_id: userId,
    input_text: userInput,
    output_text: outputText,
    tokens_used: tokensUsed,
    response_time_ms: responseTime,
    status: 'success'
  })
  .select()
  .single();

// Trigger supervisor analysis (in background)
if (shouldAnalyze(interaction)) {
  supabase.functions.invoke('supervisor-analyze', {
    body: { interactionId: interaction.id }
  }).catch(console.error);  // Don't wait for result
}
```

## Provider-Specific Examples

### OpenAI

```typescript
const response = await fetch(`${config.provider_base_url}/chat/completions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${config.provider_api_key}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: config.model_id,
    messages: [
      { role: 'system', content: config.system_prompt },
      { role: 'user', content: userInput }
    ],
    temperature: config.temperature,
    max_tokens: config.max_tokens
  })
});
```

### Google AI (Gemini)

```typescript
const response = await fetch(
  `${config.provider_base_url}/models/${config.model_id}:generateContent?key=${config.provider_api_key}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: userInput }]
      }],
      systemInstruction: {
        parts: [{ text: config.system_prompt }]
      },
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.max_tokens
      }
    })
  }
);
```

### Anthropic (Claude)

```typescript
const response = await fetch(`${config.provider_base_url}/messages`, {
  method: 'POST',
  headers: {
    'x-api-key': config.provider_api_key,
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: config.model_id,
    system: config.system_prompt,
    messages: [
      { role: 'user', content: userInput }
    ],
    temperature: config.temperature,
    max_tokens: config.max_tokens
  })
});
```

## Best Practices

### 1. Always Log Interactions
Every AI call should be logged for monitoring and analysis:

```typescript
await supabase.from('ai_mgmt_interaction_logs').insert({
  function_id: funcData.id,
  user_id: userId,
  provider_id: config.provider_id,
  model_id: config.model_id,
  input_text: userInput,
  output_text: outputText,
  tokens_used: tokensUsed,
  response_time_ms: responseTime,
  status: 'success',
  metadata: { /* additional context */ }
});
```

### 2. Handle Errors Gracefully
Always catch and log errors:

```typescript
try {
  // AI call
} catch (error) {
  await supabase.from('ai_mgmt_interaction_logs').insert({
    function_id: funcData.id,
    user_id: userId,
    input_text: userInput,
    status: 'error',
    error_message: error.message
  });
  throw error;
}
```

### 3. Use Timeouts
Implement timeouts to prevent hanging requests:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);  // 30s timeout

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ...
  });
} finally {
  clearTimeout(timeoutId);
}
```

### 4. Cache Configurations
Cache active configurations to reduce database queries:

```typescript
let configCache: Map<string, any> = new Map();
const CACHE_TTL = 5 * 60 * 1000;  // 5 minutes

async function getConfig(functionKey: string) {
  const cached = configCache.get(functionKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.config;
  }

  const { data: config } = await supabase
    .rpc('get_active_ai_config', { p_function_key: functionKey })
    .single();

  configCache.set(functionKey, {
    config,
    timestamp: Date.now()
  });

  return config;
}
```

### 5. Monitor Token Usage
Track token usage to manage costs:

```typescript
// After each interaction
const totalTokens = aiResponse.usage?.total_tokens || 0;

// Update usage stats
await supabase.rpc('increment_token_usage', {
  p_function_id: funcData.id,
  p_tokens: totalTokens
});
```

## Testing

### Test Configuration

```typescript
// Test if a configuration works
async function testConfig(configId: string) {
  const { data: config } = await supabase
    .from('ai_mgmt_function_configs')
    .select('*, provider:ai_mgmt_providers(*), model:ai_mgmt_models(*)')
    .eq('id', configId)
    .single();

  try {
    const response = await fetch(`${config.provider.base_url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.provider.api_key_encrypted}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model.model_id,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Config test failed:', error);
    return false;
  }
}
```

## Migration Guide

### Migrating Existing Edge Functions

If you have existing Edge Functions that call AI APIs directly, here's how to migrate:

**Before:**
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: userInput }
    ]
  })
});
```

**After:**
```typescript
// Get config from database
const { data: config } = await supabase
  .rpc('get_active_ai_config', { p_function_key: 'chat' })
  .single();

// Use config
const response = await fetch(`${config.provider_base_url}/chat/completions`, {
  headers: {
    'Authorization': `Bearer ${config.provider_api_key}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: config.model_id,
    messages: [
      { role: 'system', content: config.system_prompt },
      { role: 'user', content: userInput }
    ],
    temperature: config.temperature,
    max_tokens: config.max_tokens
  })
});

// Log interaction
await supabase.from('ai_mgmt_interaction_logs').insert({
  function_id: funcData.id,
  user_id: userId,
  input_text: userInput,
  output_text: aiResponse.choices[0].message.content,
  tokens_used: aiResponse.usage.total_tokens,
  status: 'success'
});
```

## Troubleshooting

### Common Issues

**Issue: "No active AI configuration found"**
```typescript
// Check if config exists
const { data: configs } = await supabase
  .from('ai_mgmt_function_configs')
  .select('*')
  .eq('function_id', functionId);

console.log('Available configs:', configs);
```

**Issue: "API key not working"**
```typescript
// Test API key
const testResponse = await fetch(`${baseUrl}/models`, {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
console.log('API key test:', testResponse.ok);
```

**Issue: "Rate limit exceeded"**
```typescript
// Implement exponential backoff
async function callWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('rate limit') && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
}
```

## Next Steps

1. **Configure your first AI function** in the admin panel
2. **Update existing Edge Functions** to use the AI Management System
3. **Monitor interactions** in the AI Interaction Logs page
4. **Review supervisor reports** to improve AI quality
5. **Optimize configurations** based on usage patterns

For more information, see [AI_MANAGEMENT_SYSTEM.md](./AI_MANAGEMENT_SYSTEM.md).
