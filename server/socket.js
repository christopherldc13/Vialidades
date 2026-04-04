const socketIo = require('socket.io');

let io;

const init = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PATCH", "PUT"]
        }
    });

    const activeLocks = new Map(); // socket.id -> reportId
    const Report = require('./models/Report');

    io.on('connection', (socket) => {
        console.log(`[Socket] New client connected: ${socket.id}`);

        socket.on('join_moderation', () => {
            socket.join('moderation_room');
            console.log(`[Socket] Client joined moderation room`);
        });

        // Register that this socket is locking a report
        socket.on('lock_report', (reportId) => {
            activeLocks.set(socket.id, reportId);
            console.log(`[Socket] Lock registered for ${socket.id} on report ${reportId}`);
        });

        // Unregister lock (explicit unlock)
        socket.on('unlock_report', () => {
            activeLocks.delete(socket.id);
            console.log(`[Socket] Lock removed for ${socket.id}`);
        });

        socket.on('disconnect', async () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);

            const reportId = activeLocks.get(socket.id);
            if (reportId) {
                try {
                    // Auto-release the report if it was in process by this user's socket
                    const report = await Report.findById(reportId);
                    if (report && report.status === 'In Process') {
                        report.status = 'pending';
                        report.moderatorInCharge = null;
                        await report.save();

                        console.log(`[Socket] Auto-released report ${reportId} due to disconnect`);

                        // Notify all clients in the moderation room
                        io.to('moderation_room').emit('report_status_updated', {
                            reportId: report._id,
                            status: 'pending'
                        });
                    }
                } catch (err) {
                    console.error("[Socket] Error auto-releasing report:", err);
                } finally {
                    activeLocks.delete(socket.id);
                }
            }
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { init, getIo };
