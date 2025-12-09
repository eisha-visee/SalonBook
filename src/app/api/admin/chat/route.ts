import { NextResponse } from 'next/server';
import { processAdminMessage } from '@/lib/adminChatService';
import { createEmployee, getRevenue, reassignAppointments } from '@/lib/firestore';

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        // 1. Get Intent and Entities from AI
        const aiResponse = await processAdminMessage(message, history || []);

        console.log("AI Response:", aiResponse);

        let finalResponse = aiResponse.response;
        let actionResult = null;

        // 2. Execute Action based on Intent
        try {
            switch (aiResponse.intent) {
                case 'ADD_EMPLOYEE':
                    if (aiResponse.entities && aiResponse.entities.name && aiResponse.entities.role) {
                        const employeeData = {
                            ...aiResponse.entities,
                            totalBookings: 0,
                            rating: 5,
                            status: 'available',
                            workSchedule: 'Mon-Sat, 10AM-7PM' // Default
                        };
                        await createEmployee(employeeData);
                        finalResponse += " (Employee added to database successfully.)";
                        actionResult = { success: true, type: 'ADD_EMPLOYEE' };
                    }
                    break;

                case 'GET_REVENUE':
                    if (aiResponse.entities && aiResponse.entities.date) {
                        const amount = await getRevenue(aiResponse.entities.date);
                        // If AI didn't include the number in text, we append it. 
                        // But usually AI should script the text 'The revenue was X'. 
                        // However, the AI doesn't know the REAL DB value yet.
                        // So we must override or append the real value.
                        finalResponse = `The revenue for ${aiResponse.entities.date} was ₹${amount}.`;
                        actionResult = { success: true, type: 'GET_REVENUE', data: amount };
                    }
                    break;

                case 'REASSIGN_APPOINTMENTS':
                    if (aiResponse.entities && aiResponse.entities.employeeName && aiResponse.entities.date) {
                        const count = await reassignAppointments(aiResponse.entities.employeeName, aiResponse.entities.date);
                        finalResponse = `I have reassigned ${count} appointments for ${aiResponse.entities.employeeName} on ${aiResponse.entities.date}.`;
                        actionResult = { success: true, type: 'REASSIGN_APPOINTMENTS', count };
                    }
                    break;
            }
        } catch (dbError: any) {
            console.error("Database Action Failed:", dbError);
            finalResponse += ` (Note: Failed to execute database action: ${dbError.message})`;
        }

        return NextResponse.json({
            role: 'model',
            message: finalResponse,
            actionResult
        });

    } catch (error: any) {
        console.error('Admin chat API fatal error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
