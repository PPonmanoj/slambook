import * as THREE from 'three'

export const SCENES = {
  DOOR: 'door',
  CLASSROOM: 'classroom'
}

export const DESK_CONFIG = {
  TOTAL_DESKS: 74,
  EMPTY_COLUMNS: 4,
  ROWS: 10,
  COLS: 9,
  SPACING: 1.2
}

export const CAMERA_POSITIONS = {
  door: {
    position: new THREE.Vector3(0, 1.6, 5),
    lookAt: new THREE.Vector3(0, 1.6, 0)
  },
  classroom: {
    position: new THREE.Vector3(0, 1.6, 8),
    lookAt: new THREE.Vector3(0, 0.8, 0)
  }
}

export const COLORS = {
  doorWood: 0x8B4513,
  classroomFloor: 0xD2B48C,
  classroomWall: 0xfffacd,
  deskWood: 0x8B7355,
  postBoxRed: 0xff0000,
  tableWood: 0x654321
}