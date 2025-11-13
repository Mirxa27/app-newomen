# Edge Function Error Handling Fix

## Error: "functionError?.context?.text is not a function"

### Problem Description
When the Edge Function `generate-assessment-insights` encountered an error, the error handling code tried to call `functionError.context.text()` as a function, but this method doesn't always exist, causing a secondary error that masked the original issue.

### Root Cause
The error handling code assumed that `functionError.context.text` would always be a function, but the Supabase Edge Function error structure can vary:

```typescript
// Original problematic code
if (functionError) {
  const errorMsg = await functionError?.context?.text();  // ❌ text might not be a function
  console.error('Edge Function error:', errorMsg || functionError);
  toast.error('Failed to generate insights. Please try again.');
  return;
}
```

### Error Structure Variations

Edge Function errors can have different structures:

1. **Standard Error Object**
   ```typescript
   {
     message: "Error message here",
     name: "FunctionsHttpError"
   }
   ```

2. **Context with text() method**
   ```typescript
   {
     context: {
       text: async () => "Error details"
     }
   }
   ```

3. **Context without text() method**
   ```typescript
   {
     context: "Error string or object"
   }
   ```

### Solution Implemented

Implemented robust error handling that checks for all possible error structures:

```typescript
if (functionError) {
  console.error('Edge Function error:', functionError);
  let errorMsg = 'Failed to generate insights. Please try again.';
  
  // Try to extract error message from different possible structures
  if (functionError.message) {
    errorMsg = functionError.message;
  } else if (functionError.context) {
    try {
      const contextText = typeof functionError.context.text === 'function' 
        ? await functionError.context.text()
        : functionError.context.toString();
      errorMsg = contextText || errorMsg;
    } catch (e) {
      console.error('Failed to extract error context:', e);
    }
  }
  
  toast.error(errorMsg);
  return;
}
```

### Key Improvements

#### 1. Type Checking Before Function Call
```typescript
typeof functionError.context.text === 'function'
```
- Checks if `text` is actually a function before calling it
- Prevents "text is not a function" error

#### 2. Fallback to toString()
```typescript
: functionError.context.toString()
```
- If `text` is not a function, convert context to string
- Handles cases where context is a plain string or object

#### 3. Nested Try-Catch
```typescript
try {
  const contextText = ...
} catch (e) {
  console.error('Failed to extract error context:', e);
}
```
- Prevents error extraction from crashing the application
- Logs extraction failures for debugging

#### 4. Default Error Message
```typescript
let errorMsg = 'Failed to generate insights. Please try again.';
```
- Always provides a user-friendly message
- Falls back if no specific error can be extracted

#### 5. Priority Order
1. First check `functionError.message` (most common)
2. Then check `functionError.context` (Edge Function specific)
3. Finally use default message

### Testing Scenarios

#### Test Case 1: Standard Error
```typescript
// Simulate standard error
const error = new Error("API key not configured");
// Expected: Shows "API key not configured"
```

#### Test Case 2: Context with text() Method
```typescript
// Simulate Edge Function error with text()
const error = {
  context: {
    text: async () => "Rate limit exceeded"
  }
};
// Expected: Shows "Rate limit exceeded"
```

#### Test Case 3: Context without text() Method
```typescript
// Simulate Edge Function error without text()
const error = {
  context: "Invalid request format"
};
// Expected: Shows "Invalid request format"
```

#### Test Case 4: No Error Details
```typescript
// Simulate error with no extractable message
const error = {};
// Expected: Shows "Failed to generate insights. Please try again."
```

### Related Files Modified

**src/pages/AssessmentTake.tsx**
- Lines 390-416: Enhanced error handling for Edge Function calls
- Added type checking before calling `text()` method
- Added fallback error message extraction
- Improved error logging for debugging

### Best Practices Applied

#### 1. Defensive Programming
- Never assume a property or method exists
- Always check types before calling methods
- Provide fallbacks for all error paths

#### 2. Error Logging
```typescript
console.error('Edge Function error:', functionError);
```
- Log the full error object for debugging
- Helps identify error structure variations

#### 3. User-Friendly Messages
```typescript
toast.error(errorMsg);
```
- Always show a clear message to users
- Don't expose technical details unnecessarily

#### 4. Graceful Degradation
- Application continues to work even if error extraction fails
- Users always get feedback about what went wrong

### Common Edge Function Errors

#### 1. Missing Environment Variables
```
Error: ERNIE_API_KEY is not configured
```
**Solution**: Set secrets using `supabase_bulk_create_secrets`

#### 2. API Rate Limits
```
Error: Rate limit exceeded
```
**Solution**: Implement retry logic or show appropriate message

#### 3. Invalid Request Format
```
Error: Invalid request body
```
**Solution**: Validate request data before sending

#### 4. Timeout Errors
```
Error: Function execution timeout
```
**Solution**: Optimize Edge Function or increase timeout

### Debugging Tips

#### Check Edge Function Logs
```bash
# View Edge Function logs in Supabase dashboard
# Look for execution errors and stack traces
```

#### Test Edge Function Directly
```typescript
// Test in browser console
const { data, error } = await supabase.functions.invoke('generate-assessment-insights', {
  body: { assessment: {...}, responses: [...] }
});
console.log('Data:', data);
console.log('Error:', error);
```

#### Monitor Error Patterns
- Track which error structures occur most frequently
- Adjust error handling based on real-world usage
- Add specific handling for common error types

### Prevention Strategies

#### 1. Type Guards
```typescript
function isTextFunction(obj: any): obj is { text: () => Promise<string> } {
  return obj && typeof obj.text === 'function';
}

if (isTextFunction(functionError.context)) {
  const text = await functionError.context.text();
}
```

#### 2. Error Wrapper
```typescript
async function extractErrorMessage(error: any): Promise<string> {
  if (error.message) return error.message;
  if (error.context) {
    if (typeof error.context.text === 'function') {
      return await error.context.text();
    }
    return error.context.toString();
  }
  return 'An unknown error occurred';
}
```

#### 3. Centralized Error Handling
Create a utility function for all Edge Function calls:

```typescript
// utils/edgeFunctionHelper.ts
export async function invokeEdgeFunction<T>(
  functionName: string,
  body: any
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  
  if (error) {
    const errorMsg = await extractErrorMessage(error);
    return { data: null, error: errorMsg };
  }
  
  return { data, error: null };
}
```

### Conclusion

The "text is not a function" error has been resolved by:
1. ✅ Checking if `text` is a function before calling it
2. ✅ Providing fallback error message extraction
3. ✅ Adding nested try-catch for safe error handling
4. ✅ Always showing user-friendly error messages
5. ✅ Logging full error objects for debugging

The application now handles Edge Function errors gracefully without crashing, and users receive clear feedback when issues occur.

### Related Documentation
- `ASSESSMENT_SUBMISSION_FIX.md` - Assessment submission error fix
- `ERROR_RESOLUTION_SUMMARY.md` - Overall error resolution summary
- `FINAL_IMPLEMENTATION_SUMMARY.md` - Complete feature documentation
