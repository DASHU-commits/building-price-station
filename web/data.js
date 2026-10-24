/* 建材市场价格数据：内置示例行情 + 可复现生成器 */
(function (global) {
  'use strict';

  const CITIES = ['合肥', '南京', '上海', '杭州'];

const MATERIALS = [
  { id: 'mat-1', name: '螺纹钢', spec: 'HRB400E Φ12', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3420, '南京': 3471, '上海': 3523, '杭州': 3505 } },
  { id: 'mat-2', name: '螺纹钢', spec: 'HRB400E Φ14', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3390, '南京': 3441, '上海': 3492, '杭州': 3475 } },
  { id: 'mat-3', name: '螺纹钢', spec: 'HRB400E Φ16', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3360, '南京': 3410, '上海': 3461, '杭州': 3444 } },
  { id: 'mat-4', name: '螺纹钢', spec: 'HRB400E Φ18', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3350, '南京': 3400, '上海': 3451, '杭州': 3434 } },
  { id: 'mat-5', name: '螺纹钢', spec: 'HRB400E Φ20', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3340, '南京': 3390, '上海': 3440, '杭州': 3423 } },
  { id: 'mat-6', name: '螺纹钢', spec: 'HRB400E Φ22', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3370, '南京': 3421, '上海': 3471, '杭州': 3454 } },
  { id: 'mat-7', name: '螺纹钢', spec: 'HRB400E Φ25', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3410, '南京': 3461, '上海': 3512, '杭州': 3495 } },
  { id: 'mat-8', name: '盘螺', spec: 'HRB400 Φ8', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3620, '南京': 3674, '上海': 3729, '杭州': 3710 } },
  { id: 'mat-9', name: '盘螺', spec: 'HRB400 Φ10', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3590, '南京': 3644, '上海': 3698, '杭州': 3680 } },
  { id: 'mat-10', name: '盘螺', spec: 'HRB400 Φ12', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3620, '南京': 3674, '上海': 3729, '杭州': 3710 } },
  { id: 'mat-11', name: '高线', spec: 'HPB300 Φ6.5', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3620, '南京': 3674, '上海': 3729, '杭州': 3710 } },
  { id: 'mat-12', name: '高线', spec: 'HPB300 Φ8', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3600, '南京': 3654, '上海': 3708, '杭州': 3690 } },
  { id: 'mat-13', name: '高线', spec: 'HPB300 Φ10', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3630, '南京': 3684, '上海': 3739, '杭州': 3721 } },
  { id: 'mat-14', name: '中厚板', spec: 'Q235B 10mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3980, '南京': 4040, '上海': 4099, '杭州': 4079 } },
  { id: 'mat-15', name: '中厚板', spec: 'Q235B 12mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3920, '南京': 3979, '上海': 4038, '杭州': 4018 } },
  { id: 'mat-16', name: '中厚板', spec: 'Q235B 14mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3880, '南京': 3938, '上海': 3996, '杭州': 3977 } },
  { id: 'mat-17', name: '中厚板', spec: 'Q235B 16mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3850, '南京': 3908, '上海': 3966, '杭州': 3946 } },
  { id: 'mat-18', name: '中厚板', spec: 'Q235B 20mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3820, '南京': 3877, '上海': 3935, '杭州': 3915 } },
  { id: 'mat-19', name: '热轧板卷', spec: 'Q235B 3.0mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 4050, '南京': 4111, '上海': 4172, '杭州': 4151 } },
  { id: 'mat-20', name: '热轧板卷', spec: 'Q235B 4.0mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3950, '南京': 4009, '上海': 4069, '杭州': 4049 } },
  { id: 'mat-21', name: '热轧板卷', spec: 'Q235B 5.75mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 3880, '南京': 3938, '上海': 3996, '杭州': 3977 } },
  { id: 'mat-22', name: '不锈钢板 304', spec: '2B 1.0mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 15800, '南京': 16037, '上海': 16274, '杭州': 16195 } },
  { id: 'mat-23', name: '不锈钢板 304', spec: '2B 1.5mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 15400, '南京': 15631, '上海': 15862, '杭州': 15785 } },
  { id: 'mat-24', name: '不锈钢板 304', spec: '2B 2.0mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 15100, '南京': 15326, '上海': 15553, '杭州': 15477 } },
  { id: 'mat-25', name: '不锈钢板 304', spec: '2B 3.0mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 14900, '南京': 15123, '上海': 15347, '杭州': 15272 } },
  { id: 'mat-26', name: '不锈钢板 316L', spec: '2B 2.0mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 24500, '南京': 24867, '上海': 25235, '杭州': 25112 } },
  { id: 'mat-27', name: '不锈钢板 316L', spec: '2B 3.0mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 24200, '南京': 24563, '上海': 24926, '杭州': 24805 } },
  { id: 'mat-28', name: '不锈钢管 304', spec: 'DN25', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 15200, '南京': 15428, '上海': 15656, '杭州': 15580 } },
  { id: 'mat-29', name: '不锈钢管 304', spec: 'DN50', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 14800, '南京': 15022, '上海': 15244, '杭州': 15170 } },
  { id: 'mat-30', name: '不锈钢管 304', spec: 'DN80', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 15500, '南京': 15732, '上海': 15965, '杭州': 15887 } },
  { id: 'mat-31', name: '不锈钢管 316L', spec: 'DN25', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 23500, '南京': 23852, '上海': 24205, '杭州': 24087 } },
  { id: 'mat-32', name: '不锈钢管 316L', spec: 'DN50', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 23000, '南京': 23345, '上海': 23690, '杭州': 23575 } },
  { id: 'mat-150', name: '不锈钢板 201', spec: '2B 1.0mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.006, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 10200, '南京': 10312, '上海': 10425, '杭州': 10370 } },
  { id: 'mat-151', name: '不锈钢板 201', spec: '2B 1.5mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.006, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 9900, '南京': 10023, '上海': 10148, '杭州': 10090 } },
  { id: 'mat-152', name: '不锈钢板 201', spec: '2B 2.0mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.006, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 9700, '南京': 9821, '上海': 9944, '杭州': 9885 } },
  { id: 'mat-153', name: '不锈钢板 201', spec: '2B 3.0mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.006, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 9550, '南京': 9670, '上海': 9792, '杭州': 9733 } },
  { id: 'mat-154', name: '不锈钢板 202', spec: '2B 2.0mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.006, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 11300, '南京': 11430, '上海': 11562, '杭州': 11500 } },
  { id: 'mat-155', name: '不锈钢板 202', spec: '2B 3.0mm', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.006, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 11100, '南京': 11222, '上海': 11345, '杭州': 11285 } },
  { id: 'mat-156', name: '无取向硅钢', spec: '50WW800', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.006, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 5750, '南京': 5795, '上海': 5840, '杭州': 5800 } },
  { id: 'mat-157', name: '无取向硅钢', spec: '50WW600', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.006, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 6380, '南京': 6435, '上海': 6490, '杭州': 6455 } },
  { id: 'mat-158', name: '无取向硅钢', spec: '50WW470', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.006, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 7150, '南京': 7210, '上海': 7270, '杭州': 7230 } },
  { id: 'mat-159', name: '取向硅钢', spec: '30Q130', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.006, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 13400, '南京': 13500, '上海': 13600, '杭州': 13550 } },
  { id: 'mat-160', name: '取向硅钢', spec: '30Q120', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.006, trend: 0.0001, category: '钢材', channel: '我的钢铁网', base: { '合肥': 14300, '南京': 14400, '上海': 14500, '杭州': 14450 } },
  { id: 'mat-33', name: 'PVC-U排水管', spec: 'DN50', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 8.5, '南京': 8.93, '上海': 10.03, '杭州': 9.52 } },
  { id: 'mat-34', name: 'PVC-U排水管', spec: 'DN75', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 14, '南京': 14.7, '上海': 16.52, '杭州': 15.68 } },
  { id: 'mat-35', name: 'PVC-U排水管', spec: 'DN110', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 28, '南京': 29.4, '上海': 33.04, '杭州': 31.36 } },
  { id: 'mat-36', name: 'PVC-U排水管', spec: 'DN160', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 55, '南京': 57.75, '上海': 64.9, '杭州': 61.6 } },
  { id: 'mat-37', name: 'PVC-U排水管', spec: 'DN200', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 95, '南京': 99.75, '上海': 112.1, '杭州': 106.4 } },
  { id: 'mat-38', name: 'PVC-U排水管', spec: 'DN250', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 150, '南京': 157.5, '上海': 177, '杭州': 168 } },
  { id: 'mat-39', name: 'PVC-U给水管', spec: 'DN20', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 4.2, '南京': 4.41, '上海': 4.96, '杭州': 4.7 } },
  { id: 'mat-40', name: 'PVC-U给水管', spec: 'DN25', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 6, '南京': 6.3, '上海': 7.08, '杭州': 6.72 } },
  { id: 'mat-41', name: 'PVC-U给水管', spec: 'DN32', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 8.5, '南京': 8.93, '上海': 10.03, '杭州': 9.52 } },
  { id: 'mat-42', name: 'PVC-U给水管', spec: 'DN40', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 11, '南京': 11.55, '上海': 12.98, '杭州': 12.32 } },
  { id: 'mat-43', name: 'PVC-U给水管', spec: 'DN50', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 15, '南京': 15.75, '上海': 17.7, '杭州': 16.8 } },
  { id: 'mat-44', name: 'PVC-U给水管', spec: 'DN63', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 23, '南京': 24.15, '上海': 27.14, '杭州': 25.76 } },
  { id: 'mat-45', name: 'SC镀锌钢管', spec: 'SC15', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '我的钢铁网', base: { '合肥': 9.5, '南京': 9.98, '上海': 11.21, '杭州': 10.64 } },
  { id: 'mat-46', name: 'SC镀锌钢管', spec: 'SC20', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '我的钢铁网', base: { '合肥': 12, '南京': 12.6, '上海': 14.16, '杭州': 13.44 } },
  { id: 'mat-47', name: 'SC镀锌钢管', spec: 'SC25', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '我的钢铁网', base: { '合肥': 16, '南京': 16.8, '上海': 18.88, '杭州': 17.92 } },
  { id: 'mat-48', name: 'SC镀锌钢管', spec: 'SC32', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '我的钢铁网', base: { '合肥': 21, '南京': 22.05, '上海': 24.78, '杭州': 23.52 } },
  { id: 'mat-49', name: 'SC镀锌钢管', spec: 'SC40', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '我的钢铁网', base: { '合肥': 27, '南京': 28.35, '上海': 31.86, '杭州': 30.24 } },
  { id: 'mat-50', name: 'SC镀锌钢管', spec: 'SC50', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '我的钢铁网', base: { '合肥': 36, '南京': 37.8, '上海': 42.48, '杭州': 40.32 } },
  { id: 'mat-51', name: 'SC镀锌钢管', spec: 'SC65', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '我的钢铁网', base: { '合肥': 52, '南京': 54.6, '上海': 61.36, '杭州': 58.24 } },
  { id: 'mat-52', name: 'SC镀锌钢管', spec: 'SC80', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '我的钢铁网', base: { '合肥': 68, '南京': 71.4, '上海': 80.24, '杭州': 76.16 } },
  { id: 'mat-53', name: 'SC镀锌钢管', spec: 'SC100', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '我的钢铁网', base: { '合肥': 95, '南京': 99.75, '上海': 112.1, '杭州': 106.4 } },
  { id: 'mat-54', name: 'MPP电力管', spec: 'DN110', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 38, '南京': 39.9, '上海': 44.84, '杭州': 42.56 } },
  { id: 'mat-55', name: 'MPP电力管', spec: 'DN160', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 68, '南京': 71.4, '上海': 80.24, '杭州': 76.16 } },
  { id: 'mat-56', name: 'MPP电力管', spec: 'DN200', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 105, '南京': 110.25, '上海': 123.9, '杭州': 117.6 } },
  { id: 'mat-57', name: 'MPP电力管', spec: 'DN250', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 155, '南京': 162.75, '上海': 182.9, '杭州': 173.6 } },
  { id: 'mat-58', name: 'JDG电线管', spec: 'JDG16', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 4.5, '南京': 4.73, '上海': 5.31, '杭州': 5.04 } },
  { id: 'mat-59', name: 'JDG电线管', spec: 'JDG20', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 6, '南京': 6.3, '上海': 7.08, '杭州': 6.72 } },
  { id: 'mat-60', name: 'JDG电线管', spec: 'JDG25', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 8, '南京': 8.4, '上海': 9.44, '杭州': 8.96 } },
  { id: 'mat-61', name: 'JDG电线管', spec: 'JDG32', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 11, '南京': 11.55, '上海': 12.98, '杭州': 12.32 } },
  { id: 'mat-62', name: 'JDG电线管', spec: 'JDG40', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 15, '南京': 15.75, '上海': 17.7, '杭州': 16.8 } },
  { id: 'mat-63', name: 'JDG电线管', spec: 'JDG50', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 22, '南京': 23.1, '上海': 25.96, '杭州': 24.64 } },
  { id: 'mat-64', name: 'PE给水管', spec: 'DN20', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 4.5, '南京': 4.73, '上海': 5.31, '杭州': 5.04 } },
  { id: 'mat-65', name: 'PE给水管', spec: 'DN25', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 5.5, '南京': 5.78, '上海': 6.49, '杭州': 6.16 } },
  { id: 'mat-66', name: 'PE给水管', spec: 'DN32', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 7.5, '南京': 7.88, '上海': 8.85, '杭州': 8.4 } },
  { id: 'mat-67', name: 'PE给水管', spec: 'DN40', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 10, '南京': 10.5, '上海': 11.8, '杭州': 11.2 } },
  { id: 'mat-68', name: 'PE给水管', spec: 'DN50', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 14, '南京': 14.7, '上海': 16.52, '杭州': 15.68 } },
  { id: 'mat-69', name: 'PE给水管', spec: 'DN63', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 22, '南京': 23.1, '上海': 25.96, '杭州': 24.64 } },
  { id: 'mat-70', name: 'PE给水管', spec: 'DN75', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 30, '南京': 31.5, '上海': 35.4, '杭州': 33.6 } },
  { id: 'mat-71', name: 'PE给水管', spec: 'DN90', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 42, '南京': 44.1, '上海': 49.56, '杭州': 47.04 } },
  { id: 'mat-72', name: 'PPR给水管', spec: 'DN20', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 8.5, '南京': 8.93, '上海': 10.03, '杭州': 9.52 } },
  { id: 'mat-73', name: 'PPR给水管', spec: 'DN25', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 12.5, '南京': 13.13, '上海': 14.75, '杭州': 14 } },
  { id: 'mat-74', name: 'PPR给水管', spec: 'DN32', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 18, '南京': 18.9, '上海': 21.24, '杭州': 20.16 } },
  { id: 'mat-75', name: 'PPR给水管', spec: 'DN40', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 25, '南京': 26.25, '上海': 29.5, '杭州': 28 } },
  { id: 'mat-76', name: 'PPR给水管', spec: 'DN50', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 36, '南京': 37.8, '上海': 42.48, '杭州': 40.32 } },
  { id: 'mat-77', name: 'PPR给水管', spec: 'DN63', unit: '元/m', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '安装材料', channel: '广材网', base: { '合肥': 55, '南京': 57.75, '上海': 64.9, '杭州': 61.6 } },
  { id: 'mat-78', name: '水泥砖', spec: '240×115×53', unit: '元/块', dec: 2, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 0.42, '南京': 0.44, '上海': 0.5, '杭州': 0.47 } },
  { id: 'mat-79', name: '水泥砖', spec: '240×115×90', unit: '元/块', dec: 2, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 0.75, '南京': 0.79, '上海': 0.89, '杭州': 0.84 } },
  { id: 'mat-80', name: '水泥砖', spec: '190×90×40', unit: '元/块', dec: 2, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 0.55, '南京': 0.58, '上海': 0.65, '杭州': 0.62 } },
  { id: 'mat-81', name: '水泥砖', spec: '200×100×50', unit: '元/块', dec: 2, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 0.62, '南京': 0.65, '上海': 0.73, '杭州': 0.69 } },
  { id: 'mat-82', name: '煤矸石', spec: '0-10mm 回填', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 45, '南京': 47, '上海': 53, '杭州': 50 } },
  { id: 'mat-83', name: '煤矸石', spec: '10-40mm 回填', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 38, '南京': 40, '上海': 45, '杭州': 43 } },
  { id: 'mat-84', name: '煤矸石', spec: '40-80mm 回填', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 32, '南京': 34, '上海': 38, '杭州': 36 } },
  { id: 'mat-85', name: '煤矸石', spec: '80-150mm 回填', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 26, '南京': 27, '上海': 31, '杭州': 29 } },
  { id: 'mat-86', name: '加气块', spec: '600×200×100 B06', unit: '元/m³', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 235, '南京': 247, '上海': 277, '杭州': 263 } },
  { id: 'mat-87', name: '加气块', spec: '600×200×150 B06', unit: '元/m³', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 248, '南京': 260, '上海': 293, '杭州': 278 } },
  { id: 'mat-88', name: '加气块', spec: '600×200×200 B06', unit: '元/m³', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 260, '南京': 273, '上海': 307, '杭州': 291 } },
  { id: 'mat-89', name: '加气块', spec: '600×300×200 B06', unit: '元/m³', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 285, '南京': 299, '上海': 336, '杭州': 319 } },
  { id: 'mat-90', name: '加气块', spec: '600×300×250 B06', unit: '元/m³', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 320, '南京': 336, '上海': 378, '杭州': 358 } },
  { id: 'mat-91', name: 'ALC板', spec: '75mm 隔墙板', unit: '元/m²', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 55, '南京': 57.75, '上海': 64.9, '杭州': 61.6 } },
  { id: 'mat-92', name: 'ALC板', spec: '100mm 隔墙板', unit: '元/m²', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 68, '南京': 71.4, '上海': 80.24, '杭州': 76.16 } },
  { id: 'mat-93', name: 'ALC板', spec: '125mm 隔墙板', unit: '元/m²', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 80, '南京': 84, '上海': 94.4, '杭州': 89.6 } },
  { id: 'mat-94', name: 'ALC板', spec: '150mm 隔墙板', unit: '元/m²', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 92, '南京': 96.6, '上海': 108.56, '杭州': 103.04 } },
  { id: 'mat-95', name: 'ALC板', spec: '200mm 隔墙板', unit: '元/m²', dec: 2, tax: 0.13, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 118, '南京': 123.9, '上海': 139.24, '杭州': 132.16 } },
  { id: 'mat-96', name: '水泥', spec: 'P.O42.5 散装', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 385, '南京': 404, '上海': 454, '杭州': 431 } },
  { id: 'mat-97', name: '水泥', spec: 'P.O42.5 袋装', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 405, '南京': 425, '上海': 478, '杭州': 454 } },
  { id: 'mat-98', name: '水泥', spec: 'P.C32.5 散装', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 355, '南京': 373, '上海': 419, '杭州': 398 } },
  { id: 'mat-99', name: '水泥', spec: 'P.C32.5 袋装', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 375, '南京': 394, '上海': 443, '杭州': 420 } },
  { id: 'mat-100', name: '水泥', spec: 'P.O52.5 散装', unit: '元/吨', dec: 0, tax: 0.13, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 420, '南京': 441, '上海': 496, '杭州': 470 } },
  { id: 'mat-101', name: '砂', spec: '细砂', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 88, '南京': 92, '上海': 104, '杭州': 99 } },
  { id: 'mat-102', name: '砂', spec: '中砂', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 95, '南京': 100, '上海': 112, '杭州': 106 } },
  { id: 'mat-103', name: '砂', spec: '粗砂', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 100, '南京': 105, '上海': 118, '杭州': 112 } },
  { id: 'mat-104', name: '砂', spec: '机制砂', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 92, '南京': 97, '上海': 109, '杭州': 103 } },
  { id: 'mat-105', name: '砂', spec: '天然河砂', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 105, '南京': 110, '上海': 124, '杭州': 118 } },
  { id: 'mat-106', name: '砂', spec: '石粉', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 75, '南京': 79, '上海': 89, '杭州': 84 } },
  { id: 'mat-107', name: '碎石', spec: '0-5mm', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 95, '南京': 100, '上海': 112, '杭州': 106 } },
  { id: 'mat-108', name: '碎石', spec: '5-10mm', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 92, '南京': 97, '上海': 109, '杭州': 103 } },
  { id: 'mat-109', name: '碎石', spec: '10-20mm', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 88, '南京': 92, '上海': 104, '杭州': 99 } },
  { id: 'mat-110', name: '碎石', spec: '20-31.5mm', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 85, '南京': 89, '上海': 100, '杭州': 95 } },
  { id: 'mat-111', name: '碎石', spec: '31.5-60mm', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 80, '南京': 84, '上海': 94, '杭州': 90 } },
  { id: 'mat-112', name: '级配碎石', spec: '0-31.5mm', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 90, '南京': 95, '上海': 106, '杭州': 101 } },
  { id: 'mat-113', name: '级配碎石', spec: '0-40mm', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 86, '南京': 90, '上海': 101, '杭州': 96 } },
  { id: 'mat-114', name: '级配碎石', spec: '0-60mm', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 82, '南京': 86, '上海': 97, '杭州': 92 } },
  { id: 'mat-115', name: '商品混凝土', spec: 'C15', unit: '元/m³', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 400, '南京': 420, '上海': 472, '杭州': 448 } },
  { id: 'mat-116', name: '商品混凝土', spec: 'C20', unit: '元/m³', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 415, '南京': 436, '上海': 490, '杭州': 465 } },
  { id: 'mat-117', name: '商品混凝土', spec: 'C25', unit: '元/m³', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 430, '南京': 452, '上海': 507, '杭州': 482 } },
  { id: 'mat-118', name: '商品混凝土', spec: 'C30', unit: '元/m³', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 445, '南京': 467, '上海': 525, '杭州': 498 } },
  { id: 'mat-119', name: '商品混凝土', spec: 'C35', unit: '元/m³', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 465, '南京': 488, '上海': 549, '杭州': 521 } },
  { id: 'mat-120', name: '商品混凝土', spec: 'C40', unit: '元/m³', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 485, '南京': 509, '上海': 572, '杭州': 543 } },
  { id: 'mat-121', name: '商品混凝土', spec: 'C45', unit: '元/m³', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 510, '南京': 536, '上海': 602, '杭州': 571 } },
  { id: 'mat-122', name: '商品混凝土', spec: 'C50', unit: '元/m³', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 535, '南京': 562, '上海': 631, '杭州': 599 } },
  { id: 'mat-123', name: '砌筑砂浆', spec: 'M5', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 380, '南京': 399, '上海': 448, '杭州': 426 } },
  { id: 'mat-124', name: '砌筑砂浆', spec: 'M7.5', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 395, '南京': 415, '上海': 466, '杭州': 442 } },
  { id: 'mat-125', name: '砌筑砂浆', spec: 'M10', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 410, '南京': 431, '上海': 484, '杭州': 459 } },
  { id: 'mat-126', name: '砌筑砂浆', spec: 'M15', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 435, '南京': 457, '上海': 513, '杭州': 487 } },
  { id: 'mat-127', name: '砌筑砂浆', spec: 'M20', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 460, '南京': 483, '上海': 543, '杭州': 515 } },
  { id: 'mat-128', name: '抹灰砂浆', spec: 'M5', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 390, '南京': 410, '上海': 460, '杭州': 437 } },
  { id: 'mat-129', name: '抹灰砂浆', spec: 'M10', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 415, '南京': 436, '上海': 490, '杭州': 465 } },
  { id: 'mat-130', name: '抹灰砂浆', spec: 'M15', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 440, '南京': 462, '上海': 519, '杭州': 493 } },
  { id: 'mat-131', name: '抹灰砂浆', spec: 'M20', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 465, '南京': 488, '上海': 549, '杭州': 521 } },
  { id: 'mat-132', name: '地面砂浆', spec: 'M15', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 430, '南京': 452, '上海': 507, '杭州': 482 } },
  { id: 'mat-139', name: '地面砂浆', spec: 'M20', unit: '元/吨', dec: 0, tax: 0.03, vol: 0.005, trend: 0.0001, category: '地材', channel: '广材网', base: { '合肥': 455, '南京': 478, '上海': 537, '杭州': 510 } }
]

  const CITY_FACTOR = { 合肥: 0, 南京: 0.2, 上海: 0.5, 杭州: 0.35 };

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatDate(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function roundTo(value, dec) {
    const p = Math.pow(10, dec);
    return Math.round(value * p) / p;
  }

  function tradingDays(endDate, count) {
    const days = [];
    const d = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    while (days.length < count) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) days.unshift(formatDate(d));
      d.setDate(d.getDate() - 1);
    }
    return days;
  }

  function buildDemoData() {
    const endDate = new Date(2026, 7, 3);
    const days = tradingDays(endDate, 252);
    const series = {};

    for (const city of CITIES) {
      series[city] = {};
      for (const m of MATERIALS) {
        const rng = mulberry32(hashString(city + '|' + m.id));
        const list = [];
        let close = m.base[city];
        const drift = m.trend + CITY_FACTOR[city] * 0.00008;

        for (const date of days) {
          const noise = (rng() - 0.5) * 2 * m.vol;
          const shock = rng() < 0.025 ? (rng() - 0.5) * m.vol * 5 : 0;
          const gap = (rng() - 0.5) * m.vol * 0.6;
          const open = roundTo(close * (1 + gap), m.dec);
          const newClose = roundTo(close * (1 + drift + noise + shock), m.dec);
          const high = roundTo(Math.max(open, newClose) * (1 + rng() * m.vol * 0.9), m.dec);
          const low = roundTo(Math.min(open, newClose) * (1 - rng() * m.vol * 0.9), m.dec);
          list.push({
            date,
            open,
            high: Math.max(high, open, newClose),
            low: Math.min(low, open, newClose),
            close: newClose
          });
          close = newClose;
        }

        const lastClose = list.length ? list[list.length - 1].close : 0;
        if (lastClose > 0 && m.base[city] > 0) {
          const scale = m.base[city] / lastClose;
          for (const c of list) {
            c.open = roundTo(c.open * scale, m.dec);
            c.high = roundTo(c.high * scale, m.dec);
            c.low = roundTo(c.low * scale, m.dec);
            c.close = roundTo(c.close * scale, m.dec);
          }
        }

        series[city][m.id] = {
          name: m.name,
          spec: m.spec,
          unit: m.unit,
          dec: m.dec,
          taxRate: m.tax,
          source: '示例数据',
          series: list
        };
      }
    }

    return {
      cities: CITIES.slice(),
      materials: MATERIALS.map(m => Object.assign({}, m, { channel: m.channel || '广材网' })),
      series,
      latestDate: days[days.length - 1]
    };
  }

  function todayStr() {
    return formatDate(new Date());
  }

  function parseDate(str) {
    const parts = String(str || '').split('-').map(Number);
    return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
  }

  function nextWeekdays(fromDate, toDate) {
    const out = [];
    const d = parseDate(fromDate);
    const end = parseDate(toDate);
    if (!isFinite(d.getTime()) || !isFinite(end.getTime())) return out;
    d.setDate(d.getDate() + 1);
    while (d <= end) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) out.push(formatDate(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  function extendSeriesToDate(data, targetDate) {
    if (!data || !data.series) return data;
    const target = targetDate || todayStr();
    if (data.latestDate && data.latestDate >= target) return data;
    const metaMap = {};
    for (const m of (data.materials || MATERIALS)) metaMap[m.id] = m;
    let maxDate = data.latestDate || '';
    for (const city of (data.cities || CITIES)) {
      const cityMap = data.series[city] || {};
      for (const id of Object.keys(cityMap)) {
        const s = cityMap[id];
        if (!s.series || !s.series.length) continue;
        const last = s.series[s.series.length - 1];
        const dates = nextWeekdays(last.date, target);
        if (!dates.length) {
          if (last.date > maxDate) maxDate = last.date;
          continue;
        }
        const rng = mulberry32(hashString(city + '|' + id + '|' + last.date));
        const m = metaMap[id] || {};
        const vol = m.vol != null ? m.vol : 0.005;
        const drift = m.trend != null ? m.trend : 0;
        let close = last.close;
        for (const date of dates) {
          const noise = (rng() - 0.5) * 2 * vol;
          const gap = (rng() - 0.5) * vol * 0.6;
          const open = roundTo(close * (1 + gap), s.dec);
          const newClose = roundTo(close * (1 + drift + noise), s.dec);
          const high = roundTo(Math.max(open, newClose) * (1 + rng() * vol * 0.9), s.dec);
          const low = roundTo(Math.min(open, newClose) * (1 - rng() * vol * 0.9), s.dec);
          s.series.push({
            date,
            open,
            high: Math.max(high, open, newClose),
            low: Math.min(low, open, newClose),
            close: newClose
          });
          close = newClose;
        }
        const lastDate = dates[dates.length - 1];
        if (lastDate > maxDate) maxDate = lastDate;
      }
    }
    data.latestDate = maxDate;
    data.updatedAt = new Date().toISOString();
    return data;
  }


  global.PriceData = {
    CITIES,
    MATERIALS,
    buildDemoData,
    extendSeriesToDate,
    todayStr
  };
})(window);
