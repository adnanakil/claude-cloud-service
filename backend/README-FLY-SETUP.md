# Fly.io Setup Instructions

## Setting the ANTHROPIC_API_KEY

The Claude Cloud Service requires an ANTHROPIC_API_KEY to be set as a Fly.io secret. 

### Step 1: Get your Anthropic API Key
1. Go to https://console.anthropic.com/
2. Navigate to API Keys section
3. Create a new API key or use an existing one

### Step 2: Set the API Key in Fly.io
```bash
flyctl secrets set ANTHROPIC_API_KEY="your-actual-api-key-here" -a claude-cloud-service
```

### Step 3: Verify the Secret is Set
```bash
flyctl secrets list -a claude-cloud-service
```

You should see:
- ANTHROPIC_API_KEY (with a digest, not the actual value)
- JWT_SECRET (already set)

### Step 4: Restart the App
After setting the secret, the app should automatically restart. If not:
```bash
flyctl apps restart claude-cloud-service
```

### Step 5: Verify it's Working
Test the API key is available:
```bash
curl https://claude-cloud-service.fly.dev/api/debug/claude-diagnostics | jq '.environment.ANTHROPIC_API_KEY'
```

This should return "SET" instead of "NOT SET".

### Troubleshooting
If the API key still shows as "NOT SET":
1. Check the deployment logs: `flyctl logs -a claude-cloud-service`
2. SSH into the container: `flyctl ssh console -a claude-cloud-service`
3. Check environment: `echo $ANTHROPIC_API_KEY`

## Testing Claude
Once the API key is set, you can test Claude:
```bash
curl https://claude-cloud-service.fly.dev/api/debug/test-claude?query=Hello
```

This should return a response from Claude instead of an error.