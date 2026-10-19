export default function IndexLoading() {
  return (
    <div className="container">
      <div className="index-box">
        <div className="skeleton" style={{ height: '36px', width: '260px', marginBottom: '1rem' }} />
        <hr className="index-hr" />
        <div className="skeleton" style={{ height: '18px', width: '80%', marginBottom: '2rem' }} />

        {/* Skeleton project rows */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="project-row" style={{ padding: '1.25rem 0' }}>
            <div className="project-row-left" style={{ width: '40%', gap: '0.5rem' }}>
              <div className="skeleton" style={{ height: '20px', width: '70%' }} />
              <div className="skeleton" style={{ height: '14px', width: '45%' }} />
            </div>
            <div className="project-row-pills">
              <div className="skeleton" style={{ height: '24px', width: '70px', borderRadius: '6px' }} />
              <div className="skeleton" style={{ height: '24px', width: '60px', borderRadius: '6px' }} />
              <div className="skeleton" style={{ height: '24px', width: '110px', borderRadius: '6px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
