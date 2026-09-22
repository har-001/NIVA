// ============================================
// NIVA — Geometric Hand Gesture Classifier
// Pure function: 21 landmarks → gesture + confidence
// No ML model needed — uses finger extension geometry
// ============================================

export type GestureType =
  | 'fist'
  | 'open_palm'
  | 'point_up'
  | 'point_down'
  | 'peace'
  | 'thumbs_up'
  | 'rock'
  | 'none';

export interface GestureResult {
  gesture: GestureType;
  confidence: number;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

// MediaPipe Hands landmark indices
// 0 = wrist
// 4 = thumb tip, 3 = thumb IP, 2 = thumb MCP
// 8 = index tip, 7 = index DIP, 6 = index PIP, 5 = index MCP
// 12 = middle tip, 11 = middle DIP, 10 = middle PIP, 9 = middle MCP
// 16 = ring tip, 15 = ring DIP, 14 = ring PIP, 13 = ring MCP
// 20 = pinky tip, 19 = pinky DIP, 18 = pinky PIP, 17 = pinky MCP

/**
 * Determine if a finger is extended by comparing tip y to PIP joint y.
 * In MediaPipe's coordinate system, y increases downward (screen coords),
 * so an extended finger has tip.y < pip.y (tip is above pip).
 */
function isFingerExtended(landmarks: Landmark[], tipIdx: number, pipIdx: number): boolean {
  return landmarks[tipIdx].y < landmarks[pipIdx].y;
}

/**
 * Thumb uses x-axis comparison relative to hand orientation.
 * For a right hand: thumb extended = tip.x > ip.x
 * We use absolute distance from MCP as a simpler heuristic.
 */
function isThumbExtended(landmarks: Landmark[]): boolean {
  const thumbTip = landmarks[4];
  const thumbIP = landmarks[3];
  const thumbMCP = landmarks[2];
  const indexMCP = landmarks[5];

  // Distance from thumb tip to index MCP (if large, thumb is extended)
  const dx = thumbTip.x - indexMCP.x;
  const dy = thumbTip.y - indexMCP.y;
  const tipToIndex = Math.sqrt(dx * dx + dy * dy);

  const dx2 = thumbMCP.x - indexMCP.x;
  const dy2 = thumbMCP.y - indexMCP.y;
  const mcpToIndex = Math.sqrt(dx2 * dx2 + dy2 * dy2);

  // Thumb tip should be further from index MCP than thumb MCP is
  return tipToIndex > mcpToIndex * 1.1 && thumbTip.y < thumbIP.y + 0.05;
}

/**
 * Classify a hand gesture from 21 MediaPipe Hands landmarks.
 * Returns the detected gesture and a confidence score (0-1).
 */
export function classifyGesture(landmarks: Landmark[]): GestureResult {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: 'none', confidence: 0 };
  }

  const thumb = isThumbExtended(landmarks);
  const index = isFingerExtended(landmarks, 8, 6);
  const middle = isFingerExtended(landmarks, 12, 10);
  const ring = isFingerExtended(landmarks, 16, 14);
  const pinky = isFingerExtended(landmarks, 20, 18);

  const extendedCount = [thumb, index, middle, ring, pinky].filter(Boolean).length;

  // 👇 POINT DOWN — index pointing downward (tip below wrist & MCP, others curled)
  const wrist = landmarks[0];
  const indexTip = landmarks[8];
  const indexMcp = landmarks[5];
  const indexDown = !thumb && !middle && !ring && !pinky && (indexTip.y > wrist.y && indexTip.y > indexMcp.y);

  if (indexDown) {
    return { gesture: 'point_down', confidence: 0.85 };
  }

  // ✊ FIST — no fingers extended
  if (extendedCount === 0) {
    return { gesture: 'fist', confidence: 0.9 };
  }

  // ✋ OPEN PALM — all 5 fingers extended
  if (extendedCount === 5) {
    return { gesture: 'open_palm', confidence: 0.92 };
  }

  // 👍 THUMBS UP — only thumb extended, wrist below thumb tip significantly
  if (thumb && !index && !middle && !ring && !pinky) {
    const thumbTip = landmarks[4];
    // Thumb tip should be notably above wrist
    if (thumbTip.y < wrist.y - 0.08) {
      return { gesture: 'thumbs_up', confidence: 0.88 };
    }
  }

  // 👆 POINT UP — only index extended, tip above PIP
  if (!thumb && index && !middle && !ring && !pinky) {
    if (indexTip.y < wrist.y) {
      return { gesture: 'point_up', confidence: 0.87 };
    }
  }

  // ✌️ PEACE / V SIGN — index + middle extended, others curled
  if (!thumb && index && middle && !ring && !pinky) {
    return { gesture: 'peace', confidence: 0.9 };
  }

  // 🤟 ROCK / CALL — thumb + index + pinky extended, middle + ring curled
  if (thumb && index && !middle && !ring && pinky) {
    return { gesture: 'rock', confidence: 0.85 };
  }

  return { gesture: 'none', confidence: 0 };
}
