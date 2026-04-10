// world.js — procedural map generation with traps, secrets, torches
const TILE = 40;
const MAP_W = 80, MAP_H = 80;
let map, rooms, bossRoom;
let torches, traps, breakableWalls, secretRooms;

// 0=wall, 1=floor, 2=water, 3=bridge, 4=bossFloor, 5=spikeTrap, 6=breakableWall
function genMap() {
  map = Array.from({length:MAP_H}, ()=>Array(MAP_W).fill(0));
  rooms = [];
  torches = [];
  traps = [];
  breakableWalls = [];
  secretRooms = [];

  // Carve rooms
  for (let attempt=0; attempt<120; attempt++) {
    const rw = 4+Math.floor(Math.random()*6);
    const rh = 4+Math.floor(Math.random()*6);
    const rx = 2+Math.floor(Math.random()*(MAP_W-rw-4));
    const ry = 2+Math.floor(Math.random()*(MAP_H-rh-4));
    let ok = true;
    for (const r of rooms) {
      if (rx<r.x+r.w+2 && rx+rw>r.x-2 && ry<r.y+r.h+2 && ry+rh>r.y-2) { ok=false; break; }
    }
    if (!ok) continue;
    const room = {x:rx,y:ry,w:rw,h:rh,cx:rx+rw/2|0,cy:ry+rh/2|0,type:'normal'};
    rooms.push(room);
    for (let y=ry;y<ry+rh;y++) for (let x=rx;x<rx+rw;x++) map[y][x]=1;
  }

  // Connect rooms with corridors
  for (let i=1;i<rooms.length;i++) {
    const a=rooms[i-1], b=rooms[i];
    let cx=a.cx, cy=a.cy;
    while(cx!==b.cx) { map[cy][cx]=1; cx+=cx<b.cx?1:-1; }
    while(cy!==b.cy) { map[cy][cx]=1; cy+=cy<b.cy?1:-1; }
  }

  // Water patches
  for (let i=0;i<8;i++) {
    const wx=5+Math.floor(Math.random()*(MAP_W-10));
    const wy=5+Math.floor(Math.random()*(MAP_H-10));
    const wr=2+Math.random()*2;
    for (let y=wy-3;y<=wy+3;y++) for (let x=wx-3;x<=wx+3;x++) {
      if (y>=0&&y<MAP_H&&x>=0&&x<MAP_W && Math.hypot(x-wx,y-wy)<wr && map[y][x]===1)
        map[y][x]=2;
    }
    if (map[wy]&&map[wy][wx]===2) map[wy][wx]=3;
  }

  // Boss room
  bossRoom = rooms[rooms.length-1];
  bossRoom.type = 'boss';
  for (let y=bossRoom.y;y<bossRoom.y+bossRoom.h;y++)
    for (let x=bossRoom.x;x<bossRoom.x+bossRoom.w;x++) map[y][x]=4;

  // Add torches to some rooms
  for (let i=1;i<rooms.length;i++) {
    if (Math.random()<.5) continue;
    const r=rooms[i];
    rooms[i].lit = true;
    // Place torches at corners
    torches.push({x:r.x*TILE+8, y:r.y*TILE+8, flicker:Math.random()*Math.PI*2});
    torches.push({x:(r.x+r.w-1)*TILE+32, y:r.y*TILE+8, flicker:Math.random()*Math.PI*2});
  }

  // Add spike traps in corridors
  for (let y=1;y<MAP_H-1;y++) for (let x=1;x<MAP_W-1;x++) {
    if (map[y][x]!==1) continue;
    // Only in narrow corridors (floor with walls on 2 opposite sides)
    const isCorridorH = map[y-1][x]===0 && map[y+1][x]===0;
    const isCorridorV = map[y][x-1]===0 && map[y][x+1]===0;
    if ((isCorridorH||isCorridorV) && Math.random()<.08) {
      map[y][x] = 5;
      traps.push({x:x*TILE+TILE/2, y:y*TILE+TILE/2, tx:x, ty:y, activeT:0, cycle:2+Math.random()*2});
    }
  }

  // Secret rooms — carve small hidden rooms adjacent to existing rooms, connected by breakable wall
  for (let i=2;i<rooms.length-2;i++) {
    if (Math.random()<.7) continue;
    const r=rooms[i];
    // Try to place a 3x3 secret room to the right
    const sx=r.x+r.w+1, sy=r.cy-1;
    if (sx+3>=MAP_W) continue;
    let canPlace=true;
    for (let dy=0;dy<3;dy++) for (let dx=0;dx<3;dx++) {
      if (map[sy+dy]&&map[sy+dy][sx+dx]!==0) canPlace=false;
    }
    if (!canPlace) continue;
    for (let dy=0;dy<3;dy++) for (let dx=0;dx<3;dx++) map[sy+dy][sx+dx]=1;
    // Breakable wall between
    const bwx=r.x+r.w, bwy=r.cy;
    map[bwy][bwx]=6;
    breakableWalls.push({tx:bwx,ty:bwy,broken:false});
    secretRooms.push({x:sx,y:sy,w:3,h:3,cx:sx+1,cy:sy+1});
  }
}

function solid(tx,ty) {
  if (tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) return true;
  const t=map[ty][tx];
  return t===0 || t===2 || t===6;
}

function tileAt(px,py) {
  const tx=Math.floor(px/TILE), ty=Math.floor(py/TILE);
  if (tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) return 0;
  return map[ty][tx];
}
