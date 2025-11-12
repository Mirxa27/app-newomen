# API Management System Guide

## Overview

The NewMe platform now includes a comprehensive API management system that allows administrators to configure and manage third-party API integrations, AI models, voices, behaviors, and prompt templates.

## Features

### 1. API Providers Management
**Location**: `/admin/api-providers`

Manage third-party API provider configurations:
- **Add/Edit Providers**: Configure API credentials and settings
- **Test Connection**: Verify API connectivity before use
- **Fetch Models**: Automatically retrieve available models from providers
- **Fetch Voices**: Automatically retrieve available voices for TTS providers
- **Provider Types**: AI Chat, AI Image, Text-to-Speech, Speech-to-Text, Other

**Supported Providers** (pre-configured):
- OpenAI
- Anthropic
- Google AI

### 2. AI Models Management
**Location**: `/admin/ai-models`

Manage available AI models:
- **Model Configuration**: Set model parameters (temperature, max_tokens, etc.)
- **Model Types**: Chat, Completion, Embedding, Image, Audio
- **Default Models**: Set default models for each type
- **Capabilities**: Define model capabilities (streaming, functions, etc.)
- **Provider Association**: Link models to their providers

### 3. AI Behaviors Management
**Location**: `/admin/ai-behaviors`

Configure AI personalities and behaviors:
- **System Prompts**: Define AI personality and behavior
- **Personality Traits**: Configure traits (empathy, curiosity, etc.) on 0-1 scale
- **Response Style**: Set tone, formality, and verbosity
- **Model Assignment**: Assign preferred models to behaviors
- **Default Behavior**: Set the default AI personality

**Pre-configured Behaviors**:
- **NewMe Companion**: Empathetic AI companion for self-discovery
- **Professional Coach**: Goal-oriented professional coaching
- **Mindfulness Guide**: Calm and centered mindfulness teacher

### 4. Prompt Templates Management
**Location**: `/admin/prompt-templates`

Manage reusable prompt templates:
- **Template Variables**: Use `{{variable_name}}` syntax
- **Categories**: Organize templates by category
- **Version Control**: Track template versions
- **Usage Statistics**: Monitor template usage
- **Variable Definitions**: Define variable types and descriptions

**Pre-configured Templates**:
- Daily Reflection
- Goal Setting
- Emotional Check-in

## Database Schema

### Tables Created

1. **api_providers**
   - Stores API provider configurations and credentials
   - API keys are encrypted
   - Tracks connection test status

2. **ai_models**
   - Stores available AI models from providers
   - Includes model parameters and capabilities
   - Supports default model selection

3. **ai_voices**
   - Stores available voices for TTS providers
   - Includes language, gender, and accent information
   - Sample audio URLs for preview

4. **ai_behaviors**
   - Stores AI personality configurations
   - System prompts and personality traits
   - Response style settings

5. **prompt_templates**
   - Stores reusable prompt templates
   - Variable definitions
   - Usage tracking

## API Methods

### API Providers
```typescript
db.apiProviders.list()                    // List all providers (safe view)
db.apiProviders.getById(id)               // Get provider with API key
db.apiProviders.create(provider)          // Create new provider
db.apiProviders.update(id, updates)       // Update provider
db.apiProviders.delete(id)                // Delete provider
db.apiProviders.testConnection(id)        // Test API connection
db.apiProviders.fetchModels(id)           // Fetch models from provider
db.apiProviders.fetchVoices(id)           // Fetch voices from provider
```

### AI Models
```typescript
db.aiModels.list()                        // List all models
db.aiModels.listWithProvider()            // List models with provider info
db.aiModels.getById(id)                   // Get model by ID
db.aiModels.create(model)                 // Create new model
db.aiModels.update(id, updates)           // Update model
db.aiModels.delete(id)                    // Delete model
db.aiModels.setDefault(id, modelType)     // Set as default for type
```

### AI Voices
```typescript
db.aiVoices.list()                        // List all voices
db.aiVoices.listWithProvider()            // List voices with provider info
db.aiVoices.getById(id)                   // Get voice by ID
db.aiVoices.create(voice)                 // Create new voice
db.aiVoices.update(id, updates)           // Update voice
db.aiVoices.delete(id)                    // Delete voice
db.aiVoices.setDefault(id)                // Set as default voice
```

### AI Behaviors
```typescript
db.aiBehaviors.list()                     // List all behaviors
db.aiBehaviors.listWithModel()            // List behaviors with model info
db.aiBehaviors.getById(id)                // Get behavior by ID
db.aiBehaviors.create(behavior)           // Create new behavior
db.aiBehaviors.update(id, updates)        // Update behavior
db.aiBehaviors.delete(id)                 // Delete behavior
db.aiBehaviors.setDefault(id)             // Set as default behavior
```

### Prompt Templates
```typescript
db.promptTemplates.list()                 // List all templates
db.promptTemplates.listByCategory(cat)    // List templates by category
db.promptTemplates.getById(id)            // Get template by ID
db.promptTemplates.create(template)       // Create new template
db.promptTemplates.update(id, updates)    // Update template
db.promptTemplates.delete(id)             // Delete template
db.promptTemplates.incrementUsage(id)     // Increment usage count
```

## Security

### Row Level Security (RLS)
- All tables have RLS enabled
- Admins have full access to all data
- Regular users can only view active items
- API keys are never exposed to non-admin users
- Safe views (e.g., `api_providers_safe`) hide sensitive data

### API Key Storage
- API keys are stored encrypted in the database
- Only admins can view/edit API keys
- Regular users see only a "Configured" badge

## Usage Workflow

### Setting Up a New AI Provider

1. **Add Provider**
   - Navigate to `/admin/api-providers`
   - Click "Add Provider"
   - Enter provider name, type, API URL, and API key
   - Save the provider

2. **Test Connection**
   - Click the refresh icon next to the provider
   - System will test the API connection
   - Status will update to "Connected" or "Failed"

3. **Fetch Models/Voices**
   - Click the download icon to fetch available models/voices
   - System will automatically create model/voice entries
   - Models/voices will appear in their respective management pages

4. **Configure Behavior**
   - Navigate to `/admin/ai-behaviors`
   - Create or edit a behavior
   - Assign a model to the behavior
   - Set personality traits and system prompt

5. **Create Prompt Templates**
   - Navigate to `/admin/prompt-templates`
   - Create templates with variables
   - Use templates in conversations

## Edge Functions

The system uses Supabase Edge Functions for secure API operations:

### test-api-connection
Tests connectivity to an API provider.

**Input**:
```json
{
  "provider_id": "uuid"
}
```

**Output**:
```json
{
  "success": true,
  "message": "Connection successful"
}
```

### fetch-provider-models
Fetches available models from a provider.

**Input**:
```json
{
  "provider_id": "uuid"
}
```

**Output**:
```json
{
  "models": [
    {
      "model_id": "gpt-4",
      "model_name": "GPT-4",
      "model_type": "chat",
      ...
    }
  ]
}
```

### fetch-provider-voices
Fetches available voices from a TTS provider.

**Input**:
```json
{
  "provider_id": "uuid"
}
```

**Output**:
```json
{
  "voices": [
    {
      "voice_id": "en-US-Neural2-A",
      "voice_name": "English (US) - Neural2 A",
      "language": "en-US",
      ...
    }
  ]
}
```

## Best Practices

1. **Test Connections First**: Always test API connections before using them in production
2. **Set Default Models**: Set default models for each type to ensure fallback behavior
3. **Use Behaviors**: Create different behaviors for different use cases
4. **Template Variables**: Use descriptive variable names in templates
5. **Monitor Usage**: Check template usage statistics to optimize prompts
6. **Secure API Keys**: Never expose API keys in client-side code
7. **Regular Updates**: Periodically fetch new models/voices from providers

## Troubleshooting

### Connection Test Fails
- Verify API key is correct
- Check API URL is accessible
- Ensure provider service is operational
- Check network connectivity

### Models Not Fetching
- Verify provider connection is successful
- Check provider type is correct (ai_chat for models)
- Ensure API key has necessary permissions
- Check provider API documentation for changes

### Behavior Not Working
- Verify behavior is set to active
- Check model assignment is valid
- Review system prompt for errors
- Test with default behavior first

## Future Enhancements

Potential improvements for the API management system:

1. **Model Performance Tracking**: Monitor model response times and costs
2. **A/B Testing**: Test different behaviors and prompts
3. **Cost Management**: Track API usage and costs per provider
4. **Automatic Failover**: Switch to backup providers on failure
5. **Model Comparison**: Compare outputs from different models
6. **Voice Preview**: Play voice samples before selection
7. **Prompt Analytics**: Analyze prompt effectiveness
8. **Rate Limiting**: Implement rate limits per provider

## Migration

To set up the API management system:

1. Run migration: `supabase/migrations/10_add_api_management.sql`
2. Configure at least one API provider
3. Test the connection
4. Fetch models/voices
5. Configure behaviors
6. Create prompt templates

## Support

For issues or questions about the API management system:
- Check the troubleshooting section
- Review provider documentation
- Contact the development team

---

**Last Updated**: 2025  
**Version**: 1.0.0
