import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

export default function PathViewer({ path }) {
  const mountRef = useRef(null)
  const { scene, camera, renderer } = useMemo(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0b1020)
    const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 100)
    camera.position.set(1.2, 0.9, 1.2)
    camera.lookAt(0, 0, 0)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    return { scene, camera, renderer }
  }, [])

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const grid = new THREE.GridHelper(2, 20, 0x2b3d7a, 0x1f2b55)
    scene.add(grid)

    const light = new THREE.DirectionalLight(0xffffff, 1.0)
    light.position.set(2, 3, 2)
    scene.add(light)

    const amb = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(amb)

    let rafId
    const onResize = () => {
      if (!mount) return
      const w = mount.clientWidth
      const h = mount.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    onResize()
    const ro = new ResizeObserver(onResize)
    ro.observe(mount)

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      mount.removeChild(renderer.domElement)
      // dispose will be handled implicitly here
    }
  }, [renderer, scene, camera])

  useEffect(() => {
    // Clear previous path objects
    scene.children = scene.children.filter(obj => !(obj.userData && obj.userData.isPath))

    if (!path || !Array.isArray(path.points) || path.points.length < 2) return

    const points = path.points.map(p => new THREE.Vector3(p.x, p.y, p.z))

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineDashedMaterial({ color: 0x8aa9ff, dashSize: 0.05, gapSize: 0.02 })
    const line = new THREE.Line(geometry, material)
    line.computeLineDistances()
    line.userData.isPath = true
    scene.add(line)

    // spheres at waypoints
    const sphereGeom = new THREE.SphereGeometry(0.01, 16, 16)
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0xbcd1ff })
    points.forEach((pt, idx) => {
      const s = new THREE.Mesh(sphereGeom, sphereMat)
      s.position.copy(pt)
      s.userData.isPath = true
      scene.add(s)
    })

    // markers for grasp/release, prefer explicit grasp_events if provided
    const graspMat = new THREE.MeshStandardMaterial({ color: 0x00d084 })
    const releaseMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b })
    if (Array.isArray(path.grasp_events) && path.grasp_events.length) {
      path.grasp_events.forEach((ge) => {
        const idx = ge.index
        if (Number.isInteger(idx) && points[idx]) {
          const p = points[idx]
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02), ge.event === 'grasp' ? graspMat : releaseMat)
          m.position.set(p.x, p.y, p.z)
          m.userData.isPath = true
          scene.add(m)
        }
      })
    } else {
      path.points.forEach((p) => {
        if (p.grasp == null) return
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02), p.grasp ? graspMat : releaseMat)
        m.position.set(p.x, p.y, p.z)
        m.userData.isPath = true
        scene.add(m)
      })
    }

    // fixtures (pick/place) if provided
    if (path.fixtures) {
      const sphereGeomFx = new THREE.SphereGeometry(0.03, 16, 16)
      if (Array.isArray(path.fixtures.pick)) {
        const s = new THREE.Mesh(sphereGeomFx, new THREE.MeshStandardMaterial({ color: 0x00ff00 }))
        const [x, y, z] = path.fixtures.pick.map(v => v / 1000) // mm -> m if coming in mm
        s.position.set(x, y, z)
        s.userData.isPath = true
        scene.add(s)
      }
      if (Array.isArray(path.fixtures.place)) {
        const s = new THREE.Mesh(sphereGeomFx, new THREE.MeshStandardMaterial({ color: 0xffa500 }))
        const [x, y, z] = path.fixtures.place.map(v => v / 1000)
        s.position.set(x, y, z)
        s.userData.isPath = true
        scene.add(s)
      }
    }
  }, [path, scene])

  return <div ref={mountRef} className="viewer" />
}
