import { useState } from "react";
import { useLoaderData, Link, Form, redirect, useNavigate, useSearchParams, useActionData } from "react-router";
import { reservationAPI } from "../services/api";
import { Button } from "../components/Button";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const view = url.searchParams.get("view") || "month";
  const dateParam = url.searchParams.get("date") || new Date().toISOString().split("T")[0];
  
  const currentDate = new Date(dateParam);
  let startDate: string;
  let endDate: string;

  if (view === "week") {
    // Get start of week (Sunday)
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    startDate = start.toISOString().split("T")[0];
    
    // Get end of week (Saturday)
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    endDate = end.toISOString().split("T")[0];
  } else {
    // Month view - get first and last day of month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    startDate = new Date(year, month, 1).toISOString().split("T")[0];
    endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];
  }

  try {
    const reservations = await reservationAPI.getByDateRange(startDate, endDate);
    return { reservations, currentDate: dateParam, view };
  } catch (error) {
    console.error("Error loading reservations:", error);
    return { reservations: [], currentDate: dateParam, view };
  }
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const actionType = formData.get("action");
  const reservationId = formData.get("reservationId");
  const redirectTo = formData.get("redirectTo")?.toString() || "/front-desk";

  try {
    if (actionType === "checkIn" && reservationId) {
      await reservationAPI.checkIn(Number(reservationId));
    } else if (actionType === "checkOut" && reservationId) {
      await reservationAPI.checkOut(Number(reservationId));
    }
    return redirect(redirectTo);
  } catch (error) {
    console.error("Error in front desk action:", error);
    return { error: error instanceof Error ? error.message : "Action failed" };
  }
}

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];
  
  // Add days from previous month to fill the week
  const startDay = firstDay.getDay();
  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(date);
  }
  
  // Add days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }
  
  // Add days from next month to fill the week
  const remainingDays = 42 - days.length; // 6 weeks * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    days.push(new Date(year, month + 1, day));
  }
  
  return days;
}

function getWeekDays(date: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay()); // Start from Sunday
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  
  return days;
}

function formatDate(date: Date | string): string {
  if (typeof date === "string") {
    // If it's already in YYYY-MM-DD format, return it as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Otherwise parse it
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  // For Date objects, use local date components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(date1: Date | string, date2: Date | string): boolean {
  return formatDate(date1) === formatDate(date2);
}

function isDateInRange(date: Date, startDate: string, endDate: string): boolean {
  const dateStr = formatDate(date);
  return dateStr >= startDate && dateStr <= endDate;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
    CONFIRMED: "bg-blue-100 text-blue-800 border-blue-300",
    CHECKED_IN: "bg-green-100 text-green-800 border-green-300",
    CHECKED_OUT: "bg-gray-100 text-gray-800 border-gray-300",
    CANCELLED: "bg-red-100 text-red-800 border-red-300",
    NO_SHOW: "bg-orange-100 text-orange-800 border-orange-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
}

export default function FrontDeskPage() {
  const { reservations, currentDate, view } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  const date = new Date(currentDate);
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const navigateDate = (direction: "prev" | "next") => {
    const params = new URLSearchParams(searchParams);
    const current = new Date(currentDate);
    
    if (view === "week") {
      current.setDate(current.getDate() + (direction === "next" ? 7 : -7));
    } else {
      current.setMonth(current.getMonth() + (direction === "next" ? 1 : -1));
    }
    
    params.set("date", formatDate(current));
    // Preserve view parameter
    if (view) {
      params.set("view", view);
    }
    navigate(`/front-desk?${params.toString()}`);
  };
  
  const changeView = (newView: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("view", newView);
    // Preserve the date when changing views
    params.set("date", currentDate);
    navigate(`/front-desk?${params.toString()}`);
  };
  
  const goToToday = () => {
    const params = new URLSearchParams(searchParams);
    params.set("date", formatDate(new Date()));
    // Preserve view parameter
    if (view) {
      params.set("view", view);
    }
    navigate(`/front-desk?${params.toString()}`);
  };
  
  const getReservationsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    const filtered = reservations.filter((res: any) => {
      // Use formatDate to ensure consistent date string format (YYYY-MM-DD)
      const checkInDate = formatDate(res.checkInDate);
      const checkOutDate = formatDate(res.checkOutDate);
      return dateStr >= checkInDate && dateStr <= checkOutDate;
    });
    
    // Sort reservations: pending check-ins first, then checked-in, then check-outs
    return filtered.sort((a: any, b: any) => {
      const aCheckIn = isSameDay(date, a.checkInDate);
      const bCheckIn = isSameDay(date, b.checkInDate);
      const aCheckOut = isSameDay(date, a.checkOutDate);
      const bCheckOut = isSameDay(date, b.checkOutDate);
      
      // Priority 1: Pending check-ins (PENDING or CONFIRMED on check-in date)
      const aIsPendingCheckIn = aCheckIn && (a.status === "PENDING" || a.status === "CONFIRMED");
      const bIsPendingCheckIn = bCheckIn && (b.status === "PENDING" || b.status === "CONFIRMED");
      
      if (aIsPendingCheckIn && !bIsPendingCheckIn) return -1;
      if (!aIsPendingCheckIn && bIsPendingCheckIn) return 1;
      
      // Priority 2: Checked-in guests (CHECKED_IN status)
      const aIsCheckedIn = a.status === "CHECKED_IN";
      const bIsCheckedIn = b.status === "CHECKED_IN";
      
      if (aIsCheckedIn && !bIsCheckedIn && !bIsPendingCheckIn) return -1;
      if (!aIsCheckedIn && bIsCheckedIn && !aIsPendingCheckIn) return 1;
      
      // Priority 3: Check-outs (on check-out date)
      if (aCheckOut && !bCheckOut && !bIsCheckedIn && !bIsPendingCheckIn) return -1;
      if (!aCheckOut && bCheckOut && !aIsCheckedIn && !aIsPendingCheckIn) return 1;
      
      // Within same priority, sort by room number
      const aRoom = a.room?.roomNumber || String(a.roomId);
      const bRoom = b.room?.roomNumber || String(b.roomId);
      return aRoom.localeCompare(bRoom);
    });
  };
  
  const canCheckIn = (reservation: any) => {
    return reservation.status === "CONFIRMED" || reservation.status === "PENDING";
  };
  
  const canCheckOut = (reservation: any) => {
    return reservation.status === "CHECKED_IN";
  };
  
  const today = formatDate(new Date());
  
  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Front Desk</h1>
          <p className="mt-2 text-gray-600">Calendar view of bookings and reservations</p>
        </div>
        <div className="flex gap-4 items-start">
          {/* Status Legend */}
          <div className="bg-white rounded-lg shadow p-3">
            <h3 className="text-xs font-medium text-gray-700 mb-2">Status</h3>
            <div className="flex flex-wrap gap-2">
              {["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW"].map((status) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded border ${getStatusColor(status)}`}></div>
                  <span className="text-xs text-gray-600">{status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
          <Button to="/bookings/new" variant="primary">
            New Booking
          </Button>
        </div>
      </div>
      
      {actionData?.error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Error:</p>
          <p className="text-sm">{actionData.error}</p>
        </div>
      )}
      
      {/* Calendar View */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Calendar Header with Navigation */}
        <div className="border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateDate("prev")}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                aria-label="Previous"
              >
                ←
              </button>
              <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                {view === "week" 
                  ? `Week of ${new Date(date).toLocaleDateString()}`
                  : `${monthNames[month]} ${year}`
                }
              </h2>
              <button
                onClick={() => navigateDate("next")}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                aria-label="Next"
              >
                →
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Today
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => changeView("week")}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  view === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => changeView("month")}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  view === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>
        {view === "month" ? (
          <div className="grid grid-cols-7">
            {/* Day Headers */}
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-xs font-semibold text-gray-700 bg-gray-50 border-b border-r border-gray-200"
              >
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {getDaysInMonth(year, month).map((day, index) => {
              const dayReservations = getReservationsForDate(day);
              const isCurrentMonth = day.getMonth() === month;
              const isToday = isSameDay(day, today);
              
              return (
                <div
                  key={index}
                  className={`min-h-20 p-1.5 border-b border-r border-gray-200 ${
                    !isCurrentMonth ? "bg-gray-50" : "bg-white"
                  } ${isToday ? "ring-1 ring-blue-500" : ""} ${
                    dayReservations.length > 0 ? "cursor-pointer hover:bg-gray-50" : ""
                  }`}
                  onClick={() => {
                    if (dayReservations.length > 0) {
                      setSelectedDay(day);
                    }
                  }}
                >
                  <div
                    className={`text-xs font-medium mb-0.5 ${
                      isCurrentMonth ? "text-gray-900" : "text-gray-400"
                    } ${isToday ? "text-blue-600" : ""}`}
                  >
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayReservations.slice(0, 5).map((reservation: any) => {
                      const isCheckIn = isSameDay(day, reservation.checkInDate);
                      const isCheckOut = isSameDay(day, reservation.checkOutDate);
                      
                      return (
                        <Link
                          key={reservation.id}
                          to={`/bookings/${reservation.id}`}
                          className={`block px-1.5 py-0.5 text-xs rounded border ${getStatusColor(
                            reservation.status
                          )} hover:opacity-80 truncate leading-tight`}
                          title={`${reservation.guest?.firstName || ""} ${reservation.guest?.lastName || ""} - Room ${reservation.room?.roomNumber || reservation.roomId}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-0.5">
                            {isCheckIn && <span className="font-bold text-[10px]">→</span>}
                            {isCheckOut && <span className="font-bold text-[10px]">←</span>}
                            <span className="truncate text-[11px]">
                              {reservation.room?.roomNumber || `R${reservation.roomId}`}
                            </span>
                          </div>
                          <div className="truncate text-[10px] leading-tight">
                            {reservation.guest?.firstName || "Guest"}
                          </div>
                        </Link>
                      );
                    })}
                    {dayReservations.length > 5 && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedDay(day);
                        }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 px-1 font-medium hover:underline cursor-pointer"
                      >
                        +{dayReservations.length - 5} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {/* Day Headers */}
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-semibold text-gray-700 bg-gray-50 border-b border-r border-gray-200"
              >
                {day}
              </div>
            ))}
            
            {/* Week Days */}
            {getWeekDays(date).map((day, index) => {
              const dayReservations = getReservationsForDate(day);
              const isToday = isSameDay(day, today);
              
              return (
                <div
                  key={index}
                  className={`min-h-96 p-3 border-b border-r border-gray-200 bg-white ${
                    isToday ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <div
                    className={`text-lg font-semibold mb-3 ${
                      isToday ? "text-blue-600" : "text-gray-900"
                    }`}
                  >
                    {day.getDate()} {monthNames[day.getMonth()].substring(0, 3)}
                  </div>
                  <div className="space-y-2">
                    {dayReservations.map((reservation: any) => {
                      const isCheckIn = isSameDay(day, reservation.checkInDate);
                      const isCheckOut = isSameDay(day, reservation.checkOutDate);
                      
                      return (
                        <div
                          key={reservation.id}
                          className={`p-2 rounded border ${getStatusColor(
                            reservation.status
                          )}`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <Link
                              to={`/bookings/${reservation.id}`}
                              className="font-semibold text-sm hover:underline"
                            >
                              {reservation.room?.roomNumber || `Room ${reservation.roomId}`}
                            </Link>
                            <div className="flex gap-1">
                              {isCheckIn && (
                                <span className="text-xs font-bold" title="Check-in">→</span>
                              )}
                              {isCheckOut && (
                                <span className="text-xs font-bold" title="Check-out">←</span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs mb-2">
                            {reservation.guest?.firstName} {reservation.guest?.lastName}
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            {new Date(reservation.checkInDate).toLocaleDateString()} -{" "}
                            {new Date(reservation.checkOutDate).toLocaleDateString()}
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {canCheckIn(reservation) && (
                              <Form method="post" className="inline">
                                <input type="hidden" name="action" value="checkIn" />
                                <input type="hidden" name="reservationId" value={reservation.id} />
                                <input
                                  type="hidden"
                                  name="redirectTo"
                                  value={`/front-desk?view=${view}&date=${currentDate}`}
                                />
                                <button
                                  type="submit"
                                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Check In
                                </button>
                              </Form>
                            )}
                            {canCheckOut(reservation) && (
                              <Form method="post" className="inline">
                                <input type="hidden" name="action" value="checkOut" />
                                <input type="hidden" name="reservationId" value={reservation.id} />
                                <input
                                  type="hidden"
                                  name="redirectTo"
                                  value={`/front-desk?view=${view}&date=${currentDate}`}
                                />
                                <button
                                  type="submit"
                                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Check Out
                                </button>
                              </Form>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {dayReservations.length === 0 && (
                      <div className="text-sm text-gray-400 text-center py-4">No bookings</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Bookings</div>
          <div className="text-2xl font-bold text-gray-900">{reservations.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Check-ins Today</div>
          <div className="text-2xl font-bold text-green-600">
            {reservations.filter(
              (r: any) => isSameDay(r.checkInDate, today) && (r.status === "CONFIRMED" || r.status === "PENDING")
            ).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Check-outs Today</div>
          <div className="text-2xl font-bold text-blue-600">
            {reservations.filter(
              (r: any) => isSameDay(r.checkOutDate, today) && r.status === "CHECKED_IN"
            ).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Currently Checked In</div>
          <div className="text-2xl font-bold text-purple-600">
            {reservations.filter((r: any) => r.status === "CHECKED_IN").length}
          </div>
        </div>
      </div>
      
      {/* Day Bookings Modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-10 flex items-center justify-center z-50"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Bookings for {selectedDay.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {(() => {
                const dayReservations = getReservationsForDate(selectedDay);
                
                if (dayReservations.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      No bookings for this day
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-3">
                    {dayReservations.map((reservation: any) => {
                      const isCheckIn = isSameDay(selectedDay, reservation.checkInDate);
                      const isCheckOut = isSameDay(selectedDay, reservation.checkOutDate);
                      
                      return (
                        <div
                          key={reservation.id}
                          className={`p-4 rounded-lg border ${getStatusColor(
                            reservation.status
                          )}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <Link
                                to={`/bookings/${reservation.id}`}
                                className="font-semibold text-lg hover:underline text-gray-900"
                              >
                                {reservation.room?.roomNumber || `Room ${reservation.roomId}`}
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                {isCheckIn && (
                                  <span className="text-xs font-bold px-2 py-1 bg-green-200 text-green-800 rounded" title="Check-in">
                                    → Check-in
                                  </span>
                                )}
                                {isCheckOut && (
                                  <span className="text-xs font-bold px-2 py-1 bg-blue-200 text-blue-800 rounded" title="Check-out">
                                    ← Check-out
                                  </span>
                                )}
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                reservation.status
                              )}`}
                            >
                              {reservation.status.replace("_", " ")}
                            </span>
                          </div>
                          
                          <div className="space-y-1 mb-3">
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">Guest:</span>{" "}
                              {reservation.guest?.firstName} {reservation.guest?.lastName}
                            </div>
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">Reservation #:</span>{" "}
                              {reservation.reservationNumber || `#${reservation.id}`}
                            </div>
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">Dates:</span>{" "}
                              {new Date(reservation.checkInDate).toLocaleDateString()} -{" "}
                              {new Date(reservation.checkOutDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">Guests:</span> {reservation.numberOfGuests}
                            </div>
                            {reservation.totalAmount && (
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">Total:</span> ₹{reservation.totalAmount.toFixed(2)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 flex-wrap">
                            <Link
                              to={`/bookings/${reservation.id}`}
                              className="text-sm px-3 py-1.5 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                            >
                              View Details
                            </Link>
                            {canCheckIn(reservation) && (
                              <Form method="post" className="inline">
                                <input type="hidden" name="action" value="checkIn" />
                                <input type="hidden" name="reservationId" value={reservation.id} />
                                <input
                                  type="hidden"
                                  name="redirectTo"
                                  value={`/front-desk?view=${view}&date=${currentDate}`}
                                />
                                <button
                                  type="submit"
                                  className="text-sm px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Check In
                                </button>
                              </Form>
                            )}
                            {canCheckOut(reservation) && (
                              <Form method="post" className="inline">
                                <input type="hidden" name="action" value="checkOut" />
                                <input type="hidden" name="reservationId" value={reservation.id} />
                                <input
                                  type="hidden"
                                  name="redirectTo"
                                  value={`/front-desk?view=${view}&date=${currentDate}`}
                                />
                                <button
                                  type="submit"
                                  className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Check Out
                                </button>
                              </Form>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

