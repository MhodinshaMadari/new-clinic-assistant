import { useState, useEffect } from 'react';
import { APP_NAME, getClinicUrl } from '../config/appConfig';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Appointment, AppointmentStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import QRCode from 'qrcode';
// @ts-ignore
import mainLogo from '../assets/images/main_logo_1783512166748.jpg';

// Helper functions to load images and convert to base64
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

const generateQRCodeWithLogo = async (text: string, logoUrl: string): Promise<string> => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 180;
    
    // Draw the QR code onto the canvas
    await QRCode.toCanvas(canvas, text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 180,
      color: {
        dark: '#1e293b', // Deep slate
        light: '#ffffff'
      }
    });

    // Load the logo
    try {
      const logoImg = await loadImage(logoUrl);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const logoSize = 42; // Center size
        const x = (canvas.width - logoSize) / 2;
        const y = (canvas.height - logoSize) / 2;
        
        // Draw white square behind logo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8);
        
        // Draw logo
        ctx.drawImage(logoImg, x, y, logoSize, logoSize);
      }
    } catch (logoErr) {
      console.warn("Failed to overlay logo on QR code:", logoErr);
    }
    
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error("Failed to generate QR Code:", err);
    return '';
  }
};

export function useAppointments() {
  const { userProfile } = useAuth();
  const { activeClinic } = useClinic();
  const activeSlug = activeClinic?.slug || 'revon-dental';
  const isSuperAdmin = Boolean(userProfile?.isSuperAdmin);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'appointments'), orderBy('dateTime', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        const app = { id: docSnap.id, ...docSnap.data() } as Appointment;
        const itemSlug = app.clinicSlug || 'revon-dental';
        if (itemSlug === activeSlug) {
          list.push(app);
        }
      });
      setAppointments(list);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error fetching appointments in real-time:", err);
      setError("Failed to fetch appointments. Permission denied or connection issue.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile, activeSlug, isSuperAdmin]);

  const createAppointment = async (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      const appData = {
        ...data,
        clinicSlug: data.clinicSlug || activeSlug,
        clinicId: data.clinicId || activeClinic?.id || 'c1',
        clinicName: data.clinicName || activeClinic?.name || 'Revon Dental Clinic',
        locationId: data.locationId || activeClinic?.locations?.[0]?.id,
        locationName: data.locationName || activeClinic?.locations?.[0]?.name || 'Main Branch',
        createdAt: now,
        updatedAt: now
      };

      const appRef = await addDoc(collection(db, 'appointments'), appData);

      let previewUrl = null;
      let emailStatus = 'sent';

      // Check if patient has disabled email reminders
      let isEmailRemindersEnabled = true;
      if (data.patientId) {
        try {
          const patientSnap = await getDoc(doc(db, 'users', data.patientId));
          if (patientSnap.exists() && patientSnap.data()?.emailRemindersEnabled === false) {
            isEmailRemindersEnabled = false;
          }
        } catch (err) {
          console.warn("Could not check patient email reminder settings:", err);
        }
      }

      if (isEmailRemindersEnabled) {
        let qrBase64 = '';
        try {
          const targetSlug = data.clinicSlug || activeSlug || 'revon-dental';
          const appUrl = getClinicUrl(targetSlug);
          qrBase64 = await generateQRCodeWithLogo(appUrl, mainLogo);
        } catch (qrErr) {
          console.warn("Failed to generate QR Code for email:", qrErr);
        }

        // Dispatch the email in 100% real-time via server-side SMTP
        try {
          const emailHtml = `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <div style="background: linear-gradient(135deg, #042f2e, #0f766e); padding: 24px; text-align: center; color: white;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 800; tracking-tight: -0.025em; letter-spacing: 0.05em;">${APP_NAME.toUpperCase()}</h2>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #ccfbf1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Painless Care with Surgical Precision</p>
              </div>
              <div style="padding: 24px; background-color: #fafaf9; color: #1c1917;">
                <h3 style="margin-top: 0; font-size: 18px; font-weight: 700; color: #0f766e;">Booking Confirmation</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #44403c;">Your appointment has been successfully scheduled and is confirmed. Below are your clinical booking details:</p>
                <div style="background-color: white; border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; margin: 20px 0;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                      <td style="padding: 6px 0; color: #78716c; font-weight: 500; width: 35%;">Treatment</td>
                      <td style="padding: 6px 0; color: #1c1917; font-weight: 700;">${data.treatment}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #78716c; font-weight: 500;">Specialist</td>
                      <td style="padding: 6px 0; color: #1c1917; font-weight: 700;">${data.dentistName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #78716c; font-weight: 500;">Date & Time</td>
                      <td style="padding: 6px 0; color: #0d9488; font-weight: 700;">${new Date(data.dateTime).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #78716c; font-weight: 500;">Clinic Location</td>
                      <td style="padding: 6px 0; color: #1c1917; font-weight: 600;">${data.locationName ? `${data.locationName}` : `${APP_NAME}, Bengaluru, India`}</td>
                    </tr>
                  </table>
                </div>
                <p style="font-size: 13px; line-height: 1.6; color: #44403c; margin-bottom: 0;">If you need to reschedule or view your queue status in real-time, please sign into your patient portal.</p>
              </div>
              <div style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; font-family: system-ui, sans-serif;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="vertical-align: middle; width: 64px;">
                      <img src="${qrBase64}" width="60" height="60" alt="Patient Portal QR" style="display: block; border-radius: 6px; border: 1px solid #cbd5e1;" />
                    </td>
                    <td style="vertical-align: middle; padding-left: 12px; text-align: left;">
                      <strong style="color: #0f172a; font-size: 11px; display: block;">${APP_NAME.toUpperCase()} PATIENT PORTAL</strong>
                      <p style="margin: 2px 0 0 0; font-size: 10px; line-height: 1.3; color: #64748b;">
                        Scan to sign in, track appointments, and view treatments.
                      </p>
                    </td>
                    <td style="vertical-align: middle; text-align: right; padding-left: 12px;">
                      <p style="margin: 0; font-size: 10px; color: #94a3b8;">
                        Dedicated Patient Care Unit • Bengaluru
                      </p>
                      <p style="margin: 2px 0 0 0; font-size: 9px; color: #94a3b8;">
                        Sent in real-time by ${APP_NAME} Hub
                      </p>
                      <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                        crafted by ZF CREATIONS
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          `;

          const emailRes = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: data.patientEmail,
              subject: `Confirmed: Appointment for ${data.treatment} - ${APP_NAME}`,
              html: emailHtml,
              text: `Confirmed: Appointment for ${data.treatment} with ${data.dentistName} on ${new Date(data.dateTime).toLocaleString()}`
            })
          });

          if (emailRes.ok) {
            const emailData = await emailRes.json();
            previewUrl = emailData.previewUrl;
          }
        } catch (err) {
          console.warn("Failed to dispatch real-time email via server api:", err);
          emailStatus = 'failed';
        }

        await addDoc(collection(db, 'reminders'), {
          appointmentId: appRef.id,
          patientEmail: data.patientEmail,
          sentAt: now,
          type: 'email',
          status: emailStatus,
          previewUrl: previewUrl,
          details: `Booking confirmation dispatched for ${data.treatment} on ${new Date(data.dateTime).toLocaleString()}`
        });
      } else {
        // Log that reminder email was skipped due to patient opt-out preference
        await addDoc(collection(db, 'reminders'), {
          appointmentId: appRef.id,
          patientEmail: data.patientEmail,
          sentAt: now,
          type: 'email',
          status: 'disabled',
          previewUrl: null,
          details: `Booking confirmation email suppressed: Patient has disabled email reminders in profile preferences`
        });
      }

      return appRef.id;
    } catch (err: any) {
      console.error("Error booking appointment:", err);
      throw new Error(err.message || "Failed to book appointment");
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus, additionalNotes?: string) => {
    try {
      const appRef = doc(db, 'appointments', appointmentId);
      const updateData: Partial<Appointment> = {
        status,
        updatedAt: new Date().toISOString()
      };
      if (additionalNotes !== undefined) {
        updateData.notes = additionalNotes;
      }
      await updateDoc(appRef, updateData);

      // Get patient details for real-time email
      const appSnap = await getDoc(appRef);
      const appData = appSnap.exists() ? appSnap.data() : null;
      const patientEmail = appData ? appData.patientEmail : "";
      const patientId = appData ? appData.patientId : "";
      const treatment = appData ? appData.treatment : "Dental Care";
      const dentistName = appData ? appData.dentistName : "Specialist";

      let isEmailRemindersEnabled = true;
      if (patientId) {
        try {
          const patientSnap = await getDoc(doc(db, 'users', patientId));
          if (patientSnap.exists() && patientSnap.data()?.emailRemindersEnabled === false) {
            isEmailRemindersEnabled = false;
          }
        } catch (err) {
          console.warn("Could not check patient email reminder settings:", err);
        }
      }

      let previewUrl = null;
      let emailStatus = 'sent';

      if (patientEmail && isEmailRemindersEnabled) {
        try {
          let qrBase64 = '';
          try {
            const targetSlug = appData?.clinicSlug || activeSlug || 'revon-dental';
            const appUrl = getClinicUrl(targetSlug);
            qrBase64 = await generateQRCodeWithLogo(appUrl, mainLogo);
          } catch (qrErr) {
            console.warn("Failed to generate QR Code for email:", qrErr);
          }

          const emailHtml = `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <div style="background: linear-gradient(135deg, #042f2e, #0f766e); padding: 24px; text-align: center; color: white;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 800; tracking-tight: -0.025em; letter-spacing: 0.05em;">${APP_NAME.toUpperCase()}</h2>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #ccfbf1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Painless Care with Surgical Precision</p>
              </div>
              <div style="padding: 24px; background-color: #fafaf9; color: #1c1917;">
                <h3 style="margin-top: 0; font-size: 18px; font-weight: 700; color: #0d9488;">Appointment Status Updated</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #44403c;">There has been an update to your booking. Your appointment status has been updated to <strong>${status.toUpperCase()}</strong>.</p>
                <div style="background-color: white; border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; margin: 20px 0;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                      <td style="padding: 6px 0; color: #78716c; font-weight: 500; width: 35%;">Treatment</td>
                      <td style="padding: 6px 0; color: #1c1917; font-weight: 700;">${treatment}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #78716c; font-weight: 500;">Specialist</td>
                      <td style="padding: 6px 0; color: #1c1917; font-weight: 700;">${dentistName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #78716c; font-weight: 500;">New Status</td>
                      <td style="padding: 6px 0; color: #0d9488; font-weight: 700; text-transform: uppercase;">${status}</td>
                    </tr>
                    ${additionalNotes ? `
                    <tr>
                      <td style="padding: 6px 0; color: #78716c; font-weight: 500;">Clinic Notes</td>
                      <td style="padding: 6px 0; color: #44403c; font-style: italic;">"${additionalNotes}"</td>
                    </tr>
                    ` : ""}
                  </table>
                </div>
                <p style="font-size: 13px; line-height: 1.6; color: #44403c; margin-bottom: 0;">Sign in to your patient portal anytime to trace your real-time slot progression and live treatment charts.</p>
              </div>
              <div style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; font-family: system-ui, sans-serif;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="vertical-align: middle; width: 64px;">
                      <img src="${qrBase64}" width="60" height="60" alt="Patient Portal QR" style="display: block; border-radius: 6px; border: 1px solid #cbd5e1;" />
                    </td>
                    <td style="vertical-align: middle; padding-left: 12px; text-align: left;">
                      <strong style="color: #0f172a; font-size: 11px; display: block;">${APP_NAME.toUpperCase()} PATIENT PORTAL</strong>
                      <p style="margin: 2px 0 0 0; font-size: 10px; line-height: 1.3; color: #64748b;">
                        Scan to sign in, track appointments, and view treatments.
                      </p>
                    </td>
                    <td style="vertical-align: middle; text-align: right; padding-left: 12px;">
                      <p style="margin: 0; font-size: 10px; color: #94a3b8;">
                        Dedicated Patient Care Unit • Bengaluru
                      </p>
                      <p style="margin: 2px 0 0 0; font-size: 9px; color: #94a3b8;">
                        Sent in real-time by ${APP_NAME} Hub
                      </p>
                      <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                        crafted by ZF CREATIONS
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          `;

          const emailRes = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: patientEmail,
              subject: `Update: Appointment ${status.toUpperCase()} - ${APP_NAME}`,
              html: emailHtml,
              text: `Your appointment for ${treatment} is now ${status.toUpperCase()}. Notes: ${additionalNotes || "None"}`
            })
          });

          if (emailRes.ok) {
            const emailData = await emailRes.json();
            previewUrl = emailData.previewUrl;
          }
        } catch (err) {
          console.warn("Failed to dispatch real-time update email via server api:", err);
          emailStatus = 'failed';
        }
      }

      // Log a status update reminder log
      await addDoc(collection(db, 'reminders'), {
        appointmentId,
        patientEmail,
        sentAt: new Date().toISOString(),
        type: 'email',
        status: isEmailRemindersEnabled ? emailStatus : 'disabled',
        previewUrl: previewUrl,
        details: isEmailRemindersEnabled
          ? `Status updated to [${status.toUpperCase()}] for your dental appointment.`
          : `Status update email suppressed: Patient has disabled email reminders in profile preferences.`
      });

    } catch (err: any) {
      console.error("Error updating appointment:", err);
      throw new Error(err.message || "Failed to update appointment");
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    try {
      await deleteDoc(doc(db, 'appointments', appointmentId));
    } catch (err: any) {
      console.error("Error deleting appointment:", err);
      throw new Error(err.message || "Failed to delete appointment");
    }
  };

  return {
    appointments,
    loading,
    error,
    createAppointment,
    updateAppointmentStatus,
    deleteAppointment
  };
}
