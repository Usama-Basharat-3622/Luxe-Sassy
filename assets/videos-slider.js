function pauseAllVideos() {
// Pause all native <video> elements
document.querySelectorAll('video').forEach(video => {
    video.pause();
    video.currentTime = 0;
});

// Pause all iframe videos (YouTube, Vimeo) via postMessage
document.querySelectorAll('iframe').forEach(iframe => {
    const src = iframe.src || '';
    if (src.indexOf('youtube.com') !== -1) {
    iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    } else if (src.indexOf('vimeo.com') !== -1) {
    iframe.contentWindow.postMessage(JSON.stringify({ method: 'pause' }), '*');
    }
});
}

function openModalWithContent(contentHtml) {
pauseAllVideos(); // <-- Pause everything before opening new popup

const modal = document.getElementById('videoModal');
const container = document.getElementById('modalMediaContainer');

container.innerHTML = contentHtml;
modal.classList.add('show');
document.body.classList.add('modal-open');
}

function closeModal() {
const modal = document.getElementById('videoModal');
const container = document.getElementById('modalMediaContainer');

modal.classList.remove('show');
container.innerHTML = '';
document.body.classList.remove('modal-open');
}

// Handle MP4 videos
document.querySelectorAll('.VG-media button').forEach(button => {
button.addEventListener('click', function () {
    const videoId = this.id.replace('S', '');
    const videoElement = document.getElementById(videoId);
    if (!(videoElement instanceof HTMLVideoElement)) return;

    let sources = '';
    videoElement.querySelectorAll('source').forEach(source => {
    sources += `<source src="${source.src}" type="${source.type}">`;
    });

    const videoHTML = `
    <video controls autoplay muted playsinline poster="${videoElement.poster}" style="width: 100%; height: 100%;">
        ${sources}
    </video>
    `;
    openModalWithContent(videoHTML);
});
});

// Handle YouTube & Vimeo
document.querySelectorAll('.video-thumbnail-play-btn').forEach(btn => {
btn.addEventListener('click', function () {
    const wrapper = this.closest('.video-thumbnail-wrapper');
    const type = wrapper.dataset.videoType;
    const id = wrapper.dataset.videoId;
    let embed = '';

    if (type === 'youtube_video') {
    const youtubeId = id.split('v=').pop().split('&')[0];
    embed = `
        <iframe 
        src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&enablejsapi=1" 
        frameborder="0" 
        allow="autoplay; encrypted-media; fullscreen" 
        allowfullscreen 
        style="width:100%; height:100%;"></iframe>
    `;
    } else if (type === 'vimeo_video') {
    const vimeoID = id.split('/').pop();
    embed = `
        <iframe 
        src="https://player.vimeo.com/video/${vimeoID}?autoplay=1&muted=1&loop=0&title=1&byline=1&portrait=1" 
        frameborder="0" 
        allow="autoplay; fullscreen" 
        allowfullscreen 
        style="width:100%; height:100%;"></iframe>
    `;
    }

    openModalWithContent(embed);
});
});

// Close on button click
document.getElementById('closeModal').addEventListener('click', closeModal);

// Close on Escape key
document.addEventListener('keydown', function (e) {
if (e.key === "Escape") {
    closeModal();
}
});

// Close on click outside modal content
document.getElementById('videoModal').addEventListener('click', function (e) {
if (e.target.id === 'videoModal') {
    closeModal();
}
});