import { BackSide, ConeGeometry, FrontSide, Matrix4, Mesh, MeshBasicMaterial, RawShaderMaterial, SphereGeometry } from 'three'

import hsvVertexShader from './shaders/hsv.vert?raw'
import hsvFragmentShader from './shaders/hsv.frag?raw'

export const MAT_HSV = new RawShaderMaterial({
  fragmentShader: hsvFragmentShader,
  vertexShader: hsvVertexShader,
  transparent: true,
  depthTest: true,
  side: FrontSide,
  uniforms: {
    openAngle: { value: Math.PI / 2 },
    scale: { value: 1.0 },
    slope: { value: 0.5 },
    time: { value: 0.0 },
    phase: { value: 0 },
  },
})

interface CreateConeOptions {
  heightSegments: number
  material: RawShaderMaterial
}

export const createCone = (radius: number, height: number, segments: number, options?: Partial<CreateConeOptions>) => {
  const {
    heightSegments,
    material: originalMaterial,
  }: CreateConeOptions = {
    heightSegments: 1,
    material: MAT_HSV,
    ...options,
  }

  const matrix = new Matrix4().identity()
  matrix.multiply(new Matrix4().makeTranslation(0, 0.5, 0))
  matrix.multiply(new Matrix4().makeRotationX(Math.PI))

  const geometry = new ConeGeometry(radius, height, segments, heightSegments, false)
  geometry.applyMatrix4(matrix)

  const material = originalMaterial.clone()

  const cone = new Mesh(geometry, material)
  cone.renderOrder = 200

  return { cone, material }
}

export const createCursor = (radius: number, segments: number) => {
  const geometry = new SphereGeometry(radius, segments, segments)

  const material = new MeshBasicMaterial({
    color: 0xFF0000,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: FrontSide,
  })

  const cursor = new Mesh(geometry, material)
  cursor.renderOrder = 300

  const outlineGeometry = new SphereGeometry(radius + 0.003, segments, segments)
  const outlineMaterial = new MeshBasicMaterial({
    color: 0xFF0000,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: BackSide,
  })

  const outline = new Mesh(outlineGeometry, outlineMaterial)
  outline.renderOrder = 299
  return { cursor, material, outline, outlineMaterial }
}
