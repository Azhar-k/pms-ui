import { useState } from "react";
import { Link } from "react-router";
import { roomAPI } from "../services/api";

interface Room {
  id: number;
  roomNumber: string;
  roomTypeId: number;
  status: "READY" | "MAINTENANCE" | "CLEANING";
  maxOccupancy?: number;
  floor?: number;
  roomType?: {
    id: number;
    name: string;
  };
}

interface RoomKanbanBoardProps {
  rooms: Room[];
  onRoomUpdate: () => void;
}

type RoomStatus = "READY" | "MAINTENANCE" | "CLEANING";

const STATUS_CONFIG: Record<RoomStatus, { label: string; color: string; bgColor: string }> = {
  READY: {
    label: "Ready",
    color: "text-green-800",
    bgColor: "bg-green-50 border-green-200",
  },
  MAINTENANCE: {
    label: "Maintenance",
    color: "text-yellow-800",
    bgColor: "bg-yellow-50 border-yellow-200",
  },
  CLEANING: {
    label: "Cleaning",
    color: "text-blue-800",
    bgColor: "bg-blue-50 border-blue-200",
  },
};

export function RoomKanbanBoard({ rooms, onRoomUpdate }: RoomKanbanBoardProps) {
  const [draggedRoom, setDraggedRoom] = useState<Room | null>(null);
  const [draggedOverStatus, setDraggedOverStatus] = useState<RoomStatus | null>(null);
  const [updating, setUpdating] = useState<Set<number>>(new Set());

  const roomsByStatus = {
    READY: rooms.filter((r) => r.status === "READY"),
    MAINTENANCE: rooms.filter((r) => r.status === "MAINTENANCE"),
    CLEANING: rooms.filter((r) => r.status === "CLEANING"),
  };

  const handleDragStart = (e: React.DragEvent, room: Room) => {
    setDraggedRoom(room);
    e.dataTransfer.effectAllowed = "move";
    // Add a slight opacity to the dragged element
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedRoom(null);
    setDraggedOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, status: RoomStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggedOverStatus(status);
  };

  const handleDragLeave = () => {
    setDraggedOverStatus(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: RoomStatus) => {
    e.preventDefault();
    setDraggedOverStatus(null);

    if (!draggedRoom || draggedRoom.status === targetStatus) {
      return;
    }

    // Show loading state
    setUpdating((prev) => new Set(prev).add(draggedRoom.id));

    try {
      // Update room status via API
      await roomAPI.update(draggedRoom.id, {
        roomNumber: draggedRoom.roomNumber,
        roomTypeId: draggedRoom.roomTypeId,
        status: targetStatus,
      });
      
      // Notify parent to reload rooms
      onRoomUpdate();
    } catch (error) {
      console.error("Error updating room status:", error);
      alert("Failed to update room status. Please try again.");
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(draggedRoom.id);
        return next;
      });
    }

    setDraggedRoom(null);
  };

  const RoomCard = ({ room }: { room: Room }) => {
    const isUpdating = updating.has(room.id);
    
    return (
      <div
        draggable={!isUpdating}
        onDragStart={(e) => handleDragStart(e, room)}
        onDragEnd={handleDragEnd}
        className={`
          bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3 cursor-move
          hover:shadow-md transition-shadow
          ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <Link
              to={`/rooms/${room.id}`}
              className="text-sm font-semibold text-gray-900 hover:text-blue-600"
              onClick={(e) => isUpdating && e.preventDefault()}
            >
              Room {room.roomNumber}
            </Link>
            {room.floor && (
              <div className="text-xs text-gray-500 mt-1">Floor {room.floor}</div>
            )}
          </div>
          {isUpdating && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>
        <div className="text-xs text-gray-600 mb-2">
          {room.roomType?.name || `Type ${room.roomTypeId}`}
        </div>
        {room.maxOccupancy && (
          <div className="text-xs text-gray-500">
            Max: {room.maxOccupancy} guests
          </div>
        )}
      </div>
    );
  };

  const StatusColumn = ({ status }: { status: RoomStatus }) => {
    const config = STATUS_CONFIG[status];
    const isDraggedOver = draggedOverStatus === status;
    const roomsInColumn = roomsByStatus[status];

    return (
      <div
        className={`
          flex-1 min-w-[280px] rounded-lg border-2 p-4 transition-all
          ${config.bgColor}
          ${isDraggedOver ? "ring-2 ring-blue-500 ring-offset-2" : ""}
        `}
        onDragOver={(e) => handleDragOver(e, status)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, status)}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold text-sm ${config.color}`}>
            {config.label}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color} bg-white/50`}>
            {roomsInColumn.length}
          </span>
        </div>
        <div className="min-h-[200px]">
          {roomsInColumn.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-8">
              No rooms
            </div>
          ) : (
            roomsInColumn.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      <StatusColumn status="READY" />
      <StatusColumn status="MAINTENANCE" />
      <StatusColumn status="CLEANING" />
    </div>
  );
}

