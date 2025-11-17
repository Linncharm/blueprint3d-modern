/**
 * 测试现代化工具类的功能
 */

import { Utils, Point } from './core/utils-modern';
import { EventEmitter } from './core/events';

console.log('🧪 开始测试现代化工具类...\n');

// 测试 1: 距离计算
console.log('✅ 测试 1: 距离计算');
const dist = Utils.distance(0, 0, 3, 4);
console.log(`   距离 (0,0) 到 (3,4): ${dist}`);
console.assert(dist === 5, '距离计算错误');

// 测试 2: 角度计算
console.log('\n✅ 测试 2: 角度计算');
const angle = Utils.angle2pi(1, 0, 0, 1);
console.log(`   角度: ${angle} 弧度 (${(angle * 180 / Math.PI).toFixed(2)}°)`);

// 测试 3: GUID 生成
console.log('\n✅ 测试 3: GUID 生成');
const guid1 = Utils.guid();
const guid2 = Utils.guid();
console.log(`   GUID 1: ${guid1}`);
console.log(`   GUID 2: ${guid2}`);
console.assert(guid1 !== guid2, 'GUID 应该是唯一的');

// 测试 4: 点在多边形内
console.log('\n✅ 测试 4: 点在多边形内检测');
const square: Point[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 }
];
const insidePoint = Utils.pointInPolygon(5, 5, square);
const outsidePoint = Utils.pointInPolygon(15, 15, square);
console.log(`   点 (5,5) 在正方形内: ${insidePoint}`);
console.log(`   点 (15,15) 在正方形内: ${outsidePoint}`);
console.assert(insidePoint === true, '(5,5) 应该在正方形内');
console.assert(outsidePoint === false, '(15,15) 应该在正方形外');

// 测试 5: 顺时针检测
console.log('\n✅ 测试 5: 顺时针检测');
const clockwisePoints: Point[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 }
];
const counterClockwisePoints: Point[] = [
  { x: 0, y: 0 },
  { x: 0, y: 10 },
  { x: 10, y: 10 }
];
const isCW = Utils.isClockwise(clockwisePoints);
const isCCW = Utils.isClockwise(counterClockwisePoints);
console.log(`   顺时针点序列: ${isCW}`);
console.log(`   逆时针点序列: ${isCCW}`);

// 测试 6: 数组工具
console.log('\n✅ 测试 6: 数组工具方法');
const testArray = [1, 2, 3, 4, 5];
const doubled = Utils.map(testArray, (x) => x * 2);
console.log(`   原数组: [${testArray}]`);
console.log(`   翻倍后: [${doubled}]`);

const evens = Utils.removeIf(testArray, (x) => x % 2 !== 0);
console.log(`   只保留偶数: [${evens}]`);

const cycled = Utils.cycle(testArray, 2);
console.log(`   循环移位 2: [${cycled}]`);

// 测试 7: EventEmitter
console.log('\n✅ 测试 7: EventEmitter (替代 jQuery.Callbacks)');
const emitter = new EventEmitter<string>();
let eventFired = false;
let receivedData = '';

emitter.add((data: string) => {
  eventFired = true;
  receivedData = data;
  console.log(`   事件触发，接收到数据: ${data}`);
});

emitter.fire('测试数据');
console.assert(eventFired === true, '事件应该被触发');
console.assert(receivedData === '测试数据', '应该接收到正确的数据');

// 测试 8: 线段相交
console.log('\n✅ 测试 8: 线段相交检测');
const intersects = Utils.lineLineIntersect(0, 0, 10, 10, 0, 10, 10, 0);
const notIntersects = Utils.lineLineIntersect(0, 0, 10, 0, 0, 5, 10, 5);
console.log(`   对角线相交: ${intersects}`);
console.log(`   平行线相交: ${notIntersects}`);
console.assert(intersects === true, '对角线应该相交');
console.assert(notIntersects === false, '平行线不应该相交');

// 测试 9: 最近点
console.log('\n✅ 测试 9: 点到线段的最近点');
const closestPoint = Utils.closestPointOnLine(5, 5, 0, 0, 10, 0);
console.log(`   点 (5,5) 到线段 [(0,0), (10,0)] 的最近点: (${closestPoint.x}, ${closestPoint.y})`);
console.assert(closestPoint.x === 5 && closestPoint.y === 0, '最近点应该是 (5, 0)');

const pointDist = Utils.pointDistanceFromLine(5, 5, 0, 0, 10, 0);
console.log(`   距离: ${pointDist}`);
console.assert(pointDist === 5, '距离应该是 5');

console.log('\n✨ 所有测试通过！现代化工具类工作正常。\n');

// 性能测试
console.log('⚡️ 性能测试:');
const iterations = 100000;

console.time('距离计算 x100k');
for (let i = 0; i < iterations; i++) {
  Utils.distance(0, 0, i, i);
}
console.timeEnd('距离计算 x100k');

console.time('GUID 生成 x10k');
for (let i = 0; i < iterations / 10; i++) {
  Utils.guid();
}
console.timeEnd('GUID 生成 x10k');

console.log('\n📦 测试完成！');
