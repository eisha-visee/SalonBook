import { NextRequest, NextResponse } from 'next/server';
import { AdminChatService } from '@/lib/adminChatService';
import { AdminOperationsService } from '@/lib/adminOperationsService';

// Initialize chat service with AI fallback and tokens
const witaiToken = process.env.NEXT_PUBLIC_WIT_AI_TOKEN;
const hfToken = process.env.NEXT_PUBLIC_HF_API_TOKEN;

// Map to store conversation contexts by ID
const conversationSessions = new Map<string, AdminChatService>();

const adminOperationsService = new AdminOperationsService();

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId } = await request.json();
    
    // Create or get conversation session
    const sessionId = conversationId || 'default-session';
    if (!conversationSessions.has(sessionId)) {
      conversationSessions.set(sessionId, new AdminChatService(true, witaiToken, hfToken));
    }
    const adminChatService = conversationSessions.get(sessionId)!;

    // Step 1: Process message through AI service with fallback
    const chatResponse = await adminChatService.processMessage(message);

    // Step 2: If there's an actionable intent and all data is provided (no follow-up needed)
    if (
      chatResponse.actionData &&
      chatResponse.actionData.type !== 'NONE' &&
      !chatResponse.actionData.requiresFollowUp
    ) {
      const actionResult = await adminOperationsService.executeAdminAction(
        chatResponse.actionData
      );

      return NextResponse.json({
        conversationId: sessionId,
        message: chatResponse.content,
        action: chatResponse.actionData,
        actionResult,
        followUpQuestions: chatResponse.followUpQuestions
      });
    }

    // Step 3: If follow-up is needed or no action, return for user input
    return NextResponse.json({
      conversationId: sessionId,
      message: chatResponse.content,
      action: chatResponse.actionData,
      followUpQuestions: chatResponse.followUpQuestions,
      requiresFollowUp: chatResponse.actionData?.requiresFollowUp
    });
  } catch (error) {
    console.error('Error in admin chat API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
