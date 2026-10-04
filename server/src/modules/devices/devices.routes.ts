// ============================================
// NIVA — Cross-Platform Device Routes
// ============================================

import { Router, Request, Response } from 'express';
import { deviceService, DeviceInfo } from './devices.service';

export const devicesRoutes = Router();

// Retrieve all connected peer devices
devicesRoutes.get('/', (_req: Request, res: Response) => {
  try {
    const devices = deviceService.getDevices();
    return res.json({ success: true, devices });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Retrieve unified cross-platform ecosystem status
devicesRoutes.get('/status/unified', (_req: Request, res: Response) => {
  try {
    const status = deviceService.getUnifiedStatus();
    return res.json({ success: true, data: status });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Register or pair device
devicesRoutes.post('/register', (req: Request, res: Response) => {
  try {
    const { id, name, type, isTrusted, fingerprint, telemetry } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'name and type are required' });
    }

    const device: DeviceInfo = {
      id: id || `dev-${type}-${Date.now()}`,
      name,
      type,
      isTrusted: typeof isTrusted === 'boolean' ? isTrusted : true,
      fingerprint,
      ipAddress: req.ip,
      lastSeenAt: new Date().toISOString(),
      telemetry,
    };

    const saved = deviceService.registerDevice(device);
    return res.json({ success: true, device: saved });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Device Heartbeat
devicesRoutes.post('/:id/heartbeat', (req: Request, res: Response) => {
  try {
    const updated = deviceService.updateHeartbeat(req.params.id as string, req.body.telemetry);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    return res.json({ success: true, device: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Remove device
devicesRoutes.delete('/:id', (req: Request, res: Response) => {
  try {
    const ok = deviceService.removeDevice(req.params.id as string);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
