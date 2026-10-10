import { getRaw } from '../lib/storage'
import { currencySymbol } from '../lib/schoolConfig'
import { requirePermission } from '../lib/permissions'
import Dialog from '../components/Dialog'
import React, { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import {
  STORAGE_KEYS,
  INITIAL_VEHICLES,
  INITIAL_ROUTES,
  INITIAL_TRANSPORT_ASSIGNMENTS,
  INITIAL_STUDENTS,
  INITIAL_STAFF,
  readStoredList,
  writeStoredList,
} from '../lib/academicData'

const emptyRouteForm = {
  vehicleId: '',
  routeName: '',
  origin: '',
  destination: '',
  stopsInput: '',
  monthlyFee: 50,
}

const emptyVehicleForm = {
  vehicleNo: '',
  plateNo: '',
  capacity: 32,
  driverName: '',
  driverPhone: '',
  status: 'active',
}

const emptyAssignForm = {
  studentId: '',
  routeId: '',
  stopName: '',
}

export default function Transport() {
  const [vehicles, setVehicles] = useState([])
  const [routes, setRoutes] = useState([])
  const [assignments, setAssignments] = useState([])
  const [students, setStudents] = useState([])
  const [staff, setStaff] = useState([])
  
  const [activeTab, setActiveTab] = useState('routes')
  const [toast, setToast] = useState(null)
  const [hydrated, setHydrated] = useState(false)

  // Filters
  const [routeSearch, setRouteSearch] = useState('')
  const [fleetSearch, setFleetSearch] = useState('')
  const [assignSearch, setAssignSearch] = useState('')
  const [routeFilter, setRouteFilter] = useState('all')

  // Modals
  const [showRouteModal, setShowRouteModal] = useState(false)
  const [routeModalMode, setRouteModalMode] = useState('add')
  const [editingRouteId, setEditingRouteId] = useState(null)
  const [routeForm, setRouteForm] = useState(emptyRouteForm)

  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [vehicleModalMode, setVehicleModalMode] = useState('add')
  const [editingVehicleId, setEditingVehicleId] = useState(null)
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm)

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState(emptyAssignForm)

  // Authentication & Permissions
  const [currentUser, setCurrentUser] = useState('Super Admin')
  const [hasEditPermission, setHasEditPermission] = useState(true)

  useEffect(() => {
    // Read from localStorage
    const savedVehicles = readStoredList(STORAGE_KEYS.vehicles, INITIAL_VEHICLES)
    setVehicles(savedVehicles)
    const savedRoutes = readStoredList(STORAGE_KEYS.routes, INITIAL_ROUTES)
    setRoutes(savedRoutes)
    const savedAssignments = readStoredList(STORAGE_KEYS.transportAssignments, INITIAL_TRANSPORT_ASSIGNMENTS)
    setAssignments(savedAssignments)
    const savedStudents = readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS)
    setStudents(savedStudents)
    const savedStaff = readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF)
    setStaff(savedStaff)

    const savedUser = getRaw('educore.currentUser') || 'Super Admin'
    setCurrentUser(savedUser)

    // Check permissions
    if (savedUser === 'Super Admin') {
      setHasEditPermission(true)
    } else {
      const roles = readStoredList(STORAGE_KEYS.roles, [])
      const activeStaffMember = savedStaff.find(s => String(s.id) === String(savedUser))
      const activeRole = activeStaffMember ? roles.find(r => r.name === activeStaffMember.role) : null
      
      const permissions = activeRole?.permissions?.Transport || []
      setHasEditPermission(permissions.includes('edit') || permissions.includes('create') || permissions.includes('delete'))
    }

    setHydrated(true)
  }, [])

  // Sync state back to localStorage
  useEffect(() => {
    if (!hydrated) return
    writeStoredList(STORAGE_KEYS.vehicles, vehicles)
  }, [vehicles, hydrated])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList(STORAGE_KEYS.routes, routes)
  }, [routes, hydrated])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList(STORAGE_KEYS.transportAssignments, assignments)
  }, [assignments, hydrated])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Memoized stats
  const stats = useMemo(() => {
    const totalVehiclesCount = vehicles.length
    const activeRoutesCount = routes.length
    const assignedStudentsCount = assignments.length
    const totalDriversCount = vehicles.filter(v => v.driverName).length
    
    // Estimate monthly collections based on assigned students and route pricing
    const monthlyCollections = assignments.reduce((acc, a) => {
      const routeObj = routes.find(r => r.id === a.routeId)
      return acc + (routeObj ? parseInt(routeObj.monthlyFee || 0, 10) : 0)
    }, 0)

    return {
      totalVehicles: totalVehiclesCount,
      activeRoutes: activeRoutesCount,
      assignedStudents: assignedStudentsCount,
      totalDrivers: totalDriversCount,
      monthlyCollections,
    }
  }, [vehicles, routes, assignments])

  // Route Management CRUD
  const handleOpenAddRoute = () => {
    if (!hasEditPermission) return
    setRouteForm(emptyRouteForm)
    setRouteModalMode('add')
    setShowRouteModal(true)
  }

  const handleOpenEditRoute = (route) => {
    if (!hasEditPermission) return
    setRouteForm({
      vehicleId: route.vehicleId || '',
      routeName: route.routeName,
      origin: route.origin,
      destination: route.destination,
      stopsInput: (route.stops || []).join(', '),
      monthlyFee: route.monthlyFee,
    })
    setEditingRouteId(route.id)
    setRouteModalMode('edit')
    setShowRouteModal(true)
  }

  const handleSaveRoute = (e) => {
    e?.preventDefault?.(); if (!requirePermission(routeModalMode === 'add' ? 'create' : 'edit')) return

    e.preventDefault()
    if (!routeForm.vehicleId || !routeForm.routeName || !routeForm.origin || !routeForm.destination) {
      showToast('Route Name, Origin, and Destination are required fields.', 'error')
      return
    }

    const stopsArray = routeForm.stopsInput
      ? routeForm.stopsInput.split(',').map(s => s.trim()).filter(Boolean)
      : []

    if (routeModalMode === 'edit' && assignments.some(a => a.routeId === editingRouteId && !stopsArray.includes(a.stopName))) { showToast('Reassign students before removing their stops', 'error'); return }
    const vehicle = vehicles.find(v => String(v.id) === String(routeForm.vehicleId))
    if (!vehicle || vehicle.status !== 'active') { showToast('Choose an active vehicle', 'error'); return }
    if (assignments.filter(a => a.routeId === editingRouteId || routes.some(r=>r.id===a.routeId && String(r.vehicleId)===String(vehicle.id))).length > Number(vehicle.capacity)) { showToast('This vehicle does not have enough capacity', 'error'); return }
    if (routeModalMode === 'add') {
      const newRoute = {
        id: routes.length > 0 ? Math.max(...routes.map(r => r.id)) + 1 : 1,
        vehicleId: Number(routeForm.vehicleId),
        routeName: routeForm.routeName,
        origin: routeForm.origin,
        destination: routeForm.destination,
        stops: stopsArray,
        monthlyFee: parseInt(routeForm.monthlyFee || 0, 10),
      }
      setRoutes([newRoute, ...routes])
      showToast(`Route "${routeForm.routeName}" created.`)
    } else {
      const updatedRoutes = routes.map(r => {
        if (r.id === editingRouteId) {
          return {
            ...r,
            routeName: routeForm.routeName,
            origin: routeForm.origin,
            destination: routeForm.destination,
            stops: stopsArray,
            monthlyFee: parseInt(routeForm.monthlyFee || 0, 10),
          }
        }
        return r
      })
      setRoutes(updatedRoutes)
      showToast(`Route "${routeForm.routeName}" updated successfully.`)
    }
    setShowRouteModal(false)
    setRouteForm(emptyRouteForm)
  }

  const handleDeleteRoute = (id, routeName) => {
    if (!requirePermission('delete')) return

    if (!hasEditPermission) return
    const activeAssigns = assignments.filter(a => a.routeId === id)
    if (activeAssigns.length > 0) {
      showToast(`Cannot delete. This route has ${activeAssigns.length} assigned students.`, 'error')
      return
    }

    if (window.confirm(`Are you sure you want to remove the route "${routeName}"?`)) {
      setRoutes(routes.filter(r => r.id !== id))
      showToast(`Route "${routeName}" deleted.`)
    }
  }

  // Vehicle Management CRUD
  const handleOpenAddVehicle = () => {
    if (!hasEditPermission) return
    setVehicleForm(emptyVehicleForm)
    setVehicleModalMode('add')
    setShowVehicleModal(true)
  }

  const handleOpenEditVehicle = (vehicle) => {
    if (!hasEditPermission) return
    setVehicleForm({
      vehicleNo: vehicle.vehicleNo,
      plateNo: vehicle.plateNo,
      capacity: vehicle.capacity,
      driverName: vehicle.driverName,
      driverPhone: vehicle.driverPhone,
      status: vehicle.status,
    })
    setEditingVehicleId(vehicle.id)
    setVehicleModalMode('edit')
    setShowVehicleModal(true)
  }

  const handleSaveVehicle = (e) => {
    e?.preventDefault?.(); if (!requirePermission(vehicleModalMode === 'add' ? 'create' : 'edit')) return

    e.preventDefault()
    const allocated = assignments.filter(a => routes.some(r => r.id === a.routeId && r.vehicleId === editingVehicleId)).length
    if (!Number.isInteger(Number(vehicleForm.capacity)) || Number(vehicleForm.capacity) < Math.max(1,allocated)) { showToast('Capacity must cover all allocated students', 'error'); return }
    if (vehicles.some(v => v.id !== editingVehicleId && v.plateNo.trim().toLowerCase() === vehicleForm.plateNo.trim().toLowerCase())) { showToast('Plate number already exists', 'error'); return }
    if (!vehicleForm.vehicleNo || !vehicleForm.plateNo || !vehicleForm.driverName) {
      showToast('Vehicle Number, Plate Number, and Driver Name are required.', 'error')
      return
    }

    if (vehicleModalMode === 'add') {
      const newVehicle = {
        id: vehicles.length > 0 ? Math.max(...vehicles.map(v => v.id)) + 1 : 1,
        vehicleNo: vehicleForm.vehicleNo,
        plateNo: vehicleForm.plateNo,
        capacity: parseInt(vehicleForm.capacity || 32, 10),
        driverName: vehicleForm.driverName,
        driverPhone: vehicleForm.driverPhone,
        status: vehicleForm.status,
      }
      setVehicles([newVehicle, ...vehicles])
      showToast(`Vehicle "${vehicleForm.vehicleNo}" added to fleet.`)
    } else {
      const updatedVehicles = vehicles.map(v => {
        if (v.id === editingVehicleId) {
          return {
            ...v,
            vehicleNo: vehicleForm.vehicleNo,
            plateNo: vehicleForm.plateNo,
            capacity: parseInt(vehicleForm.capacity, 10),
            driverName: vehicleForm.driverName,
            driverPhone: vehicleForm.driverPhone,
            status: vehicleForm.status,
          }
        }
        return v
      })
      setVehicles(updatedVehicles)
      showToast(`Vehicle "${vehicleForm.vehicleNo}" updated successfully.`)
    }
    setShowVehicleModal(false)
    setVehicleForm(emptyVehicleForm)
  }

  const handleDeleteVehicle = (id, vehicleNo) => {
    if (routes.some(r => r.vehicleId === id)) { showToast('Reassign routes before deleting this vehicle', 'error'); return }
    if (!requirePermission('delete')) return

    if (!hasEditPermission) return
    if (window.confirm(`Are you sure you want to remove vehicle "${vehicleNo}" from the fleet?`)) {
      setVehicles(vehicles.filter(v => v.id !== id))
      showToast(`Vehicle "${vehicleNo}" removed from fleet.`)
    }
  }

  // Student Assignment Operations
  const handleOpenAssign = () => {
    if (!hasEditPermission) return
    setAssignForm(emptyAssignForm)
    setShowAssignModal(true)
  }

  const handleAssignStudent = (e) => {
    e.preventDefault(); if (!requirePermission('create')) return
    e.preventDefault()
    const { studentId, routeId, stopName } = assignForm
    if (!studentId || !routeId || !stopName) {
      showToast('Please fill out all allocation fields.', 'error')
      return
    }

    const alreadyAssigned = assignments.find(a => String(a.studentId) === String(studentId))
    if (alreadyAssigned) {
      showToast('This student is already assigned to a route. Remove the previous assignment first.', 'error')
      return
    }

    const selectedStudent = students.find(s => String(s.id) === String(studentId))
    const selectedRoute = routes.find(r => r.id === parseInt(routeId, 10))

    const vehicle = vehicles.find(v => v.id === selectedRoute?.vehicleId)
    if (!selectedStudent || selectedStudent.status !== 'active' || !selectedRoute?.stops.includes(stopName) || !vehicle || vehicle.status !== 'active') { showToast('Choose an active student and a route with an active vehicle and valid stop', 'error'); return }
    const allocated = assignments.filter(a => routes.some(r => r.id === a.routeId && r.vehicleId === vehicle.id)).length
    if (allocated >= Number(vehicle.capacity)) { showToast('The assigned vehicle is full', 'error'); return }
    const newAssignment = {
      id: assignments.length > 0 ? Math.max(...assignments.map(a => a.id)) + 1 : 1,
      studentId: String(studentId),
      studentName: selectedStudent ? selectedStudent.name : `Student #${studentId}`,
      routeId: parseInt(routeId, 10),
      stopName,
    }

    setAssignments([newAssignment, ...assignments])
    showToast(`Assigned ${newAssignment.studentName} to ${selectedRoute?.routeName || 'Route'}.`)
    setShowAssignModal(false)
  }

  const handleRemoveAssignment = (id, studentName) => {
    if (!requirePermission('delete')) return
    if (!hasEditPermission) return
    if (window.confirm(`Are you sure you want to remove transport route allocation for ${studentName}?`)) {
      setAssignments(assignments.filter(a => a.id !== id))
      showToast(`Removed allocation for ${studentName}.`)
    }
  }

  // Memoized filter lookups
  const filteredRoutes = useMemo(() => {
    return routes.filter(r => {
      return r.routeName.toLowerCase().includes(routeSearch.toLowerCase()) ||
             r.origin.toLowerCase().includes(routeSearch.toLowerCase()) ||
             r.destination.toLowerCase().includes(routeSearch.toLowerCase())
    })
  }, [routes, routeSearch])

  const filteredFleet = useMemo(() => {
    return vehicles.filter(v => {
      return v.vehicleNo.toLowerCase().includes(fleetSearch.toLowerCase()) ||
             v.driverName.toLowerCase().includes(fleetSearch.toLowerCase()) ||
             v.plateNo.toLowerCase().includes(fleetSearch.toLowerCase())
    })
  }, [vehicles, fleetSearch])

  const filteredAssignments = useMemo(() => {
    return assignments.map(a => {
      const studentObj = students.find(s => String(s.id) === String(a.studentId))
      const routeObj = routes.find(r => r.id === a.routeId)
      return {
        ...a,
        classDetails: studentObj ? `Class ${studentObj.classStr || studentObj.classId || '—'}` : '—',
        routeName: routeObj ? routeObj.routeName : 'Unknown Route',
        routeFee: routeObj ? routeObj.monthlyFee : 0,
      }
    }).filter(a => {
      const matchSearch = a.studentName.toLowerCase().includes(assignSearch.toLowerCase()) ||
                          a.routeName.toLowerCase().includes(assignSearch.toLowerCase())
      
      const matchRoute = routeFilter === 'all' || String(a.routeId) === String(routeFilter)
      return matchSearch && matchRoute
    })
  }, [assignments, students, routes, assignSearch, routeFilter])

  // Get active stops when assigning a student
  const activeRouteStops = useMemo(() => {
    if (!assignForm.routeId) return []
    const match = routes.find(r => r.id === parseInt(assignForm.routeId, 10))
    return match ? match.stops : []
  }, [assignForm.routeId, routes])

  return (
    <Layout>
      {/* HEADER */}
      <div className="settings-header">
        <div>
          <h1>
            <i className="fa-solid fa-bus" style={{ color: 'var(--amber)', marginRight: 8 }}></i>
            Transport &amp; Bus Routes
          </h1>
          <p>Configure transport routes, manage vehicle and driver profiles, and assign pickup stops to students.</p>
        </div>
        <div className="settings-actions">
          {hasEditPermission && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={handleOpenAddRoute}>
                <i className="fa-solid fa-plus"></i> Create Route
              </button>
              <button className="btn btn-export btn-sm" onClick={handleOpenAddVehicle}>
                <i className="fa-solid fa-truck-monster"></i> Add Vehicle
              </button>
              <button className="btn btn-ghost btn-sm" onClick={handleOpenAssign}>
                <i className="fa-solid fa-user-plus"></i> Assign Student
              </button>
            </div>
          )}
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--amberbg)', color: 'var(--amber)', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-bus"></i>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--t1)' }}>{stats.totalVehicles}</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>Fleet Size</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--purplebg)', color: 'var(--purple)', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-route"></i>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--t1)' }}>{stats.activeRoutes}</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>Active Routes</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--bluebg)', color: 'var(--blue)', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-user-group"></i>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--t1)' }}>{stats.assignedStudents}</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>Assigned Students</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--greenbg)', color: 'var(--green)', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-id-card"></i>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--t1)' }}>{stats.totalDrivers}</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>Active Drivers</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--tealbg)', color: 'var(--teal)', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-money-bill-trend-up"></i>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--t1)' }}>{currencySymbol()} {stats.monthlyCollections}</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>Monthly Billings</div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="tabs-nav" style={{ marginBottom: '16px' }}>
        <button className={activeTab === 'routes' ? 'active' : ''} onClick={() => setActiveTab('routes')}>
          📍 Transport Routes ({filteredRoutes.length})
        </button>
        <button className={activeTab === 'fleet' ? 'active' : ''} onClick={() => setActiveTab('fleet')}>
          🚍 Vehicle Fleet &amp; Drivers ({filteredFleet.length})
        </button>
        <button className={activeTab === 'allocations' ? 'active' : ''} onClick={() => setActiveTab('allocations')}>
          🎒 Student Allocations ({filteredAssignments.length})
        </button>
      </div>

      {/* TAB CONTENT: ROUTES */}
      {activeTab === 'routes' && (
        <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
          <div className="roles-toolbar academic-toolbar">
            <div className="roles-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input aria-label="Search route name, destination..."
                placeholder="Search route name, destination..."
                value={routeSearch}
                onChange={(e) => setRouteSearch(e.target.value)}
              />
              {routeSearch && (
                <button aria-label="Close" className="roles-search-clear" onClick={() => setRouteSearch('')}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          </div>

          <div className="table-wrap">
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Route Details</th>
                  <th>Origin / Departure</th>
                  <th>Destination</th>
                  <th>Pickup Stops (Ordered)</th>
                  <th style={{ textAlign: 'center' }}>Monthly Fee</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="roles-empty">
                      No transport routes found.
                    </td>
                  </tr>
                ) : (
                  filteredRoutes.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, color: 'var(--t1)' }}>{r.routeName}</td>
                      <td>{r.origin}</td>
                      <td>{r.destination}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(r.stops || []).map((stop, index) => (
                            <span
                              key={stop}
                              style={{
                                fontSize: '10px',
                                background: 'var(--bg3)',
                                border: '1px solid var(--border)',
                                color: 'var(--t2)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {index + 1}. {stop}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--green)' }}>
                        {currencySymbol()} {r.monthlyFee}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {hasEditPermission && (
                          <div className="roles-actions" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                            <button aria-label="Edit Route"
                              className="btn-icon-sm"
                              title="Edit Route"
                              onClick={() => handleOpenEditRoute(r)}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button aria-label="Delete Route"
                              className="btn-icon-sm danger"
                              title="Delete Route"
                              onClick={() => handleDeleteRoute(r.id, r.routeName)}
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: FLEET */}
      {activeTab === 'fleet' && (
        <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
          <div className="roles-toolbar academic-toolbar">
            <div className="roles-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input aria-label="Search bus number, driver name, plate..."
                placeholder="Search bus number, driver name, plate..."
                value={fleetSearch}
                onChange={(e) => setFleetSearch(e.target.value)}
              />
              {fleetSearch && (
                <button aria-label="Close" className="roles-search-clear" onClick={() => setFleetSearch('')}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          </div>

          <div className="table-wrap">
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Vehicle Code</th>
                  <th>License Plate</th>
                  <th>Passenger Capacity</th>
                  <th>Driver Name</th>
                  <th>Driver Phone</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFleet.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="roles-empty">
                      No vehicles cataloged.
                    </td>
                  </tr>
                ) : (
                  filteredFleet.map(v => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 700, color: 'var(--t1)' }}>{v.vehicleNo}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12.5px' }}>{v.plateNo}</td>
                      <td>{v.capacity} Seats</td>
                      <td>{v.driverName}</td>
                      <td>{v.driverPhone || '—'}</td>
                      <td>
                        {v.status === 'active' ? (
                          <span style={{ background: 'var(--greenbg)', color: 'var(--green)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                            Active
                          </span>
                        ) : (
                          <span style={{ background: 'var(--amberbg)', color: 'var(--amber)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                            Maintenance
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {hasEditPermission && (
                          <div className="roles-actions" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                            <button aria-label="Edit Vehicle"
                              className="btn-icon-sm"
                              title="Edit Vehicle"
                              onClick={() => handleOpenEditVehicle(v)}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button aria-label="Remove Vehicle"
                              className="btn-icon-sm danger"
                              title="Remove Vehicle"
                              onClick={() => handleDeleteVehicle(v.id, v.vehicleNo)}
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ALLOCATIONS */}
      {activeTab === 'allocations' && (
        <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
          <div className="roles-toolbar academic-toolbar">
            <div className="roles-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input aria-label="Search student name or route..."
                placeholder="Search student name or route..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
              />
              {assignSearch && (
                <button aria-label="Close" className="roles-search-clear" onClick={() => setAssignSearch('')}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            <select aria-label="Route Filter" className="roles-filter" value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)}>
              <option value="all">All Routes</option>
              {routes.map(r => (
                <option key={r.id} value={r.id}>{r.routeName}</option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Class / Section</th>
                  <th>Assigned Route</th>
                  <th>Pick-up Stop</th>
                  <th>Monthly Rate</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="roles-empty">
                      No student route allocations registered.
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 'bold', color: 'var(--t1)' }}>{a.studentName}</td>
                      <td>{a.classDetails}</td>
                      <td style={{ fontWeight: 600 }}>{a.routeName}</td>
                      <td>
                        <span style={{ color: 'var(--purple)', fontWeight: 'bold' }}>📍 {a.stopName}</span>
                      </td>
                      <td style={{ color: 'var(--green)', fontWeight: 'bold' }}>{currencySymbol()} {a.routeFee}</td>
                      <td style={{ textAlign: 'right' }}>
                        {hasEditPermission && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--red)' }}
                            onClick={() => handleRemoveAssignment(a.id, a.studentName)}
                          >
                            Cancel Allocation
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TOAST SYSTEM */}
      {toast && (
        <div className="toast-stack">
          <div className={`toast ${toast.type}`}>
            <span>{toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* ROUTE DIALOG MODAL */}
      {showRouteModal && (
        <Dialog className="modal-overlay" onClick={() => setShowRouteModal(false)}>
          <div className="modal-panel role-form-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{routeModalMode === 'add' ? 'Create Transport Route' : 'Edit Route Details'}</h3>
                <p className="modal-sub">Define bus routes, stops list, and fare parameters.</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setShowRouteModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSaveRoute}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group"><label htmlFor="route-vehicle">Vehicle</label><select id="route-vehicle" className="form-select" required value={routeForm.vehicleId} onChange={e=>setRouteForm({...routeForm,vehicleId:e.target.value})}><option value="">Choose vehicle</option>{vehicles.filter(v=>v.status==='active').map(v=><option key={v.id} value={v.id}>{v.vehicleNo} — {v.capacity} seats</option>)}</select></div>
                  <div className="form-group">
                    <label>Route Label / Title <span className="req">*</span></label>
                    <input aria-label="Route Label / Title"
                      className="form-input"
                      placeholder="e.g. Route D - Dwarka Sec 12"
                      value={routeForm.routeName}
                      onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label>Origin Campus <span className="req">*</span></label>
                      <input aria-label="Origin Campus"
                        className="form-input"
                        placeholder="e.g. Main Campus"
                        value={routeForm.origin}
                        onChange={(e) => setRouteForm({ ...routeForm, origin: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Terminus / Destination <span className="req">*</span></label>
                      <input aria-label="Terminus / Destination"
                        className="form-input"
                        placeholder="e.g. Dwarka Sec 12"
                        value={routeForm.destination}
                        onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Stops (Comma separated in order) <span className="req">*</span></label>
                    <input aria-label="Stops (Comma separated in order)"
                      className="form-input"
                      placeholder="Campus Stop, Palam Sec 3, Dwarka Metro, Sector 12 Hub"
                      value={routeForm.stopsInput}
                      onChange={(e) => setRouteForm({ ...routeForm, stopsInput: e.target.value })}
                      required
                    />
                    <small style={{ color: 'var(--t3)', fontSize: '11px', marginTop: '2px' }}>
                      Separate distinct pickup stop labels with commas in order of transit.
                    </small>
                  </div>
                  <div className="form-group" style={{ maxWidth: '240px' }}>
                    <label>Monthly Ticket Fee (Rs.) <span className="req">*</span></label>
                    <input aria-label="Monthly Ticket Fee (Rs.)"
                      type="number"
                      className="form-input"
                      min="0"
                      value={routeForm.monthlyFee}
                      onChange={(e) => setRouteForm({ ...routeForm, monthlyFee: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" type="button" onClick={() => setShowRouteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* VEHICLE DIALOG MODAL */}
      {showVehicleModal && (
        <Dialog className="modal-overlay" onClick={() => setShowVehicleModal(false)}>
          <div className="modal-panel role-form-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{vehicleModalMode === 'add' ? 'Add Vehicle Profile' : 'Edit Vehicle Details'}</h3>
                <p className="modal-sub">Add license indexes and assign drivers to school bus fleet.</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setShowVehicleModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSaveVehicle}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
                    <div className="form-group">
                      <label>Vehicle Code / Identifier <span className="req">*</span></label>
                      <input aria-label="Vehicle Code / Identifier"
                        className="form-input"
                        placeholder="e.g. BUS-04"
                        value={vehicleForm.vehicleNo}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNo: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select aria-label="Status"
                        className="form-select"
                        value={vehicleForm.status}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
                      >
                        <option value="active">Active / Running</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: '1.3fr 0.7fr', gap: '10px' }}>
                    <div className="form-group">
                      <label>License Plate Number <span className="req">*</span></label>
                      <input aria-label="License Plate Number"
                        className="form-input"
                        placeholder="e.g. DL 2PC 5432"
                        value={vehicleForm.plateNo}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, plateNo: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Seating Cap <span className="req">*</span></label>
                      <input aria-label="Seating Cap"
                        type="number"
                        className="form-input"
                        min="5"
                        max="120"
                        value={vehicleForm.capacity}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Driver Full Name <span className="req">*</span></label>
                    <input aria-label="Driver Full Name"
                      className="form-input"
                      placeholder="e.g. Baldev Singh"
                      value={vehicleForm.driverName}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Driver Phone Contact</label>
                    <input aria-label="Driver Phone Contact"
                      className="form-input"
                      placeholder="e.g. 9812345000"
                      value={vehicleForm.driverPhone}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" type="button" onClick={() => setShowVehicleModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* STUDENT ROUTE ALLOCATION DIALOG */}
      {showAssignModal && (
        <Dialog className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-panel role-form-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Allocate Student Transport</h3>
                <p className="modal-sub">Assign a student to a bus route and pickup stop.</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setShowAssignModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleAssignStudent}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label>Select Student <span className="req">*</span></label>
                    <select aria-label="Select Student"
                      className="form-select"
                      value={assignForm.studentId}
                      onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Student --</option>
                      {students.map(s => {
                        const assigned = assignments.some(a => String(a.studentId) === String(s.id))
                        return (
                          <option key={s.id} value={s.id} disabled={assigned}>
                            {s.name} (Class {s.classStr || s.classId || '—'}) {assigned ? '[Already Assigned]' : ''}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Select Bus Route <span className="req">*</span></label>
                    <select aria-label="Select Bus Route"
                      className="form-select"
                      value={assignForm.routeId}
                      onChange={(e) => setAssignForm({ ...assignForm, routeId: e.target.value, stopName: '' })}
                      required
                    >
                      <option value="">-- Choose Route --</option>
                      {routes.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.routeName} ({currencySymbol()} {r.monthlyFee}/month)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Pickup / Drop-off Stop <span className="req">*</span></label>
                    <select aria-label="Pickup / Drop-off Stop"
                      className="form-select"
                      value={assignForm.stopName}
                      onChange={(e) => setAssignForm({ ...assignForm, stopName: e.target.value })}
                      disabled={!assignForm.routeId}
                      required
                    >
                      <option value="">-- Choose Pickup Stop --</option>
                      {activeRouteStops.map(stop => (
                        <option key={stop} value={stop}>{stop}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" type="button" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </Layout>
  )
}
