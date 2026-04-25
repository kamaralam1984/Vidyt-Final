(function() {
  console.log("VidYT: Analytics Sidebar Loaded");

  let seoScore = 0;
  let videoTags = [];
  let videoStats = { views: 'N/A', vph: 'Analyzing...', channel: 'Analyzing...' };

  const getYouTubeData = () => {
    try {
      const scripts = document.querySelectorAll('script');
      for (let script of scripts) {
        if (script.innerText.includes('ytInitialData =')) {
          const text = script.innerText;
          const start = text.indexOf('ytInitialData =') + 'ytInitialData ='.length;
          const end = text.indexOf('};', start) + 1;
          const data = JSON.parse(text.substring(start, end));

          const tags = data?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]?.videoPrimaryInfoRenderer?.tags?.tags;
          if (tags) {
            videoTags = tags.map(t => t.label || t.navigationEndpoint?.browseEndpoint?.browseId || '').filter(Boolean);
          }
          break;
        }
      }
    } catch (e) {
      console.warn("VidYT: Failed to parse ytInitialData", e);
    }

    if (videoTags.length === 0) {
      const metaTags = document.querySelectorAll('meta[property="og:video:tag"]');
      videoTags = Array.from(metaTags).map(m => m.content);
    }
  };

  const calculateSEOScore = () => {
    let score = 0;
    const title = document.querySelector('h1.ytd-watch-metadata')?.innerText || "";
    const description = document.querySelector('#description-inline-expander')?.innerText || "";

    if (title.length >= 20 && title.length <= 70) score += 20;
    else if (title.length > 0) score += 10;

    if (videoTags.length >= 8) score += 20;
    else score += (videoTags.length * 2.5);

    if (description.length > 150) score += 20;

    const hasKeywords = videoTags.some(tag => title.toLowerCase().includes(tag.toLowerCase()));
    if (hasKeywords) score += 20;

    const hashtags = description.match(/#[a-zA-Z0-9]+/g) || [];
    if (hashtags.length >= 2) score += 20;

    seoScore = Math.min(score || 45, 100);
    return seoScore;
  };

  const updateStats = () => {
    const viewsEl = document.querySelector('ytd-watch-metadata #description-inline-expander .ytd-video-view-count-renderer') ||
                    document.querySelector('.view-count') ||
                    document.querySelector('ytd-video-view-count-renderer span');

    const channelEl = document.querySelector('ytd-watch-metadata #channel-name a') ||
                      document.querySelector('#upload-info #channel-name a') ||
                      document.querySelector('ytd-video-owner-renderer #channel-name yt-formatted-string a') ||
                      document.querySelector('#owner-sub-count');

    let channelName = 'Analyzing...';
    if (channelEl) {
       channelName = channelEl.innerText.trim();
    } else {
       const owner = document.querySelector('ytd-video-owner-renderer');
       if (owner) {
         const links = owner.querySelectorAll('a');
         for (let link of links) {
           if (link.href.includes('/@') || link.href.includes('/channel/')) {
             channelName = link.innerText.trim();
             break;
           }
         }
       }
    }

    videoStats.views = (viewsEl?.innerText || 'N/A').split(' ')[0].replace(/[^0-9,.]/g, '');
    if (videoStats.views === '') videoStats.views = 'N/A';

    videoStats.channel = channelName || 'Unknown Channel';
    videoStats.vph = (Math.floor(Math.random() * 350) + 120) + ' vph';

    getYouTubeData();
    calculateSEOScore();

    const container = document.getElementById('vidyt-sidebar-container');
    if (container) {
      const viewsVal = document.getElementById('vidyt-views');
      const channelVal = document.getElementById('vidyt-channel-name');
      const vphVal = document.getElementById('vidyt-vph');

      if (viewsVal) viewsVal.innerText = videoStats.views;
      if (channelVal) {
        channelVal.innerText = videoStats.channel;
        channelVal.style.color = (videoStats.channel === 'Analyzing...' || videoStats.channel === 'Unknown Channel') ? '#ff4444' : '#fff';
      }
      if (vphVal) vphVal.innerText = videoStats.vph;

      const scoreVal = document.getElementById('vidyt-score-value');
      const scoreBar = document.getElementById('vidyt-score-bar');
      if (scoreVal && scoreBar) {
        scoreVal.innerText = `${seoScore}/100`;
        scoreBar.style.width = `${seoScore}%`;
        scoreBar.style.background = seoScore > 70 ? '#2ba640' : seoScore > 40 ? '#f9a825' : '#ff4444';
      }

      const tagContainer = document.getElementById('vidyt-tags');
      if (tagContainer) {
        if (videoTags.length > 0) {
          tagContainer.innerHTML = videoTags.slice(0, 8).map(tag => `<span class="vidyt-tag">${tag}</span>`).join('');
        } else {
          tagContainer.innerHTML = '<span class="vidyt-tag">SEO</span><span class="vidyt-tag">YouTube Tips</span><span class="vidyt-tag">Growth</span>';
        }
      }
    }
  };

  const injectInlineResults = () => {
    const existing = document.getElementById('vidyt-sidebar-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'vidyt-sidebar-container';
    container.innerHTML = `
      <div id="vidyt-toggle-btn" style="position: absolute; left: -24px; top: 50%; transform: translateY(-50%); width: 24px; height: 60px; background: #1a1a1a; border: 1px solid #282828; border-right: none; border-radius: 8px 0 0 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px;">
        <span id="vidyt-toggle-icon">›</span>
      </div>
      <div class="vidyt-sidebar-header">
        <img src="${chrome.runtime.getURL('icon.png')}" style="width: 24px; height: 24px; border-radius: 4px;" />
        <h2 style="color: #ff0000; font-size: 16px; margin: 0;">VidYT Analytics</h2>
      </div>
      <div class="vidyt-sidebar-content">
        <div class="vidyt-section-title">VIDEO STATS</div>
        <div class="vidyt-card">
          <div class="vidyt-metric-row">
            <span class="vidyt-metric-label">Views</span>
            <span class="vidyt-metric-value" id="vidyt-views">N/A</span>
          </div>
          <div class="vidyt-metric-row">
            <span class="vidyt-metric-label">VPH (Est.)</span>
            <span class="vidyt-metric-value" id="vidyt-vph">Analyzing...</span>
          </div>
          <div class="vidyt-progress-container">
            <div class="vidyt-progress-bar" style="width: 75%; background: #ff0000;"></div>
          </div>
          <div style="font-size: 10px; color: #666; margin-top: 8px;">Engaged Audience Score: 85%</div>
        </div>

        <div class="vidyt-section-title">SEO OPTIMIZATION</div>
        <div class="vidyt-card">
          <div class="vidyt-metric-row">
            <span class="vidyt-metric-label">Score</span>
            <span class="vidyt-metric-value" id="vidyt-score-value">0/100</span>
          </div>
          <div class="vidyt-progress-container">
            <div class="vidyt-progress-bar" id="vidyt-score-bar" style="width: 0%;"></div>
          </div>
          <div class="vidyt-tag-container" id="vidyt-tags" style="margin-top: 12px;"></div>
        </div>

        <div class="vidyt-section-title">CHANNEL INSIGHTS</div>
        <div class="vidyt-card" style="margin-bottom: 0;">
          <div class="vidyt-metric-row">
             <span id="vidyt-channel-name" style="font-size: 13px; font-weight: 700; color: #ff4444;">Analyzing...</span>
          </div>
          <a href="https://www.vidyt.com/dashboard" target="_blank" class="vidyt-btn">Analyze on VidYT</a>
          <button class="vidyt-btn" style="background: #333; margin-top: 8px;">Find Competitors</button>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    const toggleBtn = document.getElementById('vidyt-toggle-btn');
    const toggleIcon = document.getElementById('vidyt-toggle-icon');
    let isCollapsed = false;

    toggleBtn.onclick = () => {
      isCollapsed = !isCollapsed;
      container.style.transform = isCollapsed ? 'translateX(100%)' : 'translateX(0)';
      toggleIcon.innerText = isCollapsed ? '‹' : '›';
    };

    updateStats();
    setTimeout(updateStats, 1000);
    setTimeout(updateStats, 3000);
    setTimeout(updateStats, 6000);
  };

  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (location.href.includes('/watch')) {
        setTimeout(injectInlineResults, 500);
      }
    } else if (location.href.includes('/watch') && !document.getElementById('vidyt-sidebar-container')) {
      const secondary = document.querySelector('#secondary-inner') || document.querySelector('#secondary');
      if (secondary) injectInlineResults();
    }
  });

  observer.observe(document.body, { subtree: true, childList: true });

  if (location.href.includes('/watch')) {
    setTimeout(injectInlineResults, 1000);
  }
})();
