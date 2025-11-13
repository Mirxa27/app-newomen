# AI Management System Documentation

## Overview

The AI Management System is a comprehensive solution for managing multiple AI providers, models, and functions within the NewMe application. It provides centralized configuration, monitoring, and supervisory capabilities for all AI interactions.

## Key Features

### 1. Multi-Provider Support
- **OpenAI**: GPT-4o, GPT-4o Mini
- **Google AI**: Gemini 2.0 Flash
- **Anthropic**: Claude 3.5 Sonnet
- Support for any OpenAI-compatible API endpoint

### 2. Function-Level Configuration
Each AI function in the application can be independently configured with:
- Specific provider and model
- Custom system prompts
- Temperature settings (0-2)
- Maximum token limits
- Additional configuration parameters

### 3. Interaction Logging
All AI interactions are logged with:
- Input and output text
- Token usage
- Response time
- Success/error status
- User and function context

### 4. Supervisory AI Monitoring
A supervisor AI analyzes interactions for:
- Error detection
- Quality assessment
- Improvement suggestions
- Severity classification (low, medium, high, critical)

## Database Schema

### Tables

#### ai_mgmt_providers
Stores AI provider configurations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Provider name (e.g., "OpenAI") |
| base_url | text | API base URL |
| api_key_encrypted | text | Encrypted API key |
| is_active | boolean | Whether provider is enabled |
| config | jsonb | Additional configuration |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

#### ai_mgmt_models
Stores AI model configurations for each provider.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| provider_id | uuid | References ai_mgmt_providers |
| model_id | text | Model identifier (e.g., "gpt-4o") |
| display_name | text | Human-readable name |
| capabilities | text[] | Model capabilities array |
| context_window | integer | Maximum context size |
| is_active | boolean | Whether model is enabled |
| config | jsonb | Model-specific configuration |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

#### ai_mgmt_functions
Defines AI functions used in the application.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| function_key | text | Unique identifier (e.g., "chat") |
| display_name | text | Human-readable name |
| description | text | Function description |
| created_at | timestamptz | Creation timestamp |

**Default Functions:**
- `chat`: General conversational AI
- `assessment_insights`: Generate insights from assessments
- `voice_chat`: Voice-based conversational AI
- `memory_extraction`: Extract and structure memories
- `supervisor`: Monitor and analyze AI interactions

#### ai_mgmt_function_configs
Maps functions to specific provider/model configurations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| function_id | uuid | References ai_mgmt_functions |
| provider_id | uuid | References ai_mgmt_providers |
| model_id | uuid | References ai_mgmt_models |
| system_prompt | text | System prompt for this function |
| temperature | numeric | Temperature setting (0-2) |
| max_tokens | integer | Maximum response tokens |
| additional_config | jsonb | Additional parameters |
| is_active | boolean | Whether this config is active |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

#### ai_mgmt_interaction_logs
Logs all AI interactions for monitoring and analysis.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| function_id | uuid | References ai_mgmt_functions |
| user_id | uuid | References profiles |
| provider_id | uuid | References ai_mgmt_providers |
| model_id | uuid | References ai_mgmt_models |
| input_text | text | User input |
| output_text | text | AI response |
| tokens_used | integer | Total tokens consumed |
| response_time_ms | integer | Response time in milliseconds |
| status | text | success, error, timeout |
| error_message | text | Error details if failed |
| metadata | jsonb | Additional context |
| created_at | timestamptz | Creation timestamp |

#### ai_mgmt_supervisor_reports
Stores supervisor AI analysis reports.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| analyzed_interaction_id | uuid | References ai_mgmt_interaction_logs |
| function_id | uuid | References ai_mgmt_functions |
| analysis_type | text | error_detection, quality_check, improvement_suggestion |
| severity | text | low, medium, high, critical |
| findings | text | Detailed analysis findings |
| suggestions | text | Improvement suggestions |
| metrics | jsonb | Quality metrics and scores |
| reviewed_by | uuid | Admin who reviewed |
| status | text | pending, reviewed, resolved, dismissed |
| created_at | timestamptz | Creation timestamp |
| reviewed_at | timestamptz | Review timestamp |

## API Functions

All API functions are available through `db.aiMgmt*` namespace:

### Providers
```typescript
db.aiMgmtProviders.list()
db.aiMgmtProviders.getById(id)
db.aiMgmtProviders.create(provider)
db.aiMgmtProviders.update(id, updates)
db.aiMgmtProviders.delete(id)
db.aiMgmtProviders.testConnection(id)
```

### Models
```typescript
db.aiMgmtModels.list()
db.aiMgmtModels.listByProvider(providerId)
db.aiMgmtModels.getById(id)
db.aiMgmtModels.create(model)
db.aiMgmtModels.update(id, updates)
db.aiMgmtModels.delete(id)
```

### Functions
```typescript
db.aiMgmtFunctions.list()
db.aiMgmtFunctions.getById(id)
db.aiMgmtFunctions.getByKey(functionKey)
db.aiMgmtFunctions.create(func)
db.aiMgmtFunctions.update(id, updates)
db.aiMgmtFunctions.delete(id)
```

### Function Configs
```typescript
db.aiMgmtFunctionConfigs.list()
db.aiMgmtFunctionConfigs.listByFunction(functionId)
db.aiMgmtFunctionConfigs.getActiveConfig(functionId)
db.aiMgmtFunctionConfigs.getById(id)
db.aiMgmtFunctionConfigs.create(config)
db.aiMgmtFunctionConfigs.update(id, updates)
db.aiMgmtFunctionConfigs.delete(id)
db.aiMgmtFunctionConfigs.setActive(id)
```

### Interaction Logs
```typescript
db.aiMgmtInteractionLogs.list(page, pageSize)
db.aiMgmtInteractionLogs.listByFunction(functionId, page, pageSize)
db.aiMgmtInteractionLogs.listByUser(userId, page, pageSize)
db.aiMgmtInteractionLogs.getById(id)
db.aiMgmtInteractionLogs.create(log)
db.aiMgmtInteractionLogs.getStats()
```

### Supervisor Reports
```typescript
db.aiMgmtSupervisorReports.list(page, pageSize)
db.aiMgmtSupervisorReports.listByStatus(status, page, pageSize)
db.aiMgmtSupervisorReports.listBySeverity(severity, page, pageSize)
db.aiMgmtSupervisorReports.getById(id)
db.aiMgmtSupervisorReports.create(report)
db.aiMgmtSupervisorReports.update(id, updates)
db.aiMgmtSupervisorReports.markReviewed(id, reviewerId)
db.aiMgmtSupervisorReports.getStats()
```

## Admin UI Pages

### 1. AI Function Configuration (`/admin/ai-function-config`)
Configure AI providers, models, and function-specific settings.

**Features:**
- View all AI functions
- Configure provider and model for each function
- Set system prompts and parameters
- Activate/deactivate configurations
- Test configurations

**Access:** Admin only

### 2. Supervisor Dashboard (`/admin/supervisor-dashboard`)
Monitor AI interactions and review supervisor reports.

**Features:**
- View statistics (total reports, by status, by severity)
- Filter reports by status and severity
- Review detailed findings and suggestions
- Mark reports as reviewed/resolved/dismissed
- View associated interaction logs

**Access:** Admin only

### 3. AI Interaction Logs (`/admin/ai-interaction-logs`)
View detailed logs of all AI interactions.

**Features:**
- Paginated list of all interactions
- Filter by function, user, status
- View input/output text
- See token usage and response times
- Export logs for analysis

**Access:** Admin only

## Security

### Row Level Security (RLS)
All AI management tables have RLS enabled with admin-only access:
- Only users with `role = 'admin'` can access AI management data
- Regular users cannot view or modify AI configurations
- Interaction logs are admin-only for privacy

### API Key Encryption
- API keys are stored in the `api_key_encrypted` field
- Keys should be encrypted before storage (implementation pending)
- Keys are never exposed in API responses

## Usage Guide

### Setting Up a New AI Provider

1. Navigate to **Admin Dashboard** → **AI Function Config**
2. Click **Add Provider** (if needed)
3. Enter provider details:
   - Name (e.g., "OpenAI")
   - Base URL (e.g., "https://api.openai.com/v1")
   - API Key (will be encrypted)
4. Click **Save**

### Adding a New Model

1. In the **AI Function Config** page, select a provider
2. Click **Add Model**
3. Enter model details:
   - Model ID (e.g., "gpt-4o")
   - Display Name (e.g., "GPT-4o")
   - Capabilities (comma-separated)
   - Context Window (e.g., 128000)
4. Click **Save**

### Configuring a Function

1. In the **AI Function Config** page, select a function
2. Click **Configure** or **Edit**
3. Select provider and model
4. Enter system prompt
5. Set temperature (0-2, default 0.7)
6. Set max tokens (default 2000)
7. Add any additional configuration (JSON)
8. Click **Save**
9. Click **Activate** to make it the active configuration

### Monitoring Interactions

1. Navigate to **Admin Dashboard** → **AI Interaction Logs**
2. Use filters to find specific interactions:
   - Function
   - User
   - Status (success/error/timeout)
   - Date range
3. Click on an interaction to view details
4. Review input, output, tokens used, and response time

### Reviewing Supervisor Reports

1. Navigate to **Admin Dashboard** → **Supervisor Dashboard**
2. View statistics at the top:
   - Total reports
   - By status (pending, reviewed, resolved, dismissed)
   - By severity (low, medium, high, critical)
3. Filter reports by status or severity
4. Click on a report to view details
5. Review findings and suggestions
6. Mark as reviewed/resolved/dismissed

## Database Helper Functions

### get_active_ai_config(function_key)
Returns the active configuration for a given function.

```sql
SELECT * FROM get_active_ai_config('chat');
```

Returns:
- provider_name
- provider_base_url
- provider_api_key
- model_id
- model_display_name
- system_prompt
- temperature
- max_tokens
- additional_config

## Integration with Edge Functions

To use the AI Management System in Edge Functions:

```typescript
// Get active config for a function
const { data: config } = await supabase
  .rpc('get_active_ai_config', { p_function_key: 'chat' })
  .single();

if (!config) {
  throw new Error('No active AI configuration found for chat');
}

// Use the config to make AI API call
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

// Log the interaction
await supabase.from('ai_mgmt_interaction_logs').insert({
  function_id: functionId,
  user_id: userId,
  provider_id: config.provider_id,
  model_id: config.model_id,
  input_text: userInput,
  output_text: aiResponse,
  tokens_used: totalTokens,
  response_time_ms: responseTime,
  status: 'success'
});
```

## Future Enhancements

### Planned Features
1. **API Key Encryption**: Implement proper encryption for API keys
2. **Cost Tracking**: Track costs per provider/model/function
3. **Rate Limiting**: Implement rate limits per function
4. **A/B Testing**: Compare different configurations
5. **Auto-Scaling**: Automatically switch providers based on load
6. **Prompt Versioning**: Track and manage prompt versions
7. **Batch Processing**: Process multiple requests efficiently
8. **Caching**: Cache common responses to reduce costs
9. **Analytics Dashboard**: Visualize usage patterns and trends
10. **Automated Supervisor**: Automatically trigger supervisor analysis

### Integration Points
- **Voice Chat**: Use configured models for voice interactions
- **Assessment Insights**: Generate personalized insights
- **Memory Extraction**: Extract structured data from conversations
- **Chat**: Power the main chat interface
- **Supervisor**: Monitor all AI interactions

## Troubleshooting

### Common Issues

**Issue: "No active AI configuration found"**
- Solution: Ensure at least one configuration is marked as active for the function
- Check that the provider and model are both active

**Issue: "API key not found"**
- Solution: Add API key to the provider configuration
- Ensure the key is properly encrypted

**Issue: "Model not available"**
- Solution: Verify the model ID matches the provider's API
- Check that the model is active

**Issue: "Rate limit exceeded"**
- Solution: Implement rate limiting in the application
- Consider switching to a different provider/model

## Support

For issues or questions:
1. Check the logs in **AI Interaction Logs**
2. Review supervisor reports for insights
3. Verify configurations in **AI Function Config**
4. Contact the development team

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Multi-provider support (OpenAI, Google AI, Anthropic)
- Function-level configuration
- Interaction logging
- Supervisor monitoring
- Admin UI pages
- Database schema and migrations
- API functions
- Documentation
