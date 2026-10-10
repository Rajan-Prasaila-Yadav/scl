import { availableStock, fineBalance, refreshLoan } from '../lib/libraryData'
import { getRaw } from '../lib/storage'
import { currencySymbol } from '../lib/schoolConfig'
import { requirePermission } from '../lib/permissions'
import { localDate } from '../lib/validation'
import Dialog from '../components/Dialog'
import React, { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import {
  STORAGE_KEYS,
  INITIAL_BOOKS,
  INITIAL_BORROWINGS,
  INITIAL_STUDENTS,
  INITIAL_STAFF,
  readStoredList,
  writeStoredList,
} from '../lib/academicData'

const DEFAULT_SUBJECTS = ['English', 'Mathematics', 'Science', 'Social Studies', 'Computer Science', 'General']

const emptyBookForm = {
  title: '',
  author: '',
  subject: 'General',
  isbn: '',
  publisher: '',
  quantity: 1,
}

const emptyCheckoutForm = {
  bookId: '',
  recipientType: 'Student',
  recipientId: '',
  dueDate: '',
}

export default function Library() {
  const [books, setBooks] = useState([])
  const [borrowings, setBorrowings] = useState([])
  const [students, setStudents] = useState([])
  const [staff, setStaff] = useState([])
  const [activeTab, setActiveTab] = useState('catalog')
  const [toast, setToast] = useState(null)
  const [hydrated, setHydrated] = useState(false)

  // Filters
  const [catalogSearch, setCatalogSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [checkoutSearch, setCheckoutSearch] = useState('')
  const [checkoutFilter, setCheckoutFilter] = useState('all') // all, issued, overdue, returned

  // Modals
  const [showBookModal, setShowBookModal] = useState(false)
  const [bookModalMode, setBookModalMode] = useState('add') // add or edit
  const [editingBookId, setEditingBookId] = useState(null)
  const [bookForm, setBookForm] = useState(emptyBookForm)

  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState(emptyCheckoutForm)

  // Authentication & Permissions
  const [currentUser, setCurrentUser] = useState('Super Admin')
  const [hasEditPermission, setHasEditPermission] = useState(true)

  useEffect(() => {
    // Read from localStorage
    const savedBooks = readStoredList(STORAGE_KEYS.books, INITIAL_BOOKS)
    setBooks(savedBooks)
    const savedBorrowings = readStoredList(STORAGE_KEYS.borrowings, INITIAL_BORROWINGS)
    setBorrowings(savedBorrowings)
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
      
      const permissions = activeRole?.permissions?.Library || []
      setHasEditPermission(permissions.includes('edit') || permissions.includes('create') || permissions.includes('delete'))
    }

    setHydrated(true)
  }, [])

  // Sync state back to localStorage
  useEffect(() => {
    if (!hydrated) return
    writeStoredList(STORAGE_KEYS.books, books)
  }, [books, hydrated])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList(STORAGE_KEYS.borrowings, borrowings)
  }, [borrowings, hydrated])

  useEffect(() => {
    if (!hydrated) return
    setBorrowings(current => current.map(loan => refreshLoan(loan)))
  }, [hydrated])
  useEffect(() => {
    if (!hydrated) return
    setBooks(current => {
      const next = current.map(book => ({...book,available:availableStock(book,borrowings)}))
      return next.some((book,index) => book.available !== current[index].available) ? next : current
    })
  }, [borrowings, hydrated])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Memoized stats
  const stats = useMemo(() => {
    const totalCount = books.reduce((acc, b) => acc + parseInt(b.quantity || 0, 10), 0)
    const availableCount = books.reduce((acc, b) => acc + parseInt(b.available || 0, 10), 0)
    const activeBorrows = borrowings.filter(b => b.status === 'issued' || b.status === 'overdue').length
    const overdueCount = borrowings.filter(b => b.status === 'overdue').length
    const totalFines = borrowings.reduce((acc, b) => acc + fineBalance(b), 0)

    return {
      totalBooks: totalCount,
      availableBooks: availableCount,
      activeBorrows,
      overdueCount,
      totalFines,
    }
  }, [books, borrowings])

  // Book Catalog Operations
  const handleOpenAddBook = () => {
    if (!hasEditPermission) return
    setBookForm(emptyBookForm)
    setBookModalMode('add')
    setShowBookModal(true)
  }

  const handleOpenEditBook = (book) => {
    if (!hasEditPermission) return
    setBookForm({
      title: book.title,
      author: book.author,
      subject: book.subject,
      isbn: book.isbn,
      publisher: book.publisher,
      quantity: book.quantity,
    })
    setEditingBookId(book.id)
    setBookModalMode('edit')
    setShowBookModal(true)
  }

  const handleSaveBook = (e) => {
    e?.preventDefault?.(); if (!requirePermission(bookModalMode === 'add' ? 'create' : 'edit')) return

    e.preventDefault()
    const quantity = Number(bookForm.quantity)
    const borrowed = borrowings.filter(b => bookModalMode === 'edit' && String(b.bookId) === String(editingBookId) && b.status !== 'returned').length
    if (!Number.isInteger(quantity) || quantity < Math.max(1, borrowed)) { showToast('Quantity must be a whole number and cover all borrowed copies', 'error'); return }
    if (!bookForm.title || !bookForm.author) {
      showToast('Title and Author are required fields.', 'error')
      return
    }

    if (bookModalMode === 'add') {
      const newBook = {
        id: books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1,
        title: bookForm.title,
        author: bookForm.author,
        subject: bookForm.subject,
        isbn: bookForm.isbn || '—',
        publisher: bookForm.publisher || '—',
        quantity: parseInt(bookForm.quantity || 1, 10),
        available: parseInt(bookForm.quantity || 1, 10),
        status: 'active',
      }
      setBooks([newBook, ...books])
      showToast(`Book "${bookForm.title}" added to catalog.`)
    } else {
      const updatedBooks = books.map(b => {
        if (b.id === editingBookId) {
          const qtyDiff = parseInt(bookForm.quantity, 10) - b.quantity
          const newAvailable = Math.max(0, b.available + qtyDiff)
          return {
            ...b,
            title: bookForm.title,
            author: bookForm.author,
            subject: bookForm.subject,
            isbn: bookForm.isbn || '—',
            publisher: bookForm.publisher || '—',
            quantity: parseInt(bookForm.quantity, 10),
            available: newAvailable,
          }
        }
        return b
      })
      setBooks(updatedBooks)
      showToast(`Book "${bookForm.title}" updated successfully.`)
    }
    setShowBookModal(false)
    setBookForm(emptyBookForm)
  }

  const handleDeleteBook = (id, title) => {
    if (!requirePermission('delete')) return

    if (!hasEditPermission) return
    const activeCheckouts = borrowings.filter(b => b.bookId === id && (b.status === 'issued' || b.status === 'overdue'))
    if (activeCheckouts.length > 0) {
      showToast(`Cannot delete. This book has ${activeCheckouts.length} active borrowings.`, 'error')
      return
    }

    if (window.confirm(`Are you sure you want to remove "${title}" from the catalog?`)) {
      setBooks(books.filter(b => b.id !== id))
      showToast(`Book "${title}" deleted from catalog.`)
    }
  }

  // Issue/Checkout Operations
  const handleOpenCheckout = (bookId = '') => {
    if (!hasEditPermission) return
    const today = new Date()
    const returnDate = new Date()
    returnDate.setDate(today.getDate() + 14) // default 14 days loan period
    
    setCheckoutForm({
      bookId,
      recipientType: 'Student',
      recipientId: '',
      dueDate: localDate(returnDate),
    })
    setShowCheckoutModal(true)
  }

  const handleIssueBook = (e) => {
    e?.preventDefault?.(); if (!requirePermission('create')) return

    e.preventDefault()
    const { bookId, recipientType, recipientId, dueDate } = checkoutForm
    if (dueDate < localDate()) { showToast('Due date cannot be in the past', 'error'); return }
    
    if (!bookId || !recipientId || !dueDate) {
      showToast('Please fill out all checkout fields.', 'error')
      return
    }

    const selectedBook = books.find(b => b.id === parseInt(bookId, 10))
    if (!selectedBook || selectedBook.available <= 0) {
      showToast('This book is currently out of stock / unavailable.', 'error')
      return
    }

    const recipient = (recipientType === 'Student' ? students : staff).find(person => String(person.id) === String(recipientId))
    if (!recipient || recipient.status !== 'active') { showToast('Choose an active borrower', 'error'); return }
    let recipientName = ''
    if (recipientType === 'Student') {
      const match = students.find(s => String(s.id) === String(recipientId))
      recipientName = match ? match.name : `Student #${recipientId}`
    } else {
      const match = staff.find(st => String(st.id) === String(recipientId))
      recipientName = match ? match.name : `Staff #${recipientId}`
    }

    const newBorrowing = {
      id: borrowings.length > 0 ? Math.max(...borrowings.map(b => b.id)) + 1 : 1,
      bookId: parseInt(bookId, 10),
      recipientType,
      recipientId: String(recipientId),
      recipientName,
      issueDate: localDate(),
      dueDate,
      returnDate: '',
      status: 'issued',
      fineAmt: 0,
      finePaid: false,
    }

    // Decrement available count
    setBooks(books.map(b => b.id === parseInt(bookId, 10) ? { ...b, available: b.available - 1 } : b))
    setBorrowings([newBorrowing, ...borrowings])
    showToast(`Book issued to ${recipientName}.`)
    setShowCheckoutModal(false)
  }

  const handleReturnBook = (borrowId) => {
    if (!requirePermission('edit')) return

    if (!hasEditPermission) return
    const borrowRecord = borrowings.find(b => b.id === borrowId)
    if (!borrowRecord || borrowRecord.status === 'returned') return

    const todayStr = localDate()
    
    const updatedBorrowings = borrowings.map(b => {
      if (b.id === borrowId) {
        return {
          ...b,
          ...refreshLoan(b, todayStr),
          returnDate: todayStr,
          status: 'returned',
        }
      }
      return b
    })

    // Increment available count
    setBooks(books.map(b => b.id === borrowRecord.bookId ? { ...b, available: Math.min(b.quantity, b.available + 1) } : b))
    setBorrowings(updatedBorrowings)
    
    if (borrowRecord.status === 'overdue' && borrowRecord.fineAmt > 0) {
      showToast(`Book returned. A fine of ${currencySymbol()} ${borrowRecord.fineAmt} has been logged.`, 'warning')
    } else {
      showToast('Book returned successfully.')
    }
  }

  const handlePayFine = (borrowId) => {
    if (!requirePermission('edit')) return

    if (!hasEditPermission) return
    const updatedBorrowings = borrowings.map(b => {
      if (b.id === borrowId) {
        return {
          ...b,
          finePaidAmount: Number(b.fineAmt) || 0,
          finePaid: true,
        }
      }
      return b
    })
    setBorrowings(updatedBorrowings)
    showToast('Fine marked as paid.')
  }

  // Filtering list computations
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchSearch = b.title.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                          b.author.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                          (b.isbn && b.isbn.includes(catalogSearch))
      const matchSubject = subjectFilter === 'all' || b.subject === subjectFilter
      return matchSearch && matchSubject
    })
  }, [books, catalogSearch, subjectFilter])

  const filteredCheckouts = useMemo(() => {
    return borrowings.map(b => {
      const bookObj = books.find(bk => bk.id === b.bookId)
      return { ...b, bookTitle: bookObj ? bookObj.title : 'Unknown Book' }
    }).filter(b => {
      const matchSearch = b.recipientName.toLowerCase().includes(checkoutSearch.toLowerCase()) ||
                          b.bookTitle.toLowerCase().includes(checkoutSearch.toLowerCase())
      
      const matchStatus = checkoutFilter === 'all' || 
                          (checkoutFilter === 'issued' && b.status === 'issued') ||
                          (checkoutFilter === 'overdue' && b.status === 'overdue') ||
                          (checkoutFilter === 'returned' && b.status === 'returned')
      
      return matchSearch && matchStatus
    })
  }, [borrowings, books, checkoutSearch, checkoutFilter])

  const unpaidFines = useMemo(() => {
    return borrowings.map(b => {
      const bookObj = books.find(bk => bk.id === b.bookId)
      return { ...b, bookTitle: bookObj ? bookObj.title : 'Unknown Book' }
    }).filter(b => b.fineAmt > 0 && !b.finePaid)
  }, [borrowings, books])

  return (
    <Layout>
      {/* HEADER */}
      <div className="settings-header">
        <div>
          <h1>
            <i className="fa-solid fa-book-open" style={{ color: 'var(--purple)', marginRight: 8 }}></i>
            Library &amp; Books Catalog
          </h1>
          <p>Manage books cataloging, issue checkouts to students/staff, and track overdue logs and fines.</p>
        </div>
        <div className="settings-actions">
          {hasEditPermission && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={handleOpenAddBook}>
                <i className="fa-solid fa-plus"></i> Add New Book
              </button>
              <button className="btn btn-export btn-sm" onClick={() => handleOpenCheckout()}>
                <i className="fa-solid fa-receipt"></i> Issue Book
              </button>
            </div>
          )}
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--purplebg)', color: 'var(--purple)', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-book"></i>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--t1)' }}>{stats.totalBooks}</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>Total Books</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--greenbg)', color: 'var(--green)', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--t1)' }}>{stats.availableBooks}</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>Available Copies</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--bluebg)', color: 'var(--blue)', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--t1)' }}>{stats.activeBorrows}</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>Active Checkouts</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--redbg)', color: 'var(--red)', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--t1)' }}>{stats.overdueCount}</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>Overdue Loans</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--amberbg)', color: 'var(--amber)', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-wallet"></i>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--t1)' }}>{currencySymbol()} {stats.totalFines}</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>Unpaid Fines</div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="tabs-nav" style={{ marginBottom: '16px' }}>
        <button className={activeTab === 'catalog' ? 'active' : ''} onClick={() => setActiveTab('catalog')}>
          📚 Books Catalog ({filteredBooks.length})
        </button>
        <button className={activeTab === 'checkouts' ? 'active' : ''} onClick={() => setActiveTab('checkouts')}>
          📖 Checkouts &amp; Issue Log ({filteredCheckouts.length})
        </button>
        <button className={activeTab === 'fines' ? 'active' : ''} onClick={() => setActiveTab('fines')}>
          💸 Unpaid Fines ({unpaidFines.length})
        </button>
      </div>

      {/* TAB CONTENT: BOOKS CATALOG */}
      {activeTab === 'catalog' && (
        <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
          <div className="roles-toolbar academic-toolbar">
            <div className="roles-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input aria-label="Search Title, Author, or ISBN..."
                placeholder="Search Title, Author, or ISBN..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
              />
              {catalogSearch && (
                <button aria-label="Close" className="roles-search-clear" onClick={() => setCatalogSearch('')}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            <select aria-label="Subject Filter" className="roles-filter" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="all">All Subjects</option>
              {DEFAULT_SUBJECTS.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Book Details</th>
                  <th>Subject</th>
                  <th>ISBN</th>
                  <th>Publisher</th>
                  <th style={{ textAlign: 'center' }}>Stock (Avail / Total)</th>
                  <th>Availability</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="roles-empty">
                      No books found matching the filters.
                    </td>
                  </tr>
                ) : (
                  filteredBooks.map(book => (
                    <tr key={book.id}>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div style={{ width: '36px', height: '46px', borderRadius: 'var(--radius-sm)', background: 'var(--bg3)', display: 'grid', placeItems: 'center', fontSize: '14px', border: '1px solid var(--border)' }}>
                            📚
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--t1)' }}>{book.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--t3)' }}>By {book.author}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-teaching" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                          {book.subject}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{book.isbn}</td>
                      <td>{book.publisher}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        <span style={{ color: book.available === 0 ? 'var(--red)' : 'var(--t1)' }}>{book.available}</span>
                        <span style={{ color: 'var(--t3)', fontWeight: 'normal' }}> / {book.quantity}</span>
                      </td>
                      <td>
                        {book.available > 0 ? (
                          <span style={{ color: 'var(--green)', fontSize: '12px', fontWeight: 'bold' }}>
                            ✓ In Stock
                          </span>
                        ) : (
                          <span style={{ color: 'var(--red)', fontSize: '12px', fontWeight: 'bold' }}>
                            ✗ Out of Stock
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="roles-actions" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                          {book.available > 0 && hasEditPermission && (
                            <button aria-label="Issue this book"
                              className="btn-icon-sm"
                              title="Issue this book"
                              onClick={() => handleOpenCheckout(book.id)}
                            >
                              <i className="fa-solid fa-receipt"></i>
                            </button>
                          )}
                          {hasEditPermission && (
                            <>
                              <button aria-label="Edit book details"
                                className="btn-icon-sm"
                                title="Edit book details"
                                onClick={() => handleOpenEditBook(book)}
                              >
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>
                              <button aria-label="Delete Book"
                                className="btn-icon-sm danger"
                                title="Delete Book"
                                onClick={() => handleDeleteBook(book.id, book.title)}
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CHECKOUTS LOG */}
      {activeTab === 'checkouts' && (
        <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
          <div className="roles-toolbar academic-toolbar">
            <div className="roles-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input aria-label="Search recipient name or book title..."
                placeholder="Search recipient name or book title..."
                value={checkoutSearch}
                onChange={(e) => setCheckoutSearch(e.target.value)}
              />
              {checkoutSearch && (
                <button aria-label="Close" className="roles-search-clear" onClick={() => setCheckoutSearch('')}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            <select aria-label="Checkout Filter" className="roles-filter" value={checkoutFilter} onChange={(e) => setCheckoutFilter(e.target.value)}>
              <option value="all">All Checkouts</option>
              <option value="issued">Active Issues</option>
              <option value="overdue">Overdue Loans</option>
              <option value="returned">Returned Books</option>
            </select>
          </div>

          <div className="table-wrap">
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Recipient</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th>Fine accrued</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCheckouts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="roles-empty">
                      No borrowings registered.
                    </td>
                  </tr>
                ) : (
                  filteredCheckouts.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 'bold', color: 'var(--t1)' }}>{b.bookTitle}</td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600 }}>{b.recipientName}</div>
                          <div style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase' }}>
                            {b.recipientType}
                          </div>
                        </div>
                      </td>
                      <td>{b.issueDate}</td>
                      <td>{b.dueDate}</td>
                      <td>{b.returnDate || '—'}</td>
                      <td>
                        {b.status === 'returned' && (
                          <span style={{ background: 'var(--greenbg)', color: 'var(--green)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                            Returned
                          </span>
                        )}
                        {b.status === 'issued' && (
                          <span style={{ background: 'var(--bluebg)', color: 'var(--blue)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                            Active
                          </span>
                        )}
                        {b.status === 'overdue' && (
                          <span style={{ background: 'var(--redbg)', color: 'var(--red)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                            Overdue
                          </span>
                        )}
                      </td>
                      <td>
                        {b.fineAmt > 0 ? (
                          <span style={{ color: b.finePaid ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}>
                            {currencySymbol()} {b.fineAmt} {b.finePaid ? '(Paid)' : '(Unpaid)'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--t3)' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {b.status !== 'returned' && hasEditPermission && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            onClick={() => handleReturnBook(b.id)}
                          >
                            Mark Returned
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

      {/* TAB CONTENT: FINES */}
      {activeTab === 'fines' && (
        <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
          <div className="table-wrap">
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Borrower Type</th>
                  <th>Book Title</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Accrued Fine</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {unpaidFines.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="roles-empty">
                      No outstanding fines registered! All clean.
                    </td>
                  </tr>
                ) : (
                  unpaidFines.map(f => {
                    const diffDays = Math.ceil(f.fineAmt / 10)
                    return (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 'bold', color: 'var(--t1)' }}>{f.recipientName}</td>
                        <td>
                          <span className="badge badge-nonteach" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                            {f.recipientType}
                          </span>
                        </td>
                        <td>{f.bookTitle}</td>
                        <td>{f.dueDate}</td>
                        <td style={{ color: 'var(--red)', fontWeight: 'bold' }}>{diffDays} Days</td>
                        <td style={{ color: 'var(--red)', fontWeight: 'bold', fontSize: '14px' }}>{currencySymbol()} {fineBalance(f)}</td>
                        <td style={{ textAlign: 'right' }}>
                          {hasEditPermission && (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ padding: '4px 12px', fontSize: '12px' }}
                              onClick={() => handlePayFine(f.id)}
                            >
                              Collect Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION STACK */}
      {toast && (
        <div className="toast-stack">
          <div className={`toast ${toast.type}`}>
            <span>{toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* BOOK DIALOG MODAL (ADD / EDIT) */}
      {showBookModal && (
        <Dialog className="modal-overlay" onClick={() => setShowBookModal(false)}>
          <div className="modal-panel role-form-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{bookModalMode === 'add' ? 'Add Book to Catalog' : 'Edit Book Details'}</h3>
                <p className="modal-sub">Provide catalog card index properties for inventory tracking.</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setShowBookModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSaveBook}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label>Book Title <span className="req">*</span></label>
                    <input aria-label="Book Title"
                      className="form-input"
                      placeholder="e.g. The Great Gatsby"
                      value={bookForm.title}
                      onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Author Name <span className="req">*</span></label>
                    <input aria-label="Author Name"
                      className="form-input"
                      placeholder="e.g. F. Scott Fitzgerald"
                      value={bookForm.author}
                      onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label>Subject / Class Category</label>
                      <select aria-label="Subject / Class Category"
                        className="form-select"
                        value={bookForm.subject}
                        onChange={(e) => setBookForm({ ...bookForm, subject: e.target.value })}
                      >
                        {DEFAULT_SUBJECTS.map(subj => (
                          <option key={subj} value={subj}>{subj}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Quantity Stock</label>
                      <input aria-label="Quantity Stock"
                        type="number"
                        className="form-input"
                        min="1"
                        max="100"
                        value={bookForm.quantity}
                        onChange={(e) => setBookForm({ ...bookForm, quantity: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>ISBN Identifier</label>
                    <input aria-label="ISBN Identifier"
                      className="form-input"
                      placeholder="e.g. 978-3-16-148410-0"
                      value={bookForm.isbn}
                      onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Publisher</label>
                    <input aria-label="Publisher"
                      className="form-input"
                      placeholder="e.g. Penguin Books"
                      value={bookForm.publisher}
                      onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" type="button" onClick={() => setShowBookModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Save Book
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* CHECKOUT ISSUE DIALOG MODAL */}
      {showCheckoutModal && (
        <Dialog className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal-panel role-form-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Issue Book Checkout</h3>
                <p className="modal-sub">Log student or staff book loans from the library inventory.</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setShowCheckoutModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleIssueBook}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label>Select Book to Issue <span className="req">*</span></label>
                    <select aria-label="Select Book to Issue"
                      className="form-select"
                      value={checkoutForm.bookId}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, bookId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Book --</option>
                      {books.map(b => (
                        <option key={b.id} value={b.id} disabled={b.available <= 0}>
                          {b.title} ({b.available} copies available)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1.5fr', gap: '10px' }}>
                    <div className="form-group">
                      <label>Recipient Type</label>
                      <select aria-label="Recipient Type"
                        className="form-select"
                        value={checkoutForm.recipientType}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, recipientType: e.target.value, recipientId: '' })}
                      >
                        <option value="Student">Student</option>
                        <option value="Staff">Staff</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Select Member <span className="req">*</span></label>
                      {checkoutForm.recipientType === 'Student' ? (
                        <select aria-label="Select Member"
                          className="form-select"
                          value={checkoutForm.recipientId}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, recipientId: e.target.value })}
                          required
                        >
                          <option value="">-- Choose Student --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.name} (ADM-{s.admissionNo})</option>
                          ))}
                        </select>
                      ) : (
                        <select aria-label="Select Member"
                          className="form-select"
                          value={checkoutForm.recipientId}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, recipientId: e.target.value })}
                          required
                        >
                          <option value="">-- Choose Staff Member --</option>
                          {staff.map(st => (
                            <option key={st.id} value={st.id}>{st.name} ({st.role})</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Loan Due Date <span className="req">*</span></label>
                    <input aria-label="Loan Due Date"
                      type="date"
                      className="form-input"
                      value={checkoutForm.dueDate}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, dueDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" type="button" onClick={() => setShowCheckoutModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Confirm Checkout
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </Layout>
  )
}
