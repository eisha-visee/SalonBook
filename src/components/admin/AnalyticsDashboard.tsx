'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Booking {
    id: string;
    totalAmount: number;
    date: string;
    status: string;
    services: { name: string }[];
}

export default function AnalyticsDashboard() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalBookings: 0,
        activeClients: 0, // We'll estimate this from unique emails in bookings for now
        avgOrderValue: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const bookingsSnapshot = await getDocs(query(collection(db, 'bookings'), orderBy('date', 'asc')));
                const bookingsData = bookingsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Booking[];

                setBookings(bookingsData);

                // Calculate Stats
                const totalRevenue = bookingsData.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
                const uniqueClients = new Set(bookingsData.map((b: any) => b.customerEmail)).size;

                setStats({
                    totalRevenue,
                    totalBookings: bookingsData.length,
                    activeClients: uniqueClients,
                    avgOrderValue: bookingsData.length ? Math.round(totalRevenue / bookingsData.length) : 0
                });

                setLoading(false);
            } catch (error) {
                console.error('Error fetching analytics data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Prepare Chart Data
    const revenueData = useMemo(() => {
        const data: Record<string, number> = {};
        bookings.forEach(b => {
            const date = b.date; // Assuming YYYY-MM-DD
            data[date] = (data[date] || 0) + (b.totalAmount || 0);
        });
        return Object.entries(data)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-7); // Last 7 days with data
    }, [bookings]);

    const serviceData = useMemo(() => {
        const data: Record<string, number> = {};
        bookings.forEach(b => {
            b.services?.forEach(s => {
                data[s.name] = (data[s.name] || 0) + 1;
            });
        });
        return Object.entries(data)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 services
    }, [bookings]);

    const statusData = useMemo(() => {
        const data: Record<string, number> = {};
        bookings.forEach(b => {
            const status = b.status || 'unknown';
            data[status] = (data[status] || 0) + 1;
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [bookings]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (loading) {
        return <div className="loading-spinner">Loading analytics...</div>;
    }

    return (
        <div className="analytics-dashboard">
            {/* Key Metrics */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <h3>Total Revenue</h3>
                    <p className="metric-value">₹{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="metric-card">
                    <h3>Total Bookings</h3>
                    <p className="metric-value">{stats.totalBookings}</p>
                </div>
                <div className="metric-card">
                    <h3>Active Clients</h3>
                    <p className="metric-value">{stats.activeClients}</p>
                </div>
                <div className="metric-card">
                    <h3>Avg. Order Value</h3>
                    <p className="metric-value">₹{stats.avgOrderValue}</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
                {/* Revenue Trend */}
                <div className="chart-card">
                    <h3>Revenue Trend (Last 7 Active Days)</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="amount" stroke="#FF6B9D" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Services */}
                <div className="chart-card">
                    <h3>Top Services</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={serviceData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" fill="#8884d8" name="Bookings" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Booking Status */}
                <div className="chart-card">
                    <h3>Booking Status Distribution</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .analytics-dashboard {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                }

                .metric-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .metric-card h3 {
                    font-size: 0.875rem;
                    color: #6B7280;
                    margin: 0 0 0.5rem 0;
                }

                .metric-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1F2937;
                    margin: 0;
                }

                .charts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 1.5rem;
                }

                .chart-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    height: 400px;
                    display: flex;
                    flex-direction: column;
                }

                .chart-card h3 {
                    margin: 0 0 1rem 0;
                    font-size: 1.125rem;
                    color: #374151;
                }

                .chart-container {
                    flex: 1;
                    width: 100%;
                    min-height: 0;
                }

                .loading-spinner {
                    text-align: center;
                    padding: 2rem;
                    color: #6B7280;
                }
            `}</style>
        </div>
    );
}
