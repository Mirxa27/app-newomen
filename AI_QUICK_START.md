# AI Management System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Access Admin Panel
1. Log in as an admin user
2. Navigate to **Admin Dashboard**
3. Click on **AI Function Config**

### Step 2: Add API Keys

#### For OpenAI:
1. Get your API key from https://platform.openai.com/api-keys
2. In AI Function Config, find "OpenAI" provider
3. Click **Edit**
4. Paste your API key
5. Click **Save**

#### For Google AI (Gemini):
1. Get your API key from https://aistudio.google.com/apikey
2. Find "Google AI" provider
3. Click **Edit**
4. Paste your API key
5. Click **Save**

#### For Anthropic (Claude):
1. Get your API key from https://console.anthropic.com/
2. Find "Anthropic" provider
3. Click **Edit**
4. Paste your API key
5. Click **Save**

### Step 3: Configure Your First Function

Let's configure the "Chat" function:

1. In AI Function Config, select **Chat** from the functions list
2. Click **Configure** or **Add Configuration**
3. Fill in the form:
   - **Provider**: Select "OpenAI"
   - **Model**: Select "GPT-4o Mini" (cost-effective)
   - **System Prompt**: Enter something like:
     ```
     You are a helpful AI assistant for the NewMe platform. 
     You help users with personal growth, self-discovery, and transformation.
     Be empathetic, supportive, and insightful.
     ```
   - **Temperature**: 0.7 (balanced creativity)
   - **Max Tokens**: 2000 (sufficient for most responses)
4. Click **Save**
5. Click **Activate** to make it the active configuration

### Step 4: Test the Configuration

1. Go to the main chat interface in your application
2. Send a test message
3. Verify you get a response

### Step 5: Monitor Interactions

1. Go to **Admin Dashboard** → **AI Interaction Logs**
2. You should see your test interaction logged
3. Check:
   - ✅ Status is "success"
   - ✅ Token usage is recorded
   - ✅ Response time is reasonable

## 📊 Understanding the Dashboard

### AI Function Config Page
- **Left Panel**: List of all AI functions
- **Middle Panel**: Configurations for selected function
- **Right Panel**: Configuration details and edit form

### Supervisor Dashboard
- **Top Cards**: Statistics (total reports, by status, by severity)
- **Reports Table**: List of all supervisor reports
- **Filters**: Filter by status or severity
- **Actions**: Review, resolve, or dismiss reports

### AI Interaction Logs
- **Logs Table**: All AI interactions
- **Filters**: Filter by function, user, status
- **Details**: Click to view full input/output
- **Pagination**: Navigate through logs

## 🎯 Recommended Configurations

### Chat Function
```
Provider: OpenAI
Model: GPT-4o Mini
Temperature: 0.7
Max Tokens: 2000
System Prompt: "You are a helpful AI assistant for the NewMe platform..."
```

### Assessment Insights
```
Provider: OpenAI
Model: GPT-4o
Temperature: 0.5
Max Tokens: 1500
System Prompt: "You are an expert psychologist analyzing user assessments..."
```

### Voice Chat
```
Provider: Google AI
Model: Gemini 2.0 Flash
Temperature: 0.8
Max Tokens: 1000
System Prompt: "You are a conversational AI for voice interactions..."
```

### Memory Extraction
```
Provider: Anthropic
Model: Claude 3.5 Sonnet
Temperature: 0.3
Max Tokens: 1000
System Prompt: "Extract and structure memories from conversations..."
```

### Supervisor AI
```
Provider: OpenAI
Model: GPT-4o
Temperature: 0.2
Max Tokens: 1500
System Prompt: "Analyze AI interactions for quality, errors, and improvements..."
```

## 🔧 Common Tasks

### Change Model for a Function
1. Go to AI Function Config
2. Select the function
3. Click **Edit** on the active configuration
4. Change the model
5. Click **Save**

### Switch Provider
1. Create a new configuration with the new provider
2. Click **Activate** on the new configuration
3. The old configuration will be automatically deactivated

### View Token Usage
1. Go to AI Interaction Logs
2. Look at the "Tokens Used" column
3. Sum up tokens for cost estimation

### Review Supervisor Reports
1. Go to Supervisor Dashboard
2. Filter by severity (start with "critical" and "high")
3. Click on a report to view details
4. Review findings and suggestions
5. Mark as reviewed/resolved/dismissed

## 💡 Tips & Best Practices

### Cost Optimization
- Use **GPT-4o Mini** for simple tasks (cheaper)
- Use **GPT-4o** for complex tasks (better quality)
- Use **Gemini 2.0 Flash** for high-volume tasks (fast & cheap)
- Set appropriate **max_tokens** limits

### Quality Optimization
- Lower temperature (0.2-0.5) for factual tasks
- Higher temperature (0.7-1.0) for creative tasks
- Test different system prompts
- Monitor supervisor reports for issues

### Performance Optimization
- Use faster models for real-time interactions
- Implement caching for common queries
- Set reasonable timeout limits
- Monitor response times in logs

### Security
- Never share API keys
- Rotate keys regularly
- Monitor usage for anomalies
- Review interaction logs for sensitive data

## 🆘 Troubleshooting

### "No active AI configuration found"
**Solution**: Ensure at least one configuration is activated for the function.

### "API key not working"
**Solution**: 
1. Verify the API key is correct
2. Check if the key has sufficient credits
3. Test the key directly with the provider's API

### "Rate limit exceeded"
**Solution**:
1. Upgrade your API plan with the provider
2. Implement rate limiting in your application
3. Switch to a different provider temporarily

### "High response times"
**Solution**:
1. Use a faster model (e.g., GPT-4o Mini instead of GPT-4o)
2. Reduce max_tokens
3. Check your network connection
4. Consider switching providers

### "Poor quality responses"
**Solution**:
1. Improve the system prompt
2. Increase temperature for more creativity
3. Use a more capable model
4. Review supervisor reports for insights

## 📚 Next Steps

1. ✅ Configure all AI functions
2. ✅ Test each function thoroughly
3. ✅ Monitor interactions for a few days
4. ✅ Review supervisor reports
5. ✅ Optimize configurations based on feedback
6. ✅ Set up cost tracking
7. ✅ Implement rate limiting
8. ✅ Create backup configurations

## 📖 Additional Resources

- **Full Documentation**: See `AI_MANAGEMENT_SYSTEM.md`
- **Integration Guide**: See `AI_INTEGRATION_GUIDE.md`
- **API Reference**: See API Functions section in documentation
- **Provider Docs**:
  - OpenAI: https://platform.openai.com/docs
  - Google AI: https://ai.google.dev/docs
  - Anthropic: https://docs.anthropic.com

## 🎉 You're Ready!

You now have a fully configured AI Management System. Start using it and monitor the results!

**Need Help?** Check the troubleshooting section or review the full documentation.
