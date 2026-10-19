export default function ProjectLoading() {
  return (
    <div className="journal-layout">
      {/* Sidebar TOC skeleton */}
      <aside className="toc-sidebar" aria-hidden="true">
        <div className="skeleton" style={{ height: '16px', width: '80px', marginBottom: '1rem' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div className="skeleton" style={{ height: '14px', width: '120px' }} />
          <div className="skeleton" style={{ height: '14px', width: '100px' }} />
          <div className="skeleton" style={{ height: '14px', width: '140px' }} />
          <div className="skeleton" style={{ height: '14px', width: '90px' }} />
        </div>
      </aside>

      {/* Main post card skeleton */}
      <article className="post-card">
        <div className="nav-top">
          <div className="skeleton" style={{ height: '16px', width: '130px' }} />
        </div>

        {/* Eyebrow */}
        <div className="skeleton" style={{ height: '14px', width: '160px', marginBottom: '0.75rem' }} />

        {/* Title */}
        <div className="skeleton" style={{ height: '42px', width: '60%', marginBottom: '1rem' }} />

        {/* Meta row */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div className="skeleton" style={{ height: '24px', width: '120px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ height: '24px', width: '80px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ height: '24px', width: '70px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ height: '24px', width: '100px', borderRadius: '6px' }} />
        </div>

        {/* Description note skeleton */}
        <div
          className="skeleton"
          style={{ height: '60px', width: '100%', marginBottom: '2rem', borderRadius: '4px' }}
        />

        {/* Controls row */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div className="skeleton" style={{ height: '32px', width: '190px', borderRadius: '6px' }} />
        </div>

        {/* Entries skeletons */}
        {[1, 2].map((i) => (
          <section key={i} className="journal-entry" style={{ marginTop: '2rem' }}>
            <div className="entry-header" style={{ marginBottom: '1.25rem' }}>
              <div className="skeleton" style={{ height: '28px', width: '45%' }} />
              <div className="skeleton" style={{ height: '20px', width: '80px' }} />
              <div className="skeleton" style={{ height: '22px', width: '60px', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="skeleton" style={{ height: '18px', width: '100%' }} />
              <div className="skeleton" style={{ height: '18px', width: '92%' }} />
              <div className="skeleton" style={{ height: '18px', width: '75%' }} />
              <div className="skeleton" style={{ height: '120px', width: '100%', marginTop: '0.5rem' }} />
            </div>
          </section>
        ))}
      </article>
    </div>
  );
}
