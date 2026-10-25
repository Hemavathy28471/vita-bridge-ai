const Device = require('../models/Device');
const { logAuditEvent } = require('../middleware/audit');

// List devices
const getDevices = async (req, res) => {
  try {
    let devices = await Device.find({ userId: req.user._id });

    // Seed default simulated devices if user has none
    if (devices.length === 0) {
      const defaults = [
        {
          userId: req.user._id,
          deviceId: 'apple-watch-s9',
          name: 'Apple Watch Series 9',
          type: 'smartwatch',
          manufacturer: 'Apple',
          status: 'connected',
          batteryLevel: 84,
          supportedModalities: ['Heart Rate', 'HRV', 'SpO2', 'Temperature', 'Sleep', 'Activity'],
          isSimulated: true,
        },
        {
          userId: req.user._id,
          deviceId: 'whoop-band-4',
          name: 'Whoop Strap 4.0',
          type: 'fitness_band',
          manufacturer: 'Whoop',
          status: 'connected',
          batteryLevel: 67,
          supportedModalities: ['Heart Rate', 'HRV', 'Sleep Stages', 'Recovery', 'Strain'],
          isSimulated: true,
        },
        {
          userId: req.user._id,
          deviceId: 'omron-bp-bt',
          name: 'Omron Evolv Wireless BP Monitor',
          type: 'bp_monitor',
          manufacturer: 'Omron',
          status: 'disconnected',
          batteryLevel: 92,
          supportedModalities: ['Systolic BP', 'Diastolic BP', 'Pulse Rate'],
          isSimulated: true,
        },
        {
          userId: req.user._id,
          deviceId: 'withings-pulse-ox',
          name: 'Withings Pulse HR & Oximeter',
          type: 'pulse_oximeter',
          manufacturer: 'Withings',
          status: 'connected',
          batteryLevel: 78,
          supportedModalities: ['SpO2', 'Pulse Rate'],
          isSimulated: true,
        },
      ];
      devices = await Device.insertMany(defaults);
    }

    res.json({
      success: true,
      count: devices.length,
      data: devices,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add device
const addDevice = async (req, res) => {
  try {
    const { name, type, manufacturer, deviceId } = req.body;
    const device = await Device.create({
      userId: req.user._id,
      deviceId: deviceId || `dev-${Date.now()}`,
      name,
      type,
      manufacturer: manufacturer || 'Generic Health BLE',
      status: 'connected',
      batteryLevel: Math.floor(Math.random() * 30 + 70),
    });

    res.status(201).json({
      success: true,
      data: device,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Toggle connection status (simulate connect/disconnect)
const toggleDeviceStatus = async (req, res) => {
  try {
    const device = await Device.findOne({ _id: req.params.id, userId: req.user._id });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    device.status = device.status === 'connected' ? 'disconnected' : 'connected';
    device.lastSync = new Date();
    await device.save();

    await logAuditEvent({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: device.status === 'connected' ? 'DEVICE_CONNECTED' : 'DEVICE_DISCONNECTED',
      resourceType: 'DEVICE',
      details: { deviceId: device.deviceId, name: device.name },
      req,
    });

    res.json({
      success: true,
      message: `Device ${device.name} is now ${device.status}.`,
      data: device,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDevices,
  addDevice,
  toggleDeviceStatus,
};
