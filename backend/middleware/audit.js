const AuditLog = require('../models/AuditLog');

const logAuditEvent = async ({
  actorId,
  actorEmail,
  actorRole,
  action,
  targetUserId = null,
  resourceType = 'SYSTEM',
  status = 'SUCCESS',
  details = {},
  req = null,
}) => {
  try {
    const ipAddress = req
      ? req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
      : '127.0.0.1';
    const userAgent = req ? req.headers['user-agent'] : 'internal-service';

    await AuditLog.create({
      actorId,
      actorEmail,
      actorRole,
      action,
      targetUserId,
      resourceType,
      status,
      ipAddress,
      userAgent,
      details,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err.message);
  }
};

module.exports = { logAuditEvent };
