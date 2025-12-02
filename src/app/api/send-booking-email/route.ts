import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const bookingData = await req.json();

    const {
      customerName,
      customerEmail,
      customerPhone,
      salonName,
      salonId,
      services,
      date,
      time,
      totalAmount,
    } = bookingData;

    // 1. Save booking to Firestore first (ALWAYS SAVES - UNCHANGED)
    const bookingRef = await addDoc(collection(db, 'bookings'), {
      salonId,
      salonName,
      customerName,
      customerEmail,
      customerPhone,
      services: services.map((s: any) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration: s.duration,
      })),
      date,
      time,
      totalAmount,
      status: 'not_assigned',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('✅ Booking saved to Firestore with ID:', bookingRef.id);

    // 2. Configure Nodemailer with Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 3. Format services list for email
    const servicesList = services
      .map((service: any) => `• ${service.name} - ₹${service.price} (${service.duration} min)`)
      .join('\n');

    // 4. Send confirmation email to customer
    try {
      await transporter.sendMail({
        from: `"SalonBook" <${process.env.GMAIL_USER}>`,
        to: customerEmail,
        subject: '✅ Booking Confirmation - SalonBook',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background: linear-gradient(135deg, #FF69B4 0%, #FF1493 100%);
                  color: white;
                  padding: 30px 20px;
                  text-align: center;
                  border-radius: 8px 8px 0 0;
                }
                .header h1 {
                  margin: 0;
                  font-size: 28px;
                }
                .content {
                  background: #f9f9f9;
                  padding: 30px 20px;
                }
                .booking-details {
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .detail-row {
                  padding: 10px 0;
                  border-bottom: 1px solid #eee;
                }
                .detail-row:last-child {
                  border-bottom: none;
                }
                .label {
                  font-weight: bold;
                  color: #FF1493;
                  display: inline-block;
                  width: 120px;
                }
                .services-list {
                  background: #fff5f8;
                  padding: 15px;
                  border-left: 4px solid #FF1493;
                  margin: 15px 0;
                  white-space: pre-line;
                }
                .total {
                  font-size: 24px;
                  font-weight: bold;
                  color: #FF1493;
                  text-align: right;
                  margin-top: 20px;
                  padding-top: 15px;
                  border-top: 2px solid #FF1493;
                }
                .footer {
                  text-align: center;
                  padding: 20px;
                  color: #666;
                  font-size: 14px;
                }
                .booking-id {
                  background: #f0f0f0;
                  padding: 10px;
                  border-radius: 5px;
                  font-family: monospace;
                  text-align: center;
                  margin: 10px 0;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>🎉 Booking Confirmed!</h1>
              </div>
              
              <div class="content">
                <p>Dear <strong>${customerName}</strong>,</p>
                
                <p>Thank you for booking with <strong>${salonName}</strong> through SalonBook! Your appointment has been confirmed.</p>
                
                <div class="booking-id">
                  <strong>Booking ID:</strong> ${bookingRef.id}
                </div>
                
                <div class="booking-details">
                  <h2 style="color: #FF1493; margin-top: 0;">Booking Details</h2>
                  
                  <div class="detail-row">
                    <span class="label">Salon:</span>
                    <span>${salonName}</span>
                  </div>
                  
                  <div class="detail-row">
                    <span class="label">Date:</span>
                    <span>${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  
                  <div class="detail-row">
                    <span class="label">Time:</span>
                    <span>${time}</span>
                  </div>
                  
                  <div class="detail-row">
                    <span class="label">Phone:</span>
                    <span>${customerPhone}</span>
                  </div>
                </div>
                
                <h3 style="color: #FF1493;">Selected Services:</h3>
                <div class="services-list">${servicesList}</div>
                
                <div class="total">
                  Total Amount: ₹${totalAmount.toLocaleString()}
                </div>
                
                <p style="margin-top: 30px;">
                  <strong>Important:</strong> Please arrive 10 minutes before your scheduled time. 
                  If you need to reschedule or cancel, please contact us at least 24 hours in advance.
                </p>
              </div>
              
              <div class="footer">
                <p>Thank you for choosing SalonBook!</p>
                <p>Need help? Reply to this email or contact us at ${process.env.GMAIL_USER}</p>
              </div>
            </body>
          </html>
        `,
      });
      console.log('✅ Customer email sent to:', customerEmail);
    } catch (emailError) {
      console.error('⚠️ Customer email failed (but booking saved):', emailError);
    }

    // 5. Send notification email to admin
    try {
      await transporter.sendMail({
        from: `"SalonBook Notifications" <${process.env.GMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
        subject: `🔔 New Booking - ${customerName} at ${salonName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background: #2c3e50;
                  color: white;
                  padding: 20px;
                  text-align: center;
                }
                .content {
                  background: #f4f4f4;
                  padding: 20px;
                }
                .booking-card {
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 15px 0;
                  border-left: 4px solid #FF1493;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: 120px 1fr;
                  gap: 10px;
                  margin: 10px 0;
                }
                .label {
                  font-weight: bold;
                  color: #666;
                }
                .services {
                  background: #f9f9f9;
                  padding: 10px;
                  margin: 10px 0;
                  border-radius: 4px;
                  white-space: pre-line;
                }
                .total {
                  font-size: 20px;
                  font-weight: bold;
                  color: #FF1493;
                  text-align: right;
                  margin-top: 15px;
                  padding-top: 15px;
                  border-top: 2px solid #eee;
                }
                .booking-id {
                  background: #fff3cd;
                  padding: 10px;
                  border-radius: 5px;
                  font-family: monospace;
                  text-align: center;
                  margin: 10px 0;
                  border: 2px solid #ffc107;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>📋 New Booking Received</h1>
              </div>
              
              <div class="content">
                <div class="booking-id">
                  <strong>Firestore ID:</strong> ${bookingRef.id}
                </div>
                
                <div class="booking-card">
                  <h2 style="margin-top: 0; color: #2c3e50;">Customer Information</h2>
                  <div class="info-grid">
                    <span class="label">Name:</span>
                    <span>${customerName}</span>
                    
                    <span class="label">Email:</span>
                    <span>${customerEmail}</span>
                    
                    <span class="label">Phone:</span>
                    <span>${customerPhone}</span>
                    
                    <span class="label">Salon:</span>
                    <span>${salonName}</span>
                    
                    <span class="label">Date:</span>
                    <span>${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    
                    <span class="label">Time:</span>
                    <span>${time}</span>
                  </div>
                  
                  <h3 style="color: #2c3e50; margin-top: 20px;">Services Booked:</h3>
                  <div class="services">${servicesList}</div>
                  
                  <div class="total">
                    Total Amount: ₹${totalAmount.toLocaleString()}
                  </div>
                </div>
                
                <p style="color: #666; margin-top: 20px;">
                  <strong>Action Required:</strong> Check Firebase console or admin dashboard to assign this booking to an available employee.
                </p>
              </div>
            </body>
          </html>
        `,
      });
      console.log('✅ Admin email sent to:', process.env.ADMIN_EMAIL || process.env.GMAIL_USER);
    } catch (emailError) {
      console.error('⚠️ Admin email failed (but booking saved):', emailError);
    }

    // 6. Return success response
    return NextResponse.json({
      success: true,
      message: 'Booking saved successfully and emails sent',
      bookingId: bookingRef.id,
    });

  } catch (error: any) {
    console.error('❌ Error processing booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process booking'
      },
      { status: 500 }
    );
  }
}
