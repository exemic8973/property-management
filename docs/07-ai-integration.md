# AI Integration Points: PropertyOS

## Overview

PropertyOS integrates AI capabilities across multiple touchpoints to enhance user experience, automate operations, and provide predictive insights. The AI architecture follows a **human-in-the-loop** approach, ensuring reliability, safety, and transparency.

---

## AI Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   AI SERVICE LAYER                                              │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   FAQ Bot   │  │ Maintenance │  │   Document  │  │   Chat      │  │   Predictive│        │
│  │   Service   │  │   Triage    │  │ Intelligence│  │   Assistant │  │  Analytics  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │                │
│         └────────────────┼────────────────┼────────────────┼────────────────┘                │
│                          │                │                │                                 │
│                          ▼                ▼                ▼                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          LLM ORCHESTRATION LAYER                                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   Prompt    │  │   Context   │  │  Response   │  │   Safety    │  │   Cache     │  │  │
│  │  │  Templates  │  │  Builder    │  │  Parser     │  │  Filters    │  │   Manager   │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘  │
│                          │                                                                 │
│                          ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          EXTERNAL LLM APIS                                                │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │  │
│  │  │   OpenAI    │  │  Anthropic  │  │   Custom    │  │   Fallback  │                    │  │
│  │  │   (GPT-4)   │  │  (Claude)   │  │  (Fine-tuned)│  │   Provider  │                    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘                    │  │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘  │
│                          │                                                                 │
│                          ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          DATA LAYER                                                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │  │
│  │  │ PostgreSQL  │  │    Redis    │  │  Pinecone   │  │   S3 /      │                    │  │
│  │  │  (Context)  │  │  (Cache)    │  │  (Vectors)  │  │   MinIO     │                    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘                    │  │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **LLM Provider** | OpenAI GPT-4 Turbo | Primary reasoning model |
| **LLM Provider** | Anthropic Claude 3.5 Sonnet | Fallback and alternative |
| **Vector DB** | Pinecone | Semantic search & retrieval |
| **Cache** | Redis | Response caching |
| **Prompt Management** | Custom | Versioned prompt templates |
| **Safety Layer** | Custom + NeMo Guardrails | Content filtering & safety |
| **Observability** | LangSmith | Prompt engineering & analytics |

---

## AI Use Cases

### 1. FAQ Bot (Phase 2)

#### Description
Natural language question-answering system for common tenant and property management queries.

#### Capabilities
- Answer 80% of common tenant queries without human intervention
- Provide instant responses 24/7
- Escalate complex queries to human support
- Learn from new interactions

#### Supported Query Types

| Category | Example Queries |
|----------|----------------|
| **Rent** | "When is my rent due?", "How do I pay rent?", "Can I change my payment method?" |
| **Maintenance** | "How do I submit a maintenance request?", "What's the status of my request?", "How long does it take to fix a leak?" |
| **Lease** | "When does my lease end?", "Can I renew my lease?", "What's my pet policy?" |
| **Policies** | "What's the guest policy?", "Can I have pets?", "Is smoking allowed?" |
| **Amenities** | "What amenities are available?", "How do I access the gym?", "Is there parking?" |
| **Contact** | "How do I contact property management?", "What's the emergency number?", "Who's my property manager?" |

#### Prompt Template

```typescript
// prompts/faq-bot/system.ts
export const faqBotSystemPrompt = `
You are PropertyOS Assistant, a helpful AI assistant for tenants and property managers.
Your role is to answer questions about property management, rent, maintenance, leases, and policies.

Guidelines:
1. Be friendly, professional, and concise
2. Only answer questions related to property management
3. If you don't know the answer, say "I'm not sure about that. Let me connect you with a human agent."
4. For account-specific questions, direct users to the appropriate section in their portal
5. For urgent matters (emergencies, safety concerns), provide emergency contact information
6. Never provide legal or financial advice
7. If the query is about account details, explain where to find that information in the portal

Tone: Helpful, empathetic, professional

If the user seems frustrated or angry, acknowledge their feelings and offer additional help.

Remember: You are an AI assistant, not a human. Be transparent about your limitations.
`;
```

#### Context Building

```typescript
// services/ai/context-builder.ts
export async function buildFAQContext(
  tenantId: string,
  query: string
): Promise<string> {
  const context: string[] = [];

  // 1. Tenant-specific information
  const tenant = await getTenant(tenantId);
  context.push(`Tenant: ${tenant.firstName} ${tenant.lastName}`);
  context.push(`Property: ${tenant.property.name}`);
  context.push(`Unit: ${tenant.unit.number}`);

  // 2. Lease information
  const lease = await getActiveLease(tenant.leaseId);
  context.push(`Lease Start: ${lease.startDate}`);
  context.push(`Lease End: ${lease.endDate}`);
  context.push(`Monthly Rent: $${lease.monthlyRent}`);

  // 3. Property policies
  const policies = await getPropertyPolicies(tenant.propertyId);
  context.push(`Pet Policy: ${policies.petPolicy}`);
  context.push(`Guest Policy: ${policies.guestPolicy}`);
  context.push(`Parking Policy: ${policies.parkingPolicy}`);

  // 4. FAQ documents (RAG)
  const relevantFAQs = await searchFAQDocuments(query, tenant.propertyId);
  if (relevantFAQs.length > 0) {
    context.push('\nRelevant FAQ Documents:');
    relevantFAQs.forEach((faq, i) => {
      context.push(`\n${i + 1}. ${faq.question}\n   ${faq.answer}`);
    });
  }

  return context.join('\n');
}
```

#### Response Handling

```typescript
// services/ai/faq-bot.ts
export async function handleFAQQuery(
  tenantId: string,
  query: string
): Promise<FAQResponse> {
  // 1. Check cache
  const cacheKey = `faq:${hash(query)}:${tenantId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Build context
  const context = await buildFAQContext(tenantId, query);

  // 3. Determine if escalation needed
  const shouldEscalate = await shouldEscalateQuery(query, context);
  if (shouldEscalate) {
    return {
      type: 'escalation',
      message: 'I need to connect you with a human agent for this request.',
      reason: shouldEscalate.reason,
    };
  }

  // 4. Call LLM
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: faqBotSystemPrompt },
      { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  const answer = response.choices[0].message.content;

  // 5. Cache response
  await redis.setex(cacheKey, 3600, JSON.stringify({ type: 'answer', message: answer }));

  return {
    type: 'answer',
    message: answer,
    confidence: calculateConfidence(response),
  };
}
```

---

### 2. Maintenance Triage (Phase 2)

#### Description
AI-powered categorization and prioritization of maintenance requests.

#### Capabilities
- Auto-categorize requests (plumbing, electrical, HVAC, etc.)
- Determine urgency level (low, medium, high, emergency)
- Suggest appropriate vendors based on type and location
- Estimate repair costs
- Recommend action steps

#### Prompt Template

```typescript
// prompts/maintenance-triage/system.ts
export const maintenanceTriageSystemPrompt = `
You are a PropertyOS Maintenance Triage AI. Your role is to analyze maintenance requests and provide triage information.

Your task:
1. Categorize the request into one of these categories:
   - plumbing, electrical, hvac, appliances, structural, pest_control, landscaping, security, internet, other

2. Assign a priority level:
   - emergency (immediate safety risk, major damage, no water/power)
   - high (significant inconvenience, potential for damage)
   - medium (minor inconvenience, no immediate risk)
   - low (minor issue, can wait)

3. Estimate the cost range (in USD):
   - $0-$100 (minor fix)
   - $100-$500 (moderate repair)
   - $500-$1,000 (major repair)
   - $1,000+ (significant work)

4. Suggest appropriate vendor type (if applicable)

5. Provide a brief assessment of the issue

Format your response as JSON:
{
  "category": "category",
  "priority": "priority",
  "estimatedCost": {"min": 100, "max": 500},
  "vendorType": "vendor type",
  "assessment": "brief description",
  "confidence": 0.95
}

Be conservative in your estimates. If you're unsure, use a wider cost range and lower confidence.
`;
```

#### Implementation

```typescript
// services/ai/maintenance-triage.ts
export async function triageMaintenanceRequest(
  request: MaintenanceRequest
): Promise<TriageResult> {
  // 1. Prepare input
  const input = {
    title: request.title,
    description: request.description,
    photos: request.photos,
    unit: {
      type: request.unit.type,
      amenities: request.unit.amenities,
    },
    property: {
      type: request.property.type,
      yearBuilt: request.property.yearBuilt,
    },
  };

  // 2. Call LLM
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: maintenanceTriageSystemPrompt },
      { role: 'user', content: JSON.stringify(input) },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  // 3. Parse and validate response
  const result = JSON.parse(response.choices[0].message.content);

  // 4. Safety check - validate priority
  if (result.priority === 'emergency') {
    // Verify it's actually an emergency
    const isActualEmergency = await verifyEmergencyPriority(input);
    if (!isActualEmergency) {
      result.priority = 'high';
    }
  }

  // 5. Get vendor suggestions
  if (result.vendorType) {
    result.suggestedVendors = await findAvailableVendors(
      request.unit.propertyId,
      result.vendorType
    );
  }

  return result;
}

// Safety check for emergency priority
async function verifyEmergencyPriority(
  input: MaintenanceRequestInput
): Promise<boolean> {
  const emergencyKeywords = [
    'fire', 'flood', 'gas', 'electrical', 'shock', 'burst', 'no water',
    'no power', 'smoke', 'carbon monoxide', 'injury', 'danger',
  ];

  const text = `${input.title} ${input.description}`.toLowerCase();
  return emergencyKeywords.some(keyword => text.includes(keyword));
}
```

---

### 3. Document Intelligence (Phase 2)

#### Description
AI-powered document processing, summarization, and data extraction.

#### Capabilities
- Summarize lease agreements
- Extract key terms from documents
- OCR for scanned documents
- Document classification
- Generate document templates

#### Use Cases

| Document Type | AI Capability |
|---------------|---------------|
| **Lease Agreements** | Summarize key terms, extract dates, rent amounts, clauses |
| **Invoices** | Extract line items, amounts, due dates, vendor info |
| **Inspection Reports** | Summarize findings, identify issues |
| **Applications** | Extract applicant information, verify completeness |
| **Notices** | Categorize notice type, extract deadlines |

#### Prompt Template (Lease Summary)

```typescript
// prompts/document-intelligence/lease-summary.ts
export const leaseSummarySystemPrompt = `
You are a PropertyOS Document Intelligence AI. Your role is to summarize lease agreements.

Your task:
1. Extract key information from the lease agreement
2. Identify important clauses and restrictions
3. Highlight any unusual or concerning terms
4. Provide a concise summary

Extract and return:
{
  "tenantName": "full name",
  "landlordName": "full name",
  "propertyAddress": "address",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "monthlyRent": 2500.00,
  "securityDeposit": 2500.00,
  "petPolicy": "description",
  "guestPolicy": "description",
  "parkingIncluded": true,
  "utilitiesIncluded": ["water", "gas"],
  "restrictions": ["no smoking", "no subletting"],
  "unusualTerms": ["any unusual clauses"],
  "summary": "2-3 sentence summary"
}

If information is not found in the document, use null for that field.
`;
```

#### Implementation

```typescript
// services/ai/document-intelligence.ts
export async function summarizeLease(
  documentId: string
): Promise<LeaseSummary> {
  // 1. Retrieve document content
  const document = await getDocument(documentId);
  const content = await extractTextFromDocument(document);

  // 2. Call LLM
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: leaseSummarySystemPrompt },
      { role: 'user', content: content },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  // 3. Parse response
  const summary = JSON.parse(response.choices[0].message.content);

  // 4. Store summary for future reference
  await saveLeaseSummary(documentId, summary);

  return summary;
}

export async function classifyDocument(
  documentId: string
): Promise<DocumentClassification> {
  const document = await getDocument(documentId);
  const content = await extractTextFromDocument(document);

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `Classify this document into one of these types:
        lease, invoice, notice, application, inspection_report, contract, other
        Return only the type name.`,
      },
      { role: 'user', content: content.substring(0, 4000) },
    ],
    temperature: 0.1,
  });

  return {
    type: response.choices[0].message.content.trim(),
    confidence: 0.85,
  };
}
```

---

### 4. AI Chat Assistant (Phase 2)

#### Description
Conversational AI assistant for complex queries, data exploration, and task assistance.

#### Capabilities
- Natural language queries over portfolio data
- Task assistance (e.g., "Create a lease for John Smith")
- Explanations of complex concepts
- Report generation assistance
- Workflow guidance

#### Prompt Template

```typescript
// prompts/chat-assistant/system.ts
export const chatAssistantSystemPrompt = `
You are PropertyOS Assistant, an AI assistant for property managers, owners, and tenants.

Your capabilities:
- Answer questions about properties, tenants, leases, and payments
- Help users navigate the PropertyOS platform
- Assist with tasks like creating maintenance requests or finding information
- Explain property management concepts
- Generate reports or summaries (when requested)

Your role is to be helpful, accurate, and efficient.

Guidelines:
1. Be concise and direct
2. Use tools when needed to fetch data
3. If you don't know the answer, be honest and suggest alternatives
4. For sensitive operations, confirm with the user before proceeding
5. Never make up data - if data is unavailable, say so

Tone: Professional, helpful, efficient

Remember: You are an AI assistant. Be transparent about your limitations and when you need human assistance.
`;
```

#### Tool Use (Function Calling)

```typescript
// services/ai/chat-assistant.ts
export async function handleChatMessage(
  userId: string,
  message: string,
  conversationHistory: Message[]
): Promise<ChatResponse> {
  // 1. Get user context
  const user = await getUser(userId);

  // 2. Define available tools
  const tools = [
    {
      type: 'function',
      function: {
        name: 'get_property_info',
        description: 'Get information about a property',
        parameters: {
          type: 'object',
          properties: {
            propertyId: {
              type: 'string',
              description: 'The ID of the property',
            },
          },
          required: ['propertyId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'search_tenants',
        description: 'Search for tenants by name or email',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_maintenance_status',
        description: 'Get status of maintenance requests',
        parameters: {
          type: 'object',
          properties: {
            requestId: {
              type: 'string',
              description: 'The ID of the maintenance request',
            },
          },
          required: ['requestId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_report',
        description: 'Generate a report',
        parameters: {
          type: 'object',
          properties: {
            reportType: {
              type: 'string',
              enum: ['income', 'expense', 'occupancy', 'maintenance'],
              description: 'Type of report to generate',
            },
            propertyId: {
              type: 'string',
              description: 'Property ID (optional)',
            },
            period: {
              type: 'string',
              description: 'Time period (e.g., "last 30 days")',
            },
          },
          required: ['reportType'],
        },
      },
    },
  ];

  // 3. Call LLM with tools
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: chatAssistantSystemPrompt },
      ...conversationHistory,
      { role: 'user', content: message },
    ],
    tools,
    tool_choice: 'auto',
    temperature: 0.5,
  });

  const assistantMessage = response.choices[0].message;

  // 4. Handle tool calls
  if (assistantMessage.tool_calls) {
    const toolResults = [];

    for (const toolCall of assistantMessage.tool_calls) {
      const result = await executeToolCall(toolCall, user.role);
      toolResults.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        content: JSON.stringify(result),
      });
    }

    // 5. Get final response with tool results
    const finalResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        ...response.messages,
        ...toolResults,
      ],
      temperature: 0.5,
    });

    return {
      message: finalResponse.choices[0].message.content,
      toolCalls: assistantMessage.tool_calls,
    };
  }

  return {
    message: assistantMessage.content,
  };
}

async function executeToolCall(
  toolCall: any,
  userRole: string
): Promise<any> {
  const { name, arguments: args } = toolCall.function;

  switch (name) {
    case 'get_property_info':
      return await getPropertyInfo(args.propertyId, userRole);
    case 'search_tenants':
      return await searchTenants(args.query, userRole);
    case 'get_maintenance_status':
      return await getMaintenanceStatus(args.requestId, userRole);
    case 'create_report':
      return await createReport(args, userRole);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```

---

### 5. Predictive Analytics (Phase 3)

#### Description
ML-powered predictions for vacancy risk, rent pricing, and maintenance forecasting.

#### Capabilities
- **Vacancy Risk Prediction**: Identify tenants at risk of leaving
- **Rent Pricing Optimization**: Suggest optimal rent prices
- **Maintenance Forecasting**: Predict equipment failures
- **Revenue Forecasting**: Predict future revenue
- **Churn Prediction**: Identify properties with high turnover

#### Model Architecture

```typescript
// services/ai/predictive-analytics.ts

// Vacancy Risk Prediction
export async function predictVacancyRisk(
  leaseId: string
): Promise<VacancyRiskPrediction> {
  // 1. Gather features
  const features = await gatherVacancyRiskFeatures(leaseId);

  // 2. Call prediction model (could be ML model or LLM-based)
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are a vacancy risk prediction AI. Analyze the tenant data and predict vacancy risk.
        Return JSON with:
        {
          "riskLevel": "low|medium|high",
          "riskScore": 0.75,
          "probability": 0.65,
          "factors": ["factor1", "factor2"],
          "recommendations": ["recommendation1"],
          "confidence": 0.80
        }`,
      },
      { role: 'user', content: JSON.stringify(features) },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const prediction = JSON.parse(response.choices[0].message.content);

  // 3. Store prediction for tracking
  await saveVacancyPrediction(leaseId, prediction);

  return prediction;
}

async function gatherVacancyRiskFeatures(
  leaseId: string
): Promise<VacancyRiskFeatures> {
  const lease = await getLease(leaseId);
  const tenant = await getTenant(lease.tenantId);
  const payments = await getPaymentHistory(leaseId);
  const maintenance = await getMaintenanceHistory(lease.unitId);

  return {
    // Payment behavior
    onTimePaymentRate: calculateOnTimeRate(payments),
    latePaymentCount: countLatePayments(payments),
    partialPayments: countPartialPayments(payments),

    // Tenure
    daysInLease: getDaysInLease(lease),
    renewalHistory: await getRenewalHistory(tenant.id),

    // Maintenance requests
    maintenanceRequestCount: maintenance.length,
    maintenanceComplaints: countComplaints(maintenance),

    // Property factors
    propertyType: lease.unit.property.type,
    rentVsMarket: await compareRentToMarket(lease.monthlyRent, lease.unit.propertyId),

    // Market factors
    marketTrend: await getMarketTrend(lease.unit.property.city),
    localAvailability: await getLocalAvailability(lease.unit.property.zipCode),
  };
}

// Rent Pricing Optimization
export async function optimizeRentPrice(
  propertyId: string,
  unitId: string
): Promise<RentPricingRecommendation> {
  // 1. Gather market data
  const marketData = await gatherMarketData(propertyId);

  // 2. Get unit features
  const unit = await getUnit(unitId);

  // 3. Get historical data
  const historical = await getHistoricalPricing(unitId);

  // 4. Calculate optimal price
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are a rent pricing optimization AI. Analyze the market data and suggest optimal rent.
        Return JSON with:
        {
          "currentRent": 2500.00,
          "recommendedRent": 2750.00,
          "increasePercentage": 10.0,
          "reasoning": "explanation",
          "confidence": 0.85,
          "marketFactors": ["factor1", "factor2"],
          "risks": ["risk1"],
          "timeToRent": "estimated days"
        }`,
      },
      { role: 'user', content: JSON.stringify({ marketData, unit, historical }) },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}
```

---

## Safety & Fallback Mechanisms

### 1. Content Filtering

```typescript
// services/ai/safety/content-filter.ts
import NeMoGuardrails from 'nemoguardrails';

export async function filterContent(
  content: string,
  contentType: 'input' | 'output'
): Promise<SafetyResult> {
  const guardrails = new NeMoGuardrails({
    config: {
      rails: {
        input: {
          flows: [
            'self check',
            'toxic language',
            'jailbreak detection',
            'policy violation',
          ],
        },
        output: {
          flows: [
            'self check',
            'toxic language',
            'hallucination check',
            'policy violation',
          ],
        },
      },
    },
  });

  const result = await guardrails.process({
    text: content,
    mode: contentType === 'input' ? 'input' : 'output',
  });

  return {
    isSafe: result.is_safe,
    blocked: result.blocked,
    reason: result.blocked_reason,
    filteredContent: result.filtered_text,
  };
}
```

### 2. Hallucination Detection

```typescript
// services/ai/safety/hallucination-detection.ts
export async function detectHallucination(
  response: string,
  context: string
): Promise<HallucinationCheck> {
  const check = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are a hallucination detection AI. Check if the response contains factual errors
        or information not supported by the context.

        Return JSON with:
        {
          "hasHallucinations": false,
          "confidence": 0.95,
          "issues": [],
          "suggestedCorrection": null
        }`,
      },
      {
        role: 'user',
        content: `Context: ${context}\n\nResponse: ${response}`,
      },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(check.choices[0].message.content);
}
```

### 3. Confidence Scoring

```typescript
// services/ai/safety/confidence-scoring.ts
export function calculateConfidence(
  response: OpenAIResponse
): ConfidenceScore {
  const finishReason = response.choices[0].finish_reason;
  const logprobs = response.choices[0].logprobs;

  let confidence = 0.5;

  // Higher confidence if response completed normally
  if (finishReason === 'stop') {
    confidence += 0.3;
  }

  // Lower confidence if stopped early
  if (finishReason === 'length') {
    confidence -= 0.2;
  }

  // Check token probabilities if available
  if (logprobs && logprobs.tokens) {
    const avgLogprob = logprobs.tokens.reduce((sum, t) => sum + t.logprob, 0) / logprobs.tokens.length;
    confidence += Math.max(0, Math.min(0.3, avgLogprob));
  }

  return {
    score: Math.max(0, Math.min(1, confidence)),
    level: getConfidenceLevel(confidence),
    finishReason,
  };
}

function getConfidenceLevel(score: number): 'low' | 'medium' | 'high' {
  if (score < 0.5) return 'low';
  if (score < 0.75) return 'medium';
  return 'high';
}
```

### 4. Human-in-the-Loop Escalation

```typescript
// services/ai/safety/escalation.ts
export async function shouldEscalate(
  query: string,
  context: string,
  response: string
): Promise<EscalationDecision> {
  const escalationCheck = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `Determine if this query should be escalated to a human agent.

        Escalate if:
        - Query involves sensitive personal information
        - Query requires legal or financial advice
        - User is expressing frustration or anger
        - Query is complex and requires human judgment
        - Query involves safety or emergency concerns
        - Response has low confidence

        Return JSON with:
        {
          "shouldEscalate": true,
          "reason": "reason",
          "urgency": "low|medium|high",
          "suggestedAction": "action"
        }`,
      },
      {
        role: 'user',
        content: `Query: ${query}\nContext: ${context}\nResponse: ${response}`,
      },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(escalationCheck.choices[0].message.content);
}
```

### 5. Rate Limiting & Cost Control

```typescript
// services/ai/rate-limiter.ts
export class AIRateLimiter {
  private redis: Redis;
  private limits: Map<string, RateLimit>;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.limits = new Map([
      ['faq-bot', { requests: 100, window: 60 }],      // 100 requests/minute
      ['maintenance-triage', { requests: 50, window: 60 }],
      ['chat-assistant', { requests: 200, window: 60 }],
      ['document-intelligence', { requests: 30, window: 60 }],
    ]);
  }

  async checkLimit(userId: string, feature: string): Promise<boolean> {
    const limit = this.limits.get(feature);
    if (!limit) return true;

    const key = `ai-rate-limit:${feature}:${userId}`;
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, limit.window);
    }

    return count <= limit.requests;
  }

  async getRemainingRequests(userId: string, feature: string): Promise<number> {
    const limit = this.limits.get(feature);
    if (!limit) return Infinity;

    const key = `ai-rate-limit:${feature}:${userId}`;
    const count = parseInt(await this.redis.get(key) || '0');
    return Math.max(0, limit.requests - count);
  }
}
```

---

## AI Metrics & Observability

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Resolution Rate** | % of queries resolved without escalation | > 70% |
| **User Satisfaction** | User satisfaction with AI responses | > 4.0/5.0 |
| **Escalation Rate** | % of queries escalated to humans | < 30% |
| **Response Time** | Average AI response time | < 2 seconds |
| **Cost Per Query** | Average LLM cost per query | < $0.05 |
| **Cache Hit Rate** | % of queries served from cache | > 40% |
| **Hallucination Rate** | % of responses with hallucinations | < 5% |
| **Confidence Score** | Average confidence of responses | > 0.75 |

### Monitoring Dashboard

```typescript
// services/ai/monitoring.ts
export class AIMonitoring {
  async logAICall(params: {
    feature: string;
    userId: string;
    input: string;
    output: string;
    confidence: number;
    latency: number;
    tokens: number;
    cost: number;
    escalated: boolean;
  }) {
    // Log to analytics
    await analytics.track('ai_call', params);

    // Log to monitoring system
    await datadog.increment('ai.calls', 1, [`feature:${params.feature}`]);
    await datadog.histogram('ai.latency', params.latency, [`feature:${params.feature}`]);
    await datadog.histogram('ai.confidence', params.confidence, [`feature:${params.feature}`]);
    await datadog.histogram('ai.cost', params.cost, [`feature:${params.feature}`]);

    // Track escalations
    if (params.escalated) {
      await datadog.increment('ai.escalations', 1, [`feature:${params.feature}`]);
    }
  }

  async getFeatureMetrics(feature: string, period: string): Promise<FeatureMetrics> {
    return await analytics.query({
      query: `
        SELECT
          COUNT(*) as total_calls,
          AVG(confidence) as avg_confidence,
          AVG(latency) as avg_latency,
          SUM(cost) as total_cost,
          SUM(CASE WHEN escalated THEN 1 ELSE 0 END) as escalations
        FROM ai_calls
        WHERE feature = $1
        AND created_at > NOW() - INTERVAL '${period}'
      `,
      params: [feature],
    });
  }
}
```

---

## AI Feature Rollout Strategy

### Phase 2 (Q2 2026)
- ✅ FAQ Bot
- ✅ Maintenance Triage
- ✅ Document Intelligence (basic)
- ✅ AI Chat Assistant (limited)

### Phase 3 (Q3 2026)
- ✅ Predictive Analytics (basic)
- ✅ Document Intelligence (advanced)
- ✅ AI Chat Assistant (full)
- ✅ Revenue Forecasting

### Phase 4 (Q4 2026)
- ✅ Predictive Analytics (advanced)
- ✅ Custom Models (fine-tuned)
- ✅ Multi-modal AI (image analysis)
- ✅ Voice AI (Phase 4+)

---

This AI integration framework provides a comprehensive, safe, and scalable approach to embedding AI capabilities throughout the PropertyOS platform while maintaining reliability, transparency, and user trust.