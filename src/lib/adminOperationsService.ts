import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  Query,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import { AdminAction } from './adminChatService';

export interface Employee {
  id?: string;
  name: string;
  email: string;
  phone: string;
  specialties?: string[]; // Changed to match Firebase schema
  categories?: string[]; // Fallback for compatibility
  isOnLeave?: boolean;
  leaveStartDate?: Timestamp;
  leaveEndDate?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  status?: string;
  rating?: number;
  role?: string;
  totalBookings?: number;
  workSchedule?: string;
}

export interface Booking {
  id?: string;
  clientId: string;
  employeeId: string;
  salonId: string;
  serviceId: string;
  serviceName?: string;
  appointmentDate: Timestamp;
  appointmentTime: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  amount?: number;
  price?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RevenueRecord {
  bookingId: string;
  date: Timestamp;
  amount: number;
  employeeId: string;
  salonId: string;
}

export class AdminOperationsService {
  private readonly COLLECTIONS = {
    EMPLOYEES: 'employees',
    BOOKINGS: 'bookings',
    EMPLOYEES_HISTORY: 'employees_history',
    ACTIONS_LOG: 'admin_actions_log',
    DAILY_REVENUE: 'daily_revenue',
    SERVICES: 'services'
  };

  /**
   * Execute admin action based on intent
   */
  async executeAdminAction(action: AdminAction): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('[AdminOperations] Executing action:', action.type);
      console.log('[AdminOperations] Action data received:', action.data);
      
      // Extract data from pattern matching results
      const { names = [], categories = [], dateType = null, email = null, phone = null } = action.data;
      
      console.log('[AdminOperations] Extracted - Names:', names, 'Email:', email, 'Phone:', phone, 'Categories:', categories);

      switch (action.type) {
        case 'ADD_EMPLOYEE': {
          const employeeData: Employee = {
            name: names[0] || 'Unknown',
            email: email || '',
            phone: phone || '',
            specialties: categories.length > 0 ? categories : [],
            categories: categories.length > 0 ? categories : []
          };
          console.log('[AdminOperations] Creating employee with data:', employeeData);
          return await this.addEmployee(employeeData);
        }

        case 'EMPLOYEE_LEAVE': {
          if (!names[0]) {
            return { success: false, message: 'Please specify which employee is on leave' };
          }
          return await this.markEmployeeOnLeave({
            employeeName: names[0],
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString()
          });
        }

        case 'REASSIGN_APPOINTMENTS': {
          if (names.length < 2) {
            return { success: false, message: 'Please specify both from and to employees' };
          }
          return await this.reassignAppointments({
            fromEmployeeName: names[0],
            toEmployeeName: names[1],
            appointmentIds: []
          });
        }

        case 'GET_REVENUE': {
          return await this.getRevenue({
            dateType: dateType || 'today'
          });
        }

        case 'GET_ANALYTICS':
          return await this.getAnalytics({ type: 'overview' });

        default:
          return { success: false, message: 'Unknown action type' };
      }
    } catch (error) {
      console.error('Error executing admin action:', error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Add new employee/stylist to database
   */
  private async addEmployee(employee: Employee): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const employeeData = {
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        specialties: employee.specialties || employee.categories || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isOnLeave: false,
        status: 'available',
        totalBookings: 0,
        rating: 5
      };

      console.log('[AdminOperations] Saving to Firestore:', employeeData);
      const docRef = await addDoc(collection(db, this.COLLECTIONS.EMPLOYEES), employeeData);
      console.log('[AdminOperations] Employee saved successfully with ID:', docRef.id);

      // Log this action
      await this.logAction('ADD_EMPLOYEE', {
        employeeId: docRef.id,
        employeeName: employee.name,
        specialties: employee.specialties || employee.categories || []
      });

      return {
        success: true,
        message: `Successfully added employee ${employee.name}${
          employee.specialties?.length || employee.categories?.length
            ? ` with specialties: ${(employee.specialties || employee.categories)?.join(', ')}`
            : ''
        }`,
        data: { employeeId: docRef.id }
      };
    } catch (error) {
      console.error('[AdminOperations] Error adding employee:', error);
      throw error;
    }
  }

  /**
   * Mark employee as on leave and ask about appointment reassignment
   */
  private async markEmployeeOnLeave(data: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const { employeeName, startDate, endDate } = data;

      // Find employee by name
      const employeeQuery = query(
        collection(db, this.COLLECTIONS.EMPLOYEES),
        where('name', '==', employeeName)
      );
      const employeeSnapshots = await getDocs(employeeQuery);
      
      if (employeeSnapshots.empty) {
        return { success: false, message: `Employee "${employeeName}" not found in system` };
      }

      const employeeDoc = employeeSnapshots.docs[0];
      const employeeId = employeeDoc.id;

      // Get all appointments for this employee during the leave period
      const appointmentQuery = query(
        collection(db, this.COLLECTIONS.BOOKINGS),
        where('employeeId', '==', employeeId),
        where('appointmentDate', '>=', Timestamp.fromDate(new Date(startDate))),
        where('appointmentDate', '<=', Timestamp.fromDate(new Date(endDate))),
        where('status', '!=', 'cancelled')
      ) as Query;

      const appointmentSnapshots = await getDocs(appointmentQuery);
      const appointments = appointmentSnapshots.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Update employee status
      const employeeRef = doc(db, this.COLLECTIONS.EMPLOYEES, employeeId);
      await updateDoc(employeeRef, {
        isOnLeave: true,
        leaveStartDate: Timestamp.fromDate(new Date(startDate)),
        leaveEndDate: Timestamp.fromDate(new Date(endDate)),
        updatedAt: Timestamp.now()
      });

      // Log this action
      await this.logAction('EMPLOYEE_LEAVE', {
        employeeId,
        employeeName,
        startDate,
        endDate,
        affectedAppointments: appointments.length
      });

      return {
        success: true,
        message: `Marked ${employeeName} on leave. Found ${appointments.length} appointments that need reassignment.`,
        data: { appointments, employeeId, employeeName }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reassign appointments from one employee to another
   */
  private async reassignAppointments(data: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const { fromEmployeeName, toEmployeeName, appointmentIds = [] } = data;

      // Find both employees by name
      const fromQuery = query(
        collection(db, this.COLLECTIONS.EMPLOYEES),
        where('name', '==', fromEmployeeName)
      );
      const fromSnapshots = await getDocs(fromQuery);

      const toQuery = query(
        collection(db, this.COLLECTIONS.EMPLOYEES),
        where('name', '==', toEmployeeName)
      );
      const toSnapshots = await getDocs(toQuery);

      if (fromSnapshots.empty) {
        return { success: false, message: `Employee "${fromEmployeeName}" not found` };
      }
      if (toSnapshots.empty) {
        return { success: false, message: `Employee "${toEmployeeName}" not found` };
      }

      const fromEmployeeId = fromSnapshots.docs[0].id;
      const toEmployeeId = toSnapshots.docs[0].id;

      // If no specific appointment IDs provided, get all of the employee's appointments
      let appointmentsToReassign = appointmentIds;
      if (appointmentIds.length === 0) {
        const allAppointmentsQuery = query(
          collection(db, this.COLLECTIONS.BOOKINGS),
          where('employeeId', '==', fromEmployeeId),
          where('status', '==', 'confirmed')
        );
        const allAppointmentsSnap = await getDocs(allAppointmentsQuery);
        appointmentsToReassign = allAppointmentsSnap.docs.map(doc => doc.id);
      }

      // Reassign appointments
      const batch = writeBatch(db);

      appointmentsToReassign.forEach((appointmentId: string) => {
        const appointmentRef = doc(db, this.COLLECTIONS.BOOKINGS, appointmentId);
        batch.update(appointmentRef, {
          employeeId: toEmployeeId,
          updatedAt: Timestamp.now()
        });
      });

      await batch.commit();

      // Log this action
      await this.logAction('REASSIGN_APPOINTMENTS', {
        fromEmployeeId,
        fromEmployeeName,
        toEmployeeId,
        toEmployeeName,
        count: appointmentsToReassign.length
      });

      return {
        success: true,
        message: `Successfully reassigned ${appointmentsToReassign.length} appointments from ${fromEmployeeName} to ${toEmployeeName}.`,
        data: { reassignedCount: appointmentsToReassign.length }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get revenue data for a specific date or date range
   */
  private async getRevenue(data: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const { dateType = 'yesterday', startDate, endDate, salonId } = data;

      let queryStart: Date;
      let queryEnd: Date;

      if (dateType === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        queryStart = yesterday;

        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);
        queryEnd = yesterdayEnd;
      } else if (dateType === 'today') {
        queryStart = new Date();
        queryStart.setHours(0, 0, 0, 0);
        queryEnd = new Date();
        queryEnd.setHours(23, 59, 59, 999);
      } else if (dateType === 'week') {
        const today = new Date();
        queryStart = new Date(today);
        queryStart.setDate(today.getDate() - today.getDay());
        queryStart.setHours(0, 0, 0, 0);
        queryEnd = new Date();
      } else if (startDate && endDate) {
        queryStart = new Date(startDate);
        queryEnd = new Date(endDate);
      } else {
        return { success: false, message: 'Invalid date range' };
      }

      // Query completed bookings in the date range
      const constraints: QueryConstraint[] = [
        where('status', '==', 'completed'),
        where('appointmentDate', '>=', Timestamp.fromDate(queryStart)),
        where('appointmentDate', '<=', Timestamp.fromDate(queryEnd))
      ];

      if (salonId) {
        constraints.push(where('salonId', '==', salonId));
      }

      const bookingQuery = query(collection(db, this.COLLECTIONS.BOOKINGS), ...constraints) as Query;
      const bookingSnapshots = await getDocs(bookingQuery);

      let totalRevenue = 0;
      const bookings = bookingSnapshots.docs.map(doc => {
        const data = doc.data() as any;
        const amount = data.amount || data.price || 0;
        totalRevenue += amount;
        return { id: doc.id, ...data, amount };
      });
      
      console.log('[AdminOperations] Revenue query:', { dateType, totalRevenue, bookingCount: bookings.length });

      // Log this action
      await this.logAction('GET_REVENUE', {
        dateType,
        totalRevenue,
        bookingCount: bookings.length
      });

      return {
        success: true,
        message: `Revenue for ${dateType}: $${totalRevenue.toFixed(2)} from ${bookings.length} bookings`,
        data: { totalRevenue, bookingCount: bookings.length, bookings }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get analytics data (bookings, employees, etc.)
   */
  private async getAnalytics(data: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const { type = 'overview' } = data;

      const employees = await getDocs(collection(db, this.COLLECTIONS.EMPLOYEES));
      const bookings = await getDocs(collection(db, this.COLLECTIONS.BOOKINGS));

      let analytics: any = {
        totalEmployees: employees.size,
        totalBookings: bookings.size
      };

      if (type === 'overview') {
        const onLeave = employees.docs.filter(doc => (doc.data() as any).isOnLeave).length;
        const completedBookings = bookings.docs.filter(doc => (doc.data() as any).status === 'completed').length;

        analytics = {
          ...analytics,
          employeesOnLeave: onLeave,
          completedBookings,
          pendingBookings: bookings.size - completedBookings
        };
      }

      return {
        success: true,
        message: 'Analytics retrieved',
        data: analytics
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Log admin actions for audit trail
   */
  private async logAction(actionType: string, actionData: any): Promise<void> {
    try {
      await addDoc(collection(db, this.COLLECTIONS.ACTIONS_LOG), {
        actionType,
        actionData,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('Error logging action:', error);
      // Don't throw - logging failures shouldn't break the main action
    }
  }

  /**
   * Get employees for reassignment selection
   */
  async getAvailableEmployees(excludeEmployeeId: string): Promise<Employee[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.EMPLOYEES),
        where('isOnLeave', '==', false)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .filter(doc => doc.id !== excludeEmployeeId)
        .map(doc => ({ id: doc.id, ...doc.data() } as Employee));
    } catch (error) {
      console.error('Error getting available employees:', error);
      throw error;
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    try {
      const docSnap = await getDocs(
        query(
          collection(db, this.COLLECTIONS.EMPLOYEES),
          where('__name__', '==', employeeId)
        )
      );
      if (!docSnap.empty) {
        const doc = docSnap.docs[0];
        return { id: doc.id, ...doc.data() } as Employee;
      }
      return null;
    } catch (error) {
      console.error('Error getting employee:', error);
      throw error;
    }
  }
}
