import Layout from '../components/Layout'

function ErrorPage({ statusCode }) {
  return (
    <Layout>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '40px 20px',
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--redbg)',
          color: 'var(--red)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          marginBottom: 20,
        }}>
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: 'var(--t1)', margin: '0 0 8px 0' }}>
          {statusCode || 'Error'}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--t2)', maxWidth: 420, margin: '0 0 24px 0' }}>
          {statusCode === 404
            ? 'The page you are looking for could not be found.'
            : 'An unexpected error has occurred. Please try again.'}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.href = '/'}
          style={{ gap: 8 }}
        >
          <i className="fa-solid fa-house"></i> Back to Home
        </button>
      </div>
    </Layout>
  )
}

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default ErrorPage
