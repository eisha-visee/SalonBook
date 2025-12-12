import { NextResponse } from 'next/server';
import { processAdminMessage } from '@/lib/adminChatService';
import { createEmployee, getRevenue, reassignAppointments, assignBookingToEmployee, cancelBooking } from '@/lib/firestore';

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
                    if (aiResponse.entities &&
                        aiResponse.entities.name &&
                        aiResponse.entities.role &&
                        aiResponse.entities.phone &&
                        aiResponse.entities.email) {

                        const employeeData = {
                            name: aiResponse.entities.name,
                            role: aiResponse.entities.role,
                            phone: aiResponse.entities.phone,
                            email: aiResponse.entities.email,
                            totalBookings: 0,
                            rating: 5,
                            status: 'available',
                            workSchedule: 'Mon-Sat, 10AM-7PM', // Default
                            joinDate: new Date().toISOString().split('T')[0], // Set join date to today
                            specialties: [] // Initialize empty array to prevent UI errors
                        };
                        await createEmployee(employeeData);
                        finalResponse += " (Employee added to database successfully.)";
                        actionResult = { success: true, type: 'ADD_EMPLOYEE' };
                    } else {
                        // Fallback if AI marked it as ADD_EMPLOYEE but missed entities (shouldn't happen with new prompt rules)
                        // But we treat it as CHAT to avoid partial adds.
                        // We don't add the success message.
                        console.log("ADD_EMPLOYEE intent detected but missing entities:", aiResponse.entities);
                    }
                    break;

                case 'GET_REVENUE':
                    console.log('📊 [GET_REVENUE] AI Response entities:', JSON.stringify(aiResponse.entities));
                    if (aiResponse.entities && aiResponse.entities.date) {
                        console.log('📊 [GET_REVENUE] Querying revenue for date:', aiResponse.entities.date);
                        const amount = await getRevenue(aiResponse.entities.date);
                        console.log('📊 [GET_REVENUE] Received amount from DB:', amount);
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

                case 'ASSIGN_BOOKING':
                    if (aiResponse.entities && (aiResponse.entities.bookingId || aiResponse.entities.BookingID) && (aiResponse.entities.stylistName || aiResponse.entities.StylistName)) {
                        // Normalize entity keys
                        const bookingId = aiResponse.entities.bookingId || aiResponse.entities.BookingID;
                        const stylistName = aiResponse.entities.stylistName || aiResponse.entities.StylistName;

                        const assignedName = await assignBookingToEmployee(bookingId, stylistName);
                        finalResponse = `Booking #${bookingId.replace('#', '')} has been assigned to ${assignedName}.`;
                        actionResult = { success: true, type: 'ASSIGN_BOOKING', bookingId, stylistName: assignedName };
                    }
                    break;

                case 'CANCEL_BOOKING':
                    if (aiResponse.entities && (aiResponse.entities.bookingId || aiResponse.entities.BookingID)) {
                        const bookingId = aiResponse.entities.bookingId || aiResponse.entities.BookingID;
                        const cancelledId = await cancelBooking(bookingId);
                        finalResponse = `Booking #${cancelledId} has been successfully cancelled.`;
                        actionResult = { success: true, type: 'CANCEL_BOOKING', bookingId: cancelledId };
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
