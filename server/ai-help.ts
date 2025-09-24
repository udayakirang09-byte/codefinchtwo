import OpenAI from "openai";
import { db } from "./db";
import { helpKnowledgeBase, helpTickets, helpTicketMessages } from "@shared/schema";
import { eq, ilike, or } from "drizzle-orm";

// Use the same OpenAI setup as ai-analytics.ts
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AIHelpService {
  
  // Analyze user question and provide AI-powered response
  async generateHelpResponse(question: string, category: string = "general", userId?: string): Promise<{
    aiResponse: string;
    confidence: number;
    suggestedKnowledgeBase: any[];
    escalateToHuman: boolean;
  }> {
    try {
      // First, search knowledge base for relevant articles
      const knowledgeBaseResults = await this.searchKnowledgeBase(question, category);
      
      // Create context from knowledge base
      const context = knowledgeBaseResults.map(kb => 
        `Title: ${kb.title}\nCategory: ${kb.category}\nContent: ${kb.content}`
      ).join('\n\n');

      // Generate AI response using OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{
          role: "system",
          content: `You are KADB (Knowledge Assistant for Digital Beginners), an AI help assistant for CodeConnect, an educational platform that connects young students with coding mentors. 

Your role:
- Provide helpful, accurate, and age-appropriate responses to user questions
- Be encouraging and supportive, especially for young learners
- Focus on educational platform features: mentors, courses, bookings, payments, achievements
- Escalate complex technical issues or sensitive topics to human support
- Always maintain a friendly, professional tone

Knowledge Base Context:
${context}

Categories you can help with:
- general: Platform navigation, getting started
- technical: Login issues, booking problems, app functionality  
- payment: Billing questions, refunds, transaction issues
- account: Profile settings, password reset, user management
- course: Course content, mentor matching, learning paths

Response Guidelines:
- Keep responses concise but helpful (2-3 paragraphs max)
- Include specific steps when possible
- Reference knowledge base articles when relevant
- Suggest escalation for complex issues
- Use encouraging language for young learners`
        }, {
          role: "user",
          content: `Category: ${category}\n\nUser Question: ${question}\n\nPlease provide a helpful response. Also indicate your confidence level (0-1) and whether this should be escalated to human support.`
        }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        aiResponse: result.response || "I'd be happy to help! Let me connect you with our support team for personalized assistance.",
        confidence: parseFloat(result.confidence || "0.7"),
        suggestedKnowledgeBase: knowledgeBaseResults.slice(0, 3),
        escalateToHuman: result.escalateToHuman || false
      };

    } catch (error) {
      console.error('AI Help Service Error:', error);
      
      // Fallback response if AI fails
      return {
        aiResponse: "I'm having trouble processing your question right now. Our support team will get back to you shortly with a personal response!",
        confidence: 0.1,
        suggestedKnowledgeBase: [],
        escalateToHuman: true
      };
    }
  }

  // Search knowledge base for relevant articles
  async searchKnowledgeBase(query: string, category?: string): Promise<any[]> {
    try {
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
      
      let whereConditions: any = [];
      
      // Add category filter if provided
      if (category && category !== 'general') {
        whereConditions.push(eq(helpKnowledgeBase.category, category));
      }
      
      // Add text search conditions
      const textSearchConditions = searchTerms.map(term => 
        or(
          ilike(helpKnowledgeBase.title, `%${term}%`),
          ilike(helpKnowledgeBase.content, `%${term}%`),
          ilike(helpKnowledgeBase.searchKeywords, `%${term}%`)
        )
      );

      whereConditions.push(...textSearchConditions);

      const results = await db.select()
        .from(helpKnowledgeBase)
        .where(
          whereConditions.length > 1 
            ? or(...whereConditions)
            : whereConditions[0]
        )
        .limit(5);

      // Update view counts
      for (const result of results) {
        await db.update(helpKnowledgeBase)
          .set({ viewCount: (result.viewCount || 0) + 1 })
          .where(eq(helpKnowledgeBase.id, result.id));
      }

      return results;
    } catch (error) {
      console.error('Knowledge Base Search Error:', error);
      return [];
    }
  }

  // Analyze ticket sentiment and categorize automatically
  async analyzeTicketSentiment(description: string): Promise<{
    category: string;
    priority: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    urgencyScore: number;
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{
          role: "system",
          content: "You are an AI assistant that analyzes support tickets for an educational platform. Categorize tickets and assess their urgency and sentiment."
        }, {
          role: "user",
          content: `Analyze this support ticket and categorize it:

Ticket Description: "${description}"

Please analyze and return JSON with:
- category: general, technical, payment, account, course
- priority: low, medium, high, urgent  
- sentiment: positive, neutral, negative
- urgencyScore: 0-1 (0=not urgent, 1=very urgent)

Consider factors like: 
- Keywords indicating urgency (urgent, asap, broken, not working)
- Payment/billing issues (higher priority)
- Educational impact (student can't access learning)
- Emotional tone and frustration level`
        }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        category: result.category || 'general',
        priority: result.priority || 'medium',
        sentiment: result.sentiment || 'neutral',
        urgencyScore: parseFloat(result.urgencyScore || "0.5")
      };

    } catch (error) {
      console.error('Ticket Analysis Error:', error);
      
      // Fallback analysis
      return {
        category: 'general',
        priority: 'medium',
        sentiment: 'neutral',
        urgencyScore: 0.5
      };
    }
  }

  // Generate knowledge base articles from common support questions
  async generateKnowledgeBaseArticle(topic: string, category: string): Promise<{
    title: string;
    content: string;
    searchKeywords: string;
    tags: string[];
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{
          role: "system",
          content: "You are a technical writer creating helpful knowledge base articles for CodeConnect, an educational platform for young coders. Write clear, step-by-step guides that are easy for students and parents to understand."
        }, {
          role: "user",
          content: `Create a comprehensive knowledge base article about: "${topic}"

Category: ${category}

Please return JSON with:
- title: Clear, specific title
- content: Detailed article with step-by-step instructions (use markdown formatting)
- searchKeywords: Comma-separated keywords for searching
- tags: Array of relevant tags

Make it:
- Age-appropriate for young learners (8-18 years)
- Include specific steps and screenshots references
- Cover common questions and troubleshooting
- Encouraging and supportive tone`
        }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        title: result.title || topic,
        content: result.content || `# ${topic}\n\nThis article is being prepared. Please contact support for immediate assistance.`,
        searchKeywords: result.searchKeywords || topic,
        tags: result.tags || [category]
      };

    } catch (error) {
      console.error('Knowledge Base Generation Error:', error);
      
      return {
        title: topic,
        content: `# ${topic}\n\nThis article is being prepared. Please contact support for immediate assistance.`,
        searchKeywords: topic,
        tags: [category]
      };
    }
  }
}

export const aiHelpService = new AIHelpService();