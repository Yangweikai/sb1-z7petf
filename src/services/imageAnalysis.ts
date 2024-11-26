import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';

interface HandGesture {
  landmarks: number[][];
  boundingBox: {
    topLeft: number[];
    bottomRight: number[];
  };
}

export async function analyzeImage(file: File): Promise<boolean> {
  try {
    await tf.ready();
    const model = await handpose.load({
      maxHands: 2, // 设置最大检测手数为2
      scoreThreshold: 0.7 // 提高检测置信度阈值
    });
    
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    
    const imageUrl = URL.createObjectURL(file);
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    const tensor = tf.browser.fromPixels(img);
    
    try {
      const predictions = await model.estimateHands(tensor);
      
      if (predictions.length >= 2) {
        const handsData = predictions as HandGesture[];
        return isHoldingHands(handsData[0], handsData[1]);
      }
      
      return false;
    } finally {
      tensor.dispose();
      URL.revokeObjectURL(imageUrl);
    }
  } catch (error) {
    console.error('Image analysis error:', error);
    throw new Error('图片分析失败，请重试');
  }
}

function isHoldingHands(hand1: HandGesture, hand2: HandGesture): boolean {
  // 检查手掌方向
  const hand1Direction = getPalmDirection(hand1.landmarks);
  const hand2Direction = getPalmDirection(hand2.landmarks);
  
  // 检查手掌是否相对
  const areHandsFacing = arePalmsFacing(hand1Direction, hand2Direction);
  
  // 计算手掌中心点距离
  const distance = calculatePalmDistance(hand1.landmarks, hand2.landmarks);
  
  // 检查手指交叉状态
  const fingersIntertwined = checkFingersIntertwined(hand1.landmarks, hand2.landmarks);
  
  // 综合判断是否牵手
  return areHandsFacing && distance < 150 && fingersIntertwined;
}

function getPalmDirection(landmarks: number[][]): number[] {
  // 使用手掌关键点计算手掌方向向量
  const palmBase = landmarks[0];
  const palmCenter = calculatePalmCenter(landmarks.slice(1, 5));
  return [
    palmCenter[0] - palmBase[0],
    palmCenter[1] - palmBase[1],
    palmCenter[2] - palmBase[2]
  ];
}

function calculatePalmCenter(points: number[][]): number[] {
  return points.reduce((acc, point) => [
    acc[0] + point[0] / points.length,
    acc[1] + point[1] / points.length,
    acc[2] + point[2] / points.length
  ], [0, 0, 0]);
}

function arePalmsFacing(dir1: number[], dir2: number[]): boolean {
  // 计算两个手掌方向向量的点积
  const dotProduct = dir1.reduce((sum, val, i) => sum + val * dir2[i], 0);
  const magnitude1 = Math.sqrt(dir1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(dir2.reduce((sum, val) => sum + val * val, 0));
  
  // 计算夹角余弦值
  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  
  // 判断手掌是否大致相对（夹角接近180度）
  return cosAngle < -0.7;
}

function calculatePalmDistance(landmarks1: number[][], landmarks2: number[][]): number {
  const center1 = calculatePalmCenter(landmarks1);
  const center2 = calculatePalmCenter(landmarks2);
  
  return Math.sqrt(
    Math.pow(center1[0] - center2[0], 2) +
    Math.pow(center1[1] - center2[1], 2) +
    Math.pow(center1[2] - center2[2], 2)
  );
}

function checkFingersIntertwined(landmarks1: number[][], landmarks2: number[][]): boolean {
  // 获取每个手的手指关键点
  const fingers1 = getFingerPoints(landmarks1);
  const fingers2 = getFingerPoints(landmarks2);
  
  // 检查手指之间的交叉
  let intersectionCount = 0;
  
  for (let i = 0; i < fingers1.length; i++) {
    for (let j = 0; j < fingers2.length; j++) {
      if (doLinesIntersect(fingers1[i], fingers2[j])) {
        intersectionCount++;
      }
    }
  }
  
  // 如果有足够多的交叉点，认为手指交织在一起
  return intersectionCount >= 3;
}

function getFingerPoints(landmarks: number[][]): Array<[number[], number[]]> {
  const fingerLines: Array<[number[], number[]]> = [];
  
  // 为每个手指创建线段（从指根到指尖）
  for (let finger = 0; finger < 5; finger++) {
    const baseIndex = finger * 4 + 1;
    fingerLines.push([
      landmarks[baseIndex],
      landmarks[baseIndex + 3]
    ]);
  }
  
  return fingerLines;
}

function doLinesIntersect(
  line1: [number[], number[]],
  line2: [number[], number[]]
): boolean {
  // 使用二维向量叉积判断两条线段是否相交
  const [[x1, y1], [x2, y2]] = line1;
  const [[x3, y3], [x4, y4]] = line2;
  
  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (denominator === 0) return false;
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;
  
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}